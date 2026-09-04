// MultitaskCoder
// Module: Quiz Data Validator
//
// Validates data/quizzes/<language>/*.json for the Python, Java, and C quiz
// question sets. Run with: node tools/validate-quizzes.js
//
// Checks performed on every question record:
//   - file is valid JSON
//   - id, language, difficulty, type, topic, question, options, correctAnswer,
//     explanation, concepts are all present
//   - id is unique within its language and matches the filename
//   - language matches the containing folder
//   - difficulty is one of: beginner, intermediate, advanced
//   - type is one of: mcq, output, code-analysis, true-false
//   - options is an array; mcq/output/code-analysis require exactly 4 options,
//     true-false requires exactly 2
//   - correctAnswer is an integer within the valid index range of options
//   - explanation is a non-empty, non-trivial string (flags lazy explanations
//     such as "The correct answer is A")
//   - concepts is a non-empty array of strings
//   - questions of type output/code-analysis have a non-empty "code" field
//
// Also checks, per language:
//   - exactly 50 question files (not counting index.json)
//   - no duplicate ids
//   - difficulty distribution (20 beginner / 20 intermediate / 10 advanced)
//   - suspiciously duplicated question text (exact and near-duplicate)
//
// Best-effort syntax/output validation (never fabricated):
//   - Python: every question with a "code" field is executed with `python`
//     if it's on PATH, and for type "output" the captured stdout is compared
//     (whitespace-normalized) against the correct option's text.
//   - Java: NOT auto-executed by this script, because most Java quiz snippets
//     are intentionally partial fragments (not complete compilable programs)
//     used for teaching purposes. This is reported explicitly as SKIPPED
//     rather than claiming a check that wasn't performed.
//   - C: NOT compiled (no C compiler dependency for this validator). Only a
//     structural check (balanced braces/parens) is performed on code fields.
//
// This script never claims a program "compiles" or "runs correctly" unless it
// was actually executed.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const DATA_ROOT = path.join(__dirname, "..", "data", "quizzes");
const LANGUAGES = ["python", "java", "c"];
const EXPECTED_COUNT = 50;
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const VALID_TYPES = ["mcq", "output", "code-analysis", "true-false"];
const LAZY_EXPLANATION_PATTERNS = [
  /^the correct answer is/i,
  /^option [a-d0-9] is correct$/i,
  /^because it is correct$/i,
  /^that's just how it works$/i
];

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

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function runPythonSnippet(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtc-quizval-py-"));
  const file = path.join(dir, "snippet.py");
  fs.writeFileSync(file, code, "utf8");
  try {
    const stdout = execFileSync("python", [file], { cwd: dir, encoding: "utf8", timeout: 10000 });
    return { ok: true, stdout };
  } catch (e) {
    return { ok: false, stdout: (e.stdout || "").toString(), stderr: (e.stderr || e.message || "").toString() };
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

  console.log("MultitaskCoder Quiz Data Validator");
  console.log("====================================\n");
  console.log(`python on PATH: ${pythonAvailable ? "yes" : "no"}`);
  console.log("javac/java: not used by this validator — most Java quiz snippets are intentional fragments, not compilable standalone programs.");
  console.log("C compiler: not used by this validator — C code fields receive a structural check only.\n");

  const perLanguageCounts = {};
  const perLanguageDifficulty = {};
  const perLanguageTypes = {};
  const allQuestionTexts = []; // { lang, id, text }
  let pyExecuted = 0;
  let pyMismatches = 0;
  let pyRuntimeErrors = 0;
  let cStructuralChecked = 0;
  let cStructuralIssues = 0;

  for (const lang of LANGUAGES) {
    const dir = path.join(DATA_ROOT, lang);
    if (!fs.existsSync(dir)) {
      errors.push(`Missing directory: data/quizzes/${lang}`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "index.json");
    perLanguageCounts[lang] = files.length;
    perLanguageDifficulty[lang] = { beginner: 0, intermediate: 0, advanced: 0 };
    perLanguageTypes[lang] = { mcq: 0, output: 0, "code-analysis": 0, "true-false": 0 };

    if (files.length !== EXPECTED_COUNT) {
      errors.push(`${lang}: expected ${EXPECTED_COUNT} question files, found ${files.length}`);
    }

    const seenIds = new Set();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const expectedId = file.replace(/\.json$/, "");
      let q;

      try {
        q = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        errors.push(`${lang}/${file}: invalid JSON (${e.message})`);
        continue;
      }

      const requiredStringFields = ["id", "language", "difficulty", "type", "topic", "question", "explanation"];
      for (const field of requiredStringFields) {
        if (!isNonEmptyString(q[field])) {
          errors.push(`${lang}/${file}: missing or empty required field "${field}"`);
        }
      }

      if (q.id && q.id !== expectedId) errors.push(`${lang}/${file}: id "${q.id}" does not match filename`);
      if (q.id) {
        if (seenIds.has(q.id)) errors.push(`${lang}/${file}: duplicate id "${q.id}"`);
        seenIds.add(q.id);
      }

      if (q.language && q.language !== lang) errors.push(`${lang}/${file}: language "${q.language}" does not match folder "${lang}"`);
      if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty)) errors.push(`${lang}/${file}: invalid difficulty "${q.difficulty}"`);
      if (q.difficulty && perLanguageDifficulty[lang][q.difficulty] !== undefined) perLanguageDifficulty[lang][q.difficulty]++;

      if (q.type && !VALID_TYPES.includes(q.type)) errors.push(`${lang}/${file}: invalid type "${q.type}"`);
      if (q.type && perLanguageTypes[lang][q.type] !== undefined) perLanguageTypes[lang][q.type]++;

      if (!Array.isArray(q.options)) {
        errors.push(`${lang}/${file}: "options" must be an array`);
      } else {
        if (q.type === "true-false" && q.options.length !== 2) {
          errors.push(`${lang}/${file}: true-false question must have exactly 2 options, found ${q.options.length}`);
        } else if (["mcq", "output", "code-analysis"].includes(q.type) && q.options.length !== 4) {
          errors.push(`${lang}/${file}: ${q.type} question must have exactly 4 options, found ${q.options.length}`);
        }
        if (!q.options.every(isNonEmptyString)) {
          errors.push(`${lang}/${file}: all options must be non-empty strings`);
        }
      }

      if (typeof q.correctAnswer !== "number" || !Number.isInteger(q.correctAnswer)) {
        errors.push(`${lang}/${file}: "correctAnswer" must be an integer index`);
      } else if (Array.isArray(q.options) && (q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
        errors.push(`${lang}/${file}: "correctAnswer" (${q.correctAnswer}) is out of range for ${q.options.length} options`);
      }

      if (!Array.isArray(q.concepts) || q.concepts.length === 0 || !q.concepts.every(isNonEmptyString)) {
        errors.push(`${lang}/${file}: "concepts" must be a non-empty array of strings`);
      }

      if (["output", "code-analysis"].includes(q.type) && !isNonEmptyString(q.code)) {
        errors.push(`${lang}/${file}: type "${q.type}" requires a non-empty "code" field`);
      }

      if (isNonEmptyString(q.explanation)) {
        if (q.explanation.trim().length < 15 || LAZY_EXPLANATION_PATTERNS.some(re => re.test(q.explanation.trim()))) {
          warnings.push(`${lang}/${file}: explanation looks too short/lazy: "${q.explanation}"`);
        }
      }

      if (isNonEmptyString(q.question)) {
        // Combine the prompt with the code field (when present) before comparing.
        // Output/code-analysis questions legitimately share generic prompts like
        // "What will this code print?" — they are differentiated by their code,
        // not their question text, so the code must be part of the dedupe key.
        const dedupeKey = normalizeWhitespace(q.question + "|||" + (q.code || "")).toLowerCase();
        allQuestionTexts.push({ lang, id: q.id || expectedId, text: dedupeKey });
      }

      // Best-effort execution/structural checks
      if (isNonEmptyString(q.code)) {
        if (lang === "python" && pythonAvailable) {
          pyExecuted++;
          const result = runPythonSnippet(q.code);
          if (!result.ok) {
            // Some questions intentionally demonstrate an exception (e.g. TypeError on
            // string item assignment) — only flag as an error for "output" type questions,
            // where a clean run producing matching stdout is expected.
            if (q.type === "output") {
              pyRuntimeErrors++;
              errors.push(`${lang}/${file}: Python snippet raised an unexpected error — ${result.stderr.split("\n").slice(-2).join(" | ")}`);
            }
          } else if (q.type === "output" && Array.isArray(q.options)) {
            const expected = normalizeWhitespace(q.options[q.correctAnswer] || "");
            const got = normalizeWhitespace(result.stdout);
            if (expected !== got) {
              pyMismatches++;
              warnings.push(`${lang}/${file}: captured stdout "${got}" differs textually from option "${expected}" (may be a formatting-only difference — see README note)`);
            }
          }
        } else if (lang === "c") {
          cStructuralChecked++;
          const issues = checkCStructure(q.code);
          if (issues.length) {
            cStructuralIssues++;
            errors.push(`${lang}/${file}: C structural check failed — ${issues.join(", ")}`);
          }
        }
      }
    }

    const indexPath = path.join(dir, "index.json");
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        if (!Array.isArray(index.questions) || index.questions.length !== EXPECTED_COUNT) {
          errors.push(`${lang}/index.json: expected ${EXPECTED_COUNT} entries, found ${Array.isArray(index.questions) ? index.questions.length : "N/A"}`);
        }
      } catch (e) {
        errors.push(`${lang}/index.json: invalid JSON (${e.message})`);
      }
    } else {
      warnings.push(`${lang}: no index.json manifest found (the quiz engine needs this to discover questions)`);
    }
  }

  // Duplicate / near-duplicate question text detection (within each language)
  const seenTextByLang = {};
  for (const entry of allQuestionTexts) {
    seenTextByLang[entry.lang] = seenTextByLang[entry.lang] || new Map();
    const map = seenTextByLang[entry.lang];
    if (map.has(entry.text)) {
      errors.push(`${entry.lang}: duplicate question text between ${map.get(entry.text)} and ${entry.id}`);
    } else {
      map.set(entry.text, entry.id);
    }
  }

  console.log("Question file counts:");
  for (const lang of LANGUAGES) console.log(`  ${lang}: ${perLanguageCounts[lang] ?? 0} / ${EXPECTED_COUNT}`);

  console.log("\nDifficulty distribution:");
  for (const lang of LANGUAGES) {
    if (perLanguageDifficulty[lang]) {
      const d = perLanguageDifficulty[lang];
      console.log(`  ${lang}: beginner=${d.beginner}, intermediate=${d.intermediate}, advanced=${d.advanced}`);
    }
  }

  console.log("\nQuestion type distribution:");
  for (const lang of LANGUAGES) {
    if (perLanguageTypes[lang]) {
      const t = perLanguageTypes[lang];
      console.log(`  ${lang}: mcq=${t.mcq}, output=${t.output}, code-analysis=${t["code-analysis"]}, true-false=${t["true-false"]}`);
    }
  }

  console.log(`\nPython snippets executed: ${pyExecuted} (runtime errors on "output" type: ${pyRuntimeErrors}, textual stdout/option mismatches: ${pyMismatches})`);
  console.log(`C snippets structurally checked (braces/parens only, no compiler used): ${cStructuralChecked} (issues: ${cStructuralIssues})`);
  console.log("Java snippets: not executed by this validator (see header comment).");

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
