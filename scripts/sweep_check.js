const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIRS_TO_CHECK = ["src", "tests", "scripts"];

const FORBIDDEN_STRINGS = [
  "\u2014", // em dash
  "\u2013", // en dash
  "&mdash;",
  "gradient",
  "purple",
  "violet",
  "rounded-full",
  "mousemove",
  "pointermove",
  "IntersectionObserver",
  "Lorem",
];

let violations = 0;

function sweep(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
        continue;
      }
      sweep(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|css|json|html)$/.test(entry.name)) {
      if (entry.name === "sweep_check.js") continue; // skip self
      const text = fs.readFileSync(fullPath, "utf-8");

      for (const term of FORBIDDEN_STRINGS) {
        if (text.includes(term)) {
          console.error(`[VIOLATION] Found "${term}" in: ${fullPath}`);
          violations++;
        }
      }
    }
  }
}

for (const d of DIRS_TO_CHECK) {
  sweep(path.join(ROOT, d));
}

if (violations === 0) {
  console.log("Sweep passed: 0 rule violations found across target directories.");
} else {
  console.error(`Sweep failed: ${violations} rule violation(s) found.`);
  process.exit(1);
}
