// MultitaskCoder
// Module: Theory Engine
//
// Discovers and loads theory lesson data from data/theory/<section>/, where
// section is one of "python", "java", "c", or "comparison". Each section has
// an index.json manifest listing its modules and the lessons within each
// module (nested in module subdirectories, e.g.
// data/theory/python/01-introduction/python-introduction-001.json). The
// engine reads however many modules/lessons the manifest contains, so adding
// more lessons later requires no code changes here.
//
// Full Theory UI/state logic (rendering lesson content, code examples,
// tracking read/completed lessons) will be built in a later phase on top of
// these loaders — this module is intentionally limited to data discovery
// and loading.

const DATA_ROOT = "data/theory";
const SUPPORTED_SECTIONS = ["python", "java", "c", "comparison"];

// Simple in-memory caches so repeated calls don't refetch the same JSON.
const indexCache = new Map(); // section -> index.json contents
const lessonCache = new Map(); // "section/id" -> lesson record

/**
 * Fetches and caches the top-level theory index, listing the four sections.
 */
export async function loadTheoryRootIndex() {
  const response = await fetch(`${DATA_ROOT}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load theory root index: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches and caches a section's index.json manifest.
 * Shape: { section, moduleCount|topicCount, lessonCount, modules|topics: [...] }
 */
export async function loadSectionIndex(section) {
  if (!SUPPORTED_SECTIONS.includes(section)) {
    throw new Error(`Unsupported theory section: ${section}`);
  }
  if (indexCache.has(section)) {
    return indexCache.get(section);
  }

  const response = await fetch(`${DATA_ROOT}/${section}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load theory index for "${section}": ${response.status} ${response.statusText}`);
  }

  const index = await response.json();
  indexCache.set(section, index);
  return index;
}

/**
 * Returns the list of modules (or, for "comparison", topics) in a section,
 * each with its lessons' metadata (id, title, difficulty, file).
 */
export async function loadModules(section) {
  const index = await loadSectionIndex(section);
  return index.modules || index.topics || [];
}

/**
 * Fetches and caches a single lesson by section + id, resolving its file
 * path via the section's index rather than assuming a fixed location.
 */
export async function loadLesson(section, id) {
  const cacheKey = `${section}/${id}`;
  if (lessonCache.has(cacheKey)) {
    return lessonCache.get(cacheKey);
  }

  const groups = await loadModules(section);
  let file = null;
  for (const group of groups) {
    const match = group.lessons.find(l => l.id === id);
    if (match) { file = match.file; break; }
  }
  if (!file) {
    throw new Error(`Lesson "${id}" not found in theory section "${section}"`);
  }

  const response = await fetch(`${DATA_ROOT}/${section}/${file}`);
  if (!response.ok) {
    throw new Error(`Failed to load lesson "${id}": ${response.status} ${response.statusText}`);
  }

  const lesson = await response.json();
  lessonCache.set(cacheKey, lesson);
  return lesson;
}

/**
 * Loads every lesson in one module (or comparison topic), in lesson order.
 */
export async function loadModuleLessons(section, moduleOrTopicSlug) {
  const groups = await loadModules(section);
  const group = groups.find(g => g.moduleSlug === moduleOrTopicSlug || g.topicSlug === moduleOrTopicSlug);
  if (!group) {
    throw new Error(`Module/topic "${moduleOrTopicSlug}" not found in theory section "${section}"`);
  }
  const results = await Promise.allSettled(group.lessons.map(l => loadLesson(section, l.id)));
  return results
    .filter(r => {
      if (r.status !== "fulfilled") {
        console.warn(`[TheoryEngine] A lesson failed in module "${moduleOrTopicSlug}":`, r.reason);
        return false;
      }
      return Boolean(r.value);
    })
    .map(r => r.value);
}

/**
 * Loads every lesson in an entire section, driven entirely by its index —
 * never hardcodes a lesson or module count. If any single lesson file fails,
 * it is safely logged and skipped so the rest of the curriculum loads smoothly.
 */
export async function loadAllLessons(section) {
  const groups = await loadModules(section);
  const ids = groups.flatMap(g => g.lessons.map(l => l.id));
  const results = await Promise.allSettled(ids.map(id => loadLesson(section, id)));
  return results
    .filter(r => {
      if (r.status !== "fulfilled") {
        console.warn(`[TheoryEngine] A lesson failed to load in section "${section}":`, r.reason);
        return false;
      }
      return Boolean(r.value);
    })
    .map(r => r.value);
}

export { SUPPORTED_SECTIONS };
