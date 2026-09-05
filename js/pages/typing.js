// MultitaskCoder
// Module: Speed Typing Page

import { loadAllTypingDrills, loadTypingDrill, loadTypingIndex, SUPPORTED_LANGUAGES } from "../features/typing/typing-engine.js";
import { renderTypingDrill } from "../features/typing/typing-ui.js";
import { isDrillCompleted, getCompletedDrillsForLanguage } from "../features/typing/typing-progress.js";
import { navigate } from "../router.js";
import { escapeHtml } from "../utils.js";

/**
 * Renders the Speed Typing page.
 */
export async function renderTypingPage(container, params = {}) {
  let activeLang = params.lang || "python";
  if (!SUPPORTED_LANGUAGES.includes(activeLang)) {
    activeLang = "python";
  }

  let selectedDrillId = params.id || null;
  let activeDifficulty = params.diff || "all";

  // Page shell
  container.innerHTML = `
    <div id="tab-typing-view" class="tab-content active space-y-4 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Header Banner -->
      <div class="glass-card rounded-3xl p-5 border border-purple-500/30 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h2 class="text-base font-bold">Speed Typing Arena</h2>
            <p class="text-xs opacity-75">Practice syntax typing velocity and muscle memory</p>
          </div>
        </div>
      </div>

      <!-- Language Selector Tabs -->
      <div class="flex space-x-1.5 p-1 rounded-2xl sub-card overflow-x-auto">
        <button data-lang="python" class="typing-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "python" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-python mr-1"></i>Python
        </button>
        <button data-lang="java" class="typing-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "java" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-java mr-1"></i>Java
        </button>
        <button data-lang="c" class="typing-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "c" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-solid fa-code mr-1"></i>C
        </button>
      </div>

      <!-- Difficulty Filter Pills & Drill Dropdown -->
      <div class="glass-card rounded-2xl p-3 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <!-- Drill Select Dropdown -->
        <div class="flex-1">
          <label for="drillSelect" class="text-[10px] font-bold opacity-75 block mb-1">Select Drill:</label>
          <select id="drillSelect" name="drillSelect" aria-label="Select Typing Drill" class="w-full sub-card rounded-xl p-2 text-xs font-semibold text-purple-300 focus:outline-none cursor-pointer">
            <option value="">Loading drills...</option>
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

      <!-- Mount for Active Typing Test -->
      <div id="typingDrillMount" class="min-h-[300px]">
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;

  // Attach language tab handlers
  container.querySelectorAll(".typing-lang-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      navigate("typing", { lang, diff: activeDifficulty });
    });
  });

  // Attach difficulty filter handlers
  container.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const diff = btn.getAttribute("data-diff");
      navigate("typing", { lang: activeLang, diff });
    });
  });

  const drillMount = container.querySelector("#typingDrillMount");
  const drillSelect = container.querySelector("#drillSelect");

  try {
    const indexData = await loadTypingIndex(activeLang);
    let allDrills = Array.isArray(indexData.programs) ? indexData.programs : [];

    // Apply difficulty filter if not "all"
    let filteredDrills = allDrills;
    if (activeDifficulty !== "all") {
      filteredDrills = allDrills.filter(d => d.difficulty === activeDifficulty);
    }
    if (filteredDrills.length === 0) filteredDrills = allDrills;

    // Populate dropdown
    const completedDrills = getCompletedDrillsForLanguage(activeLang);
    drillSelect.innerHTML = filteredDrills.map((d, idx) => {
      const done = completedDrills.includes(d.id);
      return `<option value="${d.id}" ${d.id === selectedDrillId ? "selected" : ""}>
        ${idx + 1}. ${d.title} (${d.difficulty}) ${done ? "✓" : ""}
      </option>`;
    }).join("");

    // Determine current drill entry
    let currentDrillMeta = filteredDrills.find(d => d.id === selectedDrillId) || filteredDrills[0];
    drillSelect.value = currentDrillMeta.id;

    async function renderCurrentDrill() {
      drillMount.innerHTML = `
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      `;
      try {
        const fullDrill = await loadTypingDrill(activeLang, currentDrillMeta.id);
        const currentIdx = filteredDrills.findIndex(d => d.id === currentDrillMeta.id);
        const nextDrill = filteredDrills[currentIdx + 1] || filteredDrills[0];

        renderTypingDrill(
          drillMount,
          fullDrill,
          () => {
            navigate("typing", { lang: activeLang, id: nextDrill.id, diff: activeDifficulty });
          }
        );
      } catch (err) {
        drillMount.innerHTML = `
          <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-bold">Drill Temporarily Unavailable</h3>
              <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
              <p class="text-[11px] opacity-70">Other typing drills remain fully operational.</p>
            </div>
            <div class="flex items-center justify-center space-x-2 pt-2">
              <button id="btnRetryDrill" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
              </button>
              <button id="btnSkipDrill" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all hover:border-purple-500/30 cursor-pointer">
                <i class="fa-solid fa-forward mr-1.5"></i>Next Drill
              </button>
            </div>
          </div>
        `;
        const retryBtn = drillMount.querySelector("#btnRetryDrill");
        if (retryBtn) retryBtn.addEventListener("click", () => renderCurrentDrill());
        const skipBtn = drillMount.querySelector("#btnSkipDrill");
        if (skipBtn) {
          skipBtn.addEventListener("click", () => {
            const currentIdx = filteredDrills.findIndex(d => d.id === currentDrillMeta.id);
            const nextDrill = filteredDrills[currentIdx + 1] || filteredDrills[0];
            currentDrillMeta = nextDrill;
            drillSelect.value = nextDrill.id;
            renderCurrentDrill();
          });
        }
      }
    }

    drillSelect.addEventListener("change", () => {
      const chosenId = drillSelect.value;
      const found = filteredDrills.find(d => d.id === chosenId);
      if (found) {
        currentDrillMeta = found;
        renderCurrentDrill();
      }
    });

    await renderCurrentDrill();

  } catch (err) {
    drillMount.innerHTML = `
      <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-bold">Unable to Load Drills</h3>
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
    const retryBtn = drillMount.querySelector("#btnRetryIndex");
    if (retryBtn) retryBtn.addEventListener("click", () => renderTypingPage(container, params));
    const homeBtn = drillMount.querySelector("#btnHomeFallback");
    if (homeBtn) homeBtn.addEventListener("click", () => navigate("home"));
  }
}
