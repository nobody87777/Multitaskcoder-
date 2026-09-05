// MultitaskCoder
// Module: Typing UI

import { TypingSessionStats } from "./typing-stats.js";
import { recordDrillCompletion, isDrillCompleted } from "./typing-progress.js";
import { openModal } from "../../components/modal.js";
import { escapeHtml } from "../../utils.js";

/**
 * Mounts an interactive typing drill inside container.
 */
export function renderTypingDrill(container, drill, onNextDrill = null) {
  const targetCode = drill.code || "";
  const stats = new TypingSessionStats();
  let timerInterval = null;
  let isFinished = false;

  const alreadyDone = isDrillCompleted(drill.id);

  const difficultyColors = {
    beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };
  const diffBadge = difficultyColors[drill.difficulty] || difficultyColors.beginner;

  container.innerHTML = `
    <div class="glass-card rounded-3xl p-5 border border-purple-500/30 space-y-4 shadow-xl">
      <!-- Drill Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${diffBadge}">
              ${drill.difficulty}
            </span>
            <span class="text-[10px] text-purple-400 font-semibold">${drill.topic}</span>
            ${alreadyDone ? '<span class="text-[10px] text-emerald-400 font-bold"><i class="fa-solid fa-check"></i> Completed</span>' : ""}
          </div>
          <h2 class="text-base font-bold mt-1">${drill.title}</h2>
          <p class="text-xs opacity-75 mt-0.5">${drill.description}</p>
        </div>
        <span class="text-xs font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full shrink-0 border border-purple-500/20">
          +25 XP
        </span>
      </div>

      <!-- Live Metrics Bar -->
      <div class="grid grid-cols-4 gap-2 text-center">
        <div class="sub-card p-2 rounded-xl">
          <div id="metricWpm" class="text-sm font-black text-purple-400">0</div>
          <div class="text-[9px] opacity-70">WPM</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="metricAcc" class="text-sm font-black text-emerald-400">100%</div>
          <div class="text-[9px] opacity-70">Accuracy</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="metricErr" class="text-sm font-black text-rose-400">0</div>
          <div class="text-[9px] opacity-70">Errors</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="metricTime" class="text-sm font-black text-cyan-400">0s</div>
          <div class="text-[9px] opacity-70">Time</div>
        </div>
      </div>

      <!-- Code Box Area -->
      <div class="relative">
        <div id="typingDisplay" class="code-box rounded-2xl p-4 code-font text-xs tracking-wide leading-relaxed min-h-[140px] whitespace-pre-wrap select-none shadow-inner overflow-x-auto">
          <!-- Rendered spans will go here -->
        </div>

        <!-- Hidden input overlay that captures user typing accurately -->
        <textarea id="typingInput" aria-label="Typing drill keyboard input" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer resize-none focus:outline-none" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
      </div>

      <div class="flex items-center justify-between text-[11px] opacity-75 px-1">
        <span>Click code area to focus &amp; start typing</span>
        <span id="charCounter">0 / ${targetCode.length}</span>
      </div>

      ${drill.expectedOutput ? `
      <!-- Expected Output Box -->
      <div class="sub-card rounded-2xl p-3 border border-purple-500/15 flex items-start space-x-2.5 text-xs">
        <div class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] mt-0.5">
          <i class="fa-solid fa-terminal"></i>
        </div>
        <div class="overflow-x-auto">
          <div class="font-bold text-gray-300">Expected Output:</div>
          <code class="code-font text-[11px] text-emerald-400 block mt-0.5">${escapeHtml(drill.expectedOutput)}</code>
        </div>
      </div>
      ` : ""}

      <!-- Controls -->
      <div class="flex space-x-2 pt-2">
        <button id="btnRestartTyping" class="px-4 py-2.5 rounded-xl sub-card text-xs font-semibold hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5">
          <i class="fa-solid fa-rotate-left text-[11px]"></i>
          <span>Restart</span>
        </button>
        ${onNextDrill ? `
        <button id="btnNextTyping" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5">
          <span>Next Drill</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
        ` : ""}
      </div>
    </div>
  `;

  const inputEl = container.querySelector("#typingInput");
  const displayEl = container.querySelector("#typingDisplay");
  const wpmEl = container.querySelector("#metricWpm");
  const accEl = container.querySelector("#metricAcc");
  const errEl = container.querySelector("#metricErr");
  const timeEl = container.querySelector("#metricTime");
  const charCounterEl = container.querySelector("#charCounter");
  const btnRestart = container.querySelector("#btnRestartTyping");
  const btnNext = container.querySelector("#btnNextTyping");

  // Pre-populate display with safe span elements (Safe DOM API, zero innerHTML on input)
  displayEl.textContent = "";
  const charSpans = [];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < targetCode.length; i++) {
    const span = document.createElement("span");
    span.textContent = targetCode[i];
    span.className = i === 0 ? "typing-char current" : "text-gray-400 dark:text-gray-500";
    charSpans.push(span);
    fragment.appendChild(span);
  }
  displayEl.appendChild(fragment);

  function updateDisplay() {
    const typed = inputEl.value;

    for (let i = 0; i < targetCode.length; i++) {
      const span = charSpans[i];
      if (!span) continue;

      if (i < typed.length) {
        if (typed[i] === targetCode[i]) {
          if (span.className !== "typing-char correct") {
            span.className = "typing-char correct";
          }
        } else {
          if (span.className !== "typing-char incorrect") {
            span.className = "typing-char incorrect";
          }
        }
      } else if (i === typed.length && !isFinished) {
        if (span.className !== "typing-char current") {
          span.className = "typing-char current";
        }
      } else {
        if (span.className !== "text-gray-400 dark:text-gray-500") {
          span.className = "text-gray-400 dark:text-gray-500";
        }
      }
    }

    if (charCounterEl) {
      charCounterEl.textContent = `${typed.length} / ${targetCode.length}`;
    }

    // Update metrics
    const wpm = stats.getWpm();
    const acc = stats.getAccuracy();
    if (wpmEl) wpmEl.textContent = wpm;
    if (accEl) accEl.textContent = `${acc}%`;
    if (errEl) errEl.textContent = stats.errors;
    if (timeEl) timeEl.textContent = `${Math.round(stats.getElapsedSeconds())}s`;
  }

  function handleInput() {
    if (isFinished) return;
    stats.start();

    if (!timerInterval) {
      timerInterval = setInterval(() => {
        if (!isFinished && timeEl) {
          timeEl.innerText = `${Math.round(stats.getElapsedSeconds())}s`;
          if (wpmEl) wpmEl.innerText = stats.getWpm();
        }
      }, 500);
    }

    const typed = inputEl.value;
    const currentIdx = typed.length - 1;
    if (currentIdx >= 0 && currentIdx < targetCode.length) {
      const isCorrect = typed[currentIdx] === targetCode[currentIdx];
      stats.recordKey(isCorrect);
    }

    updateDisplay();

    // Check for completion
    if (typed.length >= targetCode.length) {
      finishDrill();
    }
  }

  function finishDrill() {
    if (isFinished) return;
    isFinished = true;
    stats.finish();
    clearInterval(timerInterval);

    const summary = stats.getSummary();
    recordDrillCompletion(drill.id, summary.wpm, targetCode.length);

    openModal(
      "Drill Complete! 🎉",
      `Awesome job! You finished <strong>${escapeHtml(drill.title)}</strong> at <strong>${summary.wpm} WPM</strong> with <strong>${summary.accuracy}% accuracy</strong> in ${summary.elapsedSeconds} seconds.<br><br><span class="text-purple-400 font-bold">+25 XP and +10 Gems awarded!</span>`,
      "Continue",
      () => {
        if (typeof onNextDrill === "function") {
          onNextDrill();
        }
      }
    );
  }

  function restart() {
    clearInterval(timerInterval);
    timerInterval = null;
    isFinished = false;
    stats.reset();
    inputEl.value = "";
    updateDisplay();
    inputEl.focus();
  }

  inputEl.addEventListener("input", handleInput);
  if (btnRestart) btnRestart.addEventListener("click", restart);
  if (btnNext) btnNext.addEventListener("click", () => onNextDrill && onNextDrill());

  // Focus input when user clicks anywhere in code box
  displayEl.addEventListener("click", () => inputEl.focus());

  // Initial draw
  updateDisplay();
}
