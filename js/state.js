// MultitaskCoder
// Module: Global State Management

import { DEFAULT_STATS, XP_REWARDS, GEM_REWARDS } from "./constants.js";
import { getStats, saveStats, getProgress, saveProgress, getTheme, saveTheme, resetAllData } from "./storage.js";

// Event bus listeners
const listeners = new Map();

function getDefaultState() {
  return {
    ...DEFAULT_STATS,
    completedTyping: [],
    completedQuizzes: [],
    completedDebugger: [],
    completedLessons: [],
    typingStats: { totalDrills: 0, bestWpm: 0, totalCharsTyped: 0 },
    debuggerStats: { bugsFixed: 0 },
    quizStats: { quizzesCompleted: 0, totalCorrect: 0 },
    theme: "dark",
    activeLanguage: "python",
    currentRoute: "home"
  };
}

// In-memory reactive state
let state = getDefaultState();

/**
 * Subscribes a callback to a specific state event.
 * Returns an unsubscribe function.
 */
export function subscribe(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
  return () => {
    listeners.get(event)?.delete(callback);
  };
}

/**
 * Emits an event with payload to all registered listeners.
 */
export function emit(event, data) {
  if (listeners.has(event)) {
    for (const cb of listeners.get(event)) {
      try {
        cb(data, state);
      } catch (err) {
        console.error(`[State] Error in listener for event "${event}":`, err);
      }
    }
  }
}

let persistTimer = null;

function writeStateToDisk() {
  saveStats({
    xp: state.xp,
    streak: state.streak,
    gems: state.gems,
    level: state.level,
    badgesCount: state.badgesCount,
    completedTyping: state.completedTyping,
    completedQuizzes: state.completedQuizzes,
    completedDebugger: state.completedDebugger,
    completedLessons: state.completedLessons,
    dailyChallengeDone: state.dailyChallengeDone,
    lastDailyDate: state.lastDailyDate,
    typingStats: state.typingStats,
    debuggerStats: state.debuggerStats,
    quizStats: state.quizStats
  });

  saveProgress({
    completedTyping: state.completedTyping,
    completedQuizzes: state.completedQuizzes,
    completedDebugger: state.completedDebugger,
    completedLessons: state.completedLessons
  });

  if (state.theme) {
    saveTheme(state.theme);
  }
}

/**
 * Syncs the current in-memory state to persistent storage.
 * Debounces rapid successive mutations to prevent excessive localStorage I/O.
 */
export function persist(immediate = false) {
  if (immediate) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    writeStateToDisk();
    return;
  }

  if (!persistTimer) {
    persistTimer = setTimeout(() => {
      persistTimer = null;
      writeStateToDisk();
    }, 40);
  }
}

// Flush pending persistence on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
      writeStateToDisk();
    }
  });
}


/**
 * Initializes the state store from persistent storage and applies theme.
 */
export function initState() {
  const loaded = getStats();
  const loadedProgress = getProgress();
  const loadedTheme = getTheme();

  // Safe migration for legacy mock seed data (level 8, 870 XP, 870 gems, streak 7)
  const isLegacyMockSeed =
    loaded &&
    loaded.xp === 870 &&
    loaded.streak === 7 &&
    loaded.gems === 870 &&
    (!loaded.completedLessons || loaded.completedLessons.length === 0) &&
    (!loaded.completedTyping || loaded.completedTyping.length === 0) &&
    (!loaded.completedQuizzes || loaded.completedQuizzes.length === 0) &&
    (!loaded.completedDebugger || loaded.completedDebugger.length === 0) &&
    (!loadedProgress.completedLessons || loadedProgress.completedLessons.length === 0) &&
    (!loadedProgress.completedTyping || loadedProgress.completedTyping.length === 0);

  if (isLegacyMockSeed) {
    loaded.xp = 0;
    loaded.streak = 0;
    loaded.gems = 0;
    loaded.level = 1;
    loaded.badgesCount = 0;
  }
  
  state = {
    ...getDefaultState(),
    ...loaded,
    completedTyping: Array.isArray(loadedProgress.completedTyping) && loadedProgress.completedTyping.length > 0
      ? [...loadedProgress.completedTyping] 
      : [...(loaded.completedTyping || [])],
    completedQuizzes: Array.isArray(loadedProgress.completedQuizzes) && loadedProgress.completedQuizzes.length > 0
      ? [...loadedProgress.completedQuizzes] 
      : [...(loaded.completedQuizzes || [])],
    completedDebugger: Array.isArray(loadedProgress.completedDebugger) && loadedProgress.completedDebugger.length > 0
      ? [...loadedProgress.completedDebugger] 
      : [...(loaded.completedDebugger || [])],
    completedLessons: Array.isArray(loadedProgress.completedLessons) && loadedProgress.completedLessons.length > 0
      ? [...loadedProgress.completedLessons] 
      : [...(loaded.completedLessons || [])],
    theme: loadedTheme,
    activeLanguage: "python",
    currentRoute: "home"
  };

  // Re-verify level based on XP
  state.level = Math.max(1, Math.floor(state.xp / 100));

  // Reset daily challenge if the calendar date has rolled over
  const today = new Date().toISOString().split("T")[0];
  if (state.lastDailyDate && state.lastDailyDate !== today) {
    state.dailyChallengeDone = false;
  }

  // Ensure storage keys are populated
  updateDerivedStats();
  persist(true);

  // Apply theme to document
  applyThemeToDOM(state.theme);

  emit("stateInitialized", state);
  return state;
}

/**
 * Calculates which badge IDs are unlocked based on user activity.
 */
export function calculateUnlockedBadgeIds(s) {
  const unlocked = [];
  const totalCompleted = (s.completedLessons?.length || 0) + 
                         (s.completedTyping?.length || 0) + 
                         (s.completedQuizzes?.length || 0) + 
                         (s.completedDebugger?.length || 0);
                         
  if (totalCompleted >= 1 || (s.xp || 0) > 0) unlocked.push("first-step");
  if ((s.typingStats?.bestWpm || 0) >= 40) unlocked.push("speed-typist");
  if ((s.completedDebugger?.length || 0) >= 5 || (s.debuggerStats?.bugsFixed || 0) >= 5) unlocked.push("bug-hunter");
  if ((s.quizStats?.totalCorrect || 0) >= 5) unlocked.push("quiz-master");
  
  const allCompletedIds = [
    ...(s.completedTyping || []),
    ...(s.completedLessons || []),
    ...(s.completedDebugger || []),
    ...(s.completedQuizzes || [])
  ];
  
  const hasPy = allCompletedIds.some(id => id.includes("py") || id.includes("python"));
  const hasJava = allCompletedIds.some(id => id.includes("java"));
  const hasC = allCompletedIds.some(id => id.includes("c-") || id.includes("-c") || id.includes("/c/"));
  
  if (hasPy && (s.xp >= 100 || totalCompleted >= 3)) unlocked.push("python-pro");
  if (hasJava && (s.xp >= 100 || totalCompleted >= 3)) unlocked.push("java-champion");
  if (hasC && (s.xp >= 100 || totalCompleted >= 3)) unlocked.push("c-warrior");
  if (hasPy && hasJava && hasC) unlocked.push("polyglot");
  if ((s.streak || 0) >= 7) unlocked.push("streak-week");
  if (s.theme === "dark" && (s.xp || 0) > 0) unlocked.push("night-owl");
  if ((s.completedLessons?.length || 0) >= 15) unlocked.push("scholar");
  if ((s.xp || 0) >= 800) unlocked.push("master-coder");
  
  return unlocked;
}

/**
 * Recomputes derived stats such as level and badgesCount.
 */
export function updateDerivedStats() {
  if (typeof state.xp === "number" && !Number.isNaN(state.xp)) {
    state.level = Math.max(1, Math.floor(state.xp / 100));
  } else {
    state.xp = 0;
    state.level = 1;
  }
  state.gems = typeof state.gems === "number" && !Number.isNaN(state.gems) ? state.gems : 0;
  state.streak = typeof state.streak === "number" && !Number.isNaN(state.streak) ? state.streak : 0;
  state.badgesCount = calculateUnlockedBadgeIds(state).length;
}

// Cross-tab / cross-window synchronization via storage events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    try {
      if (event.key === "mtc_theme") {
        const newTheme = event.newValue === "light" ? "light" : "dark";
        if (state.theme !== newTheme) {
          state.theme = newTheme;
          applyThemeToDOM(newTheme);
          emit("themeChanged", newTheme);
        }
      } else if (event.key === "mtc_stats" || event.key === "mtc_progress") {
        const loadedStats = getStats();
        const loadedProgress = getProgress();
        state = {
          ...state,
          ...loadedStats,
          completedTyping: Array.from(new Set([...state.completedTyping, ...loadedProgress.completedTyping, ...loadedStats.completedTyping])),
          completedQuizzes: Array.from(new Set([...state.completedQuizzes, ...loadedProgress.completedQuizzes, ...loadedStats.completedQuizzes])),
          completedDebugger: Array.from(new Set([...state.completedDebugger, ...loadedProgress.completedDebugger, ...loadedStats.completedDebugger])),
          completedLessons: Array.from(new Set([...state.completedLessons, ...loadedProgress.completedLessons, ...loadedStats.completedLessons]))
        };
        updateDerivedStats();
        emit("statsChanged", state);
      } else if (event.key === null) {
        initState();
      }
    } catch (err) {
      console.warn("[State] Cross-page storage event handling error:", err);
    }
  });
}

/**
 * Returns a read-only snapshot of current state.
 */
export function getState() {
  return { ...state };
}

/**
 * Updates partial state, recalculates derived values, persists, and notifies listeners.
 */
export function setState(updates) {
  if (typeof updates === "function") {
    state = { ...state, ...updates(state) };
  } else if (typeof updates === "object" && updates !== null) {
    state = { ...state, ...updates };
  }
  updateDerivedStats();
  if (updates && typeof updates === "object" && "theme" in updates) {
    applyThemeToDOM(state.theme);
    saveTheme(state.theme);
    emit("themeChanged", state.theme);
  }
  persist();
  emit("statsChanged", state);
  return { ...state };
}

/**
 * Adds XP and Gems to user account, updates level, persists, and emits events.
 */
export function addXP(amount, gems = 0, reason = "") {
  const prevLevel = state.level;
  state.xp = (typeof state.xp === "number" && !Number.isNaN(state.xp) ? state.xp : 0) + amount;
  state.gems = (typeof state.gems === "number" && !Number.isNaN(state.gems) ? state.gems : 0) + gems;
  
  updateDerivedStats();
  const levelUp = state.level > prevLevel;

  persist();
  emit("xpChanged", { xp: state.xp, amount, reason });
  emit("gemsChanged", { gems: state.gems, amount: gems });

  if (levelUp) {
    emit("levelUp", { level: state.level });
  }

  emit("statsChanged", state);
}

/**
 * Records completion of a typing drill.
 */
export function completeTyping(drillId, wpm = 0, charsTyped = 0) {
  if (!state.completedTyping.includes(drillId)) {
    state.completedTyping.push(drillId);
    state.typingStats.totalDrills += 1;
    if (wpm > (state.typingStats.bestWpm || 0)) {
      state.typingStats.bestWpm = Math.round(wpm);
    }
    state.typingStats.totalCharsTyped += charsTyped;

    addXP(XP_REWARDS.TYPING_DRILL, GEM_REWARDS.TYPING_DRILL, `Completed typing drill ${drillId}`);
    emit("typingCompleted", { drillId, wpm });
    persist();
    return true;
  }
  return false;
}

/**
 * Records completion of a quiz question.
 */
export function completeQuiz(quizId, isCorrect = true) {
  if (!state.completedQuizzes.includes(quizId)) {
    state.completedQuizzes.push(quizId);
    state.quizStats.quizzesCompleted += 1;
    if (isCorrect) {
      state.quizStats.totalCorrect += 1;
      addXP(XP_REWARDS.QUIZ_QUESTION, GEM_REWARDS.QUIZ_QUESTION, `Completed quiz ${quizId}`);
    }
    emit("quizCompleted", { quizId, isCorrect });
    persist();
    return true;
  }
  return false;
}

/**
 * Records completion of a debugger challenge.
 */
export function completeDebugger(challengeId) {
  if (!state.completedDebugger.includes(challengeId)) {
    state.completedDebugger.push(challengeId);
    state.debuggerStats.bugsFixed += 1;
    addXP(XP_REWARDS.DEBUGGER_CHALLENGE, GEM_REWARDS.DEBUGGER_CHALLENGE, `Fixed bug in ${challengeId}`);
    emit("debuggerCompleted", { challengeId });
    persist();
    return true;
  }
  return false;
}

/**
 * Records completion of a theory lesson.
 */
export function completeLesson(lessonId) {
  if (!state.completedLessons.includes(lessonId)) {
    state.completedLessons.push(lessonId);
    addXP(XP_REWARDS.THEORY_LESSON, GEM_REWARDS.THEORY_LESSON, `Read theory lesson ${lessonId}`);
    emit("lessonCompleted", { lessonId });
    persist();
    return true;
  }
  return false;
}

/**
 * Solves the home page Daily Challenge.
 */
export function solveDailyChallenge() {
  const today = new Date().toISOString().split("T")[0];
  if (state.dailyChallengeDone && state.lastDailyDate === today) {
    return false;
  }
  state.dailyChallengeDone = true;
  state.lastDailyDate = today;
  addXP(XP_REWARDS.DAILY_CHALLENGE, GEM_REWARDS.DAILY_CHALLENGE, "Solved Daily Challenge");
  persist();
  emit("dailyChallengeSolved", state);
  return true;
}

/**
 * Switches the active language tab.
 */
export function setActiveLanguage(lang) {
  state.activeLanguage = lang;
  emit("languageChanged", lang);
}

/**
 * Applies the given theme to HTML/Body classes.
 */
function applyThemeToDOM(theme) {
  const html = document.documentElement;
  const body = document.body;
  if (theme === "dark") {
    if (html?.classList) html.classList.add("dark");
    if (body?.classList) body.classList.add("dark");
  } else {
    if (html?.classList) html.classList.remove("dark");
    if (body?.classList) body.classList.remove("dark");
  }
}

/**
 * Toggles between dark and light themes.
 */
export function toggleTheme() {
  const nextTheme = state.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  return nextTheme;
}

/**
 * Sets the theme explicitly.
 */
export function setTheme(theme) {
  state.theme = theme;
  applyThemeToDOM(theme);
  saveTheme(theme);
  emit("themeChanged", theme);
}

/**
 * Resets user stats and reinitializes.
 */
export function resetState() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  resetAllData();
  initState();
  emit("stateReset", state);
  emit("statsChanged", state);
}
