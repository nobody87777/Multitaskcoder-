// MultitaskCoder
// Module: Quizzes Page

import { loadAllQuizQuestions, loadQuizQuestion, loadQuizIndex, SUPPORTED_LANGUAGES } from "../features/quiz/quiz-engine.js";
import { renderQuizCard } from "../features/quiz/quiz-ui.js";
import { QuizSessionStats, isQuizCompleted } from "../features/quiz/quiz-stats.js";
import { navigate } from "../router.js";
import { escapeHtml } from "../utils.js";

/**
 * Loads all available quiz questions for the given language.
 * Defaults to "python" if no language is specified.
 */
export async function initQuizzesPage(language = "python") {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported quiz language: ${language}`);
  }
  return loadAllQuizQuestions(language);
}

/**
 * Renders the Quiz Arena page.
 */
export async function renderQuizzesPage(container, params = {}) {
  let activeLang = params.lang || "python";
  if (!SUPPORTED_LANGUAGES.includes(activeLang)) {
    activeLang = "python";
  }

  let selectedQuizId = params.id || null;
  let activeDifficulty = params.diff || "all";
  let activeType = params.type || "all";
  const sessionStats = new QuizSessionStats();

  // Page shell
  container.innerHTML = `
    <div id="tab-quizzes-view" class="tab-content active space-y-4 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Header Banner -->
      <div class="glass-card rounded-3xl p-5 border border-purple-500/30 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg">
            <i class="fa-solid fa-trophy"></i>
          </div>
          <div>
            <h2 class="text-base font-bold">Quiz Arena &amp; Battles</h2>
            <p class="text-xs opacity-75">Test your reflexes and algorithmic trivia</p>
          </div>
        </div>
      </div>

      <!-- Language Selector Tabs -->
      <div class="flex space-x-1.5 p-1 rounded-2xl sub-card overflow-x-auto">
        <button data-lang="python" class="quiz-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "python" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-python mr-1"></i>Python
        </button>
        <button data-lang="java" class="quiz-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "java" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-java mr-1"></i>Java
        </button>
        <button data-lang="c" class="quiz-lang-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeLang === "c" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-solid fa-code mr-1"></i>C
        </button>
      </div>

      <!-- Filter Controls & Question Dropdown -->
      <div class="glass-card rounded-2xl p-3 border border-purple-500/20 space-y-2.5">
        <!-- Question Dropdown -->
        <div>
          <label for="questionSelect" class="text-[10px] font-bold opacity-75 block mb-1">Select Question:</label>
          <select id="questionSelect" name="questionSelect" aria-label="Select Quiz Question" class="w-full sub-card rounded-xl p-2 text-xs font-semibold text-purple-300 focus:outline-none cursor-pointer">
            <option value="">Loading questions...</option>
          </select>
        </div>

        <!-- Filters Row: Type & Difficulty -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
          <!-- Question Type Filter (MCQ / Output) -->
          <div class="flex items-center space-x-1">
            <span class="text-[10px] font-bold opacity-75 mr-1">Type:</span>
            <button data-type="all" class="type-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeType === "all" ? "bg-purple-600 text-white" : "opacity-60"}">All</button>
            <button data-type="mcq" class="type-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeType === "mcq" ? "bg-purple-600 text-white" : "opacity-60"}">MCQ</button>
            <button data-type="output" class="type-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeType === "output" ? "bg-cyan-600 text-white" : "opacity-60"}">Output</button>
          </div>

          <!-- Difficulty Filter -->
          <div class="flex items-center space-x-1">
            <span class="text-[10px] font-bold opacity-75 mr-1">Difficulty:</span>
            <button data-diff="all" class="diff-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "all" ? "bg-purple-600 text-white" : "opacity-60"}">All</button>
            <button data-diff="beginner" class="diff-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "beginner" ? "bg-emerald-600 text-white" : "opacity-60"}">Easy</button>
            <button data-diff="intermediate" class="diff-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "intermediate" ? "bg-amber-600 text-white" : "opacity-60"}">Med</button>
            <button data-diff="advanced" class="diff-btn px-2 py-1 rounded-lg text-[10px] font-bold sub-card ${activeDifficulty === "advanced" ? "bg-rose-600 text-white" : "opacity-60"}">Hard</button>
          </div>
        </div>
      </div>

      <!-- Live Session Score Bar -->
      <div class="grid grid-cols-3 gap-2 text-center" id="quizSessionBar">
        <div class="sub-card p-2 rounded-xl">
          <div id="quizAnsweredCount" class="text-sm font-black text-purple-400">0</div>
          <div class="text-[9px] opacity-70">Answered</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="quizCorrectCount" class="text-sm font-black text-emerald-400">0</div>
          <div class="text-[9px] opacity-70">Correct</div>
        </div>
        <div class="sub-card p-2 rounded-xl">
          <div id="quizAccuracy" class="text-sm font-black text-cyan-400">100%</div>
          <div class="text-[9px] opacity-70">Accuracy</div>
        </div>
      </div>

      <!-- Mount for Active Quiz Card -->
      <div id="quizQuestionMount" class="min-h-[300px]">
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;

  // Attach language tab handlers
  container.querySelectorAll(".quiz-lang-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      navigate("quizzes", { lang, diff: activeDifficulty, type: activeType });
    });
  });

  // Attach question type filter handlers
  container.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      navigate("quizzes", { lang: activeLang, diff: activeDifficulty, type });
    });
  });

  // Attach difficulty filter handlers
  container.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const diff = btn.getAttribute("data-diff");
      navigate("quizzes", { lang: activeLang, diff, type: activeType });
    });
  });

  const quizMount = container.querySelector("#quizQuestionMount");
  const questionSelect = container.querySelector("#questionSelect");

  try {
    const indexData = await loadQuizIndex(activeLang);
    let allQuestions = Array.isArray(indexData.questions) ? indexData.questions : [];

    // Filter by type if not "all"
    let filtered = allQuestions;
    if (activeType !== "all") {
      filtered = filtered.filter(q => q.type === activeType);
    }

    // Filter by difficulty if not "all"
    if (activeDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === activeDifficulty);
    }
    if (filtered.length === 0) filtered = allQuestions;

    // Populate dropdown
    const completedQuizzes = isQuizCompleted;
    questionSelect.innerHTML = filtered.map((q, idx) => {
      const done = completedQuizzes(q.id);
      const typeLabel = (q.type || "mcq").toUpperCase();
      const titleLabel = q.topic ? `[${typeLabel}] ${q.topic} - ${q.id}` : `[${typeLabel}] ${q.id}`;
      return `<option value="${q.id}" ${q.id === selectedQuizId ? "selected" : ""}>
        ${idx + 1}. ${titleLabel} (${q.difficulty}) ${done ? "✓" : ""}
      </option>`;
    }).join("");

    // Determine current question entry
    let currentMeta = filtered.find(q => q.id === selectedQuizId) || filtered[0];
    questionSelect.value = currentMeta.id;

    async function renderCurrent() {
      quizMount.innerHTML = `
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      `;
      try {
        const fullQuestion = await loadQuizQuestion(activeLang, currentMeta.id);
        const currentIdx = filtered.findIndex(q => q.id === currentMeta.id);
        const nextQuestion = filtered[currentIdx + 1] || filtered[0];

        renderQuizCard(
          quizMount,
          fullQuestion,
          (qId, isCorrect) => {
            sessionStats.recordAnswer(qId, isCorrect);
            const ansEl = container.querySelector("#quizAnsweredCount");
            const corEl = container.querySelector("#quizCorrectCount");
            const accEl = container.querySelector("#quizAccuracy");
            if (ansEl) ansEl.innerText = sessionStats.totalAnswered;
            if (corEl) corEl.innerText = sessionStats.correctCount;
            if (accEl) accEl.innerText = `${sessionStats.getScorePercentage()}%`;
          },
          () => {
            navigate("quizzes", { lang: activeLang, id: nextQuestion.id, diff: activeDifficulty, type: activeType });
          }
        );
      } catch (err) {
        quizMount.innerHTML = `
          <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-bold">Question Temporarily Unavailable</h3>
              <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
              <p class="text-[11px] opacity-70">Session statistics are preserved. You can skip to the next challenge.</p>
            </div>
            <div class="flex items-center justify-center space-x-2 pt-2">
              <button id="btnRetryQuiz" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
              </button>
              <button id="btnSkipQuiz" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all hover:border-purple-500/30 cursor-pointer">
                <i class="fa-solid fa-forward mr-1.5"></i>Next Question
              </button>
            </div>
          </div>
        `;
        const retryBtn = quizMount.querySelector("#btnRetryQuiz");
        if (retryBtn) retryBtn.addEventListener("click", () => renderCurrent());
        const skipBtn = quizMount.querySelector("#btnSkipQuiz");
        if (skipBtn) {
          skipBtn.addEventListener("click", () => {
            const currentIdx = filtered.findIndex(q => q.id === currentMeta.id);
            const nextQuestion = filtered[currentIdx + 1] || filtered[0];
            currentMeta = nextQuestion;
            questionSelect.value = nextQuestion.id;
            renderCurrent();
          });
        }
      }
    }

    questionSelect.addEventListener("change", () => {
      const chosenId = questionSelect.value;
      const found = filtered.find(q => q.id === chosenId);
      if (found) {
        currentMeta = found;
        renderCurrent();
      }
    });

    await renderCurrent();

  } catch (err) {
    quizMount.innerHTML = `
      <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-bold">Unable to Load Quiz Questions</h3>
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
    const retryBtn = quizMount.querySelector("#btnRetryIndex");
    if (retryBtn) retryBtn.addEventListener("click", () => renderQuizzesPage(container, params));
    const homeBtn = quizMount.querySelector("#btnHomeFallback");
    if (homeBtn) homeBtn.addEventListener("click", () => navigate("home"));
  }
}
