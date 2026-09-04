// MultitaskCoder
// Module: Debugger UI

import { escapeHtml, highlightCode } from "../../utils.js";
import { isChallengeCompleted, recordChallengeCompleted } from "./debugger-stats.js";
import { openModal } from "../../components/modal.js";

/**
 * Renders an interactive debugger arena card inside container.
 */
export function renderDebuggerCard(container, challenge, onSolved = null, onNext = null, onAttempt = null) {
  let isSolved = isChallengeCompleted(challenge.id);

  const difficultyColors = {
    beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };
  const diffBadge = difficultyColors[challenge.difficulty] || difficultyColors.beginner;

  container.innerHTML = `
    <div class="glass-card rounded-3xl p-5 border border-purple-500/30 space-y-4 shadow-xl">
      <!-- Challenge Header -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${diffBadge}">
              ${challenge.difficulty}
            </span>
            <span class="text-[10px] text-rose-400 font-semibold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              <i class="fa-solid fa-bug text-[9px] mr-1"></i>${challenge.bugType}
            </span>
            <span id="debuggerSolvedBadge" class="text-[10px] text-emerald-400 font-bold ${isSolved ? "" : "hidden"}">
              <i class="fa-solid fa-check"></i> Solved
            </span>
          </div>
          <h2 class="text-base font-bold mt-1">${challenge.title}</h2>
          <p class="text-xs opacity-75 mt-0.5">${challenge.description}</p>
        </div>
        <span class="text-xs font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full shrink-0 border border-purple-500/20">
          +50 XP
        </span>
      </div>

      <!-- Expected Behavior, Example Input & Expected Output Card -->
      <div class="sub-card rounded-2xl p-3.5 border border-purple-500/15 space-y-2 text-xs">
        <div class="flex items-start space-x-2.5">
          <div class="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[11px] mt-0.5">
            <i class="fa-solid fa-bullseye"></i>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-300">Expected Behavior:</div>
            <p class="opacity-80 text-[11px] mt-0.5">${escapeHtml(challenge.expectedBehavior)}</p>
          </div>
        </div>

        ${challenge.exampleInput ? `
          <div class="flex items-start space-x-2.5 pt-1.5 border-t border-white/5">
            <div class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-[11px] mt-0.5">
              <i class="fa-solid fa-arrow-right-to-bracket"></i>
            </div>
            <div class="flex-1">
              <div class="font-bold text-amber-300">Example Input:</div>
              <pre class="opacity-90 text-[11px] code-font mt-0.5 bg-black/20 p-2 rounded-xl overflow-x-auto">${escapeHtml(challenge.exampleInput)}</pre>
            </div>
          </div>
        ` : ""}

        ${challenge.expectedOutput ? `
          <div class="flex items-start space-x-2.5 pt-1.5 border-t border-white/5">
            <div class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] mt-0.5">
              <i class="fa-solid fa-terminal"></i>
            </div>
            <div class="flex-1">
              <div class="font-bold text-emerald-300">Expected Output:</div>
              <pre class="opacity-90 text-[11px] code-font mt-0.5 bg-black/20 p-2 rounded-xl overflow-x-auto text-emerald-400">${escapeHtml(challenge.expectedOutput)}</pre>
            </div>
          </div>
        ` : ""}
      </div>

      <!-- Buggy Code Editor Area -->
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-[11px] font-bold opacity-75">
          <span>Code Editor (Fix the Buggy Code):</span>
          <button id="btnResetCode" class="text-purple-400 hover:text-purple-300 text-[10px] cursor-pointer">
            <i class="fa-solid fa-rotate-left mr-1"></i>Reset to Buggy Code
          </button>
        </div>
        <div class="code-box rounded-2xl p-3.5 code-font text-xs space-y-2 shadow-inner">
          <textarea id="debugCodeInput" class="w-full h-32 bg-transparent resize-y focus:outline-none leading-relaxed" spellcheck="false">${escapeHtml(challenge.buggyCode)}</textarea>
        </div>
        <details class="text-[10px] opacity-75 cursor-pointer pt-0.5">
          <summary class="hover:text-purple-300 font-semibold select-none">
            <i class="fa-solid fa-code text-[9px] mr-1"></i>View Original Buggy Code Reference
          </summary>
          <div class="code-box rounded-xl p-2.5 mt-1.5 code-font text-xs overflow-x-auto border border-rose-500/20 bg-rose-950/10">
            ${highlightCode(challenge.buggyCode, challenge.language)}
          </div>
        </details>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-2 pt-1">
        <button id="btnRunTest" class="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer">
          <i class="fa-solid fa-play text-[10px]"></i>
          <span>Test Fix</span>
        </button>
        <button id="btnRevealSolution" class="py-3 rounded-2xl sub-card font-semibold text-xs hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-white/5">
          <i class="fa-solid fa-lightbulb text-amber-400 text-[11px]"></i>
          <span>Show Solution</span>
        </button>
      </div>

      <!-- Live Execution / Test Feedback Box -->
      <div id="debugFeedbackBox" class="hidden space-y-2 pt-2 animate-[fadeInScale_0.3s_ease_forwards]">
        <div id="feedbackBanner" class="p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2"></div>
      </div>

      <!-- Solution & Explanation Panel (Revealed on demand or success) -->
      <div id="solutionBox" class="hidden space-y-3 pt-3 border-t border-black/5 dark:border-white/5 animate-[fadeInScale_0.3s_ease_forwards]">
        <!-- Actual Problem -->
        <div class="sub-card rounded-2xl p-3.5 border border-rose-500/20 space-y-1">
          <div class="flex items-center space-x-2 text-xs font-bold text-rose-400">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>The Bug Analyzed</span>
          </div>
          <p class="text-xs opacity-85 leading-relaxed">${challenge.actualProblem}</p>
        </div>

        <!-- Corrected Code -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-emerald-400">Corrected Solution:</div>
          <div class="code-box rounded-2xl p-3.5 code-font text-xs overflow-x-auto border-emerald-500/30 bg-emerald-950/10">
            ${highlightCode(challenge.correctedCode, challenge.language)}
          </div>
        </div>

        <!-- Detailed Explanation -->
        <div class="sub-card rounded-2xl p-3.5 space-y-2">
          <div class="flex items-center space-x-2 text-xs font-bold text-purple-400">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>Why This Works</span>
          </div>
          <p class="text-xs opacity-85 leading-relaxed">${challenge.explanation}</p>
          
          ${Array.isArray(challenge.concepts) && challenge.concepts.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${challenge.concepts.map(c => `
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
                  #${escapeHtml(c)}
                </span>
              `).join("")}
            </div>
          ` : ""}
        </div>

        ${onNext ? `
          <button id="btnNextChallenge" class="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 font-bold text-xs text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5">
            <span>Next Bug Challenge</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        ` : ""}
      </div>
    </div>
  `;

  const inputEl = container.querySelector("#debugCodeInput");
  const btnRunTest = container.querySelector("#btnRunTest");
  const btnReveal = container.querySelector("#btnRevealSolution");
  const btnReset = container.querySelector("#btnResetCode");
  const feedbackBox = container.querySelector("#debugFeedbackBox");
  const feedbackBanner = container.querySelector("#feedbackBanner");
  const solutionBox = container.querySelector("#solutionBox");
  const solvedBadge = container.querySelector("#debuggerSolvedBadge");
  const btnNext = container.querySelector("#btnNextChallenge");

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      inputEl.value = challenge.buggyCode;
      feedbackBox.classList.add("hidden");
    });
  }

  if (btnReveal) {
    btnReveal.addEventListener("click", () => {
      solutionBox.classList.toggle("hidden");
      if (!solutionBox.classList.contains("hidden")) {
        btnReveal.innerHTML = '<i class="fa-solid fa-eye-slash text-[11px] mr-1"></i><span>Hide Solution</span>';
      } else {
        btnReveal.innerHTML = '<i class="fa-solid fa-lightbulb text-amber-400 text-[11px] mr-1"></i><span>Show Solution</span>';
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (typeof onNext === "function") onNext();
    });
  }

  function normalizeCode(str) {
    return (str || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.trimEnd())
      .filter(line => line.length > 0)
      .join("\n")
      .trim();
  }

  function normalizeQuotes(str) {
    return (str || "").replace(/['"]/g, '"');
  }

  btnRunTest.addEventListener("click", () => {
    if (typeof onAttempt === "function") {
      onAttempt(challenge.id);
    }

    const userCode = normalizeCode(inputEl.value);
    const targetCorrect = normalizeCode(challenge.correctedCode);
    const buggyCode = normalizeCode(challenge.buggyCode);

    feedbackBox.classList.remove("hidden");

    const isMatch = userCode === targetCorrect || 
                    userCode.includes(targetCorrect) ||
                    normalizeQuotes(userCode) === normalizeQuotes(targetCorrect);

    if (isMatch) {
      // Solved!
      feedbackBanner.className = "p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      feedbackBanner.textContent = "";
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-circle-check text-emerald-400 text-sm";
      const msg = document.createElement("span");
      msg.textContent = `Success! Bug solved! Expected Output: ${challenge.expectedOutput || "Pass"}`;
      feedbackBanner.append(icon, msg);

      solutionBox.classList.remove("hidden");
      if (solvedBadge) solvedBadge.classList.remove("hidden");

      if (!isSolved) {
        isSolved = true;
        recordChallengeCompleted(challenge.id);
        openModal(
          "Challenge Solved! 🎉",
          `Congratulations! You diagnosed and fixed the <strong>${escapeHtml(challenge.bugType)}</strong> bug in <strong>${escapeHtml(challenge.title)}</strong>.<br><br><span class="text-purple-400 font-bold">+50 XP and +25 Gems awarded!</span>`,
          "Next Challenge",
          () => {
            if (typeof onNext === "function") onNext();
          }
        );
      }

      if (typeof onSolved === "function") onSolved(challenge.id);
    } else if (userCode === buggyCode) {
      feedbackBanner.className = "p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 bg-rose-500/20 text-rose-400 border border-rose-500/30";
      feedbackBanner.textContent = "";
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-circle-xmark text-rose-400 text-sm";
      const msg = document.createElement("span");
      msg.textContent = "The bug is still present. Read the goal above and modify the code to fix the issue!";
      feedbackBanner.append(icon, msg);
    } else {
      feedbackBanner.className = "p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 bg-amber-500/20 text-amber-400 border border-amber-500/30";
      feedbackBanner.textContent = "";
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-triangle-exclamation text-amber-400 text-sm";
      const msg = document.createElement("span");
      msg.textContent = 'Almost there, but output does not match expected goal yet. Click "Show Solution" for hints!';
      feedbackBanner.append(icon, msg);
    }
  });
}
