// MultitaskCoder
// Module: Debugger Arena Page

import { loadAllDebuggerChallenges, loadDebuggerChallenge, loadDebuggerIndex, SUPPORTED_LANGUAGES } from "../features/debugger/debugger-engine.js";
import { renderDebuggerCard } from "../features/debugger/debugger-ui.js";
import { DebuggerSessionStats, getCompletedChallengesForLanguage, isChallengeCompleted } from "../features/debugger/debugger-stats.js";
import { navigate } from "../router.js";
import { escapeHtml } from "../utils.js";

const sessionStats = new DebuggerSessionStats();

/**
 * Loads all available debugging challenges for the given language.
 * Defaults to "python" if no language is specified.
 */
export async function initDebuggerPage(language = "python") {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported debugger language: ${language}`);
  }
  return loadAllDebuggerChallenges(language);
}

/**
 * Renders the Debugger Arena page.
 */
export async function renderDebuggerPage(container, params = {}) {
  let activeLang = params.lang || "python";
  if (!SUPPORTED_LANGUAGES.includes(activeLang)) {
    activeLang = "python";
  }

  let selectedChallengeId = params.id || null;
  let activeDifficulty = params.diff || "all";

  // Page shell
  container.innerHTML = `
    <div id="tab-debugger-view" class="tab-content active space-y-4 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Header Banner -->
      <div class="glass-card rounded-3xl p-5 border border-purple-500/30 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
            <i class="fa-solid fa-bug"></i>
          </div>
          <div>
            <h2 class="text-base font-bold">Debugger Arena</h2>
            <p class="text-xs opacity-75">Diagnose, patch syntax &amp; logic flaws in real code</p>
          </div>
        </div>
      </div>

      <!-- Language Selector Tabs -->
      <div class="flex space-x-1.5 p-1 rounded-2xl sub-card overflow-x-auto">
        <button data-lang="python" class="debug-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "python" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-python mr-1"></i>Python
        </button>
        <button data-lang="java" class="debug-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "java" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-java mr-1"></i>Java
        </button>
        <button data-lang="c" class="debug-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "c" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-solid fa-code mr-1"></i>C
        </button>
      </div>

      <!-- Difficulty Filter Pills & Challenge Dropdown -->
      <div class="glass-card rounded-2xl p-3 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <!-- Challenge Dropdown -->
        <div class="flex-1">
          <label for="challengeSelect" class="text-[10px] font-bold opacity-75 block mb-1">Select Challenge:</label>
          <select id="challengeSelect" name="challengeSelect" aria-label="Select Debugging Challenge" class="w-full sub-card rounded-xl p-2 text-xs font-semibold text-purple-300 focus:outline-none cursor-pointer">
            <option value="">Loading challenges...</option>
          </select>
        </div>

        <!-- Difficulty Filter -->
        <div>
          <label class="text-[10px] font-bold opacity-75 block mb-1">Filter Difficulty:</label>
          <div class="flex space-x-1">
            <button data-diff="all" class="diff-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "all" ? "bg-purple-600 text-white" : "opacity-60"}">All</button>
            <button data-diff="beginner" class="diff-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "beginner" ? "bg-emerald-600 text-white" : "opacity-60"}">Easy</button>
            <button data-diff="intermediate" class="diff-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "intermediate" ? "bg-amber-600 text-white" : "opacity-60"}">Med</button>
            <button data-diff="advanced" class="diff-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "advanced" ? "bg-rose-600 text-white" : "opacity-60"}">Hard</button>
          </div>
        </div>
      </div>

      <!-- Live Session Score Bar -->
      <div class="grid grid-cols-3 gap-2 text-center" id="debuggerSessionBar">
        <div class="sub-card p-2 rounded-xl">
          <div id="debugAttemptedCount" class="text-sm font-black text-purple-400">${sessionStats.totalAttempts}</div>
          <div class="text-[9px] opacity-70">Attempts</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="debugSolvedCount" class="text-sm font-black text-emerald-400">${sessionStats.solvedCount}</div>
          <div class="text-[9px] opacity-70">Solved</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="debugSuccessRate" class="text-sm font-black text-cyan-400">${sessionStats.getSuccessRate()}%</div>
          <div class="text-[9px] opacity-70">Success Rate</div>
        </div>
      </div>

      <!-- Mount for Active Challenge -->
      <div id="debuggerChallengeMount" class="min-h-[300px]">
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;

  // Attach language tab handlers
  container.querySelectorAll(".debug-lang-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      navigate("debugger", { lang, diff: activeDifficulty });
    });
  });

  // Attach difficulty filter handlers
  container.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const diff = btn.getAttribute("data-diff");
      navigate("debugger", { lang: activeLang, diff });
    });
  });

  const challengeMount = container.querySelector("#debuggerChallengeMount");
  const challengeSelect = container.querySelector("#challengeSelect");

  try {
    const indexData = await loadDebuggerIndex(activeLang);
    let allChallenges = Array.isArray(indexData.challenges) ? indexData.challenges : [];

    // Filter by difficulty if not "all"
    let filtered = allChallenges;
    if (activeDifficulty !== "all") {
      filtered = allChallenges.filter(c => c.difficulty === activeDifficulty);
    }
    if (filtered.length === 0) filtered = allChallenges;

    // Populate dropdown
    const completedChallenges = getCompletedChallengesForLanguage(activeLang);
    challengeSelect.innerHTML = filtered.map((c, idx) => {
      const done = completedChallenges.includes(c.id);
      const titleLabel = c.title || `${c.topic} (${c.bugType})`;
      return `<option value="${c.id}" ${c.id === selectedChallengeId ? "selected" : ""}>
        ${idx + 1}. ${titleLabel} ${done ? "✓" : ""}
      </option>`;
    }).join("");

    // Determine current challenge entry
    let currentMeta = filtered.find(c => c.id === selectedChallengeId) || filtered[0];
    challengeSelect.value = currentMeta.id;

    async function renderCurrent() {
      challengeMount.innerHTML = `
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      `;
      try {
        const fullChallenge = await loadDebuggerChallenge(activeLang, currentMeta.id);
        const currentIdx = filtered.findIndex(c => c.id === currentMeta.id);
        const nextChallenge = filtered[currentIdx + 1] || filtered[0];

        renderDebuggerCard(
          challengeMount,
          fullChallenge,
          (solvedId) => {
            // Solved callback
            sessionStats.recordSolved(solvedId);
            const solEl = container.querySelector("#debugSolvedCount");
            const rateEl = container.querySelector("#debugSuccessRate");
            if (solEl) solEl.innerText = sessionStats.solvedCount;
            if (rateEl) rateEl.innerText = `${sessionStats.getSuccessRate()}%`;

            // Update dropdown checkmark
            const opt = challengeSelect.querySelector(`option[value="${solvedId}"]`);
            if (opt && !opt.textContent.includes("✓")) {
              opt.textContent = `${opt.textContent.trim()} ✓`;
            }
          },
          () => {
            navigate("debugger", { lang: activeLang, id: nextChallenge.id, diff: activeDifficulty });
          },
          (attemptId) => {
            // Attempt callback
            sessionStats.recordAttempt(attemptId);
            const attEl = container.querySelector("#debugAttemptedCount");
            const rateEl = container.querySelector("#debugSuccessRate");
            if (attEl) attEl.innerText = sessionStats.totalAttempts;
            if (rateEl) rateEl.innerText = `${sessionStats.getSuccessRate()}%`;
          }
        );
      } catch (err) {
        challengeMount.innerHTML = `
          <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-bold">Challenge Temporarily Unavailable</h3>
              <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
              <p class="text-[11px] opacity-70">Arena statistics are preserved. You can skip to the next challenge.</p>
            </div>
            <div class="flex items-center justify-center space-x-2 pt-2">
              <button id="btnRetryChallenge" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
              </button>
              <button id="btnSkipChallenge" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all hover:border-purple-500/30 cursor-pointer">
                <i class="fa-solid fa-forward mr-1.5"></i>Next Challenge
              </button>
            </div>
          </div>
        `;
        const retryBtn = challengeMount.querySelector("#btnRetryChallenge");
        if (retryBtn) retryBtn.addEventListener("click", () => renderCurrent());
        const skipBtn = challengeMount.querySelector("#btnSkipChallenge");
        if (skipBtn) {
          skipBtn.addEventListener("click", () => {
            const currentIdx = filtered.findIndex(c => c.id === currentMeta.id);
            const nextChallenge = filtered[currentIdx + 1] || filtered[0];
            currentMeta = nextChallenge;
            challengeSelect.value = nextChallenge.id;
            renderCurrent();
          });
        }
      }
    }

    challengeSelect.addEventListener("change", () => {
      const chosenId = challengeSelect.value;
      const found = filtered.find(c => c.id === chosenId);
      if (found) {
        currentMeta = found;
        renderCurrent();
      }
    });

    await renderCurrent();

  } catch (err) {
    challengeMount.innerHTML = `
      <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-bold">Unable to Load Challenges</h3>
          <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
        </div>
        <div class="flex items-center justify-center space-x-2 pt-2">
          <button id="btnRetryIndex" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
            <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
          </button>
          <button id="btnHomeFallback" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all cursor-pointer">
            Return Home
          </button>
        </div>
      </div>
    `;
    const retryBtn = challengeMount.querySelector("#btnRetryIndex");
    if (retryBtn) retryBtn.addEventListener("click", () => renderDebuggerPage(container, params));
    const homeBtn = challengeMount.querySelector("#btnHomeFallback");
    if (homeBtn) homeBtn.addEventListener("click", () => navigate("home"));
  }
}
