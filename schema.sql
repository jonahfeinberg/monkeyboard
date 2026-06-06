DROP TABLE IF EXISTS monkeywords;

CREATE TABLE monkeywords (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    word_amount INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak_words TEXT NOT NULL DEFAULT '',
    all_words TEXT NOT NULL DEFAULT ''
);
