// MultitaskCoder
// Module: Theory UI Rendering

import { escapeHtml, highlightCode } from "../../utils.js";
import { completeLesson, getState } from "../../state.js";

/**
 * Checks if a theory lesson has been completed.
 */
function isLessonCompleted(lessonId) {
  const state = getState();
  return (state.completedLessons || []).includes(lessonId);
}

/**
 * Renders the module accordion and lesson directory for a theory section.
 */
export function renderModuleList(container, section, modules, onSelectLesson, onSearch = null) {
  const completedList = getState().completedLessons || [];

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Search Input -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-xs text-purple-400"></i>
        <input id="theorySearchInput" type="text" placeholder="Search concepts, topics, or lessons..." class="w-full pl-9 pr-4 py-2.5 rounded-2xl sub-card text-xs focus:outline-none focus:border-purple-500/50 border border-transparent transition-all">
      </div>

      <!-- Modules Accordion -->
      <div class="space-y-3" id="modulesAccordionContainer">
        ${modules.map((mod, modIdx) => {
          const title = mod.moduleTitle || mod.topicTitle || `Module ${modIdx + 1}`;
          const lessons = mod.lessons || [];
          const completedCount = lessons.filter(l => completedList.includes(l.id)).length;
          const isAllDone = completedCount === lessons.length && lessons.length > 0;

          return `
            <div class="glass-card rounded-2xl overflow-hidden border border-purple-500/20 transition-all">
              <button data-mod-idx="${modIdx}" class="module-header-btn w-full p-4 flex items-center justify-between text-left hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-xl ${isAllDone ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/10 text-purple-400"} flex items-center justify-center text-xs font-bold shrink-0">
                    ${isAllDone ? '<i class="fa-solid fa-check"></i>' : modIdx + 1}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold leading-tight">${escapeHtml(title)}</h4>
                    <span class="text-[10px] ${isAllDone ? "text-emerald-400" : "opacity-60"}">
                      ${completedCount}/${lessons.length} Lessons • ${mod.difficulty || "All Levels"}
                    </span>
                  </div>
                </div>
                <i class="fa-solid fa-chevron-down text-xs opacity-60 transition-transform duration-300 chevron-icon"></i>
              </button>

              <div id="module-lessons-${modIdx}" class="module-body px-3 pb-3 space-y-1.5 hidden border-t border-black/5 dark:border-white/5 pt-2">
                ${lessons.map((lesson) => {
                  const done = completedList.includes(lesson.id);
                  return `
                    <button data-lesson-id="${lesson.id}" class="lesson-btn w-full p-2.5 rounded-xl sub-card flex items-center justify-between text-left hover:border-purple-500/40 hover:translate-x-1 transition-all cursor-pointer">
                      <div class="flex items-center space-x-2.5">
                        <i class="fa-regular fa-file-lines text-xs ${done ? "text-emerald-400" : "text-purple-400"}"></i>
                        <span class="text-xs font-medium">${escapeHtml(lesson.title)}</span>
                      </div>
                      ${done ? '<i class="fa-solid fa-check text-emerald-400 text-xs"></i>' : '<i class="fa-solid fa-arrow-right text-[10px] opacity-50"></i>'}
                    </button>
                  `;
                }).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  // Attach search listener
  const searchInput = container.querySelector("#theorySearchInput");
  if (searchInput && typeof onSearch === "function") {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onSearch(searchInput.value.trim());
      }, 250);
    });
  }

  // Attach module accordion toggle
  container.querySelectorAll(".module-header-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-mod-idx");
      const body = container.querySelector(`#module-lessons-${idx}`);
      const chevron = btn.querySelector(".chevron-icon");
      if (body) {
        body.classList.toggle("hidden");
        if (chevron) chevron.classList.toggle("rotate-180");
      }
    });
  });

  // Attach lesson buttons
  container.querySelectorAll(".lesson-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lessonId = btn.getAttribute("data-lesson-id");
      if (lessonId && typeof onSelectLesson === "function") {
        onSelectLesson(lessonId);
      }
    });
  });
}

/**
 * Renders an entire interactive theory lesson reader view.
 */
export function renderLesson(container, lesson, onNavigateLesson, onBack) {
  const isDone = isLessonCompleted(lesson.id);

  const difficultyColors = {
    beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };
  const diffBadge = difficultyColors[lesson.difficulty] || difficultyColors.beginner;

  container.innerHTML = `
    <div id="theoryReadingView" class="glass-card rounded-3xl p-5 border border-purple-500/30 space-y-5 shadow-xl animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Top Bar / Back Button -->
      <div class="flex items-center justify-between">
        <button id="btnBackToModules" class="py-1.5 px-3 rounded-xl sub-card text-xs font-semibold flex items-center space-x-1.5 hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
          <i class="fa-solid fa-arrow-left text-[10px]"></i>
          <span>Modules</span>
        </button>
        <span class="text-xs font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
          +15 XP
        </span>
      </div>

      <!-- Lesson Title & Metadata -->
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${diffBadge}">
            ${lesson.difficulty}
          </span>
          <span class="text-[10px] text-purple-400 font-semibold">${lesson.module || lesson.topic || ""}</span>
          <span id="lessonSolvedBadge" class="text-[10px] text-emerald-400 font-bold ${isDone ? "" : "hidden"}">
            <i class="fa-solid fa-check"></i> Completed
          </span>
        </div>
        <h1 class="text-lg font-extrabold leading-tight mt-1">${escapeHtml(lesson.title)}</h1>
        <p class="text-xs opacity-75 leading-relaxed">${escapeHtml(lesson.description)}</p>
      </div>

      <!-- Learning Objectives -->
      ${Array.isArray(lesson.objectives) && lesson.objectives.length > 0 ? `
        <div class="sub-card rounded-2xl p-4 border border-purple-500/20 space-y-2">
          <div class="flex items-center space-x-2 text-xs font-bold text-purple-400">
            <i class="fa-solid fa-bullseye"></i>
            <span>Learning Objectives</span>
          </div>
          <ul class="space-y-1 text-xs opacity-85 list-disc list-inside">
            ${lesson.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <!-- Content Blocks -->
      <div class="space-y-4 text-xs leading-relaxed">
        ${(lesson.content || []).map((block) => {
          if (block.type === "text") {
            return `
              <div class="space-y-1.5 pt-1">
                ${block.heading ? `<h3 class="text-sm font-bold text-purple-300">${escapeHtml(block.heading)}</h3>` : ""}
                <div class="opacity-85 whitespace-pre-wrap">${escapeHtml(block.body)}</div>
              </div>
            `;
          } else if (block.type === "code") {
            return `
              <div class="space-y-1.5 pt-2">
                <div class="flex justify-between items-center text-[11px] font-bold opacity-75">
                  <span>${block.language ? block.language.toUpperCase() : "CODE"}</span>
                  <button data-copy-code class="text-purple-400 hover:text-purple-300 text-[10px] cursor-pointer">
                    <i class="fa-regular fa-copy mr-1"></i>Copy
                  </button>
                </div>
                <div class="code-box rounded-2xl p-3.5 code-font text-xs overflow-x-auto shadow-inner">
                  ${highlightCode(block.code, block.language || lesson.language)}
                </div>
                ${block.explanation ? `<p class="text-[11px] opacity-75 italic">${escapeHtml(block.explanation)}</p>` : ""}
              </div>
            `;
          }
          return "";
        }).join("")}
      </div>

      <!-- Key Points -->
      ${Array.isArray(lesson.keyPoints) && lesson.keyPoints.length > 0 ? `
        <div class="sub-card rounded-2xl p-4 border border-emerald-500/20 space-y-2 bg-emerald-950/10">
          <div class="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <i class="fa-solid fa-key"></i>
            <span>Key Takeaways</span>
          </div>
          <ul class="space-y-1 text-xs opacity-90 list-disc list-inside">
            ${lesson.keyPoints.map(kp => `<li>${escapeHtml(kp)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <!-- Common Mistakes -->
      ${Array.isArray(lesson.commonMistakes) && lesson.commonMistakes.length > 0 ? `
        <div class="sub-card rounded-2xl p-4 border border-rose-500/20 space-y-2 bg-rose-950/10">
          <div class="flex items-center space-x-2 text-xs font-bold text-rose-400">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Common Pitfalls to Avoid</span>
          </div>
          <ul class="space-y-1 text-xs opacity-90 list-disc list-inside">
            ${lesson.commonMistakes.map(cm => `<li>${escapeHtml(cm)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <!-- Concepts Tags -->
      ${Array.isArray(lesson.concepts) && lesson.concepts.length > 0 ? `
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${lesson.concepts.map(c => `
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
              #${escapeHtml(c)}
            </span>
          `).join("")}
        </div>
      ` : ""}

      <!-- Action / Complete Button -->
      <div class="pt-2">
        <button id="btnMarkCompleted" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-bold text-xs text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer">
          <i class="fa-solid fa-check-double"></i>
          <span>${isDone ? "Lesson Completed" : "Mark as Completed (+15 XP)"}</span>
        </button>
      </div>

      <!-- Bottom Next / Previous Navigation -->
      <div class="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
        <button id="btnPrevLesson" class="py-2.5 px-4 rounded-xl sub-card font-semibold flex items-center space-x-1.5 ${lesson.previousLesson ? "hover:bg-white/5 active:scale-95 cursor-pointer" : "opacity-40 cursor-not-allowed"}" ${lesson.previousLesson ? "" : "disabled"}>
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
          <span>Previous</span>
        </button>
        <button id="btnNextLesson" class="py-2.5 px-4 rounded-xl sub-card font-semibold flex items-center space-x-1.5 ${lesson.nextLesson ? "hover:bg-white/5 active:scale-95 cursor-pointer text-purple-400" : "opacity-40 cursor-not-allowed"}" ${lesson.nextLesson ? "" : "disabled"}>
          <span>Next</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  `;

  // Attach button events
  const btnBack = container.querySelector("#btnBackToModules");
  if (btnBack && typeof onBack === "function") {
    btnBack.addEventListener("click", onBack);
  }

  const btnPrev = container.querySelector("#btnPrevLesson");
  if (btnPrev && lesson.previousLesson && typeof onNavigateLesson === "function") {
    btnPrev.addEventListener("click", () => onNavigateLesson(lesson.previousLesson));
  }

  const btnNext = container.querySelector("#btnNextLesson");
  if (btnNext && lesson.nextLesson && typeof onNavigateLesson === "function") {
    btnNext.addEventListener("click", () => onNavigateLesson(lesson.nextLesson));
  }

  const btnComplete = container.querySelector("#btnMarkCompleted");
  const solvedBadge = container.querySelector("#lessonSolvedBadge");
  if (btnComplete) {
    btnComplete.addEventListener("click", () => {
      completeLesson(lesson.id);
      btnComplete.innerHTML = '<i class="fa-solid fa-check"></i><span>Lesson Completed</span>';
      if (solvedBadge) solvedBadge.classList.remove("hidden");
    });
  }

  // Copy code buttons
  container.querySelectorAll("[data-copy-code]").forEach((copyBtn) => {
    copyBtn.addEventListener("click", () => {
      const codeBox = copyBtn.closest(".space-y-1\\.5")?.querySelector(".code-box");
      if (codeBox) {
        navigator.clipboard.writeText(codeBox.innerText);
        copyBtn.innerHTML = '<i class="fa-solid fa-check mr-1 text-emerald-400"></i>Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy mr-1"></i>Copy';
        }, 1500);
      }
    });
  });
}
