(function () {
  const logoutLink = document.querySelector('a.logout[href="/logout"]');
  const modal      = document.getElementById("logout-modal");
  if (!logoutLink || !modal) return;

  const cancelBtn  = document.getElementById("logout-cancel");
  const confirmBtn = document.getElementById("logout-confirm");

  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal) settingsModal.hidden = true;
    modal.hidden = false;
    cancelBtn.focus();
    document.addEventListener("keydown", onKey);
  }
  function close() {
    modal.hidden = true;
    document.removeEventListener("keydown", onKey);
    logoutLink.focus();
  }

  logoutLink.addEventListener("click", e => { e.preventDefault(); open(); });
  cancelBtn.addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  confirmBtn.addEventListener("click", () => {
    if (typeof window.beforeSignOut === "function") window.beforeSignOut();
    window.location.href = "/logout";
  });
})();

// burger menu CLAUDE
(function () {
  const burger = document.getElementById("burgerBtn");
  const links  = document.getElementById("navLinks");
  if (!burger || !links) return;

  function setOpen(open) {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  burger.addEventListener("click", e => {
    e.stopPropagation();
    setOpen(!links.classList.contains("open"));
  });

  links.addEventListener("click", e => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", e => {
    if (links.classList.contains("open") && !e.target.closest("nav")) setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) setOpen(false);
  });
})();

// universal settings !!!

(function () {
  const DEFAULTS = {
    sound: true,
    keyClacks: true,
    streakTone: true,
    achievementSound: true,
    achievementToasts: true,
    reduceMotion: false,
    keyboardSound: "crystal-purple"
  };

  let settings;
  try {
    settings = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem("settings")) || {}) };
  } catch {
    settings = { ...DEFAULTS };
  }
  window.mbSettings = settings;

  function save()  { localStorage.setItem("settings", JSON.stringify(settings)); }
  function apply() {
    document.documentElement.classList.toggle("reduce-motion", !!settings.reduceMotion);
  }
  apply();

  const modal   = document.getElementById("settings-modal");
  const openBtn = document.getElementById("openSettings");
  if (!modal || !openBtn) return;
  const closeBtn = document.getElementById("settings-close");

  modal.querySelectorAll("[data-setting]").forEach(input => {
    input.checked = !!settings[input.dataset.setting];
    input.addEventListener("change", () => {
      settings[input.dataset.setting] = input.checked;
      save();
      apply();
    });
  });
  
  const soundSelect = document.getElementById("set-keyboardSound");

  if (soundSelect) {
    soundSelect.value = settings.keyboardSound || "purple";

    soundSelect.addEventListener("change", () => {
      settings.keyboardSound = soundSelect.value;
      save();
      if (typeof window.reloadClackPack === "function") window.reloadClackPack();
    });
  }

  function onKey(e) { if (e.key === "Escape") close(); }
  function open()  { modal.hidden = false; document.addEventListener("keydown", onKey); }
  function close() { modal.hidden = true;  document.removeEventListener("keydown", onKey); openBtn.focus(); }

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
})();

// achievements !! (written by CLAUDE, format written by me)
window.MB_ACH = (function () {
  // registry
  const LIST = [
    // total words
    { id:"first_word", tier:"bronze", name:"First Word!",              desc:"Type your first real word.",   value:m=>m.totalWords, goal:1 },
    { id:"words_50",   tier:"bronze", name:"Getting Chatty",           desc:"Reach 50 total words.",        value:m=>m.totalWords, goal:50 },
    { id:"words_100",  tier:"bronze", name:"Hundred Club",             desc:"Reach 100 total words.",       value:m=>m.totalWords, goal:100 },
    { id:"words_250",  tier:"bronze", name:"Talkative",                desc:"Reach 250 total words.",       value:m=>m.totalWords, goal:250 },
    { id:"words_500",  tier:"bronze", name:"Motormouth",               desc:"Reach 500 total words.",       value:m=>m.totalWords, goal:500 },
    { id:"words_750",  tier:"bronze", name:"Logorrhea",                desc:"Reach 750 total words.",       value:m=>m.totalWords, goal:750 },
    { id:"words_1k",   tier:"bronze", name:"Novelist Monkey",          desc:"Reach 1,000 total words.",     value:m=>m.totalWords, goal:1000 },
    { id:"words_1500", tier:"bronze", name:"Prolific",                 desc:"Reach 1,500 total words.",     value:m=>m.totalWords, goal:1500 },
    { id:"words_2500", tier:"bronze", name:"Ghostwriter",             desc:"Reach 2,500 total words.",     value:m=>m.totalWords, goal:2500 },
    { id:"words_5k",   tier:"silver", name:"Word Hoarder",            desc:"Reach 5,000 total words.",     value:m=>m.totalWords, goal:5000 },
    { id:"words_7500", tier:"silver", name:"Verbose",                  desc:"Reach 7,500 total words.",     value:m=>m.totalWords, goal:7500 },
    { id:"words_10k",  tier:"silver",   name:"Bardcore",                desc:"Reach 10,000 total words.",    value:m=>m.totalWords, goal:10000 },
    { id:"words_15k",  tier:"silver",   name:"Graphomania",             desc:"Reach 15,000 total words.",    value:m=>m.totalWords, goal:15000 },
    { id:"words_25k",  tier:"silver",   name:"Filibuster",              desc:"Reach 25,000 total words.",    value:m=>m.totalWords, goal:25000 },
    { id:"words_50k",  tier:"silver",   name:"Touch Grass",             desc:"Reach 50,000 total words.",    value:m=>m.totalWords, goal:50000 },
    { id:"words_75k",  tier:"silver",   name:"Why Are You Like This",   desc:"Reach 75,000 total words.",    value:m=>m.totalWords, goal:75000 },
    { id:"words_100k", tier:"gold",   name:"Six Figures of Nonsense", desc:"Reach 100,000 total words.",   value:m=>m.totalWords, goal:100000 },
    { id:"words_250k", tier:"gold",   name:"Quarter Waster", desc:"Reach 250,000 total words.",   value:m=>m.totalWords, goal:250000 },
    { id:"words_500k", tier:"gold",   name:"Get a hobby please", desc:"Reach 500,000 total words.",   value:m=>m.totalWords, goal:500000 },
    { id:"words_1m", tier:"gold",   name:"Monopoly...?", desc:"Reach 1,000,000 total words.",   value:m=>m.totalWords, goal:1000000 },
    { id:"words_10m", tier:"gold",   name:"Okay you really need to stop", desc:"Reach 10,000,000 total words.",   value:m=>m.totalWords, goal:10000000 },

    // streaks
    { id:"streak_3",   tier:"bronze", name:"Hat Trick",               desc:"Hit a 3-word streak.",   value:m=>m.bestStreak, goal:3 },
    { id:"streak_4",   tier:"bronze", name:"Bingoooo!",           desc:"Hit a 4-word streak.",   value:m=>m.bestStreak, goal:4 },
    { id:"streak_5",   tier:"bronze", name:"On a Roll",               desc:"Hit a 5-word streak.",   value:m=>m.bestStreak, goal:5 },
    { id:"streak_7",   tier:"silver", name:"Lucky Seven",             desc:"Hit a 7-word streak.",   value:m=>m.bestStreak, goal:7 },
    { id:"streak_10",  tier:"silver", name:"Combo Breaker",           desc:"Hit a 10-word streak.",  value:m=>m.bestStreak, goal:10 },
    { id:"streak_15",  tier:"silver", name:"In the Zone",             desc:"Hit a 15-word streak.",  value:m=>m.bestStreak, goal:15 },
    { id:"streak_20",  tier:"silver",   name:"Locked In",               desc:"Hit a 20-word streak.",  value:m=>m.bestStreak, goal:20 },
    { id:"streak_25",  tier:"gold",   name:"World record?",                desc:"Hit a 25-word streak.",  value:m=>m.bestStreak, goal:25 },
    { id:"streak_40",  tier:"gold",   name:"Are they broken?",                 desc:"Hit a 40-word streak.",  value:m=>m.bestStreak, goal:40 },
    { id:"streak_50",  tier:"gold",   name:"Uhhhh...",             desc:"Hit a 50-word streak.",  value:m=>m.bestStreak, goal:50 },
    { id:"streak_75",  tier:"gold",   name:"Probably cheating by now",    desc:"Hit a 75-word streak.",  value:m=>m.bestStreak, goal:75 },
    { id:"streak_100", tier:"gold",   name:"Statistically impossible ;)",desc:"Hit a 100-word streak.", value:m=>m.bestStreak, goal:100 },

    // same word in a row
    { id:"run_2", tier:"silver", name:"Déjà Vu",       desc:"Type the same word twice in a row.",    value:m=>m.bestSameRun, goal:2 },
    { id:"run_3", tier:"gold",   name:"Stuck Key",     desc:"Type the same word 3 times in a row.",  value:m=>m.bestSameRun, goal:3 },
    { id:"run_4", tier:"gold",   name:"Broken Record", desc:"Type the same word 4 times in a row.",  value:m=>m.bestSameRun, goal:4 },
    { id:"run_5", tier:"gold",   name:"Groundhog Day", desc:"Type the same word 5 times in a row.",  value:m=>m.bestSameRun, goal:5 },
    { id:"run_10", tier:"gold",   name:"Copycat", desc:"Type the same word 10 times in a row.",  value:m=>m.bestSameRun, goal:10 },

    // longest single word
    { id:"word_3",  tier:"bronze", name:"Baby Steps",            desc:"Detect a 3-letter word.",  value:m=>m.longestWordLen, goal:3 },
    { id:"word_4",  tier:"bronze", name:"Four Play",             desc:"Detect a 4-letter word.",  value:m=>m.longestWordLen, goal:4 },
    { id:"word_5",  tier:"bronze", name:"High Five",             desc:"Detect a 5-letter word.",  value:m=>m.longestWordLen, goal:5 },
    { id:"word_6",  tier:"silver", name:"Feeling sixy yet?",          desc:"Detect a 6-letter word.",  value:m=>m.longestWordLen, goal:6 },
    { id:"word_7",  tier:"silver", name:"Big Word Energy",      desc:"Detect a 7-letter word.",  value:m=>m.longestWordLen, goal:7 },
    { id:"word_8",  tier:"gold",   name:"Lexicographer",        desc:"Detect an 8-letter word.", value:m=>m.longestWordLen, goal:8 },
    { id:"word_9",  tier:"gold",   name:"Show-Off",             desc:"Detect a 9-letter word.",  value:m=>m.longestWordLen, goal:9 },
    { id:"word_10", tier:"gold",   name:"Spelling Bee Champion",desc:"Detect a 10-letter word.", value:m=>m.longestWordLen, goal:10 },
    { id:"word_11", tier:"gold",   name:"Eleven out of Ten",    desc:"Detect an 11-letter word.",value:m=>m.longestWordLen, goal:11 },
    { id:"word_12", tier:"gold",   name:"That's a word??",    desc:"Detect a 12-letter word.", value:m=>m.longestWordLen, goal:12 },

    // unique words
    { id:"unique_50",   tier:"bronze", name:"Vocabulary",             desc:"Reach 50 unique words.",    value:m=>m.uniqueWords, goal:50 },
    { id:"unique_100",  tier:"bronze", name:"English class is home",        desc:"Reach 100 unique words.",   value:m=>m.uniqueWords, goal:100 },
    { id:"unique_250",  tier:"bronze", name:"Well-Read Primate",      desc:"Reach 250 unique words.",   value:m=>m.uniqueWords, goal:250 },
    { id:"unique_400",  tier:"bronze",   name:"Bookworm",               desc:"Reach 400 unique words.",   value:m=>m.uniqueWords, goal:400 },
    { id:"unique_500",  tier:"bronze",   name:"You must have a dictionary",     desc:"Reach 500 unique words.",   value:m=>m.uniqueWords, goal:500 },
    { id:"unique_750",  tier:"silver",   name:"Thesaurus Monkeys",          desc:"Reach 750 unique words.",   value:m=>m.uniqueWords, goal:750 },
    { id:"unique_1000", tier:"silver",   name:"Monkey geek", desc:"Reach 1,000 unique words.", value:m=>m.uniqueWords, goal:1000 },
    { id:"unique_1500",  tier:"silver",      name:"Lexicon Explorer",        desc:"Reach 1,500 unique words.",   value:m=>m.uniqueWords, goal:1500 },
    { id:"unique_2500",  tier:"silver",      name:"Word Collector",          desc:"Reach 2,500 unique words.",   value:m=>m.uniqueWords, goal:2500 },
    { id:"unique_5000",  tier:"silver",  name:"No more ooh ooh ah ah",        desc:"Reach 5,000 unique words.",   value:m=>m.uniqueWords, goal:5000 },
    { id:"unique_7500",  tier:"silver",  name:"Are we sure they're monkeys?",    desc:"Reach 7,500 unique words.",   value:m=>m.uniqueWords, goal:7500 },
    { id:"unique_10000", tier:"gold",  name:"Walking Dictionary",       desc:"Reach 10,000 unique words.",  value:m=>m.uniqueWords, goal:10000 },
    { id:"unique_15000", tier:"gold",   name:"Better vocabulary than most",       desc:"Reach 15,000 unique words.",  value:m=>m.uniqueWords, goal:15000 },
    { id:"unique_20000", tier:"gold",   name:"Library of Babel...?",        desc:"Reach 20,000 unique words.",  value:m=>m.uniqueWords, goal:20000 },
    { id:"unique_50000", tier:"gold",    name:"You need to stop now",          desc:"Reach 50,000 unique words.",  value:m=>m.uniqueWords, goal:50000 },
    { id:"unique_75000", tier:"gold",    name:"Infinite Vocabulary",     desc:"Reach 75,000 unique words.",  value:m=>m.uniqueWords, goal:75000 },
    { id:"unique_100000",tier:"gold", name:"Statistically impossible ;)",   desc:"Reach 100,000 unique words.", value:m=>m.uniqueWords, goal:100000 },
    

    // monkeys at once
    { id:"monkeys_2",    tier:"bronze", name:"Buddy System",         desc:"Run 2 monkeys at once.",     value:m=>m.monkeyCount, goal:2 },
    { id:"monkeys_5",    tier:"bronze", name:"Gimme Five!",          desc:"Run 5 monkeys at once.",     value:m=>m.monkeyCount, goal:5 },
    { id:"monkeys_10",   tier:"bronze", name:"Full Cage",            desc:"Run 10 monkeys at once.",    value:m=>m.monkeyCount, goal:10 },
    { id:"monkeys_20",   tier:"bronze", name:"Infestation",          desc:"Run 20 monkeys at once.",    value:m=>m.monkeyCount, goal:20 },
    { id:"monkeys_30",   tier:"silver", name:"This Is a Mob",        desc:"Run 30 monkeys at once.",    value:m=>m.monkeyCount, goal:30 },
    { id:"monkeys_50",   tier:"silver", name:"Monkey Go Brrrr",      desc:"Run 50 monkeys at once.",    value:m=>m.monkeyCount, goal:50 },
    { id:"monkeys_100",  tier:"silver", name:"Okay That's Enough",   desc:"Run 100 monkeys at once.",   value:m=>m.monkeyCount, goal:100 },
    { id:"monkeys_250",  tier:"gold",   name:"Barrel of Monkeys",    desc:"Run 250 monkeys at once.",   value:m=>m.monkeyCount, goal:250 },
    { id:"monkeys_500",  tier:"gold",   name:"Monkey Business",      desc:"Run 500 monkeys at once.",   value:m=>m.monkeyCount, goal:500 },
    { id:"monkeys_1000", tier:"gold",   name:"Primate Army",         desc:"Run 1,000 monkeys at once.", value:m=>m.monkeyCount, goal:1000 },
    { id:"monkeys_2500", tier:"gold",   name:"Monkey Apocalypse",    desc:"Run 2,500 monkeys at once.", value:m=>m.monkeyCount, goal:2500 },
    { id:"monkeys_5000", tier:"gold",   name:"Planet of the Monkeys",desc:"Run 5,000 monkeys at once.", value:m=>m.monkeyCount, goal:5000 },

    // word eggs: short & common
    { id:"egg_the", tier:"bronze", name:"Ironically Common",  desc:"A monkey types \"the\".", value:m=>m.words.has("the")?1:0, goal:1 },
    { id:"egg_and", tier:"bronze", name:"Conjunction",        desc:"A monkey types \"and\".", value:m=>m.words.has("and")?1:0, goal:1 },
    { id:"egg_you", tier:"bronze", name:"Talking to Me?",     desc:"A monkey types \"you\".", value:m=>m.words.has("you")?1:0, goal:1 },
    { id:"egg_are", tier:"bronze", name:"To Be",              desc:"A monkey types \"are\".", value:m=>m.words.has("are")?1:0, goal:1 },
    { id:"egg_was", tier:"bronze", name:"Past Tense",         desc:"A monkey types \"was\".", value:m=>m.words.has("was")?1:0, goal:1 },
    { id:"egg_cat", tier:"bronze", name:"Wrong Animal",       desc:"A monkey types \"cat\".", value:m=>m.words.has("cat")?1:0, goal:1 },
    { id:"egg_dog", tier:"bronze", name:"Also Wrong",         desc:"A monkey types \"dog\".", value:m=>m.words.has("dog")?1:0, goal:1 },
    { id:"egg_ape", tier:"bronze", name:"Self-Aware",         desc:"A monkey types \"ape\".", value:m=>m.words.has("ape")?1:0, goal:1 },
    { id:"egg_owl", tier:"bronze", name:"Night Shift",        desc:"A monkey types \"owl\".", value:m=>m.words.has("owl")?1:0, goal:1 },
    { id:"egg_fox", tier:"bronze", name:"Quick Brown",        desc:"A monkey types \"fox\".", value:m=>m.words.has("fox")?1:0, goal:1 },
    { id:"egg_pig", tier:"bronze", name:"Barnyard",           desc:"A monkey types \"pig\".", value:m=>m.words.has("pig")?1:0, goal:1 },
    { id:"egg_cow", tier:"bronze", name:"Moo Point",          desc:"A monkey types \"cow\".", value:m=>m.words.has("cow")?1:0, goal:1 },
    { id:"egg_bee", tier:"bronze", name:"Spelling Bee",       desc:"A monkey types \"bee\".", value:m=>m.words.has("bee")?1:0, goal:1 },
    { id:"egg_ant", tier:"bronze", name:"Tiny Typist",        desc:"A monkey types \"ant\".", value:m=>m.words.has("ant")?1:0, goal:1 },
    { id:"egg_bat", tier:"bronze", name:"Going Batty",        desc:"A monkey types \"bat\".", value:m=>m.words.has("bat")?1:0, goal:1 },
    { id:"egg_rat", tier:"bronze", name:"Rat Race",           desc:"A monkey types \"rat\".", value:m=>m.words.has("rat")?1:0, goal:1 },
    { id:"egg_eat", tier:"bronze", name:"Snack Time",         desc:"A monkey types \"eat\".", value:m=>m.words.has("eat")?1:0, goal:1 },
    { id:"egg_run", tier:"bronze", name:"Cardio",             desc:"A monkey types \"run\".", value:m=>m.words.has("run")?1:0, goal:1 },
    { id:"egg_fun", tier:"bronze", name:"Having It",          desc:"A monkey types \"fun\".", value:m=>m.words.has("fun")?1:0, goal:1 },
    { id:"egg_sad", tier:"bronze", name:"Big Mood",           desc:"A monkey types \"sad\".", value:m=>m.words.has("sad")?1:0, goal:1 },
    { id:"egg_joy", tier:"bronze", name:"Pure Joy",           desc:"A monkey types \"joy\".", value:m=>m.words.has("joy")?1:0, goal:1 },
    { id:"egg_sky", tier:"bronze", name:"Look Up",            desc:"A monkey types \"sky\".", value:m=>m.words.has("sky")?1:0, goal:1 },
    { id:"egg_sun", tier:"bronze", name:"Bright Idea",        desc:"A monkey types \"sun\".", value:m=>m.words.has("sun")?1:0, goal:1 },
    { id:"egg_key", tier:"bronze", name:"Right Tool",         desc:"A monkey types \"key\".", value:m=>m.words.has("key")?1:0, goal:1 },
    { id:"egg_why", tier:"bronze", name:"Existential",        desc:"A monkey types \"why\".", value:m=>m.words.has("why")?1:0, goal:1 },
    { id:"egg_who", tier:"bronze", name:"Identity Crisis",    desc:"A monkey types \"who\".", value:m=>m.words.has("who")?1:0, goal:1 },
    { id:"egg_how", tier:"bronze", name:"The Process",        desc:"A monkey types \"how\".", value:m=>m.words.has("how")?1:0, goal:1 },
    { id:"egg_eye", tier:"bronze", name:"Eye Spy",            desc:"A monkey types \"eye\".", value:m=>m.words.has("eye")?1:0, goal:1 },
    { id:"egg_hat", tier:"bronze", name:"Mad Hatter",         desc:"A monkey types \"hat\".", value:m=>m.words.has("hat")?1:0, goal:1 },
    { id:"egg_map", tier:"bronze", name:"Cartographer",       desc:"A monkey types \"map\".", value:m=>m.words.has("map")?1:0, goal:1 },
    { id:"egg_hug", tier:"bronze", name:"Free Hugs",          desc:"A monkey types \"hug\".", value:m=>m.words.has("hug")?1:0, goal:1 },
    { id:"egg_yes", tier:"bronze", name:"Affirmative",        desc:"A monkey types \"yes\".", value:m=>m.words.has("yes")?1:0, goal:1 },
    { id:"gay_yes", tier:"bronze", name:"Happy June!",        desc:"A monkey types \"gay\".", value:m=>m.words.has("gay")?1:0, goal:1 },

    // word eggs: medium (rare)
    { id:"egg_banana", tier:"silver", name:"Snack Break",        desc:"A monkey types \"banana\".", value:m=>m.words.has("banana")?1:0, goal:1 },
    { id:"egg_monkey", tier:"silver", name:"Know Thyself",       desc:"A monkey types \"monkey\".", value:m=>m.words.has("monkey")?1:0, goal:1 },
    { id:"egg_word",   tier:"silver", name:"How Meta",           desc:"A monkey types \"word\".",   value:m=>m.words.has("word")?1:0,   goal:1 },
    { id:"egg_words",  tier:"silver", name:"Very Meta",          desc:"A monkey types \"words\".",  value:m=>m.words.has("words")?1:0,  goal:1 },
    { id:"egg_chaos",  tier:"silver", name:"Embrace It",         desc:"A monkey types \"chaos\".",  value:m=>m.words.has("chaos")?1:0,  goal:1 },
    { id:"egg_coffee", tier:"silver", name:"Caffeinated",        desc:"A monkey types \"coffee\".", value:m=>m.words.has("coffee")?1:0, goal:1 },
    { id:"egg_jungle", tier:"silver", name:"Natural Habitat",    desc:"A monkey types \"jungle\".", value:m=>m.words.has("jungle")?1:0, goal:1 },
    { id:"egg_typing", tier:"silver", name:"On the Job",         desc:"A monkey types \"typing\".", value:m=>m.words.has("typing")?1:0, goal:1 },
    { id:"egg_random", tier:"silver", name:"Working As Intended",desc:"A monkey types \"random\".", value:m=>m.words.has("random")?1:0, goal:1 },
    { id:"egg_letter", tier:"silver", name:"Postal",             desc:"A monkey types \"letter\".", value:m=>m.words.has("letter")?1:0, goal:1 },
    { id:"egg_boring", tier:"silver", name:"Honestly",           desc:"A monkey types \"boring\".", value:m=>m.words.has("boring")?1:0, goal:1 },
    { id:"egg_asleep", tier:"silver", name:"Nap Time",           desc:"A monkey types \"asleep\".", value:m=>m.words.has("asleep")?1:0, goal:1 },
    { id:"egg_genius", tier:"silver", name:"Certified",          desc:"A monkey types \"genius\".", value:m=>m.words.has("genius")?1:0, goal:1 },
    { id:"egg_jumble", tier:"silver", name:"Word Jumble",        desc:"A monkey types \"jumble\".", value:m=>m.words.has("jumble")?1:0, goal:1 },
    { id:"egg_scream", tier:"silver", name:"Aaaaaah",            desc:"A monkey types \"scream\".", value:m=>m.words.has("scream")?1:0, goal:1 },
    { id:"egg_bored",  tier:"silver", name:"Same",               desc:"A monkey types \"bored\".",  value:m=>m.words.has("bored")?1:0,  goal:1 },
    { id:"egg_tired",  tier:"silver", name:"Me Too",             desc:"A monkey types \"tired\".",  value:m=>m.words.has("tired")?1:0,  goal:1 },
    { id:"egg_peanut", tier:"silver", name:"Reward",             desc:"A monkey types \"peanut\".", value:m=>m.words.has("peanut")?1:0, goal:1 },
    { id:"egg_branch", tier:"silver", name:"Out on a Limb",      desc:"A monkey types \"branch\".", value:m=>m.words.has("branch")?1:0, goal:1 },
    { id:"egg_climb",  tier:"silver", name:"Social Climber",     desc:"A monkey types \"climb\".",  value:m=>m.words.has("climb")?1:0,  goal:1 },
    { id:"egg_eureka", tier:"silver", name:"I Found It",         desc:"A monkey types \"eureka\".", value:m=>m.words.has("eureka")?1:0, goal:1 },
    { id:"egg_silly",  tier:"silver", name:"Goofball",           desc:"A monkey types \"silly\".",  value:m=>m.words.has("silly")?1:0,  goal:1 },
    { id:"egg_panic",  tier:"silver", name:"Don't Panic",        desc:"A monkey types \"panic\".",  value:m=>m.words.has("panic")?1:0,  goal:1 },
    { id:"egg_mumble", tier:"silver", name:"Speak Up",           desc:"A monkey types \"mumble\".", value:m=>m.words.has("mumble")?1:0, goal:1 },
    { id:"egg_babble", tier:"silver", name:"Brook",              desc:"A monkey types \"babble\".", value:m=>m.words.has("babble")?1:0, goal:1 },
    { id:"egg_giggle", tier:"silver", name:"Tee Hee",            desc:"A monkey types \"giggle\".", value:m=>m.words.has("giggle")?1:0, goal:1 },
    { id:"egg_wiggle", tier:"silver", name:"Wiggle Room",        desc:"A monkey types \"wiggle\".", value:m=>m.words.has("wiggle")?1:0, goal:1 },
    { id:"egg_puzzle", tier:"silver", name:"Puzzling",           desc:"A monkey types \"puzzle\".", value:m=>m.words.has("puzzle")?1:0, goal:1 },
    { id:"egg_riddle", tier:"silver", name:"Enigma",             desc:"A monkey types \"riddle\".", value:m=>m.words.has("riddle")?1:0, goal:1 },
    { id:"egg_pickle", tier:"silver", name:"In a Pickle",        desc:"A monkey types \"pickle\".", value:m=>m.words.has("pickle")?1:0, goal:1 },
    { id:"egg_hooray", tier:"silver", name:"Celebrate",          desc:"A monkey types \"hooray\".", value:m=>m.words.has("hooray")?1:0, goal:1 },

    // word eggs: long (basically never; here be dragons)
    { id:"egg_keyboard",   tier:"gold", name:"On Brand",        desc:"A monkey types \"keyboard\".",   value:m=>m.words.has("keyboard")?1:0,   goal:1 },
    { id:"egg_infinite",   tier:"gold", name:"The Whole Point", desc:"A monkey types \"infinite\".",   value:m=>m.words.has("infinite")?1:0,   goal:1 },
    { id:"egg_alphabet",   tier:"gold", name:"All of Them",     desc:"A monkey types \"alphabet\".",   value:m=>m.words.has("alphabet")?1:0,   goal:1 },
    { id:"egg_eternity",   tier:"gold", name:"Time Well Spent", desc:"A monkey types \"eternity\".",   value:m=>m.words.has("eternity")?1:0,   goal:1 },
    { id:"egg_sentence",   tier:"gold", name:"Full Sentence",   desc:"A monkey types \"sentence\".",   value:m=>m.words.has("sentence")?1:0,   goal:1 },
    { id:"egg_language",   tier:"gold", name:"Linguist",        desc:"A monkey types \"language\".",   value:m=>m.words.has("language")?1:0,   goal:1 },
    { id:"egg_nonsense",   tier:"gold", name:"Fitting",         desc:"A monkey types \"nonsense\".",   value:m=>m.words.has("nonsense")?1:0,   goal:1 },
    { id:"egg_patience",   tier:"gold", name:"A Virtue",        desc:"A monkey types \"patience\".",   value:m=>m.words.has("patience")?1:0,   goal:1 },
    { id:"egg_champion",   tier:"gold", name:"The Champ",       desc:"A monkey types \"champion\".",   value:m=>m.words.has("champion")?1:0,   goal:1 },
    { id:"egg_elephant",   tier:"gold", name:"Wrong Animal IV", desc:"A monkey types \"elephant\".",   value:m=>m.words.has("elephant")?1:0,   goal:1 },
    { id:"egg_umbrella",   tier:"gold", name:"Just in Case",    desc:"A monkey types \"umbrella\".",   value:m=>m.words.has("umbrella")?1:0,   goal:1 },
    { id:"egg_mosquito",   tier:"gold", name:"Pest",            desc:"A monkey types \"mosquito\".",   value:m=>m.words.has("mosquito")?1:0,   goal:1 },
    { id:"egg_chocolate",  tier:"gold", name:"Sweet",           desc:"A monkey types \"chocolate\".",  value:m=>m.words.has("chocolate")?1:0,  goal:1 },
    { id:"egg_butterfly",  tier:"gold", name:"Metamorphosis",   desc:"A monkey types \"butterfly\".",  value:m=>m.words.has("butterfly")?1:0,  goal:1 },
    { id:"egg_xylophone",  tier:"gold", name:"Rare Letters",    desc:"A monkey types \"xylophone\".",  value:m=>m.words.has("xylophone")?1:0,  goal:1 },
    { id:"egg_gibberish",  tier:"gold", name:"On the Nose",     desc:"A monkey types \"gibberish\".",  value:m=>m.words.has("gibberish")?1:0,  goal:1 },
    { id:"egg_adjective",  tier:"gold", name:"Descriptive",     desc:"A monkey types \"adjective\".",  value:m=>m.words.has("adjective")?1:0,  goal:1 },
    { id:"egg_vocabulary", tier:"gold", name:"Show-Off Deluxe", desc:"A monkey types \"vocabulary\".", value:m=>m.words.has("vocabulary")?1:0, goal:1 },
    { id:"egg_paragraph",  tier:"gold", name:"Overachiever",    desc:"A monkey types \"paragraph\".",  value:m=>m.words.has("paragraph")?1:0,  goal:1 },
    { id:"egg_dictionary", tier:"gold", name:"Source Material", desc:"A monkey types \"dictionary\".", value:m=>m.words.has("dictionary")?1:0, goal:1 },
    { id:"egg_literature", tier:"gold", name:"Highbrow",        desc:"A monkey types \"literature\".", value:m=>m.words.has("literature")?1:0, goal:1 },
    { id:"egg_masterpiece",tier:"gold", name:"Accidental Genius",desc:"A monkey types \"masterpiece\".",value:m=>m.words.has("masterpiece")?1:0,goal:1 },

    // secrets
    { id:"combo_started",     tier:"bronze", name:"Just Getting Started",  desc:"50 words with 2 monkeys running.",      value:m=>(m.totalWords>=50 && m.monkeyCount>=2)?1:0,                          goal:1 },
    { id:"combo_swarm",       tier:"silver", name:"Swarm Intelligence",    desc:"1,000 words with 10 monkeys running.",  value:m=>(m.totalWords>=1000 && m.monkeyCount>=10)?1:0,                       goal:1 },
    { id:"combo_onetrack",    tier:"silver", name:"One-Track Mind",        desc:"500 words with under 25 unique.",       value:m=>(m.totalWords>=500 && m.uniqueWords<25)?1:0,                         goal:1 },
    { id:"combo_minimalist",  tier:"silver", name:"Minimalist",            desc:"1,000 words with under 100 unique.",    value:m=>(m.totalWords>=1000 && m.uniqueWords<100)?1:0,                       goal:1 },
    { id:"combo_quality",     tier:"silver", name:"Quality Control",       desc:"A 7-letter word before 200 words.",     value:m=>(m.longestWordLen>=7 && m.totalWords<200)?1:0,                       goal:1 },
    { id:"combo_overkill",    tier:"silver", name:"Overkill",              desc:"20 monkeys and 10,000 words.",          value:m=>(m.monkeyCount>=20 && m.totalWords>=10000)?1:0,                      goal:1 },
    { id:"combo_eloquent",    tier:"gold",   name:"Eloquent",              desc:"1,000 words and 300 unique.",           value:m=>(m.totalWords>=1000 && m.uniqueWords>=300)?1:0,                      goal:1 },
    { id:"combo_luck",        tier:"gold",   name:"Beginner's Luck",       desc:"An 8-letter word before 1,000 words.",  value:m=>(m.longestWordLen>=8 && m.totalWords<1000)?1:0,                      goal:1 },
    { id:"combo_grind",       tier:"gold",   name:"The Grind",             desc:"50,000 words and 500 unique.",          value:m=>(m.totalWords>=50000 && m.uniqueWords>=500)?1:0,                     goal:1 },
    { id:"combo_nolife",      tier:"gold",   name:"Touch Grass II",        desc:"25,000 words with 10 monkeys.",         value:m=>(m.totalWords>=25000 && m.monkeyCount>=10)?1:0,                      goal:1 },
    { id:"combo_glitch",      tier:"gold",   name:"Glitch in the Matrix",  desc:"A same-word run of 2 and a 10-streak.", value:m=>(m.bestSameRun>=2 && m.bestStreak>=10)?1:0,                          goal:1 },
    { id:"combo_renaissance", tier:"gold",   name:"Renaissance Monkey",    desc:"500 unique, an 8-letter word, a 25-streak.", value:m=>(m.uniqueWords>=500 && m.longestWordLen>=8 && m.bestStreak>=25)?1:0, goal:1 },
    { id:"combo_perfect",     tier:"gold",   name:"Perfectionist",         desc:"A 10-letter word, a 25-streak, 250 unique.", value:m=>(m.longestWordLen>=10 && m.bestStreak>=25 && m.uniqueWords>=250)?1:0, goal:1 },
  ];

  let unlocked;
  try { unlocked = new Set(JSON.parse(localStorage.getItem("unlockedAchievements")) || []); }
  catch { unlocked = new Set(); }
  function persist(){ localStorage.setItem("unlockedAchievements", JSON.stringify([...unlocked])); }

  // CLAUDE
  function metrics(words, totalWords, bestStreak, monkeyCount, bestSameRun) {
    // NOTE: bestSameRun must come from the live tracker (which respects gibberish
    // gaps between words); it can't be recomputed from this flattened word list,
    // since gibberish has already been stripped, making non-adjacent duplicates
    // (e.g. "the oiaoa the") look like a real run.
    let longest = 0;
    for (const w of words) {
      if (w.length > longest) longest = w.length;
    }
    return {
      totalWords: totalWords || 0,
      bestStreak: bestStreak || 0,
      bestSameRun: bestSameRun || 0,
      longestWordLen: longest,
      uniqueWords: new Set(words).size,
      monkeyCount: monkeyCount || 0,
      words: new Set(words),
    };
  }

  function collect() {
    let sessionWords = [], monkeyList = [];
    try { sessionWords = JSON.parse(localStorage.getItem("sessionAllWords") || "[]"); } catch {}
    const sessionEarned = parseInt(localStorage.getItem("sessionWordsEarned") || "0");
    try { monkeyList = JSON.parse(localStorage.getItem("monkeys") || "[]"); } catch {}
    const localBest = monkeyList.reduce((b,m)=>Math.max(b, m.bestStreak||0), 0);
    const localBestRun = monkeyList.reduce((b,m)=>Math.max(b, m.bestSameRun||0), 0);
    return fetch("/me").then(r=>r.json()).then(data => {
      const s = (data.logged_in && data.stats) ? data.stats : null;
      const serverWords = s && s.all_words ? s.all_words.split(/\s+/).filter(Boolean) : [];
      const words = serverWords.concat(sessionWords);
      const total = (s ? s.word_amount : 0) + sessionEarned;
      const best  = Math.max(localBest, s ? s.longest_streak : 0);
      const m = metrics(words, total, best, monkeyList.length, localBestRun);
      m.loggedIn = !!data.logged_in;
      return m;
    });
  }

  function check(m) {
    for (const a of LIST) {
      if (!unlocked.has(a.id) && a.value(m) >= a.goal) {
        unlocked.add(a.id); persist();
        if (window.mbSettings?.achievementToasts !== false) toast(a);
        if (window.mbSettings?.sound && window.mbSettings?.achievementSound !== false) chime(a);
      }
    }
  }

  function toast(a) {
    let stack = document.getElementById("toast-stack");
    if (!stack) { stack = document.createElement("div"); stack.id = "toast-stack"; document.body.appendChild(stack); }
    const el = document.createElement("div");
    el.className = "ach-toast tier-" + a.tier;
    el.innerHTML = `<div class="ach-toast-head">achievement unlocked</div>
                    <div class="ach-toast-name">${a.name}</div>
                    <div class="ach-toast-desc">${a.desc}</div>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 8000);
  }

  function chime(a) {
    try {
      const rates = { bronze: 1.0, silver: 1.5, gold: 2 };
      const audio = new Audio("/static/sounds/achievement.ogg");
      audio.volume = 0.6;
      audio.preservesPitch = false;
      audio.mozPreservesPitch = false;
      audio.webkitPreservesPitch = false;
      audio.playbackRate = rates[a?.tier] || 1.0;
      audio.play().catch(() => {});
    } catch {}
  }

  function render(m, grid, counter) {
    let got = 0; grid.innerHTML = "";
    for (const a of LIST) {
      const done = unlocked.has(a.id) || a.value(m) >= a.goal;
      if (done) got++;
      const card = document.createElement("div");
      card.className = "ach-card " + (done ? "unlocked tier-" + a.tier : "locked");
      card.innerHTML = done
        ? `<div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div><div class="ach-tier">${a.tier}</div>`
        : `<div class="ach-name">???</div><div class="ach-desc">Locked — keep typing to discover this one.</div>`;
      grid.appendChild(card);
    }
    counter.textContent = `${got} / ${LIST.length} unlocked`;
  }

  return { LIST, metrics, collect, check, render };
})();

window.mbToast = function (msg) {
  let stack = document.getElementById("toast-stack");
  if (!stack) { stack = document.createElement("div"); stack.id = "toast-stack"; document.body.appendChild(stack); }
  const el = document.createElement("div");
  el.className = "ach-toast";
  el.innerHTML = `<div class="ach-toast-name">${msg}</div>`;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 3000);
};

(function () {
  if (!document.getElementById("tabs")) return;

const characters = "                                        eeeeeeeeeetttttttaaaaaaaooooooiiiiiinnnnnssssshhhhhrrrrrddddllllccuummwwffggyyppbbvkjxqz";

let loggedIn = false;
let wordSet = new Set();
let monkeys = [];
let activeMonkeyId = null;

let sessionWordsEarned = 0;
let sessionAllWords = [];

let serverBaseline = {
  total_words: 0,
  longest_streak: 0,
  longest_streak_words: [],
  all_words_list: [],
};

const tabsEl = document.getElementById("tabs");
const monkeyCountEl = document.getElementById("monkeyCount");
const addTabBtn = document.getElementById("addTab");
const containerEl = document.getElementById("container");
const totalWordsEl = document.getElementById("totalWords");
const streakEl = document.getElementById("streak");
const streakWordsEl = document.getElementById("streakWords");
const bestStreakEl = document.getElementById("bestStreak");
const bestStreakWordsEl = document.getElementById("bestStreakWords");
const combinedTotalEl = document.getElementById("combinedTotal");
const combinedBestStreakEl = document.getElementById("combinedBestStreak");
const combinedBestStreakWordsEl = document.getElementById("combinedBestStreakWords");

let namesList = [];

// local storage !!

function saveMonkeysToStorage() {
  const data = monkeys.map(m => ({
    id: m.id,
    name: m.name,
    counter: m.counter,
    bestStreak: m.bestStreak,
    bestStreakWords: m.bestStreakWords,
    bestSameRun: m.bestSameRun,
    allWords: m.allWords,
    speed: m.speed,
  }));
  localStorage.setItem("monkeys", JSON.stringify(data));
  localStorage.setItem("activeMonkeyId", activeMonkeyId);
  localStorage.setItem("sessionWordsEarned", sessionWordsEarned);
  localStorage.setItem("sessionAllWords", JSON.stringify(sessionAllWords));
}

function loadMonkeysFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("monkeys")) || [];
  } catch {
    return [];
  }
}

// monkey objs

function createMonkey(id, name) {
  return {
    id,
    name,
    currentString: " ",
    counter: 0,
    detectedWords: [],
    lastMatchCount: 0,
    allWords: [],
    streak: 0,
    bestStreak: 0,
    streakWords: [],
    bestStreakWords: [],
    running: false,
    timeoutHandle: null,
    speed: 30,
    lastWordMatchIndex: -2,
    bestSameRun: 0,
    currentSameRun: 0,
    lastSameRunWord: null,
    lastSameRunIdx: -2,
  };
}

function addMonkey() {
  const id = Date.now();
  const name = namesList.length > 0
    ? namesList[Math.floor(Math.random() * namesList.length)]
    : `Monkey ${monkeys.length + 1}`;
  const monkey = createMonkey(id, name);
  monkeys.push(monkey);
  saveMonkeysToStorage();
  startMonkey(monkey);
  renderTabs();
  switchTo(id);
}

function removeMonkey(id) {
  const monkey = monkeys.find(m => m.id === id);
  if (monkey) {
    clearTimeout(monkey.timeoutHandle);
    monkey.running = false;
  }
  monkeys = monkeys.filter(m => m.id !== id);
  saveMonkeysToStorage();
  renderTabs();
  if (monkeys.length === 0) {
    activeMonkeyId = null;
    showEmptyState();
  } else {
    switchTo(monkeys[monkeys.length - 1].id);
  }
}

function switchTo(id) {
  activeMonkeyId = id;
  localStorage.setItem("activeMonkeyId", id);
  renderTabs();
  renderStats();
  const monkey = monkeys.find(m => m.id === id);
  if (monkey) renderMonkeyOutput(monkey);
}

// tab ui stuff (help bugfixing from CLAUDE)

let editingMonkeyId = null;

function renderTabs() {
  if (monkeyCountEl) monkeyCountEl.textContent = monkeys.length;
  tabsEl.innerHTML = "";
  if (monkeys.length === 0) {
    const empty = document.createElement("span");
    empty.className = "cage-empty";
    empty.textContent = "add your first monkey";
    tabsEl.appendChild(empty);
    return;
  }
  for (const monkey of monkeys) {
    const tab = document.createElement("span");
    if (monkey.id === activeMonkeyId) tab.classList.add("active");

    if (editingMonkeyId === monkey.id) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = monkey.name;
      tab.appendChild(input);

      let committed = false;
      function commit() {
        if (committed) return;
        committed = true;
        monkey.name = input.value.trim() || monkey.name;
        editingMonkeyId = null;
        saveMonkeysToStorage();
        renderTabs();
      }

      input.addEventListener("mousedown", e => e.stopPropagation());
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { committed = true; editingMonkeyId = null; renderTabs(); }
      });

      requestAnimationFrame(() => { input.focus(); input.select(); });
    } else {
      const nameSpan = document.createElement("span");
      nameSpan.textContent = monkey.name;

      let clickTimer = null;
      nameSpan.addEventListener("click", e => {
        e.stopPropagation();
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          editingMonkeyId = monkey.id;
          renderTabs();
        } else {
          clickTimer = setTimeout(() => {
            clickTimer = null;
            switchTo(monkey.id);
          }, 250);
        }
      });

      tab.appendChild(nameSpan);
    }

    const x = document.createElement("span");
    x.textContent = " ×";
    x.addEventListener("click", e => {
      e.stopPropagation();
      removeMonkey(monkey.id);
    });

    const pauseBtn = document.createElement("button");
    pauseBtn.textContent = monkey.running ? "pause" : "resume";
    pauseBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (monkey.running) {
        clearTimeout(monkey.timeoutHandle);
        monkey.running = false;
      } else {
        startMonkey(monkey);
      }
      saveMonkeysToStorage();
      renderTabs();
    });
    tab.appendChild(pauseBtn);

    const speedSlider = document.createElement("input");
    speedSlider.type = "range";
    speedSlider.min = "1";
    speedSlider.max = "99";
    speedSlider.value = String(100 - monkey.speed);
    speedSlider.title = "speed";
    speedSlider.addEventListener("input", e => {
      e.stopPropagation();
      monkey.speed = 100 - parseInt(speedSlider.value);
      saveMonkeysToStorage();
    });
    tab.appendChild(speedSlider);

    tab.appendChild(x);
    tabsEl.appendChild(tab);
  }
}

// stats display (https://www.youtube.com/watch?v=qZggyrjELTM)

function clearStats() {
  totalWordsEl.textContent = "0";
  streakEl.textContent = "0";
  bestStreakEl.textContent = "0";
  if (streakWordsEl) streakWordsEl.textContent = "";
  if (bestStreakWordsEl) bestStreakWordsEl.textContent = "";

  const combinedTotal = serverBaseline.total_words + sessionWordsEarned;
  if (combinedTotalEl) combinedTotalEl.textContent = combinedTotal;
  if (combinedBestStreakEl) combinedBestStreakEl.textContent = serverBaseline.longest_streak;
  if (combinedBestStreakWordsEl) combinedBestStreakWordsEl.textContent = serverBaseline.longest_streak_words.join(", ");
}

function renderStats() {
  const monkey = monkeys.find(m => m.id === activeMonkeyId);
  if (!monkey) return;

  totalWordsEl.textContent = monkey.counter;
  streakEl.textContent = monkey.streak;
  bestStreakEl.textContent = monkey.bestStreak;
  if (streakWordsEl) streakWordsEl.textContent = monkey.streakWords.join(" ");
  if (bestStreakWordsEl) bestStreakWordsEl.textContent = monkey.bestStreakWords.join(", ");

  const combinedTotal = serverBaseline.total_words + sessionWordsEarned;

  const bestMonkey = monkeys.reduce(
    (best, m) => m.bestStreak > best.bestStreak ? m : best,
    { bestStreak: 0, bestStreakWords: [] }
  );
  const combinedBest = Math.max(bestMonkey.bestStreak, serverBaseline.longest_streak);
  const combinedBestWords = bestMonkey.bestStreak >= serverBaseline.longest_streak
    ? bestMonkey.bestStreakWords
    : serverBaseline.longest_streak_words;

  if (combinedTotalEl) combinedTotalEl.textContent = combinedTotal;
  if (combinedBestStreakEl) combinedBestStreakEl.textContent = combinedBest;
  if (combinedBestStreakWordsEl) combinedBestStreakWordsEl.textContent = combinedBestWords.join(", ");

  if (window.MB_ACH) {
    const words = (serverBaseline.all_words_list || []).concat(sessionAllWords);
    const bestSameRun = monkeys.reduce((b, m) => Math.max(b, m.bestSameRun || 0), 0);
    MB_ACH.check(MB_ACH.metrics(words, combinedTotal, combinedBest, monkeys.length, bestSameRun));
  }
}

// monkey typing logic

function checkRecentWords(monkey) {
  const matches = monkey.currentString.toLowerCase().match(/ ([a-z]+)(?= )/g);
  const matchCount = matches ? matches.length : 0;

  if (matchCount <= monkey.lastMatchCount) return;

  const newMatches = matches.slice(monkey.lastMatchCount);
  const matchOffset = monkey.lastMatchCount;
  monkey.lastMatchCount = matchCount;

  for (let i = 0; i < newMatches.length; i++) {
    const word = newMatches[i].trim();
    const matchIdx = matchOffset + i;
    if (wordSet.has(word)) {
      monkey.counter++;
      monkey.detectedWords.push(word);
      monkey.allWords.push(word);
      sessionWordsEarned++;
      sessionAllWords.push(word);
      monkey.streak = (monkey.lastMatchCount - 1 === monkey.lastWordMatchIndex) ? monkey.streak + 1 : 1;
      monkey.lastWordMatchIndex = monkey.lastMatchCount - 1;
      monkey.streakWords = monkey.streak === 1 ? [word] : [...monkey.streakWords, word];
      if (monkey.id === activeMonkeyId) playStreakTone(monkey.streak);  // CLAUDE
      if (monkey.streak > monkey.bestStreak) {
        monkey.bestStreak = monkey.streak;
        monkey.bestStreakWords = [...monkey.streakWords];
      }
      // same word run CLAUDE
      if (word === monkey.lastSameRunWord && matchIdx === monkey.lastSameRunIdx + 1) {
        monkey.currentSameRun++;
        if (monkey.currentSameRun > 1) console.log(`[same-run] "${word}" x${monkey.currentSameRun} (matchIdx ${monkey.lastSameRunIdx} → ${matchIdx})`);
      } else {
        monkey.currentSameRun = 1;
      }
      monkey.lastSameRunWord = word;
      monkey.lastSameRunIdx = matchIdx;
      if (monkey.currentSameRun > monkey.bestSameRun) {
        monkey.bestSameRun = monkey.currentSameRun;
      }
    } else {
      monkey.streak = 0;
      monkey.streakWords = [];
      // intentionally don't touch lastSameRunWord/lastSameRunIdx —
      // the index gap will make the next real word fail the adjacency check automatically
    }
  }

  if (monkey.id === activeMonkeyId) renderStats();
}

let storageSaveTimer = null;
function scheduleSaveToStorage() {
  if (storageSaveTimer) return;
  storageSaveTimer = setTimeout(() => {
    storageSaveTimer = null;
    saveMonkeysToStorage();
  }, 2000);
}

function renderMonkeyOutput(monkey) {
  const nearBottom =
    containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight < 40;
  containerEl.innerHTML = monkey.currentString.replace(
    /[a-z]+(?= )/g,
    word => wordSet.has(word) ? `<span class="detected">${word}</span>` : word
  );
  if (nearBottom) containerEl.scrollTop = containerEl.scrollHeight;
}

function tickMonkey(monkey) {
  if (!monkey.running) return;
  const randomChar = characters[Math.floor(Math.random() * characters.length)];
  monkey.currentString += randomChar;
  if (monkey.id === activeMonkeyId) { renderMonkeyOutput(monkey); playClack(randomChar); }  // CLAUDE: clack
  checkRecentWords(monkey);
  scheduleSaveToStorage();
  monkey.timeoutHandle = setTimeout(() => tickMonkey(monkey), monkey.speed * (0.8 + Math.random() * 0.4));
}

function startMonkey(monkey) {
  monkey.running = true;
  tickMonkey(monkey);
}

// server sync CLAUDE help

function buildSavePayload() {
  const combinedTotal = serverBaseline.total_words + sessionWordsEarned;
  const bestMonkey = monkeys.reduce(
    (best, m) => m.bestStreak > best.bestStreak ? m : best,
    { bestStreak: 0, bestStreakWords: [] }
  );
  const combinedBest = Math.max(bestMonkey.bestStreak, serverBaseline.longest_streak);
  const combinedBestWords = bestMonkey.bestStreak >= serverBaseline.longest_streak
    ? bestMonkey.bestStreakWords
    : serverBaseline.longest_streak_words;

  return {
    total_words: combinedTotal,
    longest_streak: combinedBest,
    longest_streak_words: combinedBestWords.join(" "),
    all_words: sessionAllWords.join(" "),
  };
}

setInterval(() => {
  if (loggedIn && monkeys.length > 0) {
    fetch("/save_result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSavePayload()),
    });
  }
}, 5000);

window.beforeSignOut = () => {
  if (loggedIn && monkeys.length > 0) {
    navigator.sendBeacon(
      "/save_result",
      new Blob([JSON.stringify(buildSavePayload())], { type: "application/json" })
    );
  }
};

// CLAUDE, https://mechvibes.com/sound-packs
let audioCtx = null;
function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audioCtx) audioCtx = new AC();
  else if (audioCtx.state === "suspended") audioCtx.resume();
  loadClackSamples();
  loadWordSound();
}

document.addEventListener("click", ensureAudio);
document.addEventListener("keydown", ensureAudio);

function getSoundPaths() {
  const pack = window.mbSettings?.keyboardSound || "crystal-purple";

  const soundFile = pack === "crystal-purple"
    ? "purple.ogg"
    : pack === "Vine Boom"
      ? "Vine.mp3"
      : "sound.ogg";

  return {
    sound: `/static/sounds/${pack}/${soundFile}`,
    config: `/static/sounds/${pack}/config.json`
  };
}

const KEY_SCANCODES = {
  a:30, b:48, c:46, d:32, e:18, f:33, g:34, h:35, i:23, j:36, k:37, l:38, m:50,
  n:49, o:24, p:25, q:16, r:19, s:31, t:20, u:22, v:47, w:17, x:45, y:21, z:44,
  " ":57,
};

let soundBuffer = null;
let keySlices = null;
let clackLoadStarted = false;
const WORD_SOUND_SRC = "/static/sounds/word.ogg";

let wordBuffer = null;
let wordLoadStarted = false;

function loadWordSound() {
  if (wordLoadStarted || !audioCtx) return;
  wordLoadStarted = true;

  fetch(WORD_SOUND_SRC)
    .then(r => r.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(decoded => { wordBuffer = decoded; })
    .catch(() => {});
}
function loadClackSamples() {
  if (clackLoadStarted || !audioCtx) return;
  clackLoadStarted = true;

  const paths = getSoundPaths();
  fetch(paths.config)
    .then(r => r.json())
    .then(cfg => {
      const defines = cfg.defines || {};
      const slices = {};
      for (const ch in KEY_SCANCODES) {
        const def = defines[KEY_SCANCODES[ch]];
        if (def) slices[ch] = def;
      }
      keySlices = slices;
    })
    .catch(() => {});

  fetch(paths.sound)
    .then(r => r.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(decoded => { soundBuffer = decoded; })
    .catch(() => {});
}

let lastClack = 0;
function playClack(char) {
  const s = window.mbSettings;
  if (!audioCtx || !s || !s.sound || !s.keyClacks) return;
  if (!soundBuffer || !keySlices) return;
  const now = performance.now();
  if (now - lastClack < 80) return;
  lastClack = now;

  const slice = keySlices[char] || keySlices[" "];
  if (!slice) return;
  const [startMs, durMs] = slice;
  const src = audioCtx.createBufferSource();
  src.buffer = soundBuffer;
  const g = audioCtx.createGain();
  g.gain.value = 0.7 + Math.random() * 0.2;
  src.connect(g).connect(audioCtx.destination);
  src.start(audioCtx.currentTime, startMs / 1000, durMs / 1000);
}

function playStreakTone(streak) {
  window.reloadClackPack = function () {
    soundBuffer = null;
    keySlices = null;
    clackLoadStarted = false;
    loadClackSamples();
  };
  const s = window.mbSettings;
  if (!audioCtx || !s || !s.sound || !s.streakTone) return;
  if (!wordBuffer) return;

  const src = audioCtx.createBufferSource();
  src.buffer = wordBuffer;

  src.playbackRate.value = Math.min(
    1 + Math.max(0, streak - 1) * 0.08,
    2
  );

  src.connect(audioCtx.destination);
  src.start();
}

// empty state
function showEmptyState() {
  clearStats();
  containerEl.textContent = "";
  renderTabs();
}

// button listeners

const saveBtn    = document.getElementById("saveBtn");
const pauseAllBtn = document.getElementById("pauseAll");

pauseAllBtn.addEventListener("click", () => {
  const anyRunning = monkeys.some(m => m.running);
  monkeys.forEach(m => {
    if (anyRunning) {
      clearTimeout(m.timeoutHandle);
      m.running = false;
    } else {
      startMonkey(m);
    }
  });
  pauseAllBtn.textContent = anyRunning ? "resume all" : "pause all";
  saveMonkeysToStorage();
  renderTabs();
});

saveBtn.addEventListener("click", () => {
  if (!loggedIn) { mbToast("You are not logged in"); return; }
  fetch("/save_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSavePayload()),
  })
  .then(res => res.json())
  .then(() => mbToast("Saved!"))
  .catch(() => mbToast("Save failed"));
});

addTabBtn.addEventListener("click", () => {
  ensureAudio();
  const before = addTabBtn.getBoundingClientRect().top; // CLAUDE: keep add button under cursor on wrap
  addMonkey();
  const after = addTabBtn.getBoundingClientRect().top;
  window.scrollBy(0, after - before);
});

// delete-all conf
function deleteAllMonkeys() {
  monkeys.forEach(m => clearTimeout(m.timeoutHandle));
  monkeys = [];
  activeMonkeyId = null;
  saveMonkeysToStorage();
  showEmptyState();
}

const deleteAllBtn = document.getElementById("deleteAll");
const deleteModal  = document.getElementById("deleteall-modal");
if (deleteAllBtn && deleteModal) {
  const dCancel  = document.getElementById("deleteall-cancel");
  const dConfirm = document.getElementById("deleteall-confirm");

  function dOnKey(e) { if (e.key === "Escape") dClose(); }
  function dOpen()  { deleteModal.hidden = false; dCancel.focus(); document.addEventListener("keydown", dOnKey); }
  function dClose() { deleteModal.hidden = true;  document.removeEventListener("keydown", dOnKey); deleteAllBtn.focus(); }

  deleteAllBtn.addEventListener("click", dOpen);
  dCancel.addEventListener("click", dClose);
  deleteModal.addEventListener("click", e => { if (e.target === deleteModal) dClose(); });
  dConfirm.addEventListener("click", () => { deleteAllMonkeys(); dClose(); });
}

// boot sequence

fetch("/static/words.txt")
  .then(res => res.text())
  .then(text => {
    wordSet = new Set(
      text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(Boolean)
    );
    return fetch("/static/names.txt");
  })
  .then(res => res.text())
  .then(text => {
    namesList = text.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
    return fetch("/me").then(r => r.json());
  })
  .then(data => {
    loggedIn = data.logged_in;

    if (data.logged_in && data.stats) {
      serverBaseline.total_words     = data.stats.word_amount;
      serverBaseline.longest_streak  = data.stats.longest_streak;
      serverBaseline.longest_streak_words = data.stats.longest_streak_words
        ? data.stats.longest_streak_words.split(" ")
        : [];
      serverBaseline.all_words_list = data.stats.all_words
        ? data.stats.all_words.split(/\s+/).filter(Boolean)
        : [];
    }

    sessionWordsEarned = parseInt(localStorage.getItem("sessionWordsEarned") || "0");
    sessionAllWords    = JSON.parse(localStorage.getItem("sessionAllWords") || "[]");

    const saved = loadMonkeysFromStorage();
    if (saved.length > 0) {
      for (const s of saved) {
        const monkey = createMonkey(s.id, s.name);
        monkey.counter        = s.counter || 0;
        monkey.bestStreak     = s.bestStreak || 0;
        monkey.bestStreakWords = s.bestStreakWords || [];
        monkey.bestSameRun    = s.bestSameRun || 0;
        monkey.allWords       = s.allWords || [];
        monkey.speed          = s.speed !== undefined ? s.speed : 20;
        monkeys.push(monkey);
        startMonkey(monkey);
      }
      const savedActiveId = parseInt(localStorage.getItem("activeMonkeyId"));
      const activeExists  = monkeys.find(m => m.id === savedActiveId);
      renderTabs();
      switchTo(activeExists ? savedActiveId : monkeys[0].id);
    } else {
      showEmptyState();
    }
  });

})();
