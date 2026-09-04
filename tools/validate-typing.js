// MultitaskCoder
// Module: Typing Data Validator
//
// Validates data/typing/<language>/*.json for the Python, Java, and C typing
// exercise sets. Run with: node tools/validate-typing.js
//
// Checks performed on every program record:
//   - file is valid JSON
//   - id, language, title, difficulty, topic, description, code, concepts present
//   - id is unique within its language and matches the filename
//   - language matches the containing folder
//   - difficulty is one of: beginner, intermediate, advanced
//   - code is a non-empty string
//   - expectedOutput is present and non-empty where the exercise produces output
//   - concepts is a non-empty array of strings
//
// Also checks, per language:
//   - exactly 50 program files (not counting index.json)
//   - no duplicate ids
//
// Basic syntax validation (best effort, never required):
//   - Python: `python -m py_compile` if a `python` executable is on PATH
//   - Java:   `javac` compiles each program if `javac` is on PATH
//   - C:      structural checks only (balanced braces/parens, #include <stdio.h>,
//             int main(), a return statement) — this script does NOT invoke a C
//             compiler. If gcc/clang is not available in this environment, that is
//             reported explicitly rather than claiming programs "compile".
//
// This script never fabricates a pass. If a compiler/interpreter isn't found on
// PATH, the corresponding syntax check is reported as SKIPPED, not PASSED.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const DATA_ROOT = path.join(__dirname, "..", "data", "typing");
const LANGUAGES = ["python", "java", "c"];
const EXPECTED_COUNT = 50;
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const errors = [];
const warnings = [];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function commandExists(cmd, versionArgs) {
  try {
    execFileSync(cmd, versionArgs, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkPythonSyntax(id, code, pythonAvailable) {
  if (!pythonAvailable) return { status: "SKIPPED", detail: "python not found on PATH" };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-validate-py-"));
  const file = path.join(dir, "program.py");
  fs.writeFileSync(file, code, "utf8");
  try {
    execFileSync("python", ["-m", "py_compile", file], { stdio: "pipe" });
    return { status: "PASSED" };
  } catch (e) {
    return { status: "FAILED", detail: (e.stderr || e.message).toString() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function checkJavaSyntax(id, code, javacAvailable) {
  if (!javacAvailable) return { status: "SKIPPED", detail: "javac not found on PATH" };
  const match = code.match(/public\s+class\s+(\w+)/);
  if (!match) return { status: "FAILED", detail: "no public class found" };
  const className = match[1];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-validate-java-"));
  const file = path.join(dir, `${className}.java`);
  fs.writeFileSync(file, code, "utf8");
  try {
    execFileSync("javac", [`${className}.java`], { cwd: dir, stdio: "pipe" });
    return { status: "PASSED" };
  } catch (e) {
    return { status: "FAILED", detail: (e.stderr || e.message).toString() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function checkCStructure(id, code) {
  const issues = [];
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes) issues.push(`unbalanced braces (${opens} open, ${closes} close)`);

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) issues.push(`unbalanced parens (${openParens} open, ${closeParens} close)`);

  if (!/#include\s*<stdio\.h>/.test(code)) issues.push("missing #include <stdio.h>");
  if (!/int\s+main\s*\(/.test(code)) issues.push("missing int main(");
  if (!/return\s+\d+\s*;/.test(code)) issues.push("missing return statement in main");

  return issues.length
    ? { status: "FAILED", detail: issues.join("; ") }
    : { status: "PASSED (structural only — no C compiler invoked)" };
}

function main() {
  const pythonAvailable = commandExists("python", ["--version"]);
  const javacAvailable = commandExists("javac", ["-version"]);
  const gccAvailable = commandExists("gcc", ["--version"]) || commandExists("clang", ["--version"]);

  console.log("MultitaskCoder Typing Data Validator");
  console.log("=====================================\n");
  console.log(`python on PATH: ${pythonAvailable ? "yes" : "no"}`);
  console.log(`javac on PATH:  ${javacAvailable ? "yes" : "no"}`);
  console.log(`C compiler (gcc/clang) on PATH: ${gccAvailable ? "yes" : "no (C checks are structural-only)"}\n`);

  const perLanguageCounts = {};
  const syntaxSummary = { python: { PASSED: 0, FAILED: 0, SKIPPED: 0 }, java: { PASSED: 0, FAILED: 0, SKIPPED: 0 }, c: { PASSED: 0, FAILED: 0 } };

  for (const lang of LANGUAGES) {
    const dir = path.join(DATA_ROOT, lang);
    if (!fs.existsSync(dir)) {
      errors.push(`Missing directory: data/typing/${lang}`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "index.json");
    perLanguageCounts[lang] = files.length;

    if (files.length !== EXPECTED_COUNT) {
      errors.push(`${lang}: expected ${EXPECTED_COUNT} program files, found ${files.length}`);
    }

    const seenIds = new Set();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const expectedId = file.replace(/\.json$/, "");
      let record;

      try {
        record = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        errors.push(`${lang}/${file}: invalid JSON (${e.message})`);
        continue;
      }

      // Required fields
      const requiredStringFields = ["id", "language", "title", "difficulty", "topic", "description", "code"];
      for (const field of requiredStringFields) {
        if (!isNonEmptyString(record[field])) {
          errors.push(`${lang}/${file}: missing or empty required field "${field}"`);
        }
      }

      if (!isNonEmptyString(record.expectedOutput)) {
        errors.push(`${lang}/${file}: missing or empty "expectedOutput"`);
      }

      if (!Array.isArray(record.concepts) || record.concepts.length === 0 || !record.concepts.every(isNonEmptyString)) {
        errors.push(`${lang}/${file}: "concepts" must be a non-empty array of strings`);
      }

      if (record.id && record.id !== expectedId) {
        errors.push(`${lang}/${file}: id "${record.id}" does not match filename`);
      }

      if (record.id) {
        if (seenIds.has(record.id)) {
          errors.push(`${lang}/${file}: duplicate id "${record.id}"`);
        }
        seenIds.add(record.id);
      }

      if (record.language && record.language !== lang) {
        errors.push(`${lang}/${file}: language field "${record.language}" does not match folder "${lang}"`);
      }

      if (record.difficulty && !VALID_DIFFICULTIES.includes(record.difficulty)) {
        errors.push(`${lang}/${file}: invalid difficulty "${record.difficulty}"`);
      }

      // Best-effort syntax validation
      if (isNonEmptyString(record.code)) {
        if (lang === "python") {
          const result = checkPythonSyntax(record.id, record.code, pythonAvailable);
          syntaxSummary.python[result.status.split(" ")[0]] = (syntaxSummary.python[result.status.split(" ")[0]] || 0) + 1;
          if (result.status === "FAILED") errors.push(`${lang}/${file}: Python syntax check failed — ${result.detail}`);
        } else if (lang === "java") {
          const result = checkJavaSyntax(record.id, record.code, javacAvailable);
          syntaxSummary.java[result.status.split(" ")[0]] = (syntaxSummary.java[result.status.split(" ")[0]] || 0) + 1;
          if (result.status === "FAILED") errors.push(`${lang}/${file}: Java compilation failed — ${result.detail}`);
        } else if (lang === "c") {
          const result = checkCStructure(record.id, record.code);
          const key = result.status.startsWith("PASSED") ? "PASSED" : "FAILED";
          syntaxSummary.c[key] = (syntaxSummary.c[key] || 0) + 1;
          if (key === "FAILED") errors.push(`${lang}/${file}: C structural check failed — ${result.detail}`);
        }
      }
    }

    // index.json sanity check
    const indexPath = path.join(dir, "index.json");
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        if (!Array.isArray(index.programs) || index.programs.length !== EXPECTED_COUNT) {
          errors.push(`${lang}/index.json: expected ${EXPECTED_COUNT} entries, found ${Array.isArray(index.programs) ? index.programs.length : "N/A"}`);
        }
      } catch (e) {
        errors.push(`${lang}/index.json: invalid JSON (${e.message})`);
      }
    } else {
      warnings.push(`${lang}: no index.json manifest found (the typing engine needs this to discover programs)`);
    }
  }

  console.log("Program file counts:");
  for (const lang of LANGUAGES) {
    console.log(`  ${lang}: ${perLanguageCounts[lang] ?? 0} / ${EXPECTED_COUNT}`);
  }

  console.log("\nSyntax/structure check results:");
  console.log(`  python: ${JSON.stringify(syntaxSummary.python)}`);
  console.log(`  java:   ${JSON.stringify(syntaxSummary.java)}`);
  console.log(`  c:      ${JSON.stringify(syntaxSummary.c)} (structural only — no compiler was invoked)`);

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
