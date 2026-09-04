// MultitaskCoder
// Module: Debugger Engine
//
// Discovers and loads debugging-challenge data from data/debugger/<language>/.
// Each language folder has an index.json manifest listing every challenge
// file available for that language; the engine reads however many entries
// that manifest contains, so adding more challenges later (beyond the
// current 50 per language) requires no code changes here.
//
// Full debugger-arena UI/state logic (presenting the buggy code, accepting a
// fix or a diagnosis, revealing the corrected code, scoring, etc.) will be
// built in a later phase on top of these loaders — this module is
// intentionally limited to data discovery and loading.

const DATA_ROOT = "data/debugger";
const SUPPORTED_LANGUAGES = ["python", "java", "c"];

// Simple in-memory caches so repeated calls don't refetch the same JSON.
const indexCache = new Map(); // language -> index.json contents
const challengeCache = new Map(); // "language/id" -> challenge record

/**
 * Fetches and caches the index.json manifest for a language.
 * The manifest shape is: { language, count, challenges: [{ id, difficulty, topic, bugType, file }, ...] }
 */
export async function loadDebuggerIndex(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported debugger language: ${language}`);
  }
  if (indexCache.has(language)) {
    return indexCache.get(language);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load debugger index for "${language}": ${response.status} ${response.statusText}`);
  }

  const index = await response.json();
  indexCache.set(language, index);
  return index;
}

/**
 * Fetches and caches a single debugging challenge by language + id.
 */
export async function loadDebuggerChallenge(language, id) {
  const cacheKey = `${language}/${id}`;
  if (challengeCache.has(cacheKey)) {
    return challengeCache.get(cacheKey);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/${id}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load debugger challenge "${id}" for "${language}": ${response.status} ${response.statusText}`);
  }

  const challenge = await response.json();
  challengeCache.set(cacheKey, challenge);
  return challenge;
}

/**
 * Loads every challenge available for a language, driven entirely by the
 * language's index.json — the count is never hardcoded, so this scales to
 * however many challenge files exist.
 */
export async function loadAllDebuggerChallenges(language) {
  const index = await loadDebuggerIndex(language);
  const entries = Array.isArray(index.challenges) ? index.challenges : [];

  const results = await Promise.allSettled(entries.map(entry => loadDebuggerChallenge(language, entry.id)));
  const challenges = results
    .filter(r => {
      if (r.status !== "fulfilled") {
        console.warn(`[DebuggerEngine] A challenge failed to load for "${language}":`, r.reason);
        return false;
      }
      return Boolean(r.value);
    })
    .map(r => r.value);

  return challenges.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Convenience filter: returns only the challenges matching a given difficulty
 * ("beginner" | "intermediate" | "advanced").
 */
export function getChallengesByDifficulty(challenges, difficulty) {
  return challenges.filter(c => c.difficulty === difficulty);
}

/**
 * Convenience filter: returns only the challenges matching a given bugType
 * (e.g. "off-by-one-loop", "null-pointer", "missing-return", ...).
 */
export function getChallengesByBugType(challenges, bugType) {
  return challenges.filter(c => c.bugType === bugType);
}

export { SUPPORTED_LANGUAGES };
