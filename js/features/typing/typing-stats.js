// MultitaskCoder
// Module: Typing Stats

import { calculateWpm, calculateAccuracy } from "../../utils.js";

export class TypingSessionStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = null;
    this.endTime = null;
    this.totalTyped = 0;
    this.errors = 0;
    this.isComplete = false;
  }

  start() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
  }

  finish() {
    this.endTime = Date.now();
    this.isComplete = true;
  }

  recordKey(isCorrect) {
    this.start();
    this.totalTyped++;
    if (!isCorrect) {
      this.errors++;
    }
  }

  getElapsedSeconds() {
    if (!this.startTime) return 0;
    const end = this.endTime || Date.now();
    return Math.max(1, (end - this.startTime) / 1000);
  }

  getWpm() {
    const elapsed = this.getElapsedSeconds();
    const correctChars = Math.max(0, this.totalTyped - this.errors);
    return calculateWpm(correctChars, elapsed);
  }

  getAccuracy() {
    return calculateAccuracy(this.totalTyped, this.errors);
  }

  getSummary() {
    return {
      wpm: this.getWpm(),
      accuracy: this.getAccuracy(),
      errors: this.errors,
      totalTyped: this.totalTyped,
      elapsedSeconds: Math.round(this.getElapsedSeconds())
    };
  }
}
