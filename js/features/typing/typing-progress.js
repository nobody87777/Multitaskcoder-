// MultitaskCoder
// Module: Typing Progress Tracking

import { getState, completeTyping } from "../../state.js";

/**
 * Checks if a specific typing drill has been completed.
 */
export function isDrillCompleted(drillId) {
  const state = getState();
  return (state.completedTyping || []).includes(drillId);
}

/**
 * Records completion of a drill with WPM and characters typed.
 */
export function recordDrillCompletion(drillId, wpm, charsTyped) {
  return completeTyping(drillId, wpm, charsTyped);
}

/**
 * Returns completed drill IDs for a specific language.
 */
export function getCompletedDrillsForLanguage(language) {
  const state = getState();
  const prefix = language.toLowerCase();
  return (state.completedTyping || []).filter(id => id.startsWith(prefix));
}
