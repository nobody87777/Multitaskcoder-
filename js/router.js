// MultitaskCoder
// Module: Tab/View Router

import { ROUTES } from "./constants.js";
import { emit } from "./state.js";
import { escapeHtml } from "./utils.js";

// Registered routes: routeName -> renderFunction(container, params)
const routes = new Map();
let currentRoute = "";
let currentParams = {};
let routerInitialized = false;

/**
 * Registers a route and its view rendering function.
 */
export function registerRoute(name, renderFn) {
  routes.set(name, renderFn);
}

/**
 * Parses the current location hash into { path, params }.
 * Example: "#learn?section=python&lesson=python-001" -> { path: "learn", params: { section: "python", lesson: "python-001" } }
 */
export function parseHash(hashString = window.location.hash) {
  const clean = (hashString || "").replace(/^#\/?/, "");
  if (!clean) {
    return { path: ROUTES.HOME, params: {} };
  }

  const [pathPart, queryPart] = clean.split("?");
  const path = pathPart.toLowerCase() || ROUTES.HOME;
  const params = {};

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }

  return { path, params };
}

/**
 * Navigates to a specific route with optional query parameters.
 */
export function navigate(path, params = {}) {
  let hash = `#${path}`;
  const keys = Object.keys(params);
  if (keys.length > 0) {
    const searchParams = new URLSearchParams();
    for (const key of keys) {
      searchParams.set(key, params[key]);
    }
    hash += `?${searchParams.toString()}`;
  }

  if (window.location.hash === hash) {
    // If hash is already the same, re-trigger route handling
    handleRouteChange();
  } else {
    window.location.hash = hash;
  }
}

/**
 * Dispatches to the registered route handler and updates the UI.
 */
async function handleRouteChange() {
  const { path, params } = parseHash();
  const container = document.getElementById("main-content");

  // Handle 404 Unknown Route
  if (!routes.has(path)) {
    currentRoute = "404";
    currentParams = params;
    emit("routeChanging", { route: "404", params });

    if (container) {
      container.innerHTML = `
        <div class="glass-card p-8 rounded-3xl text-center space-y-4 shadow-xl border border-purple-500/20 animate-[fadeInScale_0.3s_ease_forwards]">
          <div class="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center text-2xl shadow-inner">
            <i class="fa-solid fa-compass-drafting"></i>
          </div>
          <div>
            <h2 class="text-base font-bold">Page Not Found</h2>
            <p class="text-xs opacity-75 mt-1">The requested view <code class="text-purple-300 font-mono bg-black/20 dark:bg-white/5 px-2 py-0.5 rounded">#${escapeHtml(path)}</code> does not exist.</p>
          </div>
          <button id="btn404Home" class="py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg glow-btn active:scale-95 transition-all cursor-pointer">
            <i class="fa-solid fa-house mr-1.5"></i>Return to Home
          </button>
        </div>
      `;
      container.querySelector("#btn404Home")?.addEventListener("click", () => navigate("home"));
    }

    emit("routeChanged", { route: "404", params });
    return;
  }

  const targetRoute = path;
  currentRoute = targetRoute;
  currentParams = params;

  // Emit route changing event
  emit("routeChanging", { route: targetRoute, params });

  // Update container
  if (container && routes.has(targetRoute)) {
    const renderFn = routes.get(targetRoute);
    try {
      container.innerHTML = "";
      await renderFn(container, params);
    } catch (err) {
      console.error(`[Router] Error rendering route "${targetRoute}":`, err);
      container.innerHTML = `
        <div class="glass-card p-6 rounded-3xl text-center space-y-4 shadow-xl border border-rose-500/30 animate-[fadeInScale_0.3s_ease_forwards]">
          <div class="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h2 class="text-base font-bold">Unable to Load View</h2>
            <p class="text-xs opacity-75 mt-1">${escapeHtml(err.message || "An unexpected error occurred.")}</p>
          </div>
          <div class="flex justify-center space-x-2 pt-1">
            <button id="btnRetryRoute" class="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer">
              <i class="fa-solid fa-rotate-right mr-1"></i>Try Again
            </button>
            <button id="btnReturnHome" class="py-2.5 px-4 rounded-xl sub-card text-xs font-semibold hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
              Return Home
            </button>
          </div>
        </div>
      `;
      container.querySelector("#btnRetryRoute")?.addEventListener("click", () => handleRouteChange());
      container.querySelector("#btnReturnHome")?.addEventListener("click", () => navigate("home"));
    }
  }


  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Emit route changed event (e.g. for bottom nav and header)
  emit("routeChanged", { route: targetRoute, params });
}

/**
 * Initializes the router and starts listening to hash changes.
 */
export function initRouter() {
  if (routerInitialized) return;
  routerInitialized = true;

  window.addEventListener("hashchange", handleRouteChange);
  
  // Initial dispatch
  handleRouteChange();
}

/**
 * Gets current active route name.
 */
export function getCurrentRoute() {
  return currentRoute || ROUTES.HOME;
}

/**
 * Gets current active route params.
 */
export function getCurrentParams() {
  return { ...currentParams };
}
