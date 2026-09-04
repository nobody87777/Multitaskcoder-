// MultitaskCoder
// Module: Quiz Stats

import { getState, completeQuiz } from "../../state.js";

export class QuizSessionStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalAnswered = 0;
    this.correctCount = 0;
    this.questionsAnswered = [];
  }

  recordAnswer(questionId, isCorrect) {
    this.totalAnswered++;
    if (isCorrect) this.correctCount++;
    this.questionsAnswered.push({ questionId, isCorrect });
    completeQuiz(questionId, isCorrect);
  }

  getScorePercentage() {
    if (this.totalAnswered === 0) return 0;
    return Math.round((this.correctCount / this.totalAnswered) * 100);
  }
}

export function isQuizCompleted(quizId) {
  const state = getState();
  return (state.completedQuizzes || []).includes(quizId);
}
