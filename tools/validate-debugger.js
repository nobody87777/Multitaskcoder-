// MultitaskCoder
// Module: Debugger Data Validator
//
// Validates data/debugger/<language>/*.json for the Python, Java, and C
// debugging challenge sets. Run with: node tools/validate-debugger.js
//
// Checks performed on every challenge record:
//   - file is valid JSON
//   - id, language, difficulty, topic, bugType, title, description, buggyCode,
//     expectedBehavior, actualProblem, correctedCode, expectedOutput,
//     explanation, concepts are all present
//   - id is unique within its language and matches the filename
//   - language matches the containing folder
//   - difficulty is one of: beginner, intermediate, advanced
//   - buggyCode and correctedCode are non-empty and NOT identical to each other
//     (a challenge whose "buggy" code equals its "fix" isn't a real bug)
//   - concepts is a non-empty array of strings
//
// Also checks, per language:
//   - exactly 50 challenge files (not counting index.json)
//   - no duplicate ids, titles, descriptions, buggyCode, or correctedCode
//
// Best-effort execution validation (never fabricated):
//   - Python: if `python` is on PATH, both buggyCode and correctedCode are
//     actually executed. correctedCode's stdout is compared against
//     expectedOutput. buggyCode is expected to NOT behave correctly — it
//     should error, hang (for bugType "infinite-loop", run with a short
//     timeout), or produce output that differs from expectedOutput. A buggy
//     snippet that runs cleanly AND matches expectedOutput is flagged as a
//     suspected "fake bug".
//   - Java: if `javac`/`java` are on PATH, the same approach is used —
//     correctedCode must compile, run, and match; buggyCode is expected to
//     fail to compile, fail to run, hang, or produce the wrong output.
//   - C: NOT compiled (no C compiler dependency for this validator). Only a
//     structural check (balanced braces/parens) is performed on
//     correctedCode. This is reported explicitly rather than claimed as a
//     full compilation check.
//
// This script never claims a program "compiles" or "runs correctly" unless it
// was actually executed by this script.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const DATA_ROOT = path.join(__dirname, "..", "data", "debugger");
const LANGUAGES = ["python", "java", "c"];
const EXPECTED_COUNT = 50;
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const errors = [];
const warnings = [];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeWs(s) {
  return s.replace(/\s+/g, " ").trim();
}

function commandExists(cmd, versionArgs) {
  try {
    execFileSync(cmd, versionArgs, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runPython(code, input, timeoutMs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-dbgval-py-"));
  const file = path.join(dir, "snippet.py");
  fs.writeFileSync(file, code, "utf8");
  try {
    const stdout = execFileSync("python", [file], {
      cwd: dir, input: input ? input + "\n" : "", encoding: "utf8", timeout: timeoutMs
    });
    return { ok: true, stdout, timedOut: false };
  } catch (e) {
    const timedOut = e.signal === "SIGTERM" || /ETIMEDOUT/.test(e.code || "");
    return { ok: false, stdout: (e.stdout || "").toString(), stderr: (e.stderr || e.message || "").toString(), timedOut };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function extractJavaClassName(code) {
  const pub = code.match(/public\s+class\s+(\w+)/);
  if (pub) return pub[1];
  const anyClass = code.match(/(?:^|\n)\s*class\s+(\w+)/);
  return anyClass ? anyClass[1] : null;
}

function compileAndRunJava(code, input, timeoutMs) {
  const className = extractJavaClassName(code);
  if (!className) return { compiled: false, compileError: "no class found" };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-dbgval-java-"));
  const file = path.join(dir, `${className}.java`);
  fs.writeFileSync(file, code, "utf8");
  const result = { compiled: false, ran: false };
  try {
    execFileSync("javac", [`${className}.java`], { cwd: dir, encoding: "utf8", timeout: 20000 });
    result.compiled = true;
  } catch (e) {
    result.compileError = (e.stderr || e.message || "").toString();
    fs.rmSync(dir, { recursive: true, force: true });
    return result;
  }
  try {
    result.stdout = execFileSync("java", [className], {
      cwd: dir, input: input ? input + "\n" : "", encoding: "utf8", timeout: timeoutMs
    });
    result.ran = true;
  } catch (e) {
    result.timedOut = e.signal === "SIGTERM" || /ETIMEDOUT/.test(e.code || "");
    result.runError = (e.stderr || e.message || "").toString();
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
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

  console.log("MultitaskCoder Debugger Data Validator");
  console.log("=========================================\n");
  console.log(`python on PATH: ${pythonAvailable ? "yes" : "no"}`);
  console.log(`javac/java on PATH: ${javacAvailable ? "yes" : "no"}`);
  console.log("C compiler: not used by this validator — correctedCode receives a structural check only.\n");

  const perLanguageCounts = {};
  const perLanguageDifficulty = {};
  const dedupeMaps = {}; // lang -> { titles: Map, descriptions: Map, buggy: Map, corrected: Map }
  let pyExecuted = 0, pyBuggyConfirmed = 0, pyBuggySuspect = 0, pyCorrectedOk = 0, pyCorrectedFailed = 0;
  let javaExecuted = 0, javaBuggyConfirmed = 0, javaBuggySuspect = 0, javaCorrectedOk = 0, javaCorrectedFailed = 0;
  let cStructuralChecked = 0, cStructuralIssues = 0;

  for (const lang of LANGUAGES) {
    const dir = path.join(DATA_ROOT, lang);
    if (!fs.existsSync(dir)) {
      errors.push(`Missing directory: data/debugger/${lang}`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "index.json");
    perLanguageCounts[lang] = files.length;
    perLanguageDifficulty[lang] = { beginner: 0, intermediate: 0, advanced: 0 };
    dedupeMaps[lang] = { titles: new Map(), descriptions: new Map(), buggy: new Map(), corrected: new Map() };

    if (files.length !== EXPECTED_COUNT) {
      errors.push(`${lang}: expected ${EXPECTED_COUNT} challenge files, found ${files.length}`);
    }

    const seenIds = new Set();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const expectedId = file.replace(/\.json$/, "");
      let c;

      try {
        c = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        errors.push(`${lang}/${file}: invalid JSON (${e.message})`);
        continue;
      }

      const requiredStringFields = [
        "id", "language", "difficulty", "topic", "bugType", "title", "description",
        "buggyCode", "expectedBehavior", "actualProblem", "correctedCode",
        "expectedOutput", "explanation"
      ];
      for (const field of requiredStringFields) {
        if (!isNonEmptyString(c[field])) {
          errors.push(`${lang}/${file}: missing or empty required field "${field}"`);
        }
      }

      if (c.id && c.id !== expectedId) errors.push(`${lang}/${file}: id "${c.id}" does not match filename`);
      if (c.id) {
        if (seenIds.has(c.id)) errors.push(`${lang}/${file}: duplicate id "${c.id}"`);
        seenIds.add(c.id);
      }

      if (c.language && c.language !== lang) errors.push(`${lang}/${file}: language "${c.language}" does not match folder "${lang}"`);
      if (c.difficulty && !VALID_DIFFICULTIES.includes(c.difficulty)) errors.push(`${lang}/${file}: invalid difficulty "${c.difficulty}"`);
      if (c.difficulty && perLanguageDifficulty[lang][c.difficulty] !== undefined) perLanguageDifficulty[lang][c.difficulty]++;

      if (!Array.isArray(c.concepts) || c.concepts.length === 0 || !c.concepts.every(isNonEmptyString)) {
        errors.push(`${lang}/${file}: "concepts" must be a non-empty array of strings`);
      }

      if (isNonEmptyString(c.buggyCode) && isNonEmptyString(c.correctedCode)) {
        if (c.buggyCode.trim() === c.correctedCode.trim()) {
          errors.push(`${lang}/${file}: buggyCode and correctedCode are identical — not a real bug`);
        }
      }

      // Duplicate detection
      const dm = dedupeMaps[lang];
      if (isNonEmptyString(c.title)) {
        const key = normalizeWs(c.title).toLowerCase();
        if (dm.titles.has(key)) errors.push(`${lang}: duplicate title between ${dm.titles.get(key)} and ${c.id || expectedId}`);
        else dm.titles.set(key, c.id || expectedId);
      }
      if (isNonEmptyString(c.description)) {
        const key = normalizeWs(c.description).toLowerCase();
        if (dm.descriptions.has(key)) warnings.push(`${lang}: suspiciously similar description between ${dm.descriptions.get(key)} and ${c.id || expectedId}`);
        else dm.descriptions.set(key, c.id || expectedId);
      }
      if (isNonEmptyString(c.buggyCode)) {
        const key = normalizeWs(c.buggyCode);
        if (dm.buggy.has(key)) errors.push(`${lang}: identical buggyCode between ${dm.buggy.get(key)} and ${c.id || expectedId}`);
        else dm.buggy.set(key, c.id || expectedId);
      }
      if (isNonEmptyString(c.correctedCode)) {
        const key = normalizeWs(c.correctedCode);
        if (dm.corrected.has(key)) errors.push(`${lang}: identical correctedCode between ${dm.corrected.get(key)} and ${c.id || expectedId}`);
        else dm.corrected.set(key, c.id || expectedId);
      }

      // Best-effort execution checks
      if (lang === "python" && pythonAvailable && isNonEmptyString(c.buggyCode) && isNonEmptyString(c.correctedCode)) {
        pyExecuted++;
        const isInfinite = c.bugType === "infinite-loop";
        const buggy = runPython(c.buggyCode, c.exampleInput, isInfinite ? 3000 : 10000);
        const corrected = runPython(c.correctedCode, c.exampleInput, 10000);

        const buggyLooksReal = isInfinite ? buggy.timedOut : (!buggy.ok || normalizeWs(buggy.stdout) !== normalizeWs(c.expectedOutput));
        if (buggyLooksReal) pyBuggyConfirmed++;
        else { pyBuggySuspect++; warnings.push(`${lang}/${file}: buggyCode ran cleanly and matched expectedOutput — possible "fake bug"`); }

        if (corrected.ok && normalizeWs(corrected.stdout) === normalizeWs(c.expectedOutput)) {
          pyCorrectedOk++;
        } else {
          pyCorrectedFailed++;
          // expectedOutput is sometimes intentionally descriptive prose (e.g. for
          // non-deterministic set ordering, or file-only side effects with no stdout) —
          // only hard-fail when correctedCode actually errored or hung.
          if (!corrected.ok) {
            errors.push(`${lang}/${file}: correctedCode failed to run cleanly — ${(corrected.stderr || "").split("\n").slice(-2).join(" | ")}`);
          } else {
            warnings.push(`${lang}/${file}: correctedCode stdout did not literally match expectedOutput text (may be descriptive/non-deterministic expectedOutput)`);
          }
        }
      }

      if (lang === "java" && javacAvailable && isNonEmptyString(c.buggyCode) && isNonEmptyString(c.correctedCode)) {
        javaExecuted++;
        const isInfinite = c.bugType === "infinite-loop";
        const buggy = compileAndRunJava(c.buggyCode, c.exampleInput, isInfinite ? 3000 : 10000);
        const corrected = compileAndRunJava(c.correctedCode, c.exampleInput, 10000);

        const buggyLooksReal = !buggy.compiled || (isInfinite ? buggy.timedOut : (!buggy.ran || normalizeWs(buggy.stdout || "") !== normalizeWs(c.expectedOutput)));
        if (buggyLooksReal) javaBuggyConfirmed++;
        else { javaBuggySuspect++; warnings.push(`${lang}/${file}: buggyCode compiled, ran cleanly, and matched expectedOutput — possible "fake bug" (or a bug not observable via stdout, e.g. a file-content or timing issue)`); }

        if (corrected.compiled && corrected.ran && normalizeWs(corrected.stdout) === normalizeWs(c.expectedOutput)) {
          javaCorrectedOk++;
        } else {
          javaCorrectedFailed++;
          if (!corrected.compiled) errors.push(`${lang}/${file}: correctedCode failed to compile — ${(corrected.compileError || "").split("\n").slice(0, 2).join(" | ")}`);
          else if (!corrected.ran) errors.push(`${lang}/${file}: correctedCode failed to run — ${(corrected.runError || "").split("\n").slice(0, 2).join(" | ")}`);
          else warnings.push(`${lang}/${file}: correctedCode stdout did not literally match expectedOutput text`);
        }
      }

      if (lang === "c" && isNonEmptyString(c.correctedCode)) {
        cStructuralChecked++;
        const issues = checkCStructure(c.correctedCode);
        if (issues.length) {
          cStructuralIssues++;
          errors.push(`${lang}/${file}: correctedCode structural check failed — ${issues.join(", ")}`);
        }
      }
    }

    const indexPath = path.join(dir, "index.json");
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        if (!Array.isArray(index.challenges) || index.challenges.length !== EXPECTED_COUNT) {
          errors.push(`${lang}/index.json: expected ${EXPECTED_COUNT} entries, found ${Array.isArray(index.challenges) ? index.challenges.length : "N/A"}`);
        }
      } catch (e) {
        errors.push(`${lang}/index.json: invalid JSON (${e.message})`);
      }
    } else {
      warnings.push(`${lang}: no index.json manifest found (the debugger engine needs this to discover challenges)`);
    }
  }

  console.log("Challenge file counts:");
  for (const lang of LANGUAGES) console.log(`  ${lang}: ${perLanguageCounts[lang] ?? 0} / ${EXPECTED_COUNT}`);

  console.log("\nDifficulty distribution:");
  for (const lang of LANGUAGES) {
    if (perLanguageDifficulty[lang]) {
      const d = perLanguageDifficulty[lang];
      console.log(`  ${lang}: beginner=${d.beginner}, intermediate=${d.intermediate}, advanced=${d.advanced}`);
    }
  }

  console.log(`\nPython: executed ${pyExecuted} challenges (buggy confirmed=${pyBuggyConfirmed}, suspect=${pyBuggySuspect}; corrected exact-match=${pyCorrectedOk}, non-matching=${pyCorrectedFailed})`);
  console.log(`Java: executed ${javaExecuted} challenges (buggy confirmed=${javaBuggyConfirmed}, suspect=${javaBuggySuspect}; corrected exact-match=${javaCorrectedOk}, non-matching=${javaCorrectedFailed})`);
  console.log(`C: correctedCode structurally checked=${cStructuralChecked} (issues: ${cStructuralIssues}); no C compiler was invoked.`);

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
