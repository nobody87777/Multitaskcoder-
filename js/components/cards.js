// MultitaskCoder
// Module: Card UI Elements

import { renderProgressRing } from "./progress.js";

/**
 * Renders a Language card matching project interface.html
 */
export function renderLanguageCard({
  language,
  name,
  iconHtml,
  subtitle,
  progressPct = 0,
  ringColor = "text-emerald-400",
  exploreButtonGradient = "from-purple-600 to-indigo-700"
}) {
  return `
    <div class="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all" data-lang-card="${language}">
      <div class="flex justify-between items-start">
        <div class="flex space-x-3.5 items-center">
          ${iconHtml}
          <div>
            <h3 class="font-bold text-base">${name}</h3>
            <p class="text-xs opacity-75 mt-0.5 max-w-[170px]">${subtitle}</p>
          </div>
        </div>
        ${renderProgressRing(progressPct, ringColor, 48)}
      </div>

      <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
        <button data-action="theory" data-lang="${language}" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
          <i class="fa-solid fa-book text-emerald-400 text-[10px]"></i>
          <span>Theory</span>
        </button>
        <button data-action="typing" data-lang="${language}" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
          <i class="fa-solid fa-laptop-code text-purple-400 text-[10px]"></i>
          <span>Programs</span>
        </button>
        <button data-action="quiz" data-lang="${language}" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
          <i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
          <span>Quiz</span>
        </button>
      </div>

      <button data-action="explore" data-lang="${language}" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r ${exploreButtonGradient} text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity cursor-pointer">
        <span>Explore ${name} Practice</span>
        <i class="fa-solid fa-arrow-right text-[10px]"></i>
      </button>
    </div>
  `;
}

/**
 * Renders a Quick Access square card.
 */
export function renderQuickAccessCard({ id, iconClass, colorClass, title, subtitle }) {
  return `
    <div data-quick-access="${id}" class="glass-card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all">
      <div class="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center ${colorClass} mb-2">
        <i class="${iconClass} text-base"></i>
      </div>
      <h4 class="text-xs font-bold">${title}</h4>
      <p class="text-[10px] opacity-75 mt-1 leading-tight">${subtitle}</p>
    </div>
  `;
}

/**
 * Renders a Quick Stat pill card for the 5-grid on Home.
 */
export function renderQuickStatPill({ iconClass, colorClass, value, label }) {
  return `
    <div class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
      <div class="${colorClass} mb-1"><i class="${iconClass} text-xs"></i></div>
      <div class="text-sm font-extrabold">${value}</div>
      <div class="text-[9px] opacity-75">${label}</div>
    </div>
  `;
}
