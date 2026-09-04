// MultitaskCoder
// Module: Home Page

import { getState, solveDailyChallenge } from "../state.js";
import { navigate } from "../router.js";
import { openModal } from "../components/modal.js";
import { calculateLanguageProgress, renderProgressRing } from "../components/progress.js";

/**
 * Renders the Home page matching project interface.html
 */
export async function renderHomePage(container) {
  const state = getState();

  const pythonProgress = calculateLanguageProgress("python", state);
  const javaProgress = calculateLanguageProgress("java", state);
  const cProgress = calculateLanguageProgress("c", state);

  const xpPercent = Math.min(100, Math.round(((state.xp % 1000) / 1000) * 100));
  const xpToGo = 1000 - (state.xp % 1000);

  container.innerHTML = `
    <div id="tab-home-view" class="tab-content active space-y-6 animate-[fadeInScale_0.3s_ease_forwards]">
      <!-- Hero Section -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#15122b] via-[#10101d] to-[#090a10] border border-purple-500/20 p-6 shadow-2xl text-white">
        <div class="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="absolute bottom-0 right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 space-y-4">
          <div class="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-[11px] font-semibold text-purple-300">
            <i class="fa-solid fa-sparkles text-amber-400"></i>
            <span>Version 3.4 Live Studio</span>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight leading-tight">
            Learn. Build. <br>
            <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">Master.</span>
          </h1>
          <p class="text-xs text-gray-300 max-w-[240px] leading-relaxed">
            Your all-in-one platform to learn syntax, test algorithms, and build real-world software.
          </p>

          <!-- Category Icons Pills -->
          <div class="flex items-center justify-between pt-2">
            <div data-pill-route="learn" class="flex flex-col items-center space-y-1 cursor-pointer group">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <i class="fa-solid fa-book-open text-sm"></i>
              </div>
              <span class="text-[10px] text-gray-300 font-medium">Theory</span>
            </div>
            <div data-pill-route="typing" class="flex flex-col items-center space-y-1 cursor-pointer group">
              <div class="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <i class="fa-solid fa-code text-sm"></i>
              </div>
              <span class="text-[10px] text-gray-300 font-medium">Code</span>
            </div>
            <div data-pill-route="debugger" class="flex flex-col items-center space-y-1 cursor-pointer group">
              <div class="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <i class="fa-solid fa-bug text-sm"></i>
              </div>
              <span class="text-[10px] text-gray-300 font-medium">Debug</span>
            </div>
            <div data-pill-route="typing" class="flex flex-col items-center space-y-1 cursor-pointer group">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <i class="fa-solid fa-bolt text-sm"></i>
              </div>
              <span class="text-[10px] text-gray-300 font-medium">Typing</span>
            </div>
            <div data-pill-route="quizzes" class="flex flex-col items-center space-y-1 cursor-pointer group">
              <div class="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <i class="fa-solid fa-bullseye text-sm"></i>
              </div>
              <span class="text-[10px] text-gray-300 font-medium">Quizzes</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 space-y-2.5">
            <button id="heroStartLearningBtn" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-bold text-sm text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer">
              <i class="fa-solid fa-rocket animate-pulse"></i>
              <span>Start Learning</span>
            </button>
            <button id="heroInstallPwaBtn" class="w-full py-3 px-4 rounded-2xl sub-card font-semibold text-xs text-white flex items-center justify-center space-x-2 hover:bg-white/5 active:scale-[0.98] transition-all border border-white/10 cursor-pointer">
              <i class="fa-solid fa-mobile-screen"></i>
              <span>Install PWA App</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Quick Stats Grid -->
      <section class="grid grid-cols-5 gap-2">
        <div data-pill-route="learn" class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <div class="text-emerald-400 mb-1"><i class="fa-solid fa-book-bookmark text-xs"></i></div>
          <div class="text-sm font-extrabold">120+</div>
          <div class="text-[9px] opacity-75">Lessons</div>
        </div>
        <div data-pill-route="typing" class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <div class="text-purple-400 mb-1"><i class="fa-solid fa-laptop-code text-xs"></i></div>
          <div class="text-sm font-extrabold">150+</div>
          <div class="text-[9px] opacity-75">Drills</div>
        </div>
        <div data-pill-route="debugger" class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <div class="text-rose-400 mb-1"><i class="fa-solid fa-spider text-xs"></i></div>
          <div class="text-sm font-extrabold">150+</div>
          <div class="text-[9px] opacity-75">Debug</div>
        </div>
        <div data-pill-route="quizzes" class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <div class="text-amber-400 mb-1"><i class="fa-solid fa-award text-xs"></i></div>
          <div class="text-sm font-extrabold">150+</div>
          <div class="text-[9px] opacity-75">Quizzes</div>
        </div>
        <div data-pill-route="profile" class="glass-card p-2.5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <div class="text-blue-400 mb-1"><i class="fa-solid fa-chart-pie text-xs"></i></div>
          <div class="text-sm font-extrabold">${state.level}</div>
          <div class="text-[9px] opacity-75">Level</div>
        </div>
      </section>

      <!-- Choose Your Language Section -->
      <section class="space-y-4">
        <div class="flex items-center justify-center space-x-3 my-2">
          <div class="h-px bg-gradient-to-r from-transparent to-purple-500/50 w-16"></div>
          <span class="text-xs font-bold uppercase tracking-wider text-purple-400">Choose Your Language</span>
          <div class="h-px bg-gradient-to-l from-transparent to-purple-500/50 w-16"></div>
        </div>

        <!-- Python Card -->
        <div data-track="python" class="language-card glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div class="flex justify-between items-start">
            <div class="flex space-x-3.5">
              <div class="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-python"></i>
              </div>
              <div>
                <h3 class="font-bold text-base">Python</h3>
                <p class="text-xs opacity-75 mt-0.5 max-w-[170px]">Easy to learn, powerful and in-demand.</p>
              </div>
            </div>
            ${renderProgressRing(pythonProgress, "text-emerald-400", 48)}
          </div>
          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
            <button data-action-nav="learn" data-lang="python" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-book text-emerald-400 text-[10px]"></i>
              <span>Theory</span>
            </button>
            <button data-action-nav="typing" data-lang="python" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-laptop-code text-purple-400 text-[10px]"></i>
              <span>Programs</span>
            </button>
            <button data-action-nav="quizzes" data-lang="python" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
              <span>Quiz</span>
            </button>
          </div>
          <button data-action-nav="typing" data-lang="python" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity cursor-pointer">
            <span>Explore Python Practice</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <!-- Java Card -->
        <div data-track="java" class="language-card glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div class="flex justify-between items-start">
            <div class="flex space-x-3.5">
              <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-java"></i>
              </div>
              <div>
                <h3 class="font-bold text-base">Java</h3>
                <p class="text-xs opacity-75 mt-0.5 max-w-[170px]">Write once, run anywhere.</p>
              </div>
            </div>
            ${renderProgressRing(javaProgress, "text-purple-400", 48)}
          </div>
          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
            <button data-action-nav="learn" data-lang="java" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-book text-emerald-400 text-[10px]"></i>
              <span>Theory</span>
            </button>
            <button data-action-nav="typing" data-lang="java" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-laptop-code text-purple-400 text-[10px]"></i>
              <span>Programs</span>
            </button>
            <button data-action-nav="quizzes" data-lang="java" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
              <span>Quiz</span>
            </button>
          </div>
          <button data-action-nav="typing" data-lang="java" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity cursor-pointer">
            <span>Explore Java Practice</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <!-- C Card -->
        <div data-track="c" class="language-card glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div class="flex justify-between items-start">
            <div class="flex space-x-3.5">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-extrabold shadow-inner group-hover:scale-110 transition-transform">
                C
              </div>
              <div>
                <h3 class="font-bold text-base">C</h3>
                <p class="text-xs opacity-75 mt-0.5 max-w-[170px]">The foundation of modern programming.</p>
              </div>
            </div>
            ${renderProgressRing(cProgress, "text-blue-400", 48)}
          </div>
          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
            <button data-action-nav="learn" data-lang="c" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-book text-emerald-400 text-[10px]"></i>
              <span>Theory</span>
            </button>
            <button data-action-nav="typing" data-lang="c" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-laptop-code text-purple-400 text-[10px]"></i>
              <span>Programs</span>
            </button>
            <button data-action-nav="quizzes" data-lang="c" class="py-2 px-3 rounded-xl sub-card text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-purple-500/10 transition-colors cursor-pointer">
              <i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
              <span>Quiz</span>
            </button>
          </div>
          <button data-action-nav="typing" data-lang="c" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity cursor-pointer">
            <span>Explore C Practice</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </section>

      <!-- Quick Access Section -->
      <section class="space-y-3">
        <div class="flex items-center justify-center space-x-3 my-2">
          <div class="h-px bg-gradient-to-r from-transparent to-purple-500/50 w-16"></div>
          <span class="text-xs font-bold uppercase tracking-wider text-purple-400">Quick Access</span>
          <div class="h-px bg-gradient-to-l from-transparent to-purple-500/50 w-16"></div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div data-pill-route="typing" class="glass-card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all">
            <div class="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
              <i class="fa-solid fa-bolt text-base"></i>
            </div>
            <h4 class="text-xs font-bold">Speed Typing</h4>
            <p class="text-[10px] opacity-75 mt-1 leading-tight">Improve your typing speed</p>
          </div>
          <div data-pill-route="debugger" class="glass-card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all">
            <div class="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
              <i class="fa-solid fa-bug text-base"></i>
            </div>
            <h4 class="text-xs font-bold">Debugger Arena</h4>
            <p class="text-[10px] opacity-75 mt-1 leading-tight">Find bugs and fix the code</p>
          </div>
          <div data-pill-route="quizzes" class="glass-card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <i class="fa-solid fa-bullseye text-base"></i>
            </div>
            <h4 class="text-xs font-bold">Brain Quizzes</h4>
            <p class="text-[10px] opacity-75 mt-1 leading-tight">Test your knowledge</p>
          </div>
          <div data-pill-route="profile" class="glass-card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all">
            <div class="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
              <i class="fa-solid fa-chart-column text-base"></i>
            </div>
            <h4 class="text-xs font-bold">Analytics</h4>
            <p class="text-[10px] opacity-75 mt-1 leading-tight">Track your progress</p>
          </div>
        </div>
      </section>

      <!-- Daily Challenge Card -->
      <section id="dailyChallengeCard" class="glass-card rounded-3xl p-5 border border-purple-500/20 space-y-4 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-fire text-orange-500 animate-bounce"></i>
            <h3 class="font-bold text-sm">Daily Challenge</h3>
          </div>
          <span class="text-xs font-bold text-purple-400">+50 XP</span>
        </div>
        <p class="text-xs opacity-75">Fix the bug in the code</p>

        <div class="code-box rounded-2xl p-3.5 code-font text-xs overflow-x-auto shadow-inner">
          <span class="text-purple-400">for</span>(int i = <span class="text-orange-400">0</span>; i &lt;= <span class="text-orange-400">5</span>; i++) {<br>
          &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-purple-400">if</span>(i == <span class="text-orange-400">3</span>) <span class="text-rose-400">continue</span>;<br>
          &nbsp;&nbsp;&nbsp;&nbsp;printf(<span class="text-emerald-400">"%d "</span>, i);<br>
          }
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <span class="text-emerald-400 font-semibold">Difficulty: Easy</span>
        </div>

        <button id="btnDailyChallenge" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-bold text-xs text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer">
          <span>${state.dailyChallengeDone ? "Challenge Solved Today! ✓" : "Solve Now"}</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </section>

      <!-- Your Progress Card -->
      <section class="glass-card rounded-3xl p-5 border border-purple-500/20 space-y-4 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-sm">Your Progress</h3>
          <span class="bg-purple-500/20 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full text-xs font-extrabold">Level ${state.level}</span>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs font-bold">
            <span class="text-base" id="xpText">${state.xp} <span class="text-xs font-normal opacity-75">/ 1000 XP</span></span>
          </div>
          <div class="w-full h-2.5 bg-black/10 dark:bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div id="xpBar" class="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-700 ease-out" style="width: ${xpPercent}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="sub-card rounded-2xl p-3 flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <i class="fa-solid fa-fire text-lg"></i>
            </div>
            <div>
              <div class="text-lg font-black" id="streakDisplay">${state.streak}</div>
              <div class="text-[10px] opacity-75">Day Streak</div>
            </div>
          </div>
          <div class="sub-card rounded-2xl p-3 flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <i class="fa-solid fa-award text-lg"></i>
            </div>
            <div>
              <div class="text-lg font-black">${state.badgesCount}</div>
              <div class="text-[10px] opacity-75">Badges</div>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-black/5 dark:border-white/5">
          <div class="flex justify-between text-xs opacity-75 mb-1.5">
            <span>Next Milestone</span>
            <span class="text-purple-400 font-semibold" id="xpToGo">${xpToGo} XP to go</span>
          </div>
          <div class="text-xs font-bold mb-2">Reach Level ${state.level + 1}</div>
          <div class="w-full h-1.5 bg-black/10 dark:bg-neutral-900 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-700" style="width: ${xpPercent}%"></div>
          </div>
        </div>
      </section>

      <!-- Footer Section -->
      <footer class="pt-6 pb-4 text-center space-y-4">
        <div class="flex items-center justify-center space-x-2">
          <div class="bg-gradient-to-tr from-purple-600 to-indigo-500 p-1.5 rounded-lg text-white shadow-md">
            <i class="fa-solid fa-code text-xs"></i>
          </div>
          <span class="font-extrabold text-base tracking-tight">MultitaskCoder</span>
        </div>

        <!-- Social Icons Row -->
        <div class="flex items-center justify-center space-x-3">
          <a href="https://linkedin.com" target="_blank" class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            <i class="fa-brands fa-linkedin-in text-sm"></i>
          </a>
          <a href="https://whatsapp.com" target="_blank" class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            <i class="fa-brands fa-whatsapp text-sm"></i>
          </a>
          <a href="https://github.com" target="_blank" class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            <i class="fa-brands fa-github text-sm"></i>
          </a>
          <a href="https://x.com" target="_blank" class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-110 active:scale-95 transition-transform" title="X (Twitter)">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="mailto:contact@multitaskcoder.com" class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            <i class="fa-solid fa-envelope text-sm"></i>
          </a>
        </div>

        <!-- License & Copyright -->
        <div class="space-y-1 text-xs opacity-70">
          <div class="flex items-center justify-center space-x-1.5">
            <i class="fa-regular fa-file-lines"></i>
            <span>Licensed under the MIT License</span>
          </div>
          <div>© 2026 MultitaskCoder. All rights reserved.</div>
        </div>
      </footer>
    </div>
  `;

  // Attach navigation events to pills and cards
  container.querySelectorAll("[data-pill-route]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-pill-route");
      if (target) navigate(target);
    });
  });

  container.querySelectorAll("[data-action-nav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = btn.getAttribute("data-action-nav");
      const lang = btn.getAttribute("data-lang");
      if (target === "learn") {
        navigate("learn", { section: lang });
      } else if (target === "typing") {
        navigate("typing", { lang });
      } else if (target === "quizzes") {
        navigate("quizzes", { lang });
      } else if (target) {
        navigate(target);
      }
    });
  });

  const btnStartLearning = container.querySelector("#heroStartLearningBtn");
  if (btnStartLearning) {
    btnStartLearning.addEventListener("click", () => navigate("learn"));
  }

  const btnInstallPwa = container.querySelector("#heroInstallPwaBtn");
  if (btnInstallPwa) {
    btnInstallPwa.addEventListener("click", () => {
      openModal(
        "Install PWA App",
        "MultitaskCoder is ready to install as a Progressive Web App. Tap 'Add to Home Screen' in your mobile browser options to enjoy offline practice!"
      );
    });
  }

  // Daily Challenge handler
  const btnDaily = container.querySelector("#btnDailyChallenge");
  if (btnDaily) {
    btnDaily.addEventListener("click", () => {
      solveDailyChallenge();
      btnDaily.innerHTML = "<span>Challenge Solved Today! ✓</span>";
      openModal(
        "Challenge Solved! 🎉",
        "You successfully fixed the loop bug! <strong>+50 XP</strong> and <strong>+25 Gems</strong> credited to your account."
      );
      // Re-render home page to reflect updated stats
      renderHomePage(container);
    });
  }
}
