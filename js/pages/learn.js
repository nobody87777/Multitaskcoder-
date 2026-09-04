// MultitaskCoder
// Module: Learn / Theory Page

import { loadModules, loadAllLessons, loadLesson, SUPPORTED_SECTIONS } from "../features/theory/theory-engine.js";
import { goToNextLesson, goToPreviousLesson } from "../features/theory/lesson-navigation.js";
import { searchSection, searchAllSections } from "../features/theory/theory-search.js";
import { renderModuleList, renderLesson } from "../features/theory/theory-ui.js";
import { navigate } from "../router.js";
import { escapeHtml } from "../utils.js";

/**
 * Loads the module list for a theory section ("python" | "java" | "c" | "comparison").
 * Defaults to "python" if no section is specified.
 */
export async function initLearnPage(section = "python") {
  if (!SUPPORTED_SECTIONS.includes(section)) {
    throw new Error(`Unsupported theory section: ${section}`);
  }
  return loadModules(section);
}

/**
 * Renders the Learn / Theory page.
 */
export async function renderLearnPage(container, params = {}) {
  let activeSection = params.section || "python";
  if (!SUPPORTED_SECTIONS.includes(activeSection)) {
    activeSection = "python";
  }

  const selectedLessonId = params.lesson || null;

  // Page wrapper
  container.innerHTML = `
    <div id="tab-learn-view" class="tab-content active space-y-4 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Section Tabs -->
      <div class="flex space-x-1.5 p-1 rounded-2xl sub-card overflow-x-auto">
        <button data-sec="python" class="sec-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeSection === "python" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-python mr-1"></i>Python
        </button>
        <button data-sec="java" class="sec-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeSection === "java" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-brands fa-java mr-1"></i>Java
        </button>
        <button data-sec="c" class="sec-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeSection === "c" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-solid fa-code mr-1"></i>C
        </button>
        <button data-sec="comparison" class="sec-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeSection === "comparison" ? "bg-purple-600 text-white shadow-md" : "opacity-75 hover:opacity-100"}">
          <i class="fa-solid fa-scale-balanced mr-1"></i>Compare
        </button>
      </div>

      <!-- Main Theory Content Area -->
      <div id="theoryContentMount" class="min-h-[300px]">
        <div class="flex items-center justify-center p-12 text-purple-400">
          <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;

  // Attach tab switching events
  container.querySelectorAll(".sec-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = btn.getAttribute("data-sec");
      navigate("learn", { section: sec });
    });
  });

  const mount = container.querySelector("#theoryContentMount");

  if (selectedLessonId) {
    // Render specific lesson
    try {
      const lesson = await loadLesson(activeSection, selectedLessonId);
      renderLesson(
        mount,
        lesson,
        (nextId) => navigate("learn", { section: activeSection, lesson: nextId }),
        () => navigate("learn", { section: activeSection })
      );
    } catch (err) {
      mount.innerHTML = `
        <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold">Lesson Temporarily Unavailable</h3>
            <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
            <p class="text-[11px] opacity-70">Other curriculum lessons remain fully accessible.</p>
          </div>
          <div class="flex items-center justify-center space-x-2 pt-2">
            <button id="btnRetryLesson" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
              <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
            </button>
            <button id="btnBackFallback" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all hover:border-purple-500/30 cursor-pointer">
              <i class="fa-solid fa-arrow-left mr-1.5"></i>Back to Modules
            </button>
          </div>
        </div>
      `;
      const retryBtn = mount.querySelector("#btnRetryLesson");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => renderLearnPage(container, params));
      }
      const fbBtn = mount.querySelector("#btnBackFallback");
      if (fbBtn) {
        fbBtn.addEventListener("click", () => navigate("learn", { section: activeSection }));
      }
    }
  } else {
    // Render module list
    try {
      const modules = await loadModules(activeSection);
      renderModuleList(
        mount,
        activeSection,
        modules,
        (lessonId) => navigate("learn", { section: activeSection, lesson: lessonId }),
        async (searchQuery) => {
          if (!searchQuery) {
            renderModuleList(
              mount,
              activeSection,
              modules,
              (lessonId) => navigate("learn", { section: activeSection, lesson: lessonId })
            );
            return;
          }
          const results = await searchSection(activeSection, searchQuery);
          renderSearchResults(mount, results, activeSection);
        }
      );
    } catch (err) {
      mount.innerHTML = `
        <div class="glass-card p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl">
            <i class="fa-solid fa-circle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold">Unable to Load Modules</h3>
            <p class="text-xs text-rose-400">${escapeHtml(err.message)}</p>
          </div>
          <div class="flex items-center justify-center space-x-2 pt-2">
            <button id="btnRetryModules" class="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
              <i class="fa-solid fa-rotate-right mr-1.5"></i>Retry
            </button>
            <button id="btnHomeFallback" class="py-2 px-4 rounded-xl sub-card text-xs font-bold transition-all cursor-pointer">
              Return Home
            </button>
          </div>
        </div>
      `;
      const retryBtn = mount.querySelector("#btnRetryModules");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => renderLearnPage(container, params));
      }
      const homeBtn = mount.querySelector("#btnHomeFallback");
      if (homeBtn) {
        homeBtn.addEventListener("click", () => navigate("home"));
      }
    }
  }
}

function renderSearchResults(container, results, section) {
  const containerList = container.querySelector("#modulesAccordionContainer");
  if (!containerList) return;

  if (results.length === 0) {
    containerList.innerHTML = `
      <div class="glass-card p-6 rounded-2xl text-center space-y-2">
        <i class="fa-solid fa-magnifying-glass text-gray-500 text-xl"></i>
        <p class="text-xs opacity-75">No lessons found matching your query.</p>
      </div>
    `;
    return;
  }

  containerList.innerHTML = `
    <div class="space-y-2">
      <div class="text-[11px] font-bold opacity-75 px-1">${results.length} Search Matches:</div>
      ${results.map(lesson => `
        <button data-search-lesson="${lesson.id}" class="w-full p-3 rounded-2xl sub-card flex items-center justify-between text-left hover:border-purple-500/40 hover:translate-x-1 transition-all cursor-pointer">
          <div>
            <div class="text-xs font-bold">${escapeHtml(lesson.title)}</div>
            <div class="text-[10px] text-purple-400 mt-0.5">${escapeHtml(lesson.module || lesson.topic || "")}</div>
          </div>
          <i class="fa-solid fa-arrow-right text-xs opacity-60"></i>
        </button>
      `).join("")}
    </div>
  `;

  containerList.querySelectorAll("[data-search-lesson]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-search-lesson");
      navigate("learn", { section, lesson: id });
    });
  });
}

export {
  loadAllLessons,
  loadLesson,
  goToNextLesson,
  goToPreviousLesson,
  searchSection,
  searchAllSections
};
