// MultitaskCoder
// Module: Quiz Engine
//
// Discovers and loads quiz question data from data/quizzes/<language>/.
// Each language folder has an index.json manifest listing every question
// file available for that language; the engine reads however many entries
// that manifest contains, so adding more questions later (beyond the
// current 50 per language) requires no code changes here.
//
// Full quiz-taking UI/state logic (question navigation, scoring, etc.) will
// be built in a later phase on top of these loaders — this module is
// intentionally limited to data discovery and loading.

const DATA_ROOT = "data/quizzes";
const SUPPORTED_LANGUAGES = ["python", "java", "c"];

// Simple in-memory caches so repeated calls don't refetch the same JSON.
const indexCache = new Map(); // language -> index.json contents
const questionCache = new Map(); // "language/id" -> question record

/**
 * Fetches and caches the index.json manifest for a language.
 * The manifest shape is: { language, count, questions: [{ id, difficulty, type, topic, file }, ...] }
 */
export async function loadQuizIndex(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported quiz language: ${language}`);
  }
  if (indexCache.has(language)) {
    return indexCache.get(language);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load quiz index for "${language}": ${response.status} ${response.statusText}`);
  }

  const index = await response.json();
  indexCache.set(language, index);
  return index;
}

/**
 * Fetches and caches a single question record by language + id.
 */
export async function loadQuizQuestion(language, id) {
  const cacheKey = `${language}/${id}`;
  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/${id}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load quiz question "${id}" for "${language}": ${response.status} ${response.statusText}`);
  }

  const question = await response.json();
  questionCache.set(cacheKey, question);
  return question;
}

/**
 * Loads every question available for a language, driven entirely by the
 * language's index.json — the count is never hardcoded, so this scales to
 * however many question files exist.
 */
export async function loadAllQuizQuestions(language) {
  const index = await loadQuizIndex(language);
  const entries = Array.isArray(index.questions) ? index.questions : [];

  const results = await Promise.allSettled(entries.map(entry => loadQuizQuestion(language, entry.id)));
  const questions = results
    .filter(r => {
      if (r.status !== "fulfilled") {
        console.warn(`[QuizEngine] A question failed to load for "${language}":`, r.reason);
        return false;
      }
      return Boolean(r.value);
    })
    .map(r => r.value);

  return questions.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Convenience filter: returns only the questions matching a given difficulty
 * ("beginner" | "intermediate" | "advanced").
 */
export function getQuestionsByDifficulty(questions, difficulty) {
  return questions.filter(q => q.difficulty === difficulty);
}

/**
 * Convenience filter: returns only the questions matching a given type
 * ("mcq" | "output" | "code-analysis" | "true-false").
 */
export function getQuestionsByType(questions, type) {
  return questions.filter(q => q.type === type);
}

export { SUPPORTED_LANGUAGES };
