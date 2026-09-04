// MultitaskCoder
// Module: Sandbox (Placeholder - Not Implemented)
// Note: Per design requirement, Sandbox is left as an unfinished placeholder.

import { escapeHtml } from "../../utils.js";

/**
 * Renders the Sandbox placeholder view.
 */
export function renderSandboxPlaceholder(container) {
  container.innerHTML = `
    <div id="tab-code-view" class="tab-content active glass-card rounded-3xl p-5 border border-purple-500/30 space-y-4 shadow-xl animate-[fadeInScale_0.3s_ease_forwards]">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-laptop-code text-purple-400 text-base"></i>
          <h2 class="font-bold text-sm">Live Code Sandbox</h2>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Beta / Placeholder</span>
        </div>
        <select id="codeLangSelect" class="sub-card rounded-xl px-2.5 py-1 text-xs text-purple-400 font-semibold focus:outline-none">
          <option value="python">Python 3.11</option>
          <option value="java">Java 17</option>
          <option value="c">C (GCC)</option>
        </select>
      </div>

      <p class="text-xs opacity-75">Interactive in-browser code editor placeholder. Full remote execution sandboxing is scheduled for a subsequent release.</p>

      <!-- Interactive Code Editor -->
      <div class="code-box rounded-2xl p-4 code-font text-xs space-y-2 shadow-inner">
        <textarea id="sandboxCode" class="w-full h-36 bg-transparent resize-none focus:outline-none leading-relaxed" spellcheck="false">def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

print("Fibonacci(6) =", calculate_fibonacci(6))</textarea>
      </div>

      <div class="flex space-x-2">
        <button id="btnRunSandbox" class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-lg glow-btn flex items-center justify-center space-x-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer">
          <i class="fa-solid fa-play"></i>
          <span>Run Code</span>
        </button>
        <button id="btnClearSandbox" class="px-4 py-3 rounded-2xl sub-card font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
          Clear
        </button>
      </div>

      <!-- Output Box -->
      <div class="space-y-1.5 pt-2">
        <span class="text-[11px] font-bold opacity-75">Execution Output:</span>
        <div id="sandboxOutput" class="sub-card rounded-2xl p-3 code-font text-xs text-emerald-400 min-h-[60px] flex items-center">
          Click "Run Code" to compile and execute snippet...
        </div>
      </div>
    </div>
  `;

  const btnRun = container.querySelector("#btnRunSandbox");
  const btnClear = container.querySelector("#btnClearSandbox");
  const codeArea = container.querySelector("#sandboxCode");
  const outputBox = container.querySelector("#sandboxOutput");

  if (btnRun && outputBox) {
    btnRun.addEventListener("click", () => {
      outputBox.innerHTML = '<span class="text-amber-400 animate-pulse">Compiling & executing...</span>';
      setTimeout(() => {
        outputBox.innerHTML = 'Fibonacci(6) = 8<br><span class="text-purple-400 font-bold">[Execution finished in 42ms with 0 errors (Simulated Sandbox)]</span>';
      }, 500);
    });
  }

  if (btnClear && codeArea && outputBox) {
    btnClear.addEventListener("click", () => {
      codeArea.value = "";
      outputBox.innerHTML = "Sandbox cleared.";
    });
  }
}
