// MultitaskCoder
// Module: Progress Bars & XP Display

/**
 * Generates an SVG circular progress ring HTML string.
 * Circumference = 2 * PI * r = 2 * 3.14159 * 20 = 125.66
 */
export function renderProgressRing(percentage = 0, colorClass = "text-emerald-400", size = 48) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));
  const offset = circumference - (pct / 100) * circumference;

  return `
    <div class="relative flex items-center justify-center shrink-0" style="width: ${size}px; height: ${size}px;">
      <svg class="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r="${radius}" stroke="currentColor" stroke-width="3.5" class="opacity-20 text-gray-500" fill="transparent"/>
        <circle cx="24" cy="24" r="${radius}" stroke="currentColor" stroke-width="3.5" class="${colorClass}" stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" stroke-linecap="round" fill="transparent"/>
      </svg>
      <span class="absolute text-[11px] font-bold ${colorClass}">${pct}%</span>
    </div>
  `;
}

/**
 * Generates a linear progress bar HTML string.
 */
export function renderLinearBar(percentage = 0, gradientClass = "from-purple-600 to-indigo-500", height = "h-2.5") {
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));
  return `
    <div class="w-full ${height} bg-black/10 dark:bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/5">
      <div class="h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
    </div>
  `;
}

/**
 * Computes language progress percentage dynamically from state.
 */
export function calculateLanguageProgress(language, state) {
  if (!state) return 0;
  const prefix = language.toLowerCase();
  
  // Count completed items belonging to this language
  const completedTyping = (state.completedTyping || []).filter(id => id.startsWith(prefix)).length;
  const completedQuizzes = (state.completedQuizzes || []).filter(id => id.includes(prefix)).length;
  const completedDebugger = (state.completedDebugger || []).filter(id => id.includes(prefix)).length;
  const completedLessons = (state.completedLessons || []).filter(id => id.startsWith(prefix)).length;

  const totalCompleted = completedTyping + completedQuizzes + completedDebugger + completedLessons;
  // If no items completed yet, provide engaging default starter percentages (e.g. 75% Python, 60% Java, 40% C as in prototype, or dynamic if completed)
  if (totalCompleted === 0) {
    if (prefix === "python") return 75;
    if (prefix === "java") return 60;
    if (prefix === "c") return 40;
  }

  // Otherwise calculate out of total drills (~50 typing + ~50 quiz + ~50 debug + ~30 lessons = ~180 items)
  return Math.min(100, Math.max(5, Math.round((totalCompleted / 180) * 100)));
}
