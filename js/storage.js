// MultitaskCoder
// Module: Local Storage Persistence

import { STORAGE_KEYS, DEFAULT_STATS } from "./constants.js";

// Cache of recently written serialized values to eliminate redundant localStorage disk writes
const writeCache = new Map();

// In-memory fallback if localStorage is disabled, restricted, or unavailable
const memoryFallback = new Map();

/**
 * Detects whether localStorage is accessible and writable.
 */
function isStorageAvailable() {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return false;
    }
    const testKey = "__mtc_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

/**
 * Safely reads a value from localStorage with a fallback default.
 * Handles missing storage, invalid JSON, and unexpected types without throwing.
 */
export function getItem(key, defaultValue = null) {
  try {
    if (!storageAvailable) {
      if (memoryFallback.has(key)) {
        return JSON.parse(memoryFallback.get(key));
      }
      return defaultValue;
    }
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    writeCache.set(key, raw);
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Storage] Failed to read key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Safely writes a JSON-serializable value to localStorage.
 * Avoids disk I/O if the serialized content has not changed.
 * Falls back to memory storage on QuotaExceededError or security restrictions.
 */
export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    if (writeCache.get(key) === serialized) {
      // Content is identical; avoid redundant localStorage write
      return true;
    }
    if (!storageAvailable) {
      memoryFallback.set(key, serialized);
      writeCache.set(key, serialized);
      return true;
    }
    localStorage.setItem(key, serialized);
    writeCache.set(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to write key "${key}":`, err);
    try {
      memoryFallback.set(key, JSON.stringify(value));
    } catch {
      // Ignore memory store failure
    }
    return false;
  }
}

/**
 * Removes a key from localStorage and memory fallback.
 */
export function removeItem(key) {
  try {
    writeCache.delete(key);
    memoryFallback.delete(key);
    if (storageAvailable) {
      localStorage.removeItem(key);
    }
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to remove key "${key}":`, err);
    return false;
  }
}

/**
 * High-level alias methods: load, save, reset
 */
export const load = getItem;
export const save = setItem;
export const reset = removeItem;

/**
 * Reads, shallow-merges updates, and writes back only if mutated.
 */
export function update(key, updaterOrPartial) {
  const current = getItem(key, {});
  const safeCurrent = typeof current === "object" && current !== null && !Array.isArray(current) ? current : {};
  const next = typeof updaterOrPartial === "function" 
    ? updaterOrPartial(safeCurrent) 
    : { ...safeCurrent, ...updaterOrPartial };
  return setItem(key, next);
}

function safeNumber(val, fallback = 0) {
  return typeof val === "number" && !Number.isNaN(val) && val >= 0 ? val : fallback;
}

function safeStringArray(val) {
  if (!Array.isArray(val)) return [];
  return val.filter((item) => typeof item === "string" || typeof item === "number").map(String);
}

/**
 * Gets user stats, merged with defaults and strictly validated against corrupted data.
 */
export function getStats() {
  const saved = getItem(STORAGE_KEYS.STATS, null);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return { ...DEFAULT_STATS };
  }

  return {
    xp: safeNumber(saved.xp, DEFAULT_STATS.xp),
    streak: safeNumber(saved.streak, DEFAULT_STATS.streak),
    gems: safeNumber(saved.gems, DEFAULT_STATS.gems),
    level: Math.max(1, safeNumber(saved.level, DEFAULT_STATS.level)),
    badgesCount: safeNumber(saved.badgesCount, DEFAULT_STATS.badgesCount),
    completedTyping: safeStringArray(saved.completedTyping),
    completedQuizzes: safeStringArray(saved.completedQuizzes),
    completedDebugger: safeStringArray(saved.completedDebugger),
    completedLessons: safeStringArray(saved.completedLessons),
    dailyChallengeDone: Boolean(saved.dailyChallengeDone),
    lastDailyDate: typeof saved.lastDailyDate === "string" ? saved.lastDailyDate : "",
    typingStats: {
      totalDrills: safeNumber(saved.typingStats?.totalDrills, 0),
      bestWpm: safeNumber(saved.typingStats?.bestWpm, 0),
      totalCharsTyped: safeNumber(saved.typingStats?.totalCharsTyped, 0)
    },
    debuggerStats: {
      bugsFixed: safeNumber(saved.debuggerStats?.bugsFixed, 0)
    },
    quizStats: {
      quizzesCompleted: safeNumber(saved.quizStats?.quizzesCompleted, 0),
      totalCorrect: safeNumber(saved.quizStats?.totalCorrect, 0)
    }
  };
}

/**
 * Saves user stats.
 */
export function saveStats(stats) {
  return setItem(STORAGE_KEYS.STATS, stats);
}

/**
 * Updates partial user stats.
 */
export function updateStats(partialStats) {
  return update(STORAGE_KEYS.STATS, partialStats);
}

/**
 * Gets completed progress sets, strictly validating arrays.
 */
export function getProgress() {
  const saved = getItem(STORAGE_KEYS.PROGRESS, null);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return {
      completedTyping: [],
      completedQuizzes: [],
      completedDebugger: [],
      completedLessons: []
    };
  }

  return {
    completedTyping: safeStringArray(saved.completedTyping),
    completedQuizzes: safeStringArray(saved.completedQuizzes),
    completedDebugger: safeStringArray(saved.completedDebugger),
    completedLessons: safeStringArray(saved.completedLessons)
  };
}

/**
 * Saves completed progress sets.
 */
export function saveProgress(progress) {
  return setItem(STORAGE_KEYS.PROGRESS, progress);
}

/**
 * Gets current theme ("dark" or "light"). Defaults to "dark".
 */
export function getTheme() {
  try {
    if (!storageAvailable) {
      const memTheme = memoryFallback.get(STORAGE_KEYS.THEME);
      return memTheme === "light" ? "light" : "dark";
    }
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/**
 * Saves current theme ("dark" or "light").
 */
export function saveTheme(theme) {
  const safeTheme = theme === "light" ? "light" : "dark";
  try {
    if (!storageAvailable) {
      memoryFallback.set(STORAGE_KEYS.THEME, safeTheme);
      return true;
    }
    localStorage.setItem(STORAGE_KEYS.THEME, safeTheme);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to save theme:`, err);
    memoryFallback.set(STORAGE_KEYS.THEME, safeTheme);
    return false;
  }
}

/**
 * Resets all MultitaskCoder storage to initial defaults.
 */
export function resetAllData() {
  removeItem(STORAGE_KEYS.PROGRESS);
  removeItem(STORAGE_KEYS.STATS);
  writeCache.clear();
  memoryFallback.delete(STORAGE_KEYS.PROGRESS);
  memoryFallback.delete(STORAGE_KEYS.STATS);
}
