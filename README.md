# MultitaskCoder

> **Learn. Build. Master.**  
> An all-in-one programming education platform to learn theory, practice syntax typing, diagnose bugs, and solve quizzes across **Python**, **Java**, and **C**.

Live Application: [https://nobody87777.github.io/Multitaskcoder-/](https://nobody87777.github.io/Multitaskcoder-/)

---

## Overview

**MultitaskCoder** is a mobile-first, vanilla web application designed for focused developer practice. It combines four core learning modes across three major programming tracks, plus a cross-language comparison module:

1. **Theory Curriculum**: 117 structured lessons with syntax-highlighted code, key takeaways, common pitfalls, difficulty ratings, search, and sequential navigation.
2. **Speed Typing Arena**: 150 syntax drills with real-time character matching, live WPM calculations, accuracy tracking, error counters, and difficulty selection.
3. **Debugger Arena**: 150 logic bug challenges featuring pre-populated code editors, in-app test verification, diagnosis feedback, and annotated side-by-side corrected solutions.
4. **Quiz Arena**: 150 practice questions including Multiple Choice (MCQ), Output Prediction, Code Analysis, and True/False with instant answer evaluations and conceptual explanations.
5. **Cross-Language Comparison**: Dedicated modules analyzing how fundamental concepts (Memory, Concurrency, OOP, Syntax) differ across Python, Java, and C.

---

## Supported Tracks & Curriculum Breakdown

| Track | Theory Lessons | Typing Drills | Debugger Challenges | Quizzes | Total Files |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Python** | 32 (29 modules) | 50 (20 beg / 20 int / 10 adv) | 50 (20 beg / 20 int / 10 adv) | 50 (MCQ, Output, Analysis, T/F) | 182 |
| **Java** | 33 (31 modules) | 50 (20 beg / 20 int / 10 adv) | 50 (20 beg / 20 int / 10 adv) | 50 (MCQ, Output, Analysis, T/F) | 183 |
| **C** | 30 (28 modules) | 50 (20 beg / 20 int / 10 adv) | 50 (20 beg / 20 int / 10 adv) | 50 (MCQ, Output, Analysis, T/F) | 180 |
| **Comparison** | 22 (22 modules) | — | — | — | 22 |
| **Total** | **117** | **150** | **150** | **150** | **567** |

---

## Architecture

MultitaskCoder is built purely with **vanilla standard web technologies** (ES2022+ modules, HTML5, standalone CSS3). It requires no build step, no bundler, no frontend framework (no React, Vue, or Angular), and no backend runtime:

```
app -> router -> pages -> features -> engines -> data
state -> storage -> progress -> UI components
```

### Directory Structure

```
├── index.html                   # HTML5 application shell & SEO/PWA metadata
├── favicon.ico                  # Standard 32x32 ICO favicon
├── manifest.webmanifest         # PWA Web Application Manifest (icons, standalone)
├── sw.js                        # Service Worker (offline caching, cache v4.1)
├── server.js                    # Zero-dependency local Node.js static HTTP server
├── robots.txt                   # Web crawler configuration
├── sitemap.xml                  # Canonical XML sitemap for search engines
├── assets/
│   └── icons/                   # SVG and PNG app icons (192x192, 512x512, favicons)
├── css/
│   ├── main.css                 # Reset, typography, spacing, flexbox/grid layout
│   ├── themes.css               # Dark & light theme palettes, CSS gradients
│   ├── components.css           # Glassmorphism cards, bottom nav, code boxes, badges
│   ├── animations.css           # Keyframe transitions, pulses, micro-interactions
│   └── responsive.css           # Viewport media queries (320px mobile to 4K desktop)
├── js/
│   ├── app.js                   # Application bootloader & shell mounting
│   ├── router.js                # Hash router with query params & 404 recovery
│   ├── state.js                 # Event-driven reactive store with auto-persistence
│   ├── storage.js               # Safe localStorage wrapper with migration guards
│   ├── constants.js             # Route names, rewards, badge metadata, default stats
│   ├── utils.js                 # Syntax highlighting, escaping, WPM/accuracy math
│   ├── components/              # Reusable UI widgets (header, bottom-nav, sidebar, modal, progress)
│   ├── pages/                   # Page controllers (home, learn, typing, debugger, quizzes, profile)
│   └── features/                # Feature business logic & engines (theory, typing, debugger, quiz, sandbox)
├── data/                        # 567 educational JSON datasets
│   ├── theory/                  # Python, Java, C, and Comparison topic manifests & lessons
│   ├── typing/                  # Python, Java, and C typing practice drills
│   ├── debugger/                # Python, Java, and C debugging challenges
│   └── quizzes/                 # Python, Java, and C quiz questions
└── tools/                       # Automated test & verification suites
    ├── validate-all.js          # Master runner for 4 curriculum validation suites
    ├── test-e2e.mjs             # Complete Node.js HTTP & unit test suite (121 assertions)
    └── test-browser.mjs         # Headless Chrome automation suite via CDP (92 assertions)
```

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended).
- Optional for data validation: `python` (Python 3.x) and `javac` (JDK 17+) on your system PATH.

### Running the App
1. Clone or open the repository:
   ```bash
   git clone https://github.com/nobody87777/Multitaskcoder-.git
   cd Multitaskcoder-
   ```
2. Start the built-in HTTP server:
   ```bash
   node server.js
   # or
   npm start
   ```
3. Open your browser to `http://localhost:8080/`.

---

## Running Automated Verification Suites

The codebase includes three standalone verification suites:

### 1. Educational Content Validator (567 Datasets)
Verifies JSON syntax, schema compliance, unique IDs, reference integrity, and compiles code snippets using local `python` and `javac`:
```bash
node tools/validate-all.js
```

### 2. End-to-End Test Suite (121 Assertions)
Launches a test HTTP server, verifies all endpoints, MIME types, directory traversal security, PWA cache integrity, JavaScript module exports, state persistence, calculation utilities, and simulated user progression:
```bash
node tools/test-e2e.mjs
```

### 3. Real-Browser Automation Suite (92 Assertions)
Spawns a real headless Google Chrome browser via Chrome DevTools Protocol (CDP), navigates through every route, tests theme switching, simulates keystrokes in the typing engine, verifies debugger solutions, tests localStorage across reloads, audits viewport responsiveness, and ensures 0 console errors and 0 failed network requests:
```bash
node tools/test-browser.mjs
```

---

## Deployment to GitHub Pages

MultitaskCoder is deployed via GitHub Pages from the `main` branch:
- **Base URL**: `https://nobody87777.github.io/Multitaskcoder-/`
- **Relative Path Design**: All resource links (`./css/...`, `./js/...`, `./data/...`, `./manifest.webmanifest`) are relative. This ensures complete asset resolution whether hosted under a root domain (`https://example.com/`) or a subdirectory path (`https://nobody87777.github.io/Multitaskcoder-/`).
- **SPA Routing**: The app uses standard browser hash routing (`#home`, `#learn`, `#typing`, `#debugger`, `#quizzes`, `#profile`). Reloading or sharing deep links works without requiring server-side URL rewriting.

---

## Progressive Web App (PWA) & Offline Capabilities

- **Manifest**: Located at `manifest.webmanifest` with standalone display mode, purple theme color (`#7c3aed`), and 192px/512px standard and maskable PNG/SVG launcher icons.
- **Service Worker (`sw.js`)**:
  - Automatically installs and precaches all 49 core shell assets (HTML shell, all 5 stylesheets, all 35 JS modules, and icon assets).
  - Employs a runtime cache for educational JSON files, allowing visited curriculum modules to be accessed fully offline.
  - Automatically purges obsolete cache versions on version bump (currently `multitaskcoder-v4.1`).

---

## Known Design Decisions & Limitations

1. **Live Code Sandbox Placeholder**:
   - The Sandbox module (`js/features/sandbox/sandbox-placeholder.js` / `#sandbox`) is intentionally maintained as a **read-only / demonstration placeholder**.
   - It contains a code editor view and explains that live in-browser code execution is disabled. No untrusted backend code execution (Judge0, Piston) or heavy WASM runtimes (Pyodide) are loaded.
2. **Initial User Progress**:
   - First-time visitors start with genuine initial values: Level 1, 0 XP, 0 streak, 0 gems, with empty completion records and clean "Start learning" callouts.
   - A built-in state migration automatically cleans up legacy mock seed values from early prototypes without affecting genuine learner progress.
3. **External Dependencies & Offline Fallback**:
   - Google Fonts and Font Awesome CDN are linked for enhanced typography and icons.
   - For all critical navigation and control elements, high-contrast inline SVG icons are embedded alongside icon font classes to guarantee visual rendering under offline or CDN-blocked conditions.

---

## License

This project is licensed under the MIT License.
