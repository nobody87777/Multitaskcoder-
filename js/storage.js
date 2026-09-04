// MultitaskCoder
// Module: Local Storage Persistence

import { STORAGE_KEYS, DEFAULT_STATS } from "./constants.js";

// Cache of recently written values to eliminate redundant localStorage disk writes
const writeCache = new Map();

/**
 * Safely reads a value from localStorage with a fallback default.
 */
export function getItem(key, defaultValue = null) {
  try {
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
 */
export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    if (writeCache.get(key) === serialized) {
      // Content is identical; avoid redundant localStorage write
      return true;
    }
    localStorage.setItem(key, serialized);
    writeCache.set(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to write key "${key}":`, err);
    return false;
  }
}

/**
 * Removes a key from localStorage.
 */
export function removeItem(key) {
  try {
    writeCache.delete(key);
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to remove key "${key}":`, err);
    return false;
  }
}

/**
 * High-level alias methods: load, save, update, reset
 */
export const load = getItem;
export const save = setItem;
export const reset = removeItem;

/**
 * Reads, shallow-merges updates, and writes back only if mutated.
 */
export function update(key, updaterOrPartial) {
  const current = getItem(key, {});
  const next = typeof updaterOrPartial === "function" 
    ? updaterOrPartial(current) 
    : { ...current, ...updaterOrPartial };
  return setItem(key, next);
}

/**
 * Gets user stats, merged with defaults if partially missing.
 */
export function getStats() {
  const saved = getItem(STORAGE_KEYS.STATS, null);
  if (!saved) return { ...DEFAULT_STATS };
  return { ...DEFAULT_STATS, ...saved };
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
 * Gets completed progress sets.
 */
export function getProgress() {
  return getItem(STORAGE_KEYS.PROGRESS, {
    completedTyping: [],
    completedQuizzes: [],
    completedDebugger: [],
    completedLessons: []
  });
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
    return localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
  } catch {
    return "dark";
  }
}

/**
 * Saves current theme.
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resets all MultitaskCoder storage to initial defaults.
 */
export function resetAllData() {
  removeItem(STORAGE_KEYS.PROGRESS);
  removeItem(STORAGE_KEYS.STATS);
  // Keep theme or reset as well
}
