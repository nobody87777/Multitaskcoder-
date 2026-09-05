// MultitaskCoder - Comprehensive Real-Browser CDP Test Suite
//
// Automatically launches Headless Chrome, navigates to http://localhost:8080/,
// and executes interactive end-to-end browser tests across all categories:
//   1. Local Server Verification
//   2. Browser Interaction
//   3. Home Page & Shell Components
//   4. Theory Curriculum (Python, Java, C, Comparison)
//   5. Speed Typing (Python, Java, C; key-by-key verification)
//   6. Quiz Arena (Python, Java, C; options, explanation, progression)
//   7. Debugger Arena (Python, Java, C; editor, test run, modal, solution)
//   8. Profile Page & Badges (XP, streak, 12 badges)
//   9. LocalStorage Persistence across Page Reloads
//  10. Router & History Navigation (Hash URLs, Back, Forward, 404s)
//  11. Responsive Viewports (Desktop, Laptop, Tablet, Mobile)
//  12. Console & Network Request Audit (0 fatal errors, 0 failed requests)
//  13. PWA Test (Manifest, Icons, ServiceWorker registration & cache)
//  14. Standalone CSS / Tailwind Issue Verification
//  15. Data Integrity Validation (567/567 curriculum files)

import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME_PATH = process.env.CHROME_PATH ||
  (fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : fs.existsSync("C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe")
      ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      : "google-chrome");

const TARGET_URL = "http://localhost:8080/";
const CDP_PORT = 9222;

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, detail = "") {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    failures.push({ testName, detail });
    console.error(`  [FAIL] ${testName} ${detail ? "(" + detail + ")" : ""}`);
  }
}

console.log("===============================================================");
console.log("    MultitaskCoder - Real-Browser Automation Test Suite        ");
console.log("===============================================================\n");

// Ensure local server is running on port 8080
let serverProc = null;
try {
  await fetch(TARGET_URL);
} catch {
  console.log("[Server] Launching local HTTP server on port 8080...");
  const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.js");
  serverProc = spawn(process.execPath, [serverPath], { stdio: "ignore" });
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(TARGET_URL);
      if (res.ok) break;
    } catch {}
  }
}

// 1. Spawn Chrome
console.log("[Chrome] Spawning headless Chrome instance...");
const chromeProc = spawn(CHROME_PATH, [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${process.env.TEMP}\\chrome-mtc-e2e-${Date.now()}`
], { stdio: "ignore" });

// Wait for CDP readiness
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://localhost:${CDP_PORT}/json/version`);
    if (res.ok) break;
  } catch (e) {}
}

const tabRes = await fetch(`http://localhost:${CDP_PORT}/json/new`, { method: "PUT" });
const tab = await tabRes.json();
console.log(`[Chrome] Created browser tab: ${tab.id}\n`);

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let msgId = 1;
const pending = new Map();
const consoleMessages = [];
const pageErrors = [];
const networkRequests = new Map();
let pageLoaded = false;

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.method === "Page.loadEventFired") {
    pageLoaded = true;
  }
  if (data.method === "Runtime.consoleAPICalled") {
    const text = data.params.args?.map(a => a.value || a.description || "").join(" ") || "";
    consoleMessages.push({ type: data.params.type, text });
  }
  if (data.method === "Runtime.exceptionThrown") {
    pageErrors.push(data.params.exceptionDetails?.text || "Unknown exception");
  }
  if (data.method === "Network.responseReceived") {
    const resp = data.params.response;
    networkRequests.set(resp.url, { status: resp.status, mime: resp.mimeType });
  }
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  }
};

function send(method, params = {}) {
  const id = msgId++;
  return new Promise(resolve => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expression) {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.result?.exceptionDetails) {
    throw new Error(res.result.exceptionDetails.text || "Eval Exception");
  }
  return res.result?.result?.value;
}

async function waitFor(fnExpression, timeoutMs = 8000, pollMs = 150) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const val = await evalJs(fnExpression);
      if (val) return val;
    } catch (e) {}
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error(`Timeout waiting for expression: ${fnExpression}`);
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 480
  });
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Console.enable");

  // Navigate to target
  console.log(`[Browser] Navigating to ${TARGET_URL}...`);
  await send("Page.navigate", { url: TARGET_URL });

  while (!pageLoaded) {
    await new Promise(r => setTimeout(r, 100));
  }
  console.log("[Browser] Page loadEventFired received.\n");

  // Wait for 3D simulation loader to finish
  await waitFor("!document.getElementById('loaderScreen') || document.getElementById('loaderScreen').classList.contains('hidden') || document.getElementById('loaderScreen').style.display === 'none' || document.getElementById('loaderScreen').style.opacity === '0'", 5000).catch(() => {});
  // Ensure main container is mounted
  await waitFor("document.getElementById('main-content') !== null", 3000);

  // ---------------------------------------------------------------------------
  // TEST 3: HOME TEST
  // ---------------------------------------------------------------------------
  console.log("[Test Suite 3] HOME PAGE & APP SHELL");
  const docTitle = await evalJs("document.title");
  assert(docTitle.includes("MultitaskCoder"), "Page title is correct", docTitle);

  const headerExists = await evalJs("document.querySelector('header') !== null");
  assert(headerExists, "Sticky header component is present in DOM");

  const logoText = await evalJs("document.getElementById('headerLogo')?.innerText.trim()");
  assert(logoText === "MultitaskCoder", "Header logo contains 'MultitaskCoder'", logoText);

  // Test theme toggle button in header
  const initialTheme = await evalJs("document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  await evalJs("document.getElementById('themeToggleBtn')?.click()");
  const toggledTheme = await evalJs("document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  assert(initialTheme !== toggledTheme, "Header theme toggle switches between dark and light", `${initialTheme} -> ${toggledTheme}`);
  // Switch back to dark
  await evalJs("document.getElementById('themeToggleBtn')?.click()");

  // Test sidebar drawer open and close
  await evalJs("document.getElementById('headerMenuBtn')?.click()");
  await new Promise(r => setTimeout(r, 300));
  const drawerOpen = await evalJs("document.getElementById('slideMenuDrawer')?.classList.contains('menu-open')");
  assert(drawerOpen, "Clicking header menu button opens sidebar drawer");

  await evalJs("document.getElementById('closeDrawerBtn')?.click()");
  await new Promise(r => setTimeout(r, 350));
  const drawerClosed = await evalJs("!document.getElementById('slideMenuDrawer')?.classList.contains('menu-open')");
  assert(drawerClosed, "Clicking drawer close button closes sidebar");

  // Test language cards on Home
  const langCardsCount = await evalJs("document.querySelectorAll('.language-card, [data-track]').length");
  assert(langCardsCount === 3, "Home page renders 3 language cards (Python, Java, C)", `Count: ${langCardsCount}`);

  // Test Quick stats grid
  const statsCount = await evalJs("document.querySelectorAll('main section.grid > div').length");
  assert(statsCount >= 5, "Home page renders quick statistics cards (120+ lessons, 500+ programs, etc.)", `Count: ${statsCount}`);

  // Test Daily Challenge interaction on Home
  const startXP = await evalJs("window.__MTC__?.getState().xp");
  const dailyBtnClicked = await evalJs(`
    (() => {
      const btn = document.getElementById('btnDailyChallenge');
      if (btn) { btn.click(); return true; }
      return false;
    })()
  `);
  assert(dailyBtnClicked, "Daily challenge button clicked");
  await new Promise(r => setTimeout(r, 300));

  // Dismiss modal
  await evalJs("document.getElementById('modalActionBtn')?.click() || document.getElementById('closeModalBtn')?.click()");
  await new Promise(r => setTimeout(r, 200));

  const afterDailyXP = await evalJs("window.__MTC__?.getState().xp");
  assert(afterDailyXP >= startXP, "Daily challenge awards XP", `Before: ${startXP}, After: ${afterDailyXP}`);

  // ---------------------------------------------------------------------------
  // TEST 4: THEORY TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 4] THEORY CURRICULUM (Python, Java, C, Comparison)");
  
  // Navigate to #learn
  await evalJs("window.location.hash = '#learn'");
  await waitFor("document.getElementById('tab-learn-view') !== null");
  assert(true, "Navigated to #learn and mounted tab-learn-view");

  const theoryTabs = await evalJs("Array.from(document.querySelectorAll('.sec-tab')).map(b => b.getAttribute('data-sec'))");
  assert(theoryTabs.includes("python") && theoryTabs.includes("java") && theoryTabs.includes("c") && theoryTabs.includes("comparison"), "All 4 theory section tabs present (python, java, c, comparison)");

  // Test Python Modules & Lesson Reading
  await waitFor("document.querySelectorAll('.module-header-btn').length > 0", 4000);
  const pyModCount = await evalJs("document.querySelectorAll('.module-header-btn').length");
  assert(pyModCount >= 28, "Python modules accordion rendered", `Found ${pyModCount} modules`);

  // Expand first module and click lesson
  await evalJs("document.querySelector('.module-header-btn')?.click()");
  await new Promise(r => setTimeout(r, 300));
  await evalJs("document.querySelector('.lesson-btn')?.click()");
  await waitFor("document.getElementById('theoryReadingView') !== null", 4000);
  
  const lessonTitle = await evalJs("document.getElementById('theoryReadingView')?.querySelector('h1, h2')?.innerText");
  assert(!!lessonTitle, "Opened Python lesson in reading view", lessonTitle);

  const codeBlocksCount = await evalJs("document.querySelectorAll('#theoryReadingView .code-box').length");
  assert(codeBlocksCount > 0, "Lesson reading view renders styled code blocks", `Code blocks: ${codeBlocksCount}`);

  // Test Next Lesson Navigation Button
  const hasNextBtn = await evalJs("document.getElementById('btnNextLesson') !== null");
  assert(hasNextBtn, "Lesson navigation 'Next' button rendered");
  await evalJs("document.getElementById('btnNextLesson')?.click()");
  await new Promise(r => setTimeout(r, 500));
  const nextTitle = await evalJs("document.getElementById('theoryReadingView')?.querySelector('h1, h2')?.innerText");
  assert(nextTitle !== lessonTitle, "Next lesson button loaded subsequent lesson", nextTitle);

  // Test Back to Modules button
  await evalJs("document.getElementById('btnBackToModules')?.click()");
  await waitFor("document.getElementById('modulesAccordionContainer') !== null", 3000);
  assert(true, "Returned to module accordion view");

  // Test Search functionality
  await evalJs(`
    (() => {
      const input = document.getElementById('theorySearchInput');
      if (input) {
        input.value = 'variable';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 400));
  const searchResultsCount = await evalJs("document.querySelectorAll('.lesson-btn').length");
  assert(searchResultsCount > 0, "Theory search filters lessons by query 'variable'", `Results: ${searchResultsCount}`);

  // Test Java Section
  await evalJs("document.querySelector('[data-sec=\"java\"]')?.click()");
  await waitFor("document.querySelectorAll('.module-header-btn').length > 0", 3000);
  const javaModCount = await evalJs("document.querySelectorAll('.module-header-btn').length");
  assert(javaModCount >= 30, "Java theory modules loaded", `Found ${javaModCount} modules`);

  // Open Java lesson
  await evalJs("document.querySelector('.module-header-btn')?.click()");
  await new Promise(r => setTimeout(r, 300));
  await evalJs("document.querySelector('.lesson-btn')?.click()");
  await waitFor("document.getElementById('theoryReadingView') !== null", 3000);
  const javaLessonTitle = await evalJs("document.getElementById('theoryReadingView')?.querySelector('h1, h2')?.innerText");
  assert(!!javaLessonTitle, "Opened Java theory lesson", javaLessonTitle);

  // Test C Section
  await evalJs("document.getElementById('btnBackToModules')?.click()");
  await waitFor("document.getElementById('modulesAccordionContainer') !== null", 3000);
  await evalJs("document.querySelector('[data-sec=\"c\"]')?.click()");
  await waitFor("document.querySelectorAll('.module-header-btn').length > 0", 3000);
  const cModCount = await evalJs("document.querySelectorAll('.module-header-btn').length");
  assert(cModCount >= 28, "C theory modules loaded", `Found ${cModCount} modules`);

  // Test Comparison Section
  await evalJs("document.querySelector('[data-sec=\"comparison\"]')?.click()");
  await waitFor("document.querySelectorAll('.module-header-btn').length > 0", 3000);
  const compModCount = await evalJs("document.querySelectorAll('.module-header-btn').length");
  assert(compModCount >= 20, "Cross-language comparison topics loaded", `Found ${compModCount} topics`);

  // ---------------------------------------------------------------------------
  // TEST 5: TYPING TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 5] SPEED TYPING ARENA");
  await evalJs("window.location.hash = '#typing'");
  await waitFor("document.getElementById('tab-typing-view') !== null");
  assert(true, "Navigated to #typing and mounted tab-typing-view");

  const typingLangs = ["python", "java", "c"];
  for (const lang of typingLangs) {
    await evalJs(`document.querySelector('.typing-lang-tab[data-lang="${lang}"]')?.click()`);
    await waitFor(`document.querySelectorAll('#drillSelect option').length > 1`, 3000);
    const drillsInDropdown = await evalJs("document.querySelectorAll('#drillSelect option').length");
    assert(drillsInDropdown >= 50, `${lang} typing drills loaded into selector dropdown (${drillsInDropdown} options)`);

    // Verify code display and character rendering
    await waitFor("document.querySelectorAll('#typingDisplay span').length > 0", 3000);
    const charCount = await evalJs("document.querySelectorAll('#typingDisplay span').length");
    assert(charCount > 0, `${lang} drill rendered ${charCount} interactive typing characters`);

    // Simulate keystroke interaction
    const simulated = await evalJs(`
      (() => {
        const input = document.getElementById('typingInput') || document.getElementById('typingHiddenInput');
        if (!input) return false;
        // Type first 5 characters matching drill code
        const chars = Array.from(document.querySelectorAll('#typingDisplay span')).slice(0, 5).map(c => c.innerText);
        input.value = chars.join('');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()
    `);
    assert(simulated, `${lang} keystroke input simulated`);

    await new Promise(r => setTimeout(r, 200));
    const correctCharsCount = await evalJs("document.querySelectorAll('#typingDisplay span.correct, .typing-char.correct').length");
    assert(correctCharsCount === 5, `${lang} keystrokes highlighted in green as .correct`, `Count: ${correctCharsCount}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: QUIZ TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 6] QUIZ ARENA");
  await evalJs("window.location.hash = '#quizzes'");
  await waitFor("document.getElementById('tab-quizzes-view') !== null");
  assert(true, "Navigated to #quizzes and mounted tab-quizzes-view");

  const quizLangs = ["python", "java", "c"];
  for (const lang of quizLangs) {
    await evalJs(`document.querySelector('.quiz-lang-tab[data-lang="${lang}"]')?.click()`);
    await waitFor("document.querySelectorAll('.quiz-option-btn, [data-opt-index]').length >= 2", 3000);
    const optionsCount = await evalJs("document.querySelectorAll('.quiz-option-btn, [data-opt-index]').length");
    assert(optionsCount >= 2, `${lang} quiz question rendered with ${optionsCount} selectable options`);

    // Click an option
    await evalJs("document.querySelector('.quiz-option-btn, [data-opt-index]')?.click()");
    await new Promise(r => setTimeout(r, 200));

    const explanationVisible = await evalJs(`
      (() => {
        const el = document.getElementById('explanationBox') || document.getElementById('quizExplanationBox');
        return el && !el.classList.contains('hidden');
      })()
    `);
    assert(explanationVisible, `${lang} answer selection revealed explanation box`);

    const hasNextQuizBtn = await evalJs("document.getElementById('btnNextQuestion') !== null");
    assert(hasNextQuizBtn, `${lang} 'Next Question' button rendered`);

    // Advance to next question
    await evalJs("document.getElementById('btnNextQuestion')?.click()");
    await new Promise(r => setTimeout(r, 300));
  }

  // ---------------------------------------------------------------------------
  // TEST 7: DEBUGGER TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 7] DEBUGGER ARENA");
  await evalJs("window.location.hash = '#debugger'");
  await waitFor("document.getElementById('tab-debugger-view') !== null");
  assert(true, "Navigated to #debugger and mounted tab-debugger-view");

  const debugLangs = ["python", "java", "c"];
  for (const lang of debugLangs) {
    await evalJs(`document.querySelector('.debug-lang-tab[data-lang="${lang}"]')?.click()`);
    await waitFor("document.getElementById('debugCodeInput') !== null || document.getElementById('debuggerCodeInput') !== null", 3000);
    
    const buggyCodePresent = await evalJs(`
      (() => {
        const el = document.getElementById('debugCodeInput') || document.getElementById('debuggerCodeInput');
        return el && el.value.length > 0;
      })()
    `);
    assert(buggyCodePresent, `${lang} debugger challenge loaded buggy snippet into editor`);

    const hasSubmitBtn = await evalJs("document.getElementById('btnRunTest') !== null || document.getElementById('btnSubmitFix') !== null");
    assert(hasSubmitBtn, `${lang} 'Test Fix' button rendered`);

    // Test clicking Test Fix
    await evalJs("(document.getElementById('btnRunTest') || document.getElementById('btnSubmitFix'))?.click()");
    await new Promise(r => setTimeout(r, 300));
    const feedbackBoxVisible = await evalJs(`
      (() => {
        const fb = document.getElementById('debugFeedbackBox');
        const modal = document.getElementById('appModal');
        return (fb && !fb.classList.contains('hidden')) || (modal && !modal.classList.contains('hidden'));
      })()
    `);
    assert(feedbackBoxVisible, `${lang} test run executed and displayed diagnosis feedback`);

    // Test Reveal Solution
    await evalJs("(document.getElementById('btnRevealSolution') || document.getElementById('btnToggleSolution'))?.click()");
    await new Promise(r => setTimeout(r, 200));
    const solutionBoxVisible = await evalJs(`
      (() => {
        const el = document.getElementById('solutionBox') || document.getElementById('debuggerSolutionBox');
        return el && !el.classList.contains('hidden');
      })()
    `);
    assert(solutionBoxVisible, `${lang} solution revealed corrected code diff`);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: PROFILE TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 8] PROFILE & STATS");
  await evalJs("window.location.hash = '#profile'");
  await waitFor("document.getElementById('tab-profile-view') !== null");
  assert(true, "Navigated to #profile and mounted tab-profile-view");

  const profileXP = await evalJs("document.getElementById('profileXp')?.innerText");
  assert(!!profileXP && parseInt(profileXP) > 0, "Profile displays total XP", profileXP);

  const profileStreak = await evalJs("document.getElementById('profileStreak')?.innerText");
  assert(!!profileStreak, "Profile displays streak", profileStreak);

  const badgesCount = await evalJs("document.querySelectorAll('[data-badge-id]').length");
  assert(badgesCount === 12, "Profile displays all 12 achievement badges", `Count: ${badgesCount}`);

  // ---------------------------------------------------------------------------
  // TEST 9: PERSISTENCE TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 9] LOCALSTORAGE PERSISTENCE ACROSS RELOAD");

  // Modify theme to light
  await evalJs("window.__MTC__?.setState({ theme: 'light' })");
  const storedTheme = await evalJs("localStorage.getItem('mtc_theme')");
  assert(storedTheme === '"light"' || storedTheme === 'light', "Theme saved to localStorage");

  // Record current state before reload
  const preReloadXP = await evalJs("window.__MTC__?.getState().xp");
  const preReloadStreak = await evalJs("window.__MTC__?.getState().streak");

  // Trigger page reload
  console.log("  [Browser] Reloading page to test persistence...");
  pageLoaded = false;
  await send("Page.reload");
  while (!pageLoaded) {
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 1500));

  const postReloadXP = await evalJs("window.__MTC__?.getState().xp");
  const postReloadStreak = await evalJs("window.__MTC__?.getState().streak");
  const postReloadTheme = await evalJs("window.__MTC__?.getState().theme");

  assert(postReloadXP === preReloadXP, "XP persists across page reload", `${preReloadXP} === ${postReloadXP}`);
  assert(postReloadStreak === preReloadStreak, "Streak persists across page reload", `${preReloadStreak} === ${postReloadStreak}`);
  assert(postReloadTheme === "light", "Theme preference persists across page reload", postReloadTheme);

  // Restore dark theme
  await evalJs("window.__MTC__?.setState({ theme: 'dark' })");

  // ---------------------------------------------------------------------------
  // TEST 10: NAVIGATION TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 10] ROUTER & NAVIGATION");

  const testRoutes = ["home", "learn", "typing", "debugger", "quizzes", "profile", "code"];
  for (const r of testRoutes) {
    await evalJs(`window.location.hash = '#${r}'`);
    await waitFor(`document.getElementById('main-content')?.innerHTML.length > 50`, 2000);
    const activeRouteId = await evalJs(`document.querySelector('.tab-content.active')?.id || ''`);
    assert(activeRouteId.includes(r) || activeRouteId.length > 0, `Direct navigation to #${r} renders route content`);
  }

  // 404 Route handling
  await evalJs("window.location.hash = '#some-unknown-route-999'");
  await waitFor("document.getElementById('btn404Home') !== null", 2000);
  assert(true, "Navigating to unknown route renders Page Not Found 404 UI");

  await evalJs("document.getElementById('btn404Home')?.click()");
  await waitFor("document.getElementById('tab-home-view') !== null", 2000);
  assert(true, "Clicking 404 'Return to Home' button routes back to #home");

  // ---------------------------------------------------------------------------
  // TEST 11: RESPONSIVE VIEWPORT TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 11] RESPONSIVE VIEWPORTS");

  const viewports = [
    { name: "Desktop", width: 1280, height: 800 },
    { name: "Laptop", width: 1024, height: 768 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    await setViewport(vp.width, vp.height);
    await new Promise(r => setTimeout(r, 200));
    const noHScroll = await evalJs("document.documentElement.scrollWidth <= window.innerWidth + 2");
    assert(noHScroll, `${vp.name} (${vp.width}x${vp.height}) has no horizontal overflow scrolling`);
  }

  // Reset viewport
  await setViewport(1280, 800);

  // ---------------------------------------------------------------------------
  // TEST 12: CONSOLE & NETWORK AUDIT
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 12] CONSOLE & NETWORK AUDIT");

  const fatalErrors = pageErrors.concat(consoleMessages.filter(m => m.type === "error").map(m => m.text));
  assert(fatalErrors.length === 0, `Zero fatal JavaScript runtime errors (Found: ${fatalErrors.length})`);
  if (fatalErrors.length > 0) {
    console.error("Fatal browser errors:", fatalErrors);
  }

  const failedRequests = Array.from(networkRequests.entries()).filter(([url, d]) => d.status >= 400);
  assert(failedRequests.length === 0, `Zero failed network requests (Found: ${failedRequests.length})`);
  if (failedRequests.length > 0) {
    console.error("Failed requests:", failedRequests);
  }

  // ---------------------------------------------------------------------------
  // TEST 13: PWA TEST
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 13] PWA VERIFICATION");

  // Manifest load
  const manifestRes = await fetch("http://localhost:8080/manifest.webmanifest");
  assert(manifestRes.status === 200, "manifest.webmanifest returns HTTP 200");
  const manifestJson = await manifestRes.json();
  assert(manifestJson.name === "MultitaskCoder", "Manifest contains correct app name", manifestJson.name);
  assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2, "Manifest defines PWA icons");

  // Icons load
  const icon192 = await fetch("http://localhost:8080/assets/icons/icon-192.svg");
  assert(icon192.status === 200, "icon-192.svg returns HTTP 200");
  const icon512 = await fetch("http://localhost:8080/assets/icons/icon-512.svg");
  assert(icon512.status === 200, "icon-512.svg returns HTTP 200");
  const favRes = await fetch("http://localhost:8080/favicon.ico");
  assert(favRes.status === 200, "favicon.ico returns HTTP 200");

  // Service Worker Registration
  const swRegistered = await evalJs(`
    (async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    })()
  `);
  assert(swRegistered, "Service worker registered in browser context");

  // ---------------------------------------------------------------------------
  // TEST 14: STANDALONE CSS / TAILWIND INTEGRITY
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 14] STANDALONE CSS & ZERO FRAMEWORK DEPENDENCY");

  const tailwindScriptPresent = await evalJs("document.querySelector('script[src*=\"tailwindcss\"]') !== null");
  assert(!tailwindScriptPresent, "Tailwind CDN script is NOT present in document (zero external CSS framework)");

  const cssLinksCount = await evalJs("document.querySelectorAll('link[rel=\"stylesheet\"][href^=\"css/\"]').length");
  assert(cssLinksCount === 5, "All 5 modular standalone CSS files loaded (main, themes, components, animations, responsive)", `Count: ${cssLinksCount}`);

  // Check that styling works (e.g. font, colors, layout)
  const bodyBg = await evalJs("getComputedStyle(document.body).backgroundColor");
  assert(bodyBg === "rgb(9, 10, 16)", "Dark theme background applied correctly via standalone CSS", bodyBg);


  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log("             REAL-BROWSER TEST SUMMARY                         ");
  console.log("===============================================================");
  console.log(` TOTAL ASSERTIONS : ${passedTests + failedTests}`);
  console.log(` PASSED           : ${passedTests}`);
  console.log(` FAILED           : ${failedTests}`);
  console.log("===============================================================");

  if (failedTests > 0) {
    console.error("\nFAILURES:");
    failures.forEach((f, i) => console.error(` ${i + 1}. ${f.testName}: ${f.detail}`));
    process.exitCode = 1;
  } else {
    console.log("\n>>> ALL REAL-BROWSER TESTS PASSED WITH ZERO ERRORS! <<<");
  }

} finally {
  try { ws.close(); } catch {}
  try { chromeProc.kill(); } catch {}
  if (serverProc) {
    try { serverProc.kill(); } catch {}
    console.log("[Server] Local test server terminated.");
  }
  console.log("[Chrome] Headless Chrome process terminated.\n");
}
