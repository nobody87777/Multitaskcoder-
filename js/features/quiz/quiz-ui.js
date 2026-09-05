// MultitaskCoder
// Module: Quiz UI

import { escapeHtml, highlightCode } from "../../utils.js";
import { isQuizCompleted } from "./quiz-stats.js";

/**
 * Renders an interactive quiz question card inside container.
 */
export function renderQuizCard(container, question, onAnswer = null, onNext = null) {
  const isDone = isQuizCompleted(question.id);
  let answered = false;

  const difficultyColors = {
    beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };
  const diffBadge = difficultyColors[question.difficulty] || difficultyColors.beginner;

  // Format question text (support inline code and multiline snippets)
  let formattedQuestion = escapeHtml(question.question);
  if (formattedQuestion.includes("```")) {
    formattedQuestion = formattedQuestion.replace(/```(?:([a-zA-Z0-9]+)\n)?([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="code-box rounded-xl p-3 my-2 code-font text-xs overflow-x-auto">${highlightCode(code.trim(), lang || question.language)}</div>`;
    });
  } else if (formattedQuestion.includes("`")) {
    formattedQuestion = formattedQuestion.replace(/`([^`]+)`/g, '<code class="code-font px-1.5 py-0.5 rounded bg-black/20 text-purple-300">$1</code>');
  }

  const typeBadges = {
    output: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    mcq: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    "code-analysis": "text-amber-400 bg-amber-500/10 border-amber-500/25",
    "true-false": "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
  };
  const typeBadgeClass = typeBadges[question.type] || "text-purple-400 bg-purple-500/10 border-purple-500/25";
  const typeLabel = question.type === "output" ? '<i class="fa-solid fa-terminal text-[9px] mr-1"></i>Output' :
                    question.type === "mcq" ? '<i class="fa-solid fa-list-check text-[9px] mr-1"></i>MCQ' :
                    question.type === "code-analysis" ? '<i class="fa-solid fa-magnifying-glass-chart text-[9px] mr-1"></i>Analysis' :
                    (question.type || "MCQ");

  const optionLetters = ["A", "B", "C", "D", "E"];

  container.innerHTML = `
    <div class="glass-card rounded-3xl p-5 border border-purple-500/30 space-y-5 shadow-xl">
      <!-- Question Header -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${diffBadge}">
              ${question.difficulty}
            </span>
            <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeBadgeClass}">
              ${typeLabel}
            </span>
            ${isDone ? '<span class="text-[10px] text-emerald-400 font-bold"><i class="fa-solid fa-check"></i> Solved</span>' : ""}
          </div>
          <div class="text-[11px] opacity-70">${question.topic}</div>
        </div>
        <span class="text-xs font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full shrink-0 border border-purple-500/20">
          +30 XP
        </span>
      </div>

      <!-- Question Text -->
      <div class="text-sm font-semibold leading-relaxed">
        ${formattedQuestion}
      </div>

      ${question.code ? `
      <!-- Code Snippet Area for Output / Analysis Question -->
      <div class="space-y-1.5">
        <div class="text-[11px] font-bold opacity-75 flex items-center space-x-1.5">
          <i class="fa-solid fa-code text-purple-400 text-[10px]"></i>
          <span>Program Code:</span>
        </div>
        <div class="code-box rounded-2xl p-3.5 code-font text-xs tracking-wide leading-relaxed overflow-x-auto shadow-inner border border-purple-500/20">
          <pre><code class="whitespace-pre">${highlightCode(question.code.trim(), question.language)}</code></pre>
        </div>
      </div>
      ` : ""}

      <!-- Options List -->
      <div class="space-y-2.5" id="optionsContainer">
        ${(question.options || []).map((opt, idx) => `
          <button data-opt-index="${idx}" aria-label="Option ${optionLetters[idx] || idx + 1}: ${escapeHtml(opt)}" class="quiz-option-btn w-full p-3.5 rounded-2xl sub-card text-left flex items-center space-x-3 hover:border-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent">
            <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 option-letter">
              ${optionLetters[idx] || idx + 1}
            </div>
            <span class="text-xs font-medium flex-1">${escapeHtml(opt)}</span>
            <div class="option-icon hidden text-sm shrink-0"></div>
          </button>
        `).join("")}
      </div>

      <!-- Explanation Box (Initially Hidden) -->
      <div id="explanationBox" class="hidden space-y-3 pt-3 border-t border-black/5 dark:border-white/5 animate-[fadeInScale_0.3s_ease_forwards]">
        <div class="sub-card rounded-2xl p-4 border border-purple-500/20 space-y-2">
          <div class="flex items-center space-x-2 text-xs font-bold text-purple-400">
            <i class="fa-solid fa-lightbulb text-amber-400"></i>
            <span>Explanation</span>
          </div>
          <p class="text-xs opacity-85 leading-relaxed">${escapeHtml(question.explanation || "Correct answer!")}</p>
          
          ${Array.isArray(question.concepts) && question.concepts.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${question.concepts.map(c => `
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
                  #${escapeHtml(c)}
                </span>
              `).join("")}
            </div>
          ` : ""}
        </div>

        ${onNext ? `
          <button id="btnNextQuestion" class="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer">
            <span>Next Question</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        ` : ""}
      </div>
    </div>
  `;

  const optionsContainer = container.querySelector("#optionsContainer");
  const explanationBox = container.querySelector("#explanationBox");
  const btnNext = container.querySelector("#btnNextQuestion");

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (typeof onNext === "function") onNext();
    });
  }

  optionsContainer.querySelectorAll(".quiz-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;

      const selectedIdx = parseInt(btn.getAttribute("data-opt-index"), 10);
      const isCorrect = selectedIdx === question.correctAnswer;

      // Update styles on all options
      optionsContainer.querySelectorAll(".quiz-option-btn").forEach((otherBtn) => {
        const otherIdx = parseInt(otherBtn.getAttribute("data-opt-index"), 10);
        const iconEl = otherBtn.querySelector(".option-icon");
        otherBtn.classList.remove("hover:border-purple-500/40", "hover:scale-[1.01]", "cursor-pointer");
        otherBtn.classList.add("cursor-default");

        if (otherIdx === question.correctAnswer) {
          otherBtn.classList.add("!border-emerald-500", "bg-emerald-500/10", "text-emerald-300");
          if (iconEl) {
            iconEl.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i>';
            iconEl.classList.remove("hidden");
          }
        } else if (otherIdx === selectedIdx && !isCorrect) {
          otherBtn.classList.add("!border-rose-500", "bg-rose-500/10", "text-rose-300");
          if (iconEl) {
            iconEl.innerHTML = '<i class="fa-solid fa-xmark text-rose-400"></i>';
            iconEl.classList.remove("hidden");
          }
        } else {
          otherBtn.classList.add("opacity-50");
        }
      });

      // Reveal explanation
      if (explanationBox) {
        explanationBox.classList.remove("hidden");
      }

      // Notify callback
      if (typeof onAnswer === "function") {
        onAnswer(question.id, isCorrect);
      }
    });
  });
}
