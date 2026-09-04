// MultitaskCoder
// Module: App Constants & Config

export const APP_NAME = "MultitaskCoder";
export const APP_VERSION = "3.4";

export const SUPPORTED_LANGUAGES = ["python", "java", "c"];
export const THEORY_SECTIONS = ["python", "java", "c", "comparison"];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export const STORAGE_KEYS = {
  PROGRESS: "mtc_progress",
  STATS: "mtc_stats",
  THEME: "mtc_theme"
};

export const ROUTES = {
  HOME: "home",
  LEARN: "learn",
  TYPING: "typing",
  DEBUGGER: "debugger",
  QUIZZES: "quizzes",
  PROFILE: "profile",
  SANDBOX: "sandbox"
};

export const XP_REWARDS = {
  TYPING_DRILL: 25,
  DEBUGGER_CHALLENGE: 50,
  QUIZ_QUESTION: 30,
  THEORY_LESSON: 15,
  DAILY_CHALLENGE: 50
};

export const GEM_REWARDS = {
  TYPING_DRILL: 10,
  DEBUGGER_CHALLENGE: 25,
  QUIZ_QUESTION: 15,
  THEORY_LESSON: 5,
  DAILY_CHALLENGE: 25
};

export const DEFAULT_STATS = {
  xp: 870,
  streak: 7,
  gems: 870,
  level: 8,
  badgesCount: 12,
  completedTyping: [],
  completedQuizzes: [],
  completedDebugger: [],
  completedLessons: [],
  dailyChallengeDone: false,
  lastDailyDate: "",
  typingStats: {
    totalDrills: 0,
    bestWpm: 0,
    totalCharsTyped: 0
  },
  debuggerStats: {
    bugsFixed: 0
  },
  quizStats: {
    quizzesCompleted: 0,
    totalCorrect: 0
  }
};

export const BADGES = [
  { id: "first-step", name: "First Step", icon: "fa-seedling", color: "text-emerald-400", desc: "Completed your first drill or lesson" },
  { id: "speed-typist", name: "Speed Typist", icon: "fa-bolt", color: "text-amber-400", desc: "Achieved over 40 WPM in code typing" },
  { id: "bug-hunter", name: "Bug Hunter", icon: "fa-spider", color: "text-rose-400", desc: "Solved 5 debugger challenges" },
  { id: "quiz-master", name: "Quiz Master", icon: "fa-bullseye", color: "text-purple-400", desc: "Scored 100% on a multi-question quiz" },
  { id: "python-pro", name: "Python Pro", icon: "fa-python", color: "text-yellow-400", desc: "Completed 10 Python challenges" },
  { id: "java-champion", name: "Java Knight", icon: "fa-java", color: "text-orange-400", desc: "Completed 10 Java challenges" },
  { id: "c-warrior", name: "C Pioneer", icon: "fa-code", color: "text-blue-400", desc: "Mastered low-level memory and pointers" },
  { id: "polyglot", name: "Polyglot", icon: "fa-globe", color: "text-cyan-400", desc: "Practiced in Python, Java, and C" },
  { id: "streak-week", name: "Week Warrior", icon: "fa-fire", color: "text-orange-500", desc: "Maintained a 7-day practice streak" },
  { id: "night-owl", name: "Night Owl", icon: "fa-moon", color: "text-indigo-400", desc: "Practiced coding in dark mode" },
  { id: "scholar", name: "Theory Scholar", icon: "fa-book-bookmark", color: "text-emerald-400", desc: "Completed 15 theory lessons" },
  { id: "master-coder", name: "Master Coder", icon: "fa-crown", color: "text-amber-300", desc: "Earned 800+ XP across all tracks" }
];
