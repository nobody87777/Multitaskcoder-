// MultitaskCoder
// Module: Language Comparison
//
// Thin, purpose-named wrapper around theory-engine.js for the "comparison"
// theory section (Python vs. Java vs. C, topic by topic). Kept as a
// separate module — rather than folding it into theory-engine.js — since
// the Theory UI treats Comparison as its own top-level section alongside
// Python/Java/C, and callers reading this file should immediately see the
// comparison-specific surface without wading through generic section logic.

import { loadModules, loadAllLessons, loadLesson } from "./theory-engine.js";

const SECTION = "comparison";

/**
 * Returns every comparison topic (e.g. "Memory", "OOP", "Concurrency"),
 * each with its lesson metadata — the basis for a comparison topic list.
 */
export async function loadComparisonTopics() {
  return loadModules(SECTION);
}

/**
 * Loads every comparison lesson, in topic order.
 */
export async function loadAllComparisonLessons() {
  return loadAllLessons(SECTION);
}

/**
 * Loads a single comparison lesson by id
 * (e.g. "comparison-memory-001").
 */
export async function loadComparisonLesson(id) {
  return loadLesson(SECTION, id);
}
