// MultitaskCoder
// Module: Typing Engine
//
// Discovers and loads typing drill data from data/typing/<language>/.
// Each language folder has an index.json manifest listing every drill
// file available for that language. Driven entirely by manifests.

const DATA_ROOT = "data/typing";
const SUPPORTED_LANGUAGES = ["python", "java", "c"];

const indexCache = new Map();
const drillCache = new Map();

/**
 * Fetches and caches the index.json manifest for a language.
 */
export async function loadTypingIndex(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported typing language: ${language}`);
  }
  if (indexCache.has(language)) {
    return indexCache.get(language);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load typing index for "${language}": ${response.status} ${response.statusText}`);
  }

  const index = await response.json();
  indexCache.set(language, index);
  return index;
}

/**
 * Fetches and caches a single typing drill by language + id.
 */
export async function loadTypingDrill(language, id) {
  const cacheKey = `${language}/${id}`;
  if (drillCache.has(cacheKey)) {
    return drillCache.get(cacheKey);
  }

  const response = await fetch(`${DATA_ROOT}/${language}/${id}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load typing drill "${id}" for "${language}": ${response.status} ${response.statusText}`);
  }

  const drill = await response.json();
  drillCache.set(cacheKey, drill);
  return drill;
}

/**
 * Loads all typing drills for a language dynamically via its manifest.
 */
export async function loadAllTypingDrills(language) {
  const index = await loadTypingIndex(language);
  const entries = Array.isArray(index.programs) ? index.programs : [];

  const results = await Promise.allSettled(entries.map(entry => loadTypingDrill(language, entry.id)));
  const drills = results
    .filter(r => {
      if (r.status !== "fulfilled") {
        console.warn(`[TypingEngine] A drill failed to load for "${language}":`, r.reason);
        return false;
      }
      return Boolean(r.value);
    })
    .map(r => r.value);

  return drills.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Filters drills by difficulty.
 */
export function getDrillsByDifficulty(drills, difficulty) {
  return drills.filter(d => d.difficulty === difficulty);
}

export { SUPPORTED_LANGUAGES };
