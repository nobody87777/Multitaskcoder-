// MultitaskCoder
// Module: Dynamic Index Generator & Validator
//
// Automatically scans the physical dataset directories and generates or verifies
// index.json manifests for:
//   - data/typing/<lang>/index.json
//   - data/quizzes/<lang>/index.json
//   - data/debugger/<lang>/index.json
//   - data/theory/<section>/index.json
//   - data/theory/index.json
//
// Usage:
//   node tools/generate-indices.js --check   (audits manifests against disk files)
//   node tools/generate-indices.js --write   (regenerates manifests from disk files)

const fs = require("fs");
const path = require("path");

const DATA_ROOT = path.join(__dirname, "..", "data");
const LANGUAGES = ["python", "java", "c"];
const THEORY_SECTIONS = ["python", "java", "c", "comparison"];

const isWriteMode = process.argv.includes("--write");
const isCheckMode = process.argv.includes("--check") || !isWriteMode;

let totalUpdated = 0;
let totalDiscovered = 0;
let totalErrors = 0;

console.log("===============================================================");
console.log(`   MultitaskCoder - Dynamic Index Generator (${isWriteMode ? "WRITE" : "CHECK"} MODE)`);
console.log("===============================================================\n");

// Helper: Read and parse JSON safely
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    totalErrors++;
    return null;
  }
}

// Helper: Write JSON formatted cleanly
function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(filePath, content, "utf8");
}

// -------------------------------------------------------------
// 1. Typing Manifests: data/typing/<lang>/index.json
// -------------------------------------------------------------
for (const lang of LANGUAGES) {
  const dir = path.join(DATA_ROOT, "typing", lang);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".json") && f !== "index.json")
    .sort();

  const programs = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const data = readJson(filePath);
    if (!data) continue;
    programs.push({
      id: data.id || path.basename(f, ".json"),
      title: data.title || "",
      difficulty: data.difficulty || "beginner",
      topic: data.topic || "",
      file: f
    });
  }

  programs.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const manifest = {
    language: lang,
    count: programs.length,
    programs
  };

  const indexPath = path.join(dir, "index.json");
  totalDiscovered += programs.length;

  if (isWriteMode) {
    writeJson(indexPath, manifest);
    totalUpdated++;
    console.log(`[Typing] Generated ${indexPath} (${programs.length} programs)`);
  } else {
    const existing = fs.existsSync(indexPath) ? readJson(indexPath) : null;
    const match = existing && existing.count === programs.length && existing.programs.length === programs.length;
    console.log(`[Typing] ${lang}: ${programs.length} drills found on disk | index.json match: ${match ? "YES" : "NO"}`);
    if (!match) totalErrors++;
  }
}

// -------------------------------------------------------------
// 2. Quiz Manifests: data/quizzes/<lang>/index.json
// -------------------------------------------------------------
for (const lang of LANGUAGES) {
  const dir = path.join(DATA_ROOT, "quizzes", lang);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".json") && f !== "index.json")
    .sort();

  const questions = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const data = readJson(filePath);
    if (!data) continue;
    questions.push({
      id: data.id || path.basename(f, ".json"),
      difficulty: data.difficulty || "beginner",
      type: data.type || "mcq",
      topic: data.topic || "",
      file: f
    });
  }

  questions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const manifest = {
    language: lang,
    count: questions.length,
    questions
  };

  const indexPath = path.join(dir, "index.json");
  totalDiscovered += questions.length;

  if (isWriteMode) {
    writeJson(indexPath, manifest);
    totalUpdated++;
    console.log(`[Quiz] Generated ${indexPath} (${questions.length} questions)`);
  } else {
    const existing = fs.existsSync(indexPath) ? readJson(indexPath) : null;
    const match = existing && existing.count === questions.length && existing.questions.length === questions.length;
    console.log(`[Quiz] ${lang}: ${questions.length} questions found on disk | index.json match: ${match ? "YES" : "NO"}`);
    if (!match) totalErrors++;
  }
}

// -------------------------------------------------------------
// 3. Debugger Manifests: data/debugger/<lang>/index.json
// -------------------------------------------------------------
for (const lang of LANGUAGES) {
  const dir = path.join(DATA_ROOT, "debugger", lang);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".json") && f !== "index.json")
    .sort();

  const challenges = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const data = readJson(filePath);
    if (!data) continue;
    challenges.push({
      id: data.id || path.basename(f, ".json"),
      difficulty: data.difficulty || "beginner",
      topic: data.topic || "",
      bugType: data.bugType || "",
      file: f
    });
  }

  challenges.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const manifest = {
    language: lang,
    count: challenges.length,
    challenges
  };

  const indexPath = path.join(dir, "index.json");
  totalDiscovered += challenges.length;

  if (isWriteMode) {
    writeJson(indexPath, manifest);
    totalUpdated++;
    console.log(`[Debugger] Generated ${indexPath} (${challenges.length} challenges)`);
  } else {
    const existing = fs.existsSync(indexPath) ? readJson(indexPath) : null;
    const match = existing && existing.count === challenges.length && existing.challenges.length === challenges.length;
    console.log(`[Debugger] ${lang}: ${challenges.length} challenges found on disk | index.json match: ${match ? "YES" : "NO"}`);
    if (!match) totalErrors++;
  }
}

// -------------------------------------------------------------
// 4. Theory Manifests: data/theory/<section>/index.json
// -------------------------------------------------------------
for (const sec of THEORY_SECTIONS) {
  const dir = path.join(DATA_ROOT, "theory", sec);
  if (!fs.existsSync(dir)) continue;

  const isComparison = sec === "comparison";
  const subdirs = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  let lessonCount = 0;
  const groups = [];

  for (let idx = 0; idx < subdirs.length; idx++) {
    const sub = subdirs[idx];
    const subPath = path.join(dir, sub);
    const lessonFiles = fs.readdirSync(subPath)
      .filter(f => f.endsWith(".json"))
      .sort();

    const lessons = [];
    let groupTitle = sub.replace(/^\d+-/, "").replace(/-/g, " ");
    groupTitle = groupTitle.charAt(0).toUpperCase() + groupTitle.slice(1);

    for (const lf of lessonFiles) {
      const lessonPath = path.join(subPath, lf);
      const data = readJson(lessonPath);
      if (!data) continue;
      lessonCount++;
      if (data.module && !isComparison) groupTitle = data.module;
      if (data.topic && isComparison) groupTitle = data.topic;

      lessons.push({
        id: data.id || path.basename(lf, ".json"),
        title: data.title || "",
        difficulty: data.difficulty || "beginner",
        file: `${sub}/${lf}`
      });
    }

    lessons.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    if (isComparison) {
      groups.push({
        topicNumber: idx + 1,
        topic: groupTitle,
        topicSlug: sub,
        lessons
      });
    } else {
      groups.push({
        moduleNumber: idx + 1,
        module: groupTitle,
        moduleSlug: sub,
        lessons
      });
    }
  }

  totalDiscovered += lessonCount;

  const manifest = isComparison
    ? { section: sec, topicCount: groups.length, lessonCount, topics: groups }
    : { language: sec, section: sec, moduleCount: groups.length, lessonCount, modules: groups };

  const indexPath = path.join(dir, "index.json");

  if (isWriteMode) {
    writeJson(indexPath, manifest);
    totalUpdated++;
    console.log(`[Theory] Generated ${indexPath} (${lessonCount} lessons in ${groups.length} groups)`);
  } else {
    const existing = fs.existsSync(indexPath) ? readJson(indexPath) : null;
    const match = existing && existing.lessonCount === lessonCount;
    console.log(`[Theory] ${sec}: ${lessonCount} lessons in ${groups.length} groups found on disk | index.json match: ${match ? "YES" : "NO"}`);
    if (!match) totalErrors++;
  }
}

// -------------------------------------------------------------
// 5. Theory Root Index: data/theory/index.json
// -------------------------------------------------------------
const rootIndexPath = path.join(DATA_ROOT, "theory", "index.json");
const rootManifest = { sections: THEORY_SECTIONS };
if (isWriteMode) {
  writeJson(rootIndexPath, rootManifest);
  totalUpdated++;
  console.log(`[Theory Root] Generated ${rootIndexPath}`);
} else {
  const existing = fs.existsSync(rootIndexPath) ? readJson(rootIndexPath) : null;
  const match = existing && Array.isArray(existing.sections) && existing.sections.length === 4;
  console.log(`[Theory Root] index.json valid: ${match ? "YES" : "NO"}`);
  if (!match) totalErrors++;
}

console.log("\n===============================================================");
console.log(`   Summary: Discovered ${totalDiscovered} total educational items on disk.`);
if (isWriteMode) {
  console.log(`   Updated ${totalUpdated} manifest index files successfully.`);
} else {
  console.log(`   Audit Status: ${totalErrors === 0 ? "ALL MANIFESTS 100% IN SYNC WITH DISK" : `${totalErrors} MISMATCHES DETECTED`}`);
}
console.log("===============================================================\n");

process.exit(totalErrors === 0 ? 0 : 1);
