// MultitaskCoder
// Module: Bottom Navigation Bar

import { navigate } from "../router.js";
import { subscribe } from "../state.js";

/**
 * Creates and mounts the sticky bottom navigation bar.
 */
export function createBottomNav() {
  const nav = document.createElement("nav");
  nav.id = "appBottomNav";
  nav.className = "fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-card px-4 py-3 flex items-center justify-between border-t z-40 rounded-t-3xl shadow-2xl";
  nav.innerHTML = `
    <button data-nav="home" id="nav-home" class="flex flex-col items-center space-y-1 text-purple-500 hover:scale-110 active:scale-95 transition-all cursor-pointer">
      <i class="fa-solid fa-house text-base"></i>
      <span class="text-[10px] font-semibold">Home</span>
    </button>
    <button data-nav="learn" id="nav-learn" class="flex flex-col items-center space-y-1 opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer">
      <i class="fa-solid fa-book-open text-base"></i>
      <span class="text-[10px] font-semibold">Learn</span>
    </button>
    <button data-nav="typing" id="nav-code" class="relative -top-5 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xl glow-btn hover:scale-110 active:scale-90 transition-transform cursor-pointer" title="Code Drills">
      <i class="fa-solid fa-code text-xl"></i>
    </button>
    <button data-nav="quizzes" id="nav-quizzes" class="flex flex-col items-center space-y-1 opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer">
      <i class="fa-solid fa-trophy text-base"></i>
      <span class="text-[10px] font-semibold">Quizzes</span>
    </button>
    <button data-nav="profile" id="nav-profile" class="flex flex-col items-center space-y-1 opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer">
      <i class="fa-solid fa-user text-base"></i>
      <span class="text-[10px] font-semibold">Profile</span>
    </button>
  `;

  // Attach click listeners to navigation buttons
  nav.querySelectorAll("button[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-nav");
      if (target) navigate(target);
    });
  });

  // Highlight active route when router triggers routeChanged
  subscribe("routeChanged", ({ route }) => {
    updateActiveNav(route);
  });

  return nav;
}

/**
 * Updates the visual active state on bottom nav items.
 */
export function updateActiveNav(activeRoute) {
  const items = ["home", "learn", "quizzes", "profile"];
  items.forEach((item) => {
    const el = document.getElementById(`nav-${item}`);
    if (el) {
      if (activeRoute === item) {
        el.classList.remove("opacity-60");
        el.classList.add("text-purple-500");
      } else {
        el.classList.remove("text-purple-500");
        el.classList.add("opacity-60");
      }
    }
  });

  const centerBtn = document.getElementById("nav-code");
  if (centerBtn) {
    if (activeRoute === "typing" || activeRoute === "debugger" || activeRoute === "sandbox") {
      centerBtn.classList.add("ring-4", "ring-purple-500/30");
    } else {
      centerBtn.classList.remove("ring-4", "ring-purple-500/30");
    }
  }
}
