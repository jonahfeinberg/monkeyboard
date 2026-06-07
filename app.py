import os
import sqlite3
from collections import Counter
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from authlib.integrations.flask_client import OAuth
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

# proxyfix for reverse proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# db path
DB_NAME = os.path.join(os.path.dirname(__file__), "monkeyboard.db")

# google oauth
oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# db connection
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# create table
def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS monkeywords (
                user_id TEXT PRIMARY KEY,
                user_name TEXT NOT NULL,
                word_amount INTEGER NOT NULL DEFAULT 0,
                longest_streak INTEGER NOT NULL DEFAULT 0,
                longest_streak_words TEXT NOT NULL DEFAULT '',
                all_words TEXT NOT NULL DEFAULT ''
            )
        """)
        conn.commit()

# upsert user
def upsert_user(user_id, user_name):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO monkeywords (user_id, user_name)
            VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET user_name = excluded.user_name
        """, (user_id, user_name))
        conn.commit()

# save stats
def save_stats(user_id, total_words, longest_streak, longest_streak_words, all_words):
    with get_db() as conn:
        conn.execute("""
            UPDATE monkeywords
            SET word_amount = ?, longest_streak = ?, longest_streak_words = ?, all_words = ?
            WHERE user_id = ?
        """, (total_words, longest_streak, longest_streak_words, all_words, user_id))
        conn.commit()

# derived word stats
def calc_word_stats(words):
    if not words:
        return {"longest_word": "", "longest_word_len": 0,
                "best_same_run": 0, "best_same_run_word": "", "unique_words": 0}

    longest_word = max(words, key=len)

    best_run = 0
    best_run_word = ""
    current_run = 0
    last_word = None
    for w in words:
        current_run = current_run + 1 if w == last_word else 1
        last_word = w
        if current_run > best_run:
            best_run = current_run
            best_run_word = w

    return {
        "longest_word": longest_word,
        "longest_word_len": len(longest_word),
        "best_same_run": best_run,
        "best_same_run_word": best_run_word,
        "unique_words": len(set(words)),
    }

# login
@app.route("/login")
def login():
    redirect_uri = url_for("auth_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

# oauth callback
@app.route("/auth/callback")
def auth_callback():
    token = google.authorize_access_token()
    user_info = token.get("userinfo")
    if not user_info:
        return redirect(url_for("index"))
    user_id = user_info["sub"]
    user_name = user_info.get("name") or user_info.get("email", "User")
    upsert_user(user_id, user_name)
    session["user_id"] = user_id
    session["user_name"] = user_name
    return redirect(url_for("index"))

# logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# login state + saved stats
@app.route("/me")
def me():
    stats = None
    if "user_id" in session:
        with get_db() as conn:
            row = conn.execute("""
                SELECT word_amount, longest_streak, longest_streak_words, all_words
                FROM monkeywords WHERE user_id = ?
            """, (session["user_id"],)).fetchone()
            if row:
                stats = {
                    "word_amount": row["word_amount"],
                    "longest_streak": row["longest_streak"],
                    "longest_streak_words": row["longest_streak_words"],
                    "all_words": row["all_words"],
                }
    return jsonify({
        "logged_in": "user_id" in session,
        "user_name": session.get("user_name"),
        "stats": stats,
    })

# home page
@app.route("/")
def index():
    with get_db() as conn:
        leaderboard = conn.execute("""
            SELECT user_name, word_amount
            FROM monkeywords
            ORDER BY word_amount DESC
            LIMIT 10
        """).fetchall()
    return render_template("index.html", leaderboard=leaderboard)

# typing page
@app.route("/monkey-cage")
def monkey_cage_page():
    return render_template("monkey-cage.html")

# persist progress
@app.route("/save_result", methods=["POST"])
def save_result():
    if not session.get("user_id"):
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    save_stats(
        session["user_id"],
        int(data.get("total_words", 0)),
        int(data.get("longest_streak", 0)),
        data.get("longest_streak_words", ""),
        data.get("all_words", ""),
    )
    return jsonify({"ok": True})

# allowed ORDER BY columns (injection guard)
SORT_COLUMNS = {
    "word_amount": "word_amount",
    "longest_streak": "longest_streak",
}

# leaderboard
@app.route("/leaderboard")
def leaderboard():
    sort = request.args.get("sort", "word_amount")
    filter_word = request.args.get("word", "").strip().lower()
    order_by = SORT_COLUMNS.get(sort, "word_amount")

    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT user_name, word_amount, longest_streak, longest_streak_words, all_words
            FROM monkeywords
            ORDER BY {order_by} DESC
            LIMIT 500
        """).fetchall()

    results = []
    for row in rows:
        words = row["all_words"].split() if row["all_words"] else []
        ws = calc_word_stats(words)
        results.append({
            "user_name": row["user_name"],
            "word_amount": row["word_amount"],
            "longest_streak": row["longest_streak"],
            "longest_streak_words": row["longest_streak_words"],
            "longest_word": ws["longest_word"],
            "best_same_run": ws["best_same_run"],
            "best_same_run_word": ws["best_same_run_word"],
            "unique_words": ws["unique_words"],
            "word_count": words.count(filter_word) if filter_word else None,
        })

    if sort == "longest_word":
        results.sort(key=lambda r: len(r["longest_word"]), reverse=True)
    elif sort == "best_same_run":
        results.sort(key=lambda r: r["best_same_run"], reverse=True)
    elif sort == "word_count" and filter_word:
        results.sort(key=lambda r: r["word_count"], reverse=True)
    elif sort == "unique_words":
        results.sort(key=lambda r: r["unique_words"], reverse=True)

    return render_template("leaderboard.html",
        leaderboard=results,
        sort=sort,
        filter_word=filter_word,
        enumerate=enumerate,
    )

# user words by frequency
@app.route("/words")
def words_page():
    if not session.get("user_id"):
        return redirect(url_for("login"))
    with get_db() as conn:
        row = conn.execute("""
            SELECT all_words FROM monkeywords WHERE user_id = ?
        """, (session["user_id"],)).fetchone()
    words = row["all_words"].split() if row and row["all_words"] else []
    counts = Counter(words)
    return render_template("words.html", words=counts.most_common())

# stats page
@app.route("/stats")
def stats_page():
    scope = request.args.get("scope", "me")
    if scope == "me" and not session.get("user_id"):
        return redirect(url_for("login"))

    personal = None
    with get_db() as conn:
        if scope == "me":
            row = conn.execute("""
                SELECT all_words, word_amount, longest_streak, longest_streak_words, user_name
                FROM monkeywords WHERE user_id = ?
            """, (session["user_id"],)).fetchone()
            all_words = row["all_words"].split() if row and row["all_words"] else []
            if row:
                ws = calc_word_stats(all_words)
                word_counts = Counter(all_words)
                most_common_word, most_common_count = word_counts.most_common(1)[0] if word_counts else ("", 0)
                personal = {
                    "user_name": row["user_name"],
                    "total_words": row["word_amount"],
                    "longest_streak": row["longest_streak"],
                    "longest_streak_words": row["longest_streak_words"],
                    "longest_word": ws["longest_word"],
                    "longest_word_len": ws["longest_word_len"],
                    "unique_words": ws["unique_words"],
                    "best_same_run": ws["best_same_run"],
                    "best_same_run_word": ws["best_same_run_word"],
                    "most_common_word": most_common_word,
                    "most_common_count": most_common_count,
                    "avg_word_length": round(sum(len(w) for w in all_words) / len(all_words), 2) if all_words else 0,
                }
        else:
            rows = conn.execute("SELECT all_words FROM monkeywords").fetchall()
            all_words = []
            for r in rows:
                if r["all_words"]:
                    all_words.extend(r["all_words"].split())

    length_counts = Counter(len(w) for w in all_words)
    total = len(all_words)
    histogram = [{"length": l,
                  "count": length_counts.get(l, 0),
                  "percent": round(length_counts.get(l, 0) / total * 100, 1) if total else 0}
                 for l in range(1, max(length_counts.keys(), default=1) + 1)]

    return render_template("stats.html",
        scope=scope,
        histogram=histogram,
        total_words=len(all_words),
        unique_words=len(set(all_words)),
        personal=personal,
    )

# reset stats
@app.route("/reset", methods=["POST"])
def reset():
    if not session.get("user_id"):
        return jsonify({"error": "Not logged in"}), 401
    with get_db() as conn:
        conn.execute("""
            UPDATE monkeywords
            SET word_amount = 0, longest_streak = 0, longest_streak_words = '', all_words = ''
            WHERE user_id = ?
        """, (session["user_id"],))
        conn.commit()
    return jsonify({"ok": True})

@app.route("/achievements")
def achievements_page():
    return render_template("achievements.html")

init_db()

if __name__ == "__main__":
    app.run(debug=True)
