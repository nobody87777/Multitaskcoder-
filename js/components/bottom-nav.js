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
  nav.className = "bottom-nav-bar fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-card px-3 py-2 flex items-center justify-around border-t z-50 rounded-t-3xl shadow-2xl";
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "Main Navigation");

  nav.innerHTML = `
    <!-- Home Navigation Item -->
    <button data-nav="home" id="nav-home" class="bottom-nav-btn active cursor-pointer" aria-label="Home" aria-current="page">
      <span class="nav-icon flex items-center justify-center w-6 h-6">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <i class="fa-solid fa-house text-base" aria-hidden="true" style="display:none;"></i>
      </span>
      <span class="nav-label">Home</span>
    </button>

    <!-- Learn Navigation Item -->
    <button data-nav="learn" id="nav-learn" class="bottom-nav-btn cursor-pointer" aria-label="Learn Theory">
      <span class="nav-icon flex items-center justify-center w-6 h-6">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        <i class="fa-solid fa-book-open text-base" aria-hidden="true" style="display:none;"></i>
      </span>
      <span class="nav-label">Learn</span>
    </button>

    <!-- Center Floating Code Drills Button -->
    <button data-nav="typing" id="nav-code" class="bottom-nav-code-btn glow-btn cursor-pointer" title="Code Drills" aria-label="Practice Code Drills">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
      <i class="fa-solid fa-code text-xl" aria-hidden="true" style="display:none;"></i>
    </button>

    <!-- Quizzes Navigation Item -->
    <button data-nav="quizzes" id="nav-quizzes" class="bottom-nav-btn cursor-pointer" aria-label="Quizzes & Battles">
      <span class="nav-icon flex items-center justify-center w-6 h-6">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
        <i class="fa-solid fa-trophy text-base" aria-hidden="true" style="display:none;"></i>
      </span>
      <span class="nav-label">Quizzes</span>
    </button>

    <!-- Profile Navigation Item -->
    <button data-nav="profile" id="nav-profile" class="bottom-nav-btn cursor-pointer" aria-label="User Profile">
      <span class="nav-icon flex items-center justify-center w-6 h-6">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <i class="fa-solid fa-user text-base" aria-hidden="true" style="display:none;"></i>
      </span>
      <span class="nav-label">Profile</span>
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
        el.classList.add("active");
        el.classList.remove("opacity-60");
        el.setAttribute("aria-current", "page");
      } else {
        el.classList.remove("active");
        el.removeAttribute("aria-current");
      }
    }
  });

  const centerBtn = document.getElementById("nav-code");
  if (centerBtn) {
    if (activeRoute === "typing" || activeRoute === "debugger" || activeRoute === "sandbox") {
      centerBtn.classList.add("ring-4", "ring-purple-500/30", "active-ring");
      centerBtn.setAttribute("aria-current", "page");
    } else {
      centerBtn.classList.remove("ring-4", "ring-purple-500/30", "active-ring");
      centerBtn.removeAttribute("aria-current");
    }
  }
}
