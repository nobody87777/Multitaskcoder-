// MultitaskCoder
// Module: Utility Helpers

/**
 * Shorthand querySelector.
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand querySelectorAll as Array.
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Safely escapes HTML special characters.
 */
export function escapeHtml(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Lightweight regex-based syntax highlighter for Python, Java, and C snippets.
 * Produces clean HTML spans matching the app theme.
 */
export function highlightCode(code, language = "python") {
  if (!code) return "";

  // Common keywords across Python, Java, C
  const keywords = {
    python: /\b(def|class|if|elif|else|for|while|in|return|import|from|as|try|except|finally|with|lambda|yield|raise|assert|pass|break|continue|None|True|False|async|await|global|nonlocal)\b/g,
    java: /\b(public|private|protected|class|interface|enum|extends|implements|static|final|void|int|double|float|char|boolean|byte|short|long|new|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|throws|package|import|null|true|false|this|super)\b/g,
    c: /\b(int|char|float|double|void|short|long|unsigned|signed|struct|union|typedef|enum|auto|register|static|extern|const|volatile|return|if|else|for|while|do|switch|case|default|break|continue|goto|sizeof|NULL|true|false)\b/g
  };

  const langRegex = keywords[language] || keywords.python;

  // Protect and highlight comments, strings, numbers, keywords
  const lines = code.split("\n");
  const highlightedLines = lines.map(line => {
    let escaped = escapeHtml(line);

    // Comments: # for python, // for java/c
    const commentIdx = language === "python" ? escaped.indexOf("#") : escaped.indexOf("//");
    let commentPart = "";
    let codePart = escaped;
    if (commentIdx !== -1) {
      codePart = escaped.slice(0, commentIdx);
      commentPart = `<span class="text-gray-500 italic">${escaped.slice(commentIdx)}</span>`;
    }

    // Strings: "..." or '...'
    codePart = codePart.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, '<span class="text-emerald-400">$&</span>');

    // Numbers: digits
    codePart = codePart.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$&</span>');

    // Keywords
    codePart = codePart.replace(langRegex, '<span class="text-purple-400 font-semibold">$&</span>');

    // Function calls: identifier followed by (
    codePart = codePart.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="text-cyan-400">$&</span>');

    return codePart + commentPart;
  });

  return highlightedLines.join("\n");
}

/**
 * Calculates Words Per Minute (WPM) based on standard 5 chars per word.
 */
export function calculateWpm(charsCount, seconds) {
  if (seconds <= 0 || charsCount <= 0) return 0;
  const minutes = seconds / 60;
  const words = charsCount / 5;
  return Math.max(0, Math.round(words / minutes));
}

/**
 * Calculates accuracy percentage based on total chars typed and errors.
 */
export function calculateAccuracy(totalTyped, errors) {
  if (totalTyped <= 0) return 100;
  const correct = Math.max(0, totalTyped - errors);
  return Math.max(0, Math.min(100, Math.round((correct / totalTyped) * 100)));
}

/**
 * Formats seconds into MM:SS.
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
