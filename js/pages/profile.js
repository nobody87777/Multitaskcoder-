// MultitaskCoder
// Module: Profile Page

import { getState, resetState, toggleTheme, calculateUnlockedBadgeIds } from "../state.js";
import { BADGES } from "../constants.js";
import { openModal } from "../components/modal.js";
import { escapeHtml } from "../utils.js";

/**
 * Renders the User Profile page matching project interface.html
 */
export async function renderProfilePage(container) {
  const state = getState();
  const unlockedBadges = new Set(calculateUnlockedBadgeIds(state));

  const typingCount = (state.completedTyping || []).length;
  const quizCount = (state.completedQuizzes || []).length;
  const debugCount = (state.completedDebugger || []).length;
  const lessonCount = (state.completedLessons || []).length;

  container.innerHTML = `
    <div id="tab-profile-view" class="tab-content active space-y-5 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Main Profile Card -->
      <div class="glass-card rounded-3xl p-6 border border-purple-500/30 space-y-5 text-center shadow-xl">
        <div class="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1 shadow-xl">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" alt="Avatar" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.src='assets/icons/icon-192.png';">
        </div>
        <div>
          <h2 class="text-base font-bold">${state.xp === 0 ? "You (New Coder)" : "You (Master Coder)"}</h2>
          <p class="text-xs text-purple-400 font-semibold mt-0.5">${state.xp === 0 ? "Level 1 • Ready to Learn" : `Level ${state.level} Software Engineer`}</p>
        </div>

        <!-- Primary Stat Grid -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          <div class="sub-card p-3 rounded-2xl">
            <div class="text-sm font-black text-purple-400" id="profileXp">${state.xp}</div>
            <div class="text-[10px] opacity-75">Total XP</div>
          </div>
          <div class="sub-card p-3 rounded-2xl">
            <div class="text-sm font-black text-orange-400" id="profileStreak">${state.streak}</div>
            <div class="text-[10px] opacity-75">Streak</div>
          </div>
          <div class="sub-card p-3 rounded-2xl">
            <div class="text-sm font-black text-yellow-400">${state.badgesCount}</div>
            <div class="text-[10px] opacity-75">Badges</div>
          </div>
        </div>

        <!-- Secondary Learning Breakdown -->
        <div class="grid grid-cols-4 gap-2 pt-1 text-center">
          <div class="sub-card p-2 rounded-xl">
            <div class="text-xs font-bold text-emerald-400">${lessonCount}</div>
            <div class="text-[9px] opacity-70">Lessons</div>
          </div>
          <div class="sub-card p-2 rounded-xl">
            <div class="text-xs font-bold text-amber-400">${typingCount}</div>
            <div class="text-[9px] opacity-70">Drills</div>
          </div>
          <div class="sub-card p-2 rounded-xl">
            <div class="text-xs font-bold text-rose-400">${debugCount}</div>
            <div class="text-[9px] opacity-70">Bugs</div>
          </div>
          <div class="sub-card p-2 rounded-xl">
            <div class="text-xs font-bold text-cyan-400">${quizCount}</div>
            <div class="text-[9px] opacity-70">Quizzes</div>
          </div>
        </div>

        <!-- Level Progress Bar -->
        <div class="space-y-1.5 text-left pt-1">
          <div class="flex justify-between text-[10px] font-bold">
            <span class="opacity-75">Level Progress:</span>
            <span class="text-purple-400">${state.xp % 100} / 100 XP to Level ${state.level + 1}</span>
          </div>
          <div class="w-full h-2 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
            <div id="levelProgressBar" class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style="width: ${state.xp % 100}%"></div>
          </div>
        </div>

        <!-- Activity Breakdown Details -->
        <div class="space-y-2 pt-2 text-left border-t border-black/5 dark:border-white/5">
          ${lessonCount === 0 && typingCount === 0 && debugCount === 0 && quizCount === 0 ? `
            <div class="sub-card p-3 rounded-2xl text-center space-y-1 border border-purple-500/20">
              <p class="text-xs font-bold text-purple-400">Start learning</p>
              <p class="text-[10px] opacity-75">No progress yet. Practice your first typing drill, debug a challenge, or read a theory lesson to earn XP!</p>
            </div>
          ` : ""}
          <div class="sub-card p-3 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-keyboard"></i>
              </div>
              <div>
                <div class="font-bold text-[11px]">Typing Drills</div>
                <div class="text-[9px] opacity-70">Best Speed: ${state.typingStats?.bestWpm || 0} WPM • ${(state.typingStats?.totalCharsTyped || 0).toLocaleString()} characters typed</div>
              </div>
            </div>
            <span class="text-xs font-black text-amber-400">${typingCount} Drills</span>
          </div>

          <div class="sub-card p-3 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div>
                <div class="font-bold text-[11px]">Quiz Scores &amp; Accuracy</div>
                <div class="text-[9px] opacity-70">Score: ${state.quizStats?.totalCorrect || quizCount} / ${state.quizStats?.quizzesCompleted || quizCount} correct (${quizCount > 0 ? Math.round(((state.quizStats?.totalCorrect || quizCount) / Math.max(1, state.quizStats?.quizzesCompleted || quizCount)) * 100) : 100}% accuracy)</div>
              </div>
            </div>
            <span class="text-xs font-black text-cyan-400">${quizCount} Quizzes</span>
          </div>

          <div class="sub-card p-3 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-bug"></i>
              </div>
              <div>
                <div class="font-bold text-[11px]">Debugger Arena Statistics</div>
                <div class="text-[9px] opacity-70">${state.debuggerStats?.bugsFixed || debugCount} logic bugs diagnosed &amp; patched in Python, Java, C</div>
              </div>
            </div>
            <span class="text-xs font-black text-rose-400">${debugCount} Bugs</span>
          </div>

          <div class="sub-card p-3 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <div>
                <div class="font-bold text-[11px]">Theory Curriculum Lessons</div>
                <div class="text-[9px] opacity-70">Python, Java, C &amp; Language Comparison tracks</div>
              </div>
            </div>
            <span class="text-xs font-black text-emerald-400">${lessonCount} Lessons</span>
          </div>
        </div>

        <button id="btnProfileSettings" class="w-full py-3 rounded-2xl sub-card text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer">
          Account Settings
        </button>
      </div>

      <!-- Badges Showcase -->
      <div class="glass-card rounded-3xl p-5 border border-purple-500/20 space-y-3 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-award text-yellow-400"></i>
            <h3 class="font-bold text-sm">Achievements &amp; Badges</h3>
          </div>
          <span class="text-xs opacity-75 font-semibold">${state.badgesCount} / ${BADGES.length}</span>
        </div>

        <div class="grid grid-cols-3 gap-2.5 pt-1">
          ${BADGES.map((b) => {
            const isUnlocked = unlockedBadges.has(b.id);
            return `
            <div data-badge-id="${b.id}" class="badge-item sub-card p-3 rounded-2xl flex flex-col items-center text-center space-y-1 hover:border-purple-500/30 transition-all cursor-pointer ${isUnlocked ? 'border-purple-500/30 shadow-sm' : 'opacity-40 grayscale'}">
              <div class="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center ${b.color} text-sm relative">
                <i class="fa-solid ${b.icon}"></i>
                ${isUnlocked ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white"><i class="fa-solid fa-check"></i></div>' : ''}
              </div>
              <span class="text-[11px] font-bold leading-tight">${escapeHtml(b.name)}</span>
              <span class="text-[9px] opacity-60 leading-tight">${escapeHtml(b.desc)}</span>
            </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Settings & Data Management -->
      <div class="glass-card rounded-3xl p-5 border border-purple-500/20 space-y-3 shadow-xl">
        <h3 class="font-bold text-sm">Preferences &amp; Data</h3>
        
        <div class="space-y-2">
          <button id="btnToggleThemeProfile" class="w-full p-3 rounded-2xl sub-card flex items-center justify-between text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-circle-half-stroke text-purple-400"></i>
              <span>Theme: ${state.theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <span class="text-[11px] text-purple-400 font-bold">Toggle</span>
          </button>

          <button id="btnResetAllData" class="w-full p-3 rounded-2xl sub-card flex items-center justify-between text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-trash text-rose-400"></i>
              <span>Reset Practice Progress</span>
            </div>
            <span class="text-[11px] font-bold">Reset</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach badge click listeners
  container.querySelectorAll(".badge-item").forEach((el) => {
    el.addEventListener("click", () => {
      const bId = el.getAttribute("data-badge-id");
      const badge = BADGES.find(b => b.id === bId);
      const isUnlocked = unlockedBadges.has(bId);
      if (badge) {
        openModal(
          `Badge: ${badge.name}`,
          `<div class="text-center space-y-2">
            <div class="w-14 h-14 mx-auto rounded-2xl ${isUnlocked ? 'bg-purple-500/20' : 'bg-white/5'} flex items-center justify-center ${isUnlocked ? badge.color : 'text-gray-400'} text-2xl mb-2">
              <i class="fa-solid ${badge.icon}"></i>
            </div>
            <p class="font-bold text-xs text-white">${escapeHtml(badge.desc)}</p>
            <p class="text-[11px] ${isUnlocked ? 'text-emerald-400 font-bold' : 'text-purple-400 font-semibold'}">
              <i class="fa-solid ${isUnlocked ? 'fa-circle-check' : 'fa-lock'} mr-1"></i>
              ${isUnlocked ? 'Unlocked &amp; Earned!' : 'Locked — Complete requirement to unlock!'}
            </p>
          </div>`
        );
      }
    });
  });

  // Attach button listeners
  const btnSettings = container.querySelector("#btnProfileSettings");
  if (btnSettings) {
    btnSettings.addEventListener("click", () => {
      openModal(
        "Account Settings",
        "MultitaskCoder Studio is operating in local offline mode. Progress is safely saved to your browser's persistent storage."
      );
    });
  }

  const btnTheme = container.querySelector("#btnToggleThemeProfile");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      toggleTheme();
      renderProfilePage(container);
    });
  }

  const btnReset = container.querySelector("#btnResetAllData");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      openModal(
        "Reset All Progress?",
        "Are you sure you want to reset your local progress, completed drills, and XP counters? This action cannot be undone.",
        "Confirm Reset",
        () => {
          resetState();
          renderProfilePage(container);
        }
      );
    });
  }
}

