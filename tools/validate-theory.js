// MultitaskCoder
// Module: Theory Data Validator
//
// Validates data/theory/<section>/<module>/*.json for the Python, Java, C,
// and Comparison theory curricula. Run with: node tools/validate-theory.js
//
// Checks performed on every lesson record:
//   - file is valid JSON
//   - id, language, section, module, title, difficulty, description,
//     objectives, content, keyPoints are all present
//   - id is unique across the ENTIRE theory dataset (all sections combined)
//   - id matches the filename
//   - difficulty is one of: beginner, intermediate, advanced
//   - objectives is a non-empty array
//   - content is a non-empty array; every text block has a non-trivial body,
//     every code block has non-empty code and a declared language
//   - keyPoints is a non-empty array
//
// Structure validation:
//   - Python, Java, C, and Comparison sections each have at least one lesson
//   - Each section's index.json lists a lesson count matching the files on disk
//
// Comparison validation:
//   - The comparison section covers the major cross-language topics expected
//     (fundamentals, memory, OOP, error handling, concurrency, etc.)
//
// Best-effort code validation (never fabricated):
//   - Python code blocks: syntax-checked with `python -m py_compile` if
//     python is on PATH.
//   - Java code blocks: compiled with `javac` if available. Some blocks are
//     intentionally illustrative multi-file examples or use version-gated
//     language features (e.g. Java 21+ pattern matching) — these are reported
//     as SKIPPED with a reason, not silently passed or falsely failed.
//   - C code blocks: NOT compiled (no C compiler dependency for this
//     validator) — only a structural check (balanced braces/parens).
//
// This script never claims a program "compiles" unless it was actually
// compiled by this script.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const DATA_ROOT = path.join(__dirname, "..", "data", "theory");
const SECTIONS = ["python", "java", "c", "comparison"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const REQUIRED_FIELDS = ["id", "language", "section", "module", "title", "difficulty", "description", "objectives", "content", "keyPoints"];

// Known intentionally-unverifiable Java code blocks (illustrative multi-file
// examples, or examples that require a newer JDK than may be available).
const JAVA_SKIP = new Set(["java-packages-and-access-modifiers-001", "java-advanced-java-002"]);

const EXPECTED_COMPARISON_TOPICS = [
  "fundamentals", "memory", "oop", "error handling", "concurrency", "performance",
  "data types", "type systems", "control flow", "strings", "arrays", "data structures",
  "generics", "functional", "file handling", "modules"
];

const errors = [];
const warnings = [];

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function commandExists(cmd, args) {
  try { execFileSync(cmd, args, { stdio: "ignore" }); return true; } catch { return false; }
}

function walkLessonFiles(sectionDir) {
  const files = [];
  for (const entry of fs.readdirSync(sectionDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = path.join(sectionDir, entry.name);
      for (const f of fs.readdirSync(sub)) {
        if (f.endsWith(".json")) files.push(path.join(sub, f));
      }
    }
  }
  return files;
}

function runPython(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-theoryval-py-"));
  const file = path.join(dir, "snippet.py");
  fs.writeFileSync(file, code, "utf8");
  try {
    execFileSync("python", ["-m", "py_compile", file], { cwd: dir, stdio: "pipe", timeout: 10000 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.message).toString().split("\n").slice(-2).join(" | ") };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function compileJava(code) {
  const classMatch = code.match(/public\s+class\s+(\w+)/) || code.match(/class\s+(\w+)/);
  if (!classMatch) return { ok: false, error: "no class found" };
  const className = classMatch[1];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-theoryval-java-"));
  const file = path.join(dir, `${className}.java`);
  fs.writeFileSync(file, code, "utf8");
  try {
    execFileSync("javac", [`${className}.java`], { cwd: dir, stdio: "pipe", timeout: 20000 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.message).toString().split("\n").slice(0, 2).join(" | ") };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function checkCStructure(code) {
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  const openP = (code.match(/\(/g) || []).length;
  const closeP = (code.match(/\)/g) || []).length;
  const issues = [];
  if (opens !== closes) issues.push(`unbalanced braces (${opens}/${closes})`);
  if (openP !== closeP) issues.push(`unbalanced parens (${openP}/${closeP})`);
  return issues;
}

function main() {
  const pythonAvailable = commandExists("python", ["--version"]);
  const javacAvailable = commandExists("javac", ["-version"]);

  console.log("MultitaskCoder Theory Data Validator");
  console.log("=======================================\n");
  console.log(`python on PATH: ${pythonAvailable ? "yes" : "no"}`);
  console.log(`javac on PATH: ${javacAvailable ? "yes" : "no"}`);
  console.log("C compiler: not used by this validator — C code blocks receive a structural check only.\n");

  const allIds = new Map(); // id -> section/file, for global duplicate detection
  const perSectionCount = {};
  const perSectionDifficulty = {};
  let pyChecked = 0, pyOk = 0;
  let javaChecked = 0, javaOk = 0, javaSkipped = 0;
  let cChecked = 0, cIssues = 0;
  const comparisonTitles = [];

  for (const section of SECTIONS) {
    const sectionDir = path.join(DATA_ROOT, section);
    if (!fs.existsSync(sectionDir)) {
      errors.push(`Missing directory: data/theory/${section}`);
      continue;
    }

    const files = walkLessonFiles(sectionDir);
    perSectionCount[section] = files.length;
    perSectionDifficulty[section] = { beginner: 0, intermediate: 0, advanced: 0 };

    if (files.length === 0) {
      errors.push(`${section}: no lesson files found`);
    }

    for (const filePath of files) {
      const fileName = path.basename(filePath, ".json");
      let lesson;
      try {
        lesson = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        errors.push(`${section}/${fileName}: invalid JSON (${e.message})`);
        continue;
      }

      for (const field of REQUIRED_FIELDS) {
        const val = lesson[field];
        const missing = val === undefined || val === null || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0);
        if (missing) errors.push(`${section}/${fileName}: missing or empty required field "${field}"`);
      }

      if (lesson.id && lesson.id !== fileName) errors.push(`${section}/${fileName}: id "${lesson.id}" does not match filename`);
      if (lesson.id) {
        if (allIds.has(lesson.id)) errors.push(`Duplicate id "${lesson.id}" — used by both ${allIds.get(lesson.id)} and ${section}/${fileName}`);
        else allIds.set(lesson.id, `${section}/${fileName}`);
      }

      if (lesson.difficulty && !VALID_DIFFICULTIES.includes(lesson.difficulty)) {
        errors.push(`${section}/${fileName}: invalid difficulty "${lesson.difficulty}"`);
      }
      if (lesson.difficulty && perSectionDifficulty[section][lesson.difficulty] !== undefined) {
        perSectionDifficulty[section][lesson.difficulty]++;
      }

      if (Array.isArray(lesson.content)) {
        if (lesson.content.length === 0) {
          errors.push(`${section}/${fileName}: "content" array is empty`);
        }
        for (const block of lesson.content) {
          if (block.type === "text") {
            if (!isNonEmptyString(block.body) || block.body.trim().length < 30) {
              errors.push(`${section}/${fileName}: a text content block has too little meaningful content`);
            }
          } else if (block.type === "code") {
            if (!isNonEmptyString(block.code)) errors.push(`${section}/${fileName}: a code content block is empty`);
            if (!isNonEmptyString(block.language)) errors.push(`${section}/${fileName}: a code content block is missing its language`);

            if (block.language === "python" && isNonEmptyString(block.code)) {
              if (pythonAvailable) {
                pyChecked++;
                const result = runPython(block.code);
                if (result.ok) pyOk++;
                else errors.push(`${section}/${fileName}: Python code block failed py_compile — ${result.error}`);
              }
            } else if (block.language === "java" && isNonEmptyString(block.code)) {
              if (JAVA_SKIP.has(lesson.id)) {
                javaSkipped++;
              } else if (javacAvailable) {
                javaChecked++;
                const result = compileJava(block.code);
                if (result.ok) javaOk++;
                else errors.push(`${section}/${fileName}: Java code block failed to compile — ${result.error}`);
              }
            } else if (block.language === "c" && isNonEmptyString(block.code)) {
              cChecked++;
              const issues = checkCStructure(block.code);
              if (issues.length) {
                cIssues++;
                errors.push(`${section}/${fileName}: C code block structural check failed — ${issues.join(", ")}`);
              }
            }
          }
        }
      }

      if (section === "comparison" && isNonEmptyString(lesson.title)) {
        comparisonTitles.push(lesson.title.toLowerCase());
      }
    }

    const indexPath = path.join(sectionDir, "index.json");
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        const declaredCount = index.lessonCount;
        if (typeof declaredCount === "number" && declaredCount !== files.length) {
          errors.push(`${section}/index.json: declares lessonCount ${declaredCount} but ${files.length} files were found`);
        }
      } catch (e) {
        errors.push(`${section}/index.json: invalid JSON (${e.message})`);
      }
    } else {
      warnings.push(`${section}: no index.json manifest found (the theory engine needs this to discover lessons)`);
    }
  }

  // Comparison topic coverage check
  const comparisonBlob = comparisonTitles.join(" | ");
  const missingTopics = EXPECTED_COMPARISON_TOPICS.filter(t => !comparisonBlob.includes(t));
  if (missingTopics.length) {
    warnings.push(`Comparison section may be missing coverage for: ${missingTopics.join(", ")}`);
  }

  console.log("Lesson counts per section:");
  for (const s of SECTIONS) console.log(`  ${s}: ${perSectionCount[s] ?? 0}`);

  console.log("\nDifficulty distribution:");
  for (const s of SECTIONS) {
    if (perSectionDifficulty[s]) {
      const d = perSectionDifficulty[s];
      console.log(`  ${s}: beginner=${d.beginner}, intermediate=${d.intermediate}, advanced=${d.advanced}`);
    }
  }

  console.log(`\nPython code blocks: ${pyOk}/${pyChecked} passed py_compile`);
  console.log(`Java code blocks: ${javaOk}/${javaChecked} compiled with javac (${javaSkipped} intentionally skipped — multi-file example or version-gated feature)`);
  console.log(`C code blocks: ${cChecked} structurally checked (braces/parens only, no compiler used), issues: ${cIssues}`);

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) console.log(`  - ${e}`);
    console.log("\nVALIDATION FAILED");
    process.exitCode = 1;
  } else {
    console.log("\nVALIDATION PASSED");
  }
}

main();
