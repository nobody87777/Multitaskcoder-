// MultitaskCoder
// Module: Lesson Navigation
//
// Minimal navigation helpers built on top of theory-engine.js. Every lesson
// record carries previousLesson/nextLesson ids (computed at content-build
// time from each section's actual lesson ordering, never hardcoded), so
// navigation scales automatically as more lessons are added later.

import { loadLesson, loadModules } from "./theory-engine.js";

/**
 * Loads the lesson that comes after the given one within its section, or
 * null if it's the last lesson in the section.
 */
export async function goToNextLesson(section, currentLesson) {
  if (!currentLesson.nextLesson) return null;
  return loadLesson(section, currentLesson.nextLesson);
}

/**
 * Loads the lesson that comes before the given one within its section, or
 * null if it's the first lesson in the section.
 */
export async function goToPreviousLesson(section, currentLesson) {
  if (!currentLesson.previousLesson) return null;
  return loadLesson(section, currentLesson.previousLesson);
}

/**
 * Returns the ordered list of module/topic summaries for a section, each
 * with its lessons' metadata — the basis for a module navigation sidebar.
 */
export async function getModuleList(section) {
  return loadModules(section);
}

/**
 * Given a lesson id, finds which module/topic it belongs to within a
 * section's index (useful for highlighting the active module in navigation).
 */
export async function findModuleForLesson(section, lessonId) {
  const groups = await loadModules(section);
  return groups.find(g => g.lessons.some(l => l.id === lessonId)) || null;
}
