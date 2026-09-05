// MultitaskCoder
// Module: Slide-Out Navigation Drawer

import { navigate } from "../router.js";
import { openModal } from "./modal.js";

/**
 * Opens the slide-out navigation menu.
 */
export function openMenu() {
  const overlay = document.getElementById("slideMenuOverlay");
  const drawer = document.getElementById("slideMenuDrawer");
  if (!overlay || !drawer) return;

  overlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    drawer.classList.remove("-translate-x-full");
    drawer.classList.add("menu-open");
  });
}

/**
 * Closes the slide-out navigation menu.
 */
export function closeMenu() {
  const overlay = document.getElementById("slideMenuOverlay");
  const drawer = document.getElementById("slideMenuDrawer");
  if (!overlay || !drawer) return;

  drawer.classList.remove("menu-open");
  drawer.classList.add("-translate-x-full");
  overlay.classList.add("opacity-0");
  setTimeout(() => {
    overlay.classList.add("hidden");
  }, 300);
}

/**
 * Creates and returns the Slide-Out Menu elements (overlay + drawer).
 */
export function createSidebar() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <!-- Slide-Out Overlay -->
    <div id="slideMenuOverlay" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md hidden opacity-0 transition-opacity duration-300"></div>

    <!-- Slide-Out Drawer -->
    <div id="slideMenuDrawer" class="fixed top-0 bottom-0 left-0 z-50 w-72 glass-card border-r border-purple-500/25 transform -translate-x-full transition-transform duration-400 cubic-bezier(0.16, 1, 0.3, 1) p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="bg-gradient-to-tr from-purple-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg glow-purple">
              <i class="fa-solid fa-code text-sm"></i>
            </div>
            <span class="font-extrabold text-base tracking-tight">Navigation</span>
          </div>
          <button id="closeDrawerBtn" aria-label="Close Navigation Drawer" class="w-10 h-10 rounded-full sub-card flex items-center justify-center opacity-75 hover:opacity-100 hover:rotate-90 transition-all cursor-pointer">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Menu Links -->
        <div id="menuLinksContainer" class="space-y-2 text-sm font-semibold">
          <button data-route="learn" class="menu-item-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-book-bookmark text-xs"></i>
            </div>
            <span>Theory Reference</span>
          </button>

          <button data-route="typing" class="menu-item-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-bolt text-xs"></i>
            </div>
            <span>Speed Typing</span>
          </button>

          <button data-route="debugger" class="menu-item-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-bug text-xs"></i>
            </div>
            <span>Debugger Arena</span>
          </button>

          <button data-route="quizzes" class="menu-item-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-bullseye text-xs"></i>
            </div>
            <span>Brain Quizzes</span>
          </button>

          <button data-route="profile" class="menu-item-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-chart-line text-xs"></i>
            </div>
            <span>Performance Analytics</span>
          </button>

          <div class="pt-2 pb-1 border-t border-black/5 dark:border-white/5"></div>

          <button data-modal="about" class="menu-modal-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-circle-info text-xs"></i>
            </div>
            <span>About Workspace</span>
          </button>

          <button data-modal="contact" class="menu-modal-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-envelope text-xs"></i>
            </div>
            <span>Contact Us</span>
          </button>

          <button data-modal="license" class="menu-modal-link menu-item-animate w-full flex items-center space-x-3.5 p-3 rounded-2xl sub-card hover:border-purple-500/40 hover:translate-x-1.5 transition-all text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-file-shield text-xs"></i>
            </div>
            <span>License Terms</span>
          </button>
        </div>
      </div>

      <div class="text-[11px] opacity-60 text-center pt-4 border-t border-black/5 dark:border-white/5 mt-4">
        MultitaskCoder Studio v3.4
      </div>
    </div>
  `;

  const overlay = wrapper.querySelector("#slideMenuOverlay");
  const closeBtn = wrapper.querySelector("#closeDrawerBtn");

  if (overlay) overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  // Wire up route links
  wrapper.querySelectorAll(".menu-item-link").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const route = btn.getAttribute("data-route");
      closeMenu();
      if (route) navigate(route);
    });
  });

  // Wire up info modals
  wrapper.querySelectorAll(".menu-modal-link").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const modalType = btn.getAttribute("data-modal");
      closeMenu();
      if (modalType === "about") {
        openModal(
          "About Workspace",
          "MultitaskCoder is an all-in-one platform built for modern programmers to learn, build, and master software engineering across Python, Java, and C."
        );
      } else if (modalType === "contact") {
        openModal(
          "Contact Us",
          "Reach out to our support team at contact@multitaskcoder.com for inquiries, partnerships, and feedback."
        );
      } else if (modalType === "license") {
        openModal(
          "License Terms",
          "Licensed under the MIT License. Free for educational and commercial use. MultitaskCoder © 2026."
        );
      }
    });
  });

  return wrapper;
}
