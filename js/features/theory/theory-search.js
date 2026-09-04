// MultitaskCoder
// Module: Theory Search
//
// Minimal search over theory lesson metadata: titles, concepts, topics, and
// (optionally) full lesson content. Works across one section or, when no
// section is given, all four sections at once. Search is driven by whatever
// lessons the theory engine discovers — no lesson count or list is
// hardcoded here.

import { loadAllLessons, SUPPORTED_SECTIONS } from "./theory-engine.js";

function normalize(text) {
  return (text || "").toString().toLowerCase();
}

function lessonMatches(lesson, query) {
  const q = normalize(query);
  if (!q) return false;

  const haystacks = [
    lesson.title,
    lesson.module,
    lesson.topic,
    lesson.description,
    ...(lesson.concepts || []),
    ...(lesson.keyPoints || [])
  ];

  return haystacks.some(field => normalize(field).includes(q));
}

/**
 * Searches lesson titles/concepts/topics/descriptions/keyPoints within a
 * single theory section for a query string.
 */
export async function searchSection(section, query) {
  const lessons = await loadAllLessons(section);
  return lessons.filter(lesson => lessonMatches(lesson, query));
}

/**
 * Searches across all four theory sections (python, java, c, comparison) at
 * once, returning matches tagged with which section each came from.
 */
export async function searchAllSections(query) {
  const resultsPerSection = await Promise.all(
    SUPPORTED_SECTIONS.map(async section => {
      const matches = await searchSection(section, query);
      return matches.map(lesson => ({ section, lesson }));
    })
  );
  return resultsPerSection.flat();
}
