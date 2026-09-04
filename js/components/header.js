// MultitaskCoder
// Module: Header Component

import { getState, subscribe, toggleTheme } from "../state.js";
import { navigate } from "../router.js";
import { openMenu } from "./sidebar.js";

/**
 * Creates and mounts the sticky top navigation header.
 */
export function createHeader() {
  const currentState = getState();
  const header = document.createElement("header");
  header.className = "sticky top-0 z-40 glass-card px-4 py-3 flex items-center justify-between border-b backdrop-blur-md transition-all duration-300";
  header.innerHTML = `
    <div class="flex items-center space-x-3">
      <button id="headerMenuBtn" aria-label="Open Navigation Drawer" class="opacity-80 hover:opacity-100 p-1 text-xl transition-transform active:scale-95 cursor-pointer">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div id="headerLogo" class="flex items-center space-x-2 cursor-pointer group">
        <div class="bg-gradient-to-tr from-purple-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg glow-purple group-hover:rotate-6 transition-transform">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <span class="font-extrabold text-lg bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">MultitaskCoder</span>
      </div>
    </div>
    <div class="flex items-center space-x-2.5">
      <!-- Theme Toggle Button -->
      <button id="themeToggleBtn" class="w-9 h-9 rounded-full sub-card flex items-center justify-center text-purple-400 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer" title="Toggle Theme">
        <i class="fa-solid ${currentState.theme === "dark" ? "fa-moon" : "fa-sun"} transition-transform duration-500" id="themeIcon"></i>
      </button>

      <!-- Streak Badge -->
      <div class="flex items-center space-x-1.5 sub-card px-2.5 py-1 rounded-full text-xs font-bold text-orange-400 shadow-sm" title="Day Streak">
        <i class="fa-solid fa-fire text-orange-500 animate-bounce"></i>
        <span id="streakCount">${currentState.streak}</span>
      </div>

      <!-- Gems Badge -->
      <div class="flex items-center space-x-1.5 sub-card px-2.5 py-1 rounded-full text-xs font-bold text-purple-400 shadow-sm" title="Gems">
        <i class="fa-solid fa-gem text-purple-400 animate-pulse"></i>
        <span id="gemCount">${currentState.gems}</span>
      </div>

      <!-- Avatar Profile Link -->
      <button id="headerAvatarBtn" class="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer" title="Your Profile">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" class="w-full h-full object-cover rounded-full">
      </button>
    </div>
  `;

  // Attach event handlers
  const menuBtn = header.querySelector("#headerMenuBtn");
  if (menuBtn) menuBtn.addEventListener("click", openMenu);

  const logoBtn = header.querySelector("#headerLogo");
  if (logoBtn) logoBtn.addEventListener("click", () => navigate("home"));

  const avatarBtn = header.querySelector("#headerAvatarBtn");
  if (avatarBtn) avatarBtn.addEventListener("click", () => navigate("profile"));

  const themeBtn = header.querySelector("#themeToggleBtn");
  const themeIcon = header.querySelector("#themeIcon");
  if (themeBtn && themeIcon) {
    themeBtn.addEventListener("click", () => {
      themeIcon.style.transform = "rotate(360deg)";
      setTimeout(() => {
        themeIcon.style.transform = "rotate(0deg)";
      }, 300);
      toggleTheme();
    });
  }

  // Subscribe to live state changes
  subscribe("themeChanged", (theme) => {
    if (themeIcon) {
      if (theme === "dark") {
        themeIcon.className = "fa-solid fa-moon transition-transform duration-500";
      } else {
        themeIcon.className = "fa-solid fa-sun transition-transform duration-500";
      }
    }
  });

  subscribe("gemsChanged", (data) => {
    const gemEl = document.getElementById("gemCount");
    if (gemEl) gemEl.innerText = data.gems;
  });

  subscribe("statsChanged", (st) => {
    const streakEl = document.getElementById("streakCount");
    if (streakEl) streakEl.innerText = st.streak;
    const gemEl = document.getElementById("gemCount");
    if (gemEl) gemEl.innerText = st.gems;
  });

  return header;
}
