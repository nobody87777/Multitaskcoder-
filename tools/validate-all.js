// MultitaskCoder
// Module: Run All Validators
//
// Sequentially executes all 4 dataset validators:
//   1. tools/validate-theory.js   (117 theory lessons across Python, Java, C, Comparison)
//   2. tools/validate-typing.js   (150 typing drills across Python, Java, C)
//   3. tools/validate-debugger.js (150 debugging challenges across Python, Java, C)
//   4. tools/validate-quizzes.js  (150 quiz questions across Python, Java, C)
//
// Exits with code 0 if all validators pass, or code 1 if any validator fails.

const { spawnSync } = require("child_process");
const path = require("path");

const VALIDATORS = [
  { name: "Theory Curriculum", script: "validate-theory.js", count: "117 lessons" },
  { name: "Typing Practice Drills", script: "validate-typing.js", count: "150 drills" },
  { name: "Debugger Arena Challenges", script: "validate-debugger.js", count: "150 challenges" },
  { name: "Quizzes & Battles", script: "validate-quizzes.js", count: "150 questions" }
];

console.log("===============================================================");
console.log("   MultitaskCoder - Comprehensive Educational Dataset Audit    ");
console.log("===============================================================\n");
console.log(`Discovered ${VALIDATORS.length} validator suites to run.\n`);

const results = [];
let allPassed = true;

for (let i = 0; i < VALIDATORS.length; i++) {
  const v = VALIDATORS[i];
  console.log(`---------------------------------------------------------------`);
  console.log(`[${i + 1}/${VALIDATORS.length}] Running ${v.name} (${v.script}) [${v.count}]...`);
  console.log(`---------------------------------------------------------------`);

  const startTime = Date.now();
  const scriptPath = path.join(__dirname, v.script);

  const proc = spawnSync(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit"
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = proc.status === 0;

  if (!passed) {
    allPassed = false;
  }

  results.push({
    name: v.name,
    script: v.script,
    count: v.count,
    passed,
    status: proc.status,
    duration: `${durationSec}s`
  });

  console.log(`\n>>> [${passed ? "PASSED" : "FAILED"}] ${v.name} (${durationSec}s)\n`);
}

console.log("===============================================================");
console.log("                      VALIDATION SUMMARY                       ");
console.log("===============================================================");

for (const r of results) {
  const badge = r.passed ? "[ PASS ]" : "[ FAIL ]";
  console.log(`${badge} ${r.name.padEnd(28)} | ${r.count.padEnd(16)} | Duration: ${r.duration}`);
}

console.log("===============================================================");
if (allPassed) {
  console.log(" ALL VALIDATORS PASSED: Educational datasets are 100% verified!");
  console.log("===============================================================\n");
  process.exit(0);
} else {
  console.error(" ONE OR MORE VALIDATORS FAILED. Check output logs above.");
  console.log("===============================================================\n");
  process.exit(1);
}
