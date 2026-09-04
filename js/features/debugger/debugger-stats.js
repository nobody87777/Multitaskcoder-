// MultitaskCoder
// Module: Debugger Stats

import { getState, completeDebugger } from "../../state.js";

export class DebuggerSessionStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalAttempts = 0;
    this.solvedCount = 0;
    this.challengesSolved = new Set();
    this.challengesAttempted = new Set();
  }

  recordAttempt(challengeId) {
    this.totalAttempts++;
    if (challengeId) {
      this.challengesAttempted.add(challengeId);
    }
  }

  recordSolved(challengeId) {
    if (challengeId && !this.challengesSolved.has(challengeId)) {
      this.challengesSolved.add(challengeId);
      this.solvedCount++;
    }
    return completeDebugger(challengeId);
  }

  getSuccessRate() {
    const attempted = this.challengesAttempted.size;
    if (attempted === 0) return 100;
    return Math.round((this.challengesSolved.size / attempted) * 100);
  }
}

/**
 * Checks if a specific debugger challenge has been solved.
 */
export function isChallengeCompleted(challengeId) {
  const state = getState();
  return (state.completedDebugger || []).includes(challengeId);
}

/**
 * Records completion of a debugger challenge.
 */
export function recordChallengeCompleted(challengeId) {
  return completeDebugger(challengeId);
}

/**
 * Returns list of completed debugger challenges for a language.
 */
export function getCompletedChallengesForLanguage(language) {
  const state = getState();
  const prefix = language.toLowerCase();
  return (state.completedDebugger || []).filter(id => id.includes(prefix));
}

