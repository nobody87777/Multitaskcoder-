# MultitaskCoder

## Project Name
MultitaskCoder

## Purpose
MultitaskCoder is an all-in-one programming-learning platform. It will let learners
study language theory, practice speed typing of syntax, debug broken code snippets,
and take quizzes across Python, Java, and C — all from a single mobile-first web app.

## Architecture
The project uses a clean, modular vanilla frontend architecture (no framework,
no backend, no database):

```
app -> router -> pages -> features -> engines -> data
state -> storage -> progress
```

- `js/app.js` boots the application.
- `js/router.js` switches between views/tabs.
- `js/pages/*` compose each top-level page (Home, Learn, Typing, Debugger, Quizzes, Profile).
- `js/features/*` hold the engines/UI logic for Theory, Typing, Debugger, and Quiz.
- `js/state.js` / `js/storage.js` manage app state and persistence (progress, XP, streaks).
- `data/*` will hold the educational content (theory, typing drills, debugger
  challenges, quiz questions) per language, added in later phases.
- `tools/*` are standalone Node scripts that will validate the data files.

## Major Directories
- `assets/` — icons, images, fonts
- `css/` — main, themes, components, animations, responsive stylesheets
- `js/` — app core, components, pages, features
- `data/` — theory / typing / debugger / quizzes content, per language (currently empty)
- `tools/` — data validation scripts

## Reference
`project interface.html` is the original UI/design reference for this project.
It is preserved as-is and has not been modified.

## Status
This is the Phase 1A scaffold. Educational content, the Sandbox feature, and the
full interface implementation will be added in later phases.
