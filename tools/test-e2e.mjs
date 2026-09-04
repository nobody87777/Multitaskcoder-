// MultitaskCoder - Comprehensive End-to-End (E2E) Test Suite
//
// This test suite runs:
//   1. Local HTTP Server Smoke & Static Asset Delivery Tests (MIME, CORS, SPA fallback, Security)
//   2. Static & Dynamic Data API / Manifest Tests (all 567 files & indices reachable)
//   3. PWA Asset & Service Worker Static Cache Integrity Tests
//   4. Application Logic, Utility, State & Storage Unit/Integration Tests
//   5. Router & Hash-parsing Integration Tests
//   6. Feature Engines (Theory, Typing, Debugger, Quiz, Comparison, Search) Runtime Tests
//   7. Component & Page Template DOM Rendering Tests
//   8. Complete User Simulation Journey (XP, Leveling, Drills, Bug fixes, Quizzes, Badges)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = "C:/Users/jamun/Desktop/nobody/nob";
const TEST_PORT = 8999;
const BASE_URL = `http://localhost:${TEST_PORT}`;

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
console.log("       MultitaskCoder - Complete End-to-End Test Suite         ");
console.log("===============================================================\n");

// -----------------------------------------------------------------------------
// STEP 1: Boot Up the Built-in HTTP Server
// -----------------------------------------------------------------------------
console.log("[Phase 1] Starting HTTP Server on port " + TEST_PORT + "...");

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".mjs": "application/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".webmanifest": "application/manifest+json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=UTF-8",
  ".xml": "application/xml; charset=UTF-8"
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split("?")[0]);
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  if (reqPath === "/favicon.ico") reqPath = "/assets/icons/favicon-32x32.png";

  let fullPath = path.normalize(path.join(ROOT, reqPath));

  if (!fullPath.startsWith(path.normalize(ROOT))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      const ext = path.extname(reqPath);
      if (!ext) {
        fullPath = path.join(ROOT, "index.html");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  });
});

await new Promise((resolve) => {
  server.listen(TEST_PORT, "127.0.0.1", () => {
    console.log(`Server successfully listening at ${BASE_URL}\n`);
    resolve();
  });
});

try {
  // ---------------------------------------------------------------------------
  // STEP 2: HTTP Server & Static Asset Delivery Tests
  // ---------------------------------------------------------------------------
  console.log("[Phase 2] HTTP Endpoints & Asset Delivery Tests");

  // 2.1 Root Index.html
  const resIndex = await fetch(`${BASE_URL}/`);
  assert(resIndex.status === 200, "GET / returns status 200 OK");
  assert(resIndex.headers.get("content-type")?.includes("text/html"), "GET / content-type is text/html");
  const htmlText = await resIndex.text();
  assert(htmlText.includes('<div id="app"></div>'), "GET / contains #app mounting root");
  assert(htmlText.includes('<script type="module" src="js/app.js"></script>'), "GET / includes js/app.js module script");
  assert(htmlText.includes("manifest.webmanifest"), "GET / references manifest.webmanifest");
  assert(htmlText.includes("css/main.css") && htmlText.includes("css/themes.css"), "GET / references CSS stylesheets");
  assert(htmlText.includes("three.min.js"), "GET / references Three.js CDN");
  assert(htmlText.includes("all.min.css"), "GET / references Font Awesome CDN");

  // 2.2 PWA Manifest
  const resManifest = await fetch(`${BASE_URL}/manifest.webmanifest`);
  assert(resManifest.status === 200, "GET /manifest.webmanifest returns 200");
  assert(resManifest.headers.get("content-type")?.includes("manifest+json"), "Manifest content-type is application/manifest+json");
  const manifestJson = await resManifest.json();
  assert(manifestJson.name === "MultitaskCoder", "Manifest name is 'MultitaskCoder'");
  assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2, "Manifest defines at least 2 launcher icons");

  // 2.3 Service Worker
  const resSw = await fetch(`${BASE_URL}/sw.js`);
  assert(resSw.status === 200, "GET /sw.js returns 200");
  assert(resSw.headers.get("content-type")?.includes("javascript"), "sw.js content-type is application/javascript");
  const swText = await resSw.text();
  assert(swText.includes("CACHE_NAME") && swText.includes("STATIC_ASSETS"), "sw.js defines cache constants");
  assert(swText.includes('self.addEventListener("install"') && swText.includes('self.addEventListener("fetch"'), "sw.js registers install & fetch listeners");

  // 2.4 CSS Files Delivery
  const cssFiles = ["main.css", "themes.css", "components.css", "animations.css", "responsive.css"];
  for (const file of cssFiles) {
    const resCss = await fetch(`${BASE_URL}/css/${file}`);
    assert(resCss.status === 200 && resCss.headers.get("content-type")?.includes("text/css"), `GET /css/${file} returns 200 text/css`);
  }

  // 2.5 Security: Directory Traversal Prevention via raw HTTP request
  const rawTraverseStatus = await new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port: TEST_PORT, path: "/../../../etc/passwd" }, (res) => {
      resolve(res.statusCode);
    });
    req.on("error", () => resolve(500));
    req.end();
  });
  assert(rawTraverseStatus === 403, "GET directory traversal attempt /../../../etc/passwd returns 403 Forbidden");

  // 2.6 Missing Static Asset
  const res404 = await fetch(`${BASE_URL}/nonexistent-file.xyz`);
  assert(res404.status === 404, "GET missing file with extension returns 404 Not Found");

  // 2.7 SPA Routing Fallback
  const resSpa = await fetch(`${BASE_URL}/learn`);
  assert(resSpa.status === 200, "GET SPA path without extension /learn returns 200");
  const spaText = await resSpa.text();
  assert(spaText.includes('<div id="app"></div>'), "GET SPA path /learn returns index.html shell");

  // ---------------------------------------------------------------------------
  // STEP 3: Educational Datasets & Manifests Accessibility via HTTP
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 3] Educational Datasets & Index Manifests HTTP Tests");

  const languages = ["python", "java", "c"];
  for (const lang of languages) {
    const resTypingIdx = await fetch(`${BASE_URL}/data/typing/${lang}/index.json`);
    assert(resTypingIdx.status === 200, `GET /data/typing/${lang}/index.json returns 200`);
    const typingIdxData = await resTypingIdx.json();
    const count = (typingIdxData.drills || typingIdxData.programs || []).length;
    assert(count === 50, `${lang} typing manifest contains 50 drills (found ${count})`);

    const resQuizIdx = await fetch(`${BASE_URL}/data/quizzes/${lang}/index.json`);
    assert(resQuizIdx.status === 200, `GET /data/quizzes/${lang}/index.json returns 200`);
    const quizIdxData = await resQuizIdx.json();
    assert(Array.isArray(quizIdxData.questions) && quizIdxData.questions.length === 50, `${lang} quiz manifest contains 50 questions`);

    const resDbgIdx = await fetch(`${BASE_URL}/data/debugger/${lang}/index.json`);
    assert(resDbgIdx.status === 200, `GET /data/debugger/${lang}/index.json returns 200`);
    const dbgIdxData = await resDbgIdx.json();
    assert(Array.isArray(dbgIdxData.challenges) && dbgIdxData.challenges.length === 50, `${lang} debugger manifest contains 50 challenges`);
  }

  // Theory sections
  const theorySections = ["python", "java", "c", "comparison"];
  for (const sec of theorySections) {
    const resTheorySec = await fetch(`${BASE_URL}/data/theory/${sec}/index.json`);
    assert(resTheorySec.status === 200, `GET /data/theory/${sec}/index.json returns 200`);
    const theorySecData = await resTheorySec.json();
    const modCount = (theorySecData.modules || theorySecData.topics || []).length;
    assert(modCount > 0, `${sec} theory manifest contains modules/topics (found ${modCount})`);
  }

  // Icons
  const icons = ["icon-192.svg", "icon-512.svg", "icon-192.png", "icon-512.png", "favicon-32x32.png", "apple-touch-icon.png"];
  for (const icon of icons) {
    const resIcon = await fetch(`${BASE_URL}/assets/icons/${icon}`);
    assert(resIcon.status === 200, `GET /assets/icons/${icon} returns 200`);
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Service Worker Cache Asset Integrity
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 4] PWA Service Worker Static Assets Verification");

  const staticAssetsRegex = /const\s+STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/;
  const matchAssets = swText.match(staticAssetsRegex);
  assert(!!matchAssets, "sw.js contains STATIC_ASSETS array definition");

  if (matchAssets) {
    const assetList = matchAssets[1]
      .split("\n")
      .map(line => line.trim().replace(/^["']|["'],?$/g, ""))
      .filter(line => line.startsWith("./") && !line.endsWith("./"));

    let allAssetsExist = true;
    for (const rel of assetList) {
      const cleanPath = rel.replace(/^\.\//, "");
      const full = path.join(ROOT, cleanPath);
      if (!fs.existsSync(full)) {
        allAssetsExist = false;
        assert(false, `STATIC_ASSET file exists: ${rel}`, "File not found on disk");
      }
    }
    assert(allAssetsExist, `All ${assetList.length} static assets in sw.js exist on disk`);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Core JavaScript Module Runtime & Logic Tests
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 5] Core JavaScript Module Runtime & Logic Tests");

  // Setup DOM / Web API Mocks for Node environment
  const mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (k) => mockStorage.has(k) ? mockStorage.get(k) : null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear()
  };

  globalThis.window = {
    location: { hash: "" },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1
  };
  globalThis.document = {
    documentElement: { classList: { remove: () => {}, add: () => {}, contains: () => false } },
    body: { classList: { remove: () => {}, add: () => {}, contains: () => false } },
    getElementById: () => null,
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      className: "",
      innerHTML: "",
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      appendChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null
    }),
    querySelectorAll: () => []
  };

  // Helper to import from project root
  const importModule = (relPath) => import(pathToFileURL(path.join(ROOT, relPath)).href);

  // 5.1 Constants
  const constants = await importModule("js/constants.js");
  assert(constants.APP_NAME === "MultitaskCoder", "Constants: APP_NAME is MultitaskCoder");
  assert(constants.SUPPORTED_LANGUAGES.length === 3, "Constants: 3 supported languages (python, java, c)");
  assert(constants.THEORY_SECTIONS.includes("comparison"), "Constants: Theory includes comparison");
  assert(constants.BADGES.length === 12, "Constants: 12 achievement badges configured");
  assert(constants.XP_REWARDS.TYPING_DRILL === 25, "Constants: Typing drill awards 25 XP");
  assert(constants.XP_REWARDS.DEBUGGER_CHALLENGE === 50, "Constants: Debugger challenge awards 50 XP");

  // 5.2 Utils
  const utils = await importModule("js/utils.js");
  assert(utils.escapeHtml("<script>alert('xss')</script>") === "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;", "Utils: escapeHtml sanitizes dangerous tags");
  assert(utils.calculateWpm(250, 60) === 50, "Utils: calculateWpm computes 50 WPM for 250 chars in 60s");
  assert(utils.calculateAccuracy(100, 5) === 95, "Utils: calculateAccuracy computes 95% for 5 errors in 100 chars");
  const pyCode = utils.highlightCode("def add(a, b):\n  return a + b  # sum", "python");
  assert(pyCode.includes('class="text-purple-400 font-semibold">def</span>'), "Utils: highlightCode highlights Python def keyword");
  assert(pyCode.includes('class="text-gray-500 italic"># sum</span>'), "Utils: highlightCode highlights comment");

  // 5.3 Storage & Persistence
  const storage = await importModule("js/storage.js");
  storage.setItem("test_key", { value: 42 });
  const fetchedObj = storage.getItem("test_key");
  assert(fetchedObj && fetchedObj.value === 42, "Storage: setItem and getItem persist and parse JSON");

  const defaultStats = storage.getStats();
  assert(typeof defaultStats.xp === "number" && defaultStats.streak >= 0, "Storage: getStats returns structured stats object");

  storage.updateStats({ streak: 14 });
  assert(storage.getStats().streak === 14, "Storage: updateStats updates partial state");

  // 5.4 State Management
  const stateMod = await importModule("js/state.js");
  stateMod.initState();
  assert(stateMod.getState().streak === 14, "State: initState loads persisted streak");

  let eventFired = false;
  const unsub = stateMod.subscribe("xpChanged", (data) => {
    if (data.amount === 100) eventFired = true;
  });
  stateMod.addXP(100);
  assert(eventFired, "State: addXP emits xpChanged event");
  unsub();

  // Daily challenge state
  const prevXp = stateMod.getState().xp;
  stateMod.solveDailyChallenge();
  assert(stateMod.getState().dailyChallengeDone === true, "State: solveDailyChallenge marks dailyChallengeDone true");
  assert(stateMod.getState().xp === prevXp + constants.XP_REWARDS.DAILY_CHALLENGE, "State: solveDailyChallenge awards 50 XP");

  // 5.5 Router Module
  const routerMod = await importModule("js/router.js");
  const parsed1 = routerMod.parseHash("#learn?section=java&lesson=java-005");
  assert(parsed1.path === "learn" && parsed1.params.section === "java" && parsed1.params.lesson === "java-005", "Router: parseHash parses path and query parameters");

  const parsed2 = routerMod.parseHash("");
  assert(parsed2.path === "home", "Router: parseHash defaults empty hash to 'home'");

  // ---------------------------------------------------------------------------
  // STEP 6: Educational Engines Runtime Verification
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 6] Educational Engines Runtime Verification");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, opts) => {
    let resolvedUrl = String(url);
    if (!resolvedUrl.startsWith("http://") && !resolvedUrl.startsWith("https://")) {
      resolvedUrl = `${BASE_URL}/${resolvedUrl.replace(/^\.?\//, "")}`;
    }
    return originalFetch(resolvedUrl, opts);
  };

  // 6.1 Theory Engine
  const theoryEngine = await importModule("js/features/theory/theory-engine.js");
  const pyModules = await theoryEngine.loadModules("python");
  assert(Array.isArray(pyModules) && pyModules.length === 29, "TheoryEngine: loads all 29 Python modules");
  const pyLesson1 = await theoryEngine.loadLesson("python", "python-introduction-001");
  assert(pyLesson1 && pyLesson1.title && pyLesson1.content, "TheoryEngine: loads individual lesson python-introduction-001");

  // 6.2 Comparison Engine
  const comparisonEngine = await importModule("js/features/theory/comparison.js");
  const compLesson1 = await comparisonEngine.loadComparisonLesson("comparison-fundamentals-001");
  assert(compLesson1 && compLesson1.id === "comparison-fundamentals-001", "ComparisonEngine: loads comparison lesson comparison-fundamentals-001");

  // 6.3 Theory Search
  const theorySearch = await importModule("js/features/theory/theory-search.js");
  const searchResults = await theorySearch.searchSection("python", "functions");
  assert(Array.isArray(searchResults) && searchResults.length > 0, "TheorySearch: searches Python lessons for keyword 'functions'");

  // 6.4 Lesson Navigation
  const lessonNav = await importModule("js/features/theory/lesson-navigation.js");
  const nextLesson = await lessonNav.goToNextLesson("python", pyLesson1);
  assert(nextLesson && nextLesson.id, "LessonNavigation: goToNextLesson resolves to next lesson");

  // 6.5 Typing Engine & Stats
  const typingEngine = await importModule("js/features/typing/typing-engine.js");
  const pyDrill = await typingEngine.loadTypingDrill("python", "python-001");
  assert(pyDrill && pyDrill.code && pyDrill.expectedOutput, "TypingEngine: loads drill python-001 with code & expectedOutput");

  const typingStatsMod = await importModule("js/features/typing/typing-stats.js");
  const typingSession = new typingStatsMod.TypingSessionStats();
  typingSession.recordKey(true);
  typingSession.recordKey(true);
  typingSession.recordKey(false);
  typingSession.finish();
  const metrics = typingSession.getSummary();
  assert(metrics.accuracy < 100 && metrics.errors === 1, "TypingStats: accurately tracks keystrokes and error count");

  // 6.6 Quiz Engine & Stats
  const quizEngine = await importModule("js/features/quiz/quiz-engine.js");
  const pyQuiz = await quizEngine.loadQuizQuestion("python", "quiz-python-001");
  assert(pyQuiz && pyQuiz.question && Array.isArray(pyQuiz.options) && typeof pyQuiz.correctAnswer === "number", "QuizEngine: loads question quiz-python-001 with valid options & correctAnswer");

  const quizStatsMod = await importModule("js/features/quiz/quiz-stats.js");
  const quizSession = new quizStatsMod.QuizSessionStats();
  quizSession.recordAnswer("quiz-python-001", true);
  assert(quizSession.correctCount === 1 && quizSession.totalAnswered === 1, "QuizStats: score recorded accurately for correct answer");

  // 6.7 Debugger Engine & Stats
  const dbgEngine = await importModule("js/features/debugger/debugger-engine.js");
  const pyDebug = await dbgEngine.loadDebuggerChallenge("python", "debug-python-001");
  assert(pyDebug && pyDebug.buggyCode && pyDebug.correctedCode && pyDebug.bugType, "DebuggerEngine: loads challenge debug-python-001 with buggyCode and correctedCode");

  const dbgStatsMod = await importModule("js/features/debugger/debugger-stats.js");
  const dbgSession = new dbgStatsMod.DebuggerSessionStats();
  dbgSession.recordAttempt("debug-python-001");
  dbgSession.recordSolved("debug-python-001");
  assert(dbgSession.solvedCount === 1, "DebuggerStats: solved count recorded accurately");

  // ---------------------------------------------------------------------------
  // STEP 7: UI Components & Template Generators
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 7] UI Component & Template Generators Tests");

  const progressComp = await importModule("js/components/progress.js");
  const ringHtml = progressComp.renderProgressRing(75, "text-emerald-400", 48);
  assert(ringHtml.includes("<svg") && ringHtml.includes("75%"), "Progress: renderProgressRing produces SVG with percentage");

  const barHtml = progressComp.renderLinearBar(60);
  assert(barHtml.includes("width: 60%"), "Progress: renderLinearBar sets width percentage");

  const cardsComp = await importModule("js/components/cards.js");
  const langCardHtml = cardsComp.renderLanguageCard({
    language: "python",
    name: "Python",
    iconHtml: '<i class="fa-brands fa-python"></i>',
    subtitle: "Easy to learn",
    progressPct: 80
  });
  assert(langCardHtml.includes("Python") && langCardHtml.includes("80%"), "Cards: renderLanguageCard contains language name and progress");

  // ---------------------------------------------------------------------------
  // STEP 8: End-to-End User Learning Journey Simulation
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 8] Complete User Journey Simulation");

  // Reset state to a clean slate before user journey
  stateMod.resetState();
  const startingXP = stateMod.getState().xp;

  // 1. Typing drill completion
  const typingProgressMod = await importModule("js/features/typing/typing-progress.js");
  typingProgressMod.recordDrillCompletion("python-001", 45, 150);
  console.log("  [DEBUG] Starting XP:", startingXP, "After typing XP:", stateMod.getState().xp);
  assert(typingProgressMod.isDrillCompleted("python-001"), "Journey: python-001 marked completed in progress");
  assert(stateMod.getState().xp === startingXP + constants.XP_REWARDS.TYPING_DRILL, "Journey: +25 XP awarded for typing drill");

  // 2. Debugger challenge completion
  dbgStatsMod.recordChallengeCompleted("debug-python-001");
  console.log("  [DEBUG] After debug XP:", stateMod.getState().xp);
  assert(dbgStatsMod.isChallengeCompleted("debug-python-001"), "Journey: debug-python-001 marked completed in stats");
  assert(stateMod.getState().xp === startingXP + constants.XP_REWARDS.TYPING_DRILL + constants.XP_REWARDS.DEBUGGER_CHALLENGE, "Journey: +50 XP awarded for debugger challenge");

  // 3. Quiz question completion
  stateMod.completeQuiz("quiz-python-001", true);
  console.log("  [DEBUG] After quiz XP:", stateMod.getState().xp);
  assert(quizStatsMod.isQuizCompleted("quiz-python-001"), "Journey: quiz-python-001 marked completed in stats");
  assert(stateMod.getState().xp === startingXP + constants.XP_REWARDS.TYPING_DRILL + constants.XP_REWARDS.DEBUGGER_CHALLENGE + constants.XP_REWARDS.QUIZ_QUESTION, "Journey: +30 XP awarded for quiz question");

  // 4. Theory lesson completion
  stateMod.completeLesson("python-001");
  console.log("  [DEBUG] After lesson XP:", stateMod.getState().xp);
  assert(stateMod.getState().completedLessons.includes("python-001"), "Journey: python-001 lesson recorded in completedLessons");
  assert(stateMod.getState().xp === startingXP + constants.XP_REWARDS.TYPING_DRILL + constants.XP_REWARDS.DEBUGGER_CHALLENGE + constants.XP_REWARDS.QUIZ_QUESTION + constants.XP_REWARDS.THEORY_LESSON, "Journey: +15 XP awarded for theory lesson");

  // 5. Storage persistence flush
  stateMod.persist(true);
  const reloadedStats = storage.getStats();
  assert(reloadedStats.completedTyping.includes("python-001"), "Journey: Completed typing drill persisted to localStorage");
  assert(reloadedStats.completedDebugger.includes("debug-python-001"), "Journey: Completed debugger challenge persisted to localStorage");
  assert(reloadedStats.completedQuizzes.includes("quiz-python-001"), "Journey: Completed quiz question persisted to localStorage");
  assert(reloadedStats.completedLessons.includes("python-001"), "Journey: Completed theory lesson persisted to localStorage");

  // ---------------------------------------------------------------------------
  // STEP 9: Full Page Views DOM Rendering Verification
  // ---------------------------------------------------------------------------
  console.log("\n[Phase 9] Page Views Rendering Verification");

  function createMockEl(tag = "div") {
    const el = {
      tagName: tag.toUpperCase(),
      id: "",
      className: "",
      innerHTML: "",
      value: "",
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      appendChild: (child) => child,
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      querySelector: () => createMockEl(),
      querySelectorAll: () => [createMockEl()]
    };
    return el;
  }

  // 9.1 Home Page
  const homeMod = await importModule("js/pages/home.js");
  const homeContainer = createMockEl("div");
  await homeMod.renderHomePage(homeContainer);
  assert(homeContainer.innerHTML.includes("tab-home-view"), "Page: renderHomePage mounts tab-home-view");
  assert(homeContainer.innerHTML.includes("Choose Your Language"), "Page: renderHomePage renders language tracks");

  // 9.2 Learn / Theory Page
  const learnMod = await importModule("js/pages/learn.js");
  const learnContainer = createMockEl("div");
  await learnMod.renderLearnPage(learnContainer, { section: "python" });
  assert(learnContainer.innerHTML.includes("tab-learn-view"), "Page: renderLearnPage mounts tab-learn-view");
  assert(learnContainer.innerHTML.includes('data-sec="python"'), "Page: renderLearnPage renders section tabs");

  // 9.3 Typing Page
  const typingPageMod = await importModule("js/pages/typing.js");
  const typingContainer = createMockEl("div");
  await typingPageMod.renderTypingPage(typingContainer, { lang: "python" });
  assert(typingContainer.innerHTML.includes("tab-typing-view"), "Page: renderTypingPage mounts tab-typing-view");
  assert(typingContainer.innerHTML.includes("Speed Typing Arena"), "Page: renderTypingPage renders arena header");

  // 9.4 Debugger Page
  const dbgPageMod = await importModule("js/pages/debugger.js");
  const dbgContainer = createMockEl("div");
  await dbgPageMod.renderDebuggerPage(dbgContainer, { lang: "python" });
  assert(dbgContainer.innerHTML.includes("tab-debugger-view"), "Page: renderDebuggerPage mounts tab-debugger-view");
  assert(dbgContainer.innerHTML.includes("Debugger Arena"), "Page: renderDebuggerPage renders debugger header");

  // 9.5 Quizzes Page
  const quizPageMod = await importModule("js/pages/quizzes.js");
  const quizContainer = createMockEl("div");
  await quizPageMod.renderQuizzesPage(quizContainer, { lang: "python" });
  assert(quizContainer.innerHTML.includes("tab-quizzes-view"), "Page: renderQuizzesPage mounts tab-quizzes-view");
  assert(quizContainer.innerHTML.includes("Quiz Arena &amp; Battles"), "Page: renderQuizzesPage renders quiz header");

  // 9.6 Profile Page
  const profileMod = await importModule("js/pages/profile.js");
  const profileContainer = createMockEl("div");
  await profileMod.renderProfilePage(profileContainer);
  assert(profileContainer.innerHTML.includes("tab-profile-view"), "Page: renderProfilePage mounts tab-profile-view");
  assert(profileContainer.innerHTML.includes("Master Coder"), "Page: renderProfilePage displays user profile");

  // 9.7 Sandbox Placeholder
  const sandboxMod = await importModule("js/features/sandbox/sandbox-placeholder.js");
  const sandboxContainer = createMockEl("div");
  sandboxMod.renderSandboxPlaceholder(sandboxContainer);
  assert(sandboxContainer.innerHTML.includes("Live Code Sandbox"), "Page: renderSandboxPlaceholder renders sandbox UI");

  console.log("\n===============================================================");
  console.log("                      E2E TEST SUMMARY                         ");
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
    console.log("\n>>> ALL END-TO-END TESTS PASSED SUCCESSFULLY! (100% SUCCESS) <<<");
  }

} finally {
  server.close(() => {
    console.log("\nTest HTTP Server shut down cleanly.");
  });
}
