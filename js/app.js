// MultitaskCoder
// Module: Application Entry Point

import { initState, getState, setState, subscribe, emit, resetState, addXP } from "./state.js";
import { registerRoute, initRouter } from "./router.js";
import { createLoader, startLoaderSimulation } from "./components/loader.js";
import { createHeader } from "./components/header.js";
import { createSidebar } from "./components/sidebar.js";
import { createBottomNav } from "./components/bottom-nav.js";
import { createModal } from "./components/modal.js";

// Reusable App Shell Components

/**
 * Initializes and mounts the entire MultitaskCoder application.
 */
function initApp() {
  console.log("[App] Starting MultitaskCoder initApp()...");
  const root = document.getElementById("app");
  if (!root) {
    console.error('[App] Missing root element "#app"');
    return;
  }

  // Global uncaught error & rejection boundaries
  window.addEventListener("error", (event) => {
    console.warn("[App Error Guard Caught]", event.message || event);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("[App Unhandled Rejection Guard Caught]", event.reason);
  });

  // 1. Initialize reactive state and load user progress
  initState();

  window.__MTC__ = {
    getState,
    setState,
    subscribe,
    emit,
    resetState,
    addXP
  };

  // 2. Mount application shell components
  root.innerHTML = "";

  // 3D Loader simulation
  const loaderEl = createLoader();
  root.appendChild(loaderEl);

  // Sticky top header
  const headerEl = createHeader();
  root.appendChild(headerEl);

  // Slide-out drawer menu + overlay
  const sidebarEl = createSidebar();
  root.appendChild(sidebarEl);

  // Dynamic main page container
  const mainContainer = document.createElement("main");
  mainContainer.id = "main-content";
  mainContainer.className = "max-w-md mx-auto px-4 pt-6 space-y-6";
  root.appendChild(mainContainer);

  // Sticky bottom navigation bar
  const bottomNavEl = createBottomNav();
  root.appendChild(bottomNavEl);

  // Reusable modal popup
  const modalEl = createModal();
  root.appendChild(modalEl);

  // 3. Register route view handlers with on-demand lazy loading
  registerRoute("home", async (container, params) => {
    const { renderHomePage } = await import("./pages/home.js");
    return renderHomePage(container, params);
  });
  registerRoute("learn", async (container, params) => {
    const { renderLearnPage } = await import("./pages/learn.js");
    return renderLearnPage(container, params);
  });
  registerRoute("typing", async (container, params) => {
    const { renderTypingPage } = await import("./pages/typing.js");
    return renderTypingPage(container, params);
  });
  registerRoute("debugger", async (container, params) => {
    const { renderDebuggerPage } = await import("./pages/debugger.js");
    return renderDebuggerPage(container, params);
  });
  registerRoute("quizzes", async (container, params) => {
    const { renderQuizzesPage } = await import("./pages/quizzes.js");
    return renderQuizzesPage(container, params);
  });
  registerRoute("profile", async (container, params) => {
    const { renderProfilePage } = await import("./pages/profile.js");
    return renderProfilePage(container, params);
  });
  registerRoute("code", async (container, params) => {
    const { renderSandboxPlaceholder } = await import("./features/sandbox/sandbox-placeholder.js");
    return renderSandboxPlaceholder(container, params);
  });
  registerRoute("sandbox", async (container, params) => {
    const { renderSandboxPlaceholder } = await import("./features/sandbox/sandbox-placeholder.js");
    return renderSandboxPlaceholder(container, params);
  });

  // 4. Initialize hash router (renders active route view)
  initRouter();

  // 5. Start Three.js 3D loading simulation
  startLoaderSimulation();

  // 6. Register Service Worker for PWA offline capabilities
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("[App] ServiceWorker registration skipped/failed:", err);
      });
    });
  }
}

// Bootstrap when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
