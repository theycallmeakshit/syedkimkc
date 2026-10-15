const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIRS_TO_CHECK = ["src", "tests"];

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
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|css|json)$/.test(entry.name)) {
      const text = fs.readFileSync(fullPath, "utf-8");
      
      // Check em dash and en dash
      if (text.includes("\u2014")) {
        console.error(`[VIOLATION] Em dash found in: ${fullPath}`);
        violations++;
      }
      if (text.includes("\u2013")) {
        console.error(`[VIOLATION] En dash found in: ${fullPath}`);
        violations++;
      }
      // Check purple/violet
      const lower = text.toLowerCase();
      if (lower.includes("purple") || lower.includes("violet")) {
        console.error(`[VIOLATION] Purple/violet token found in: ${fullPath}`);
        violations++;
      }
    }
  }
}

for (const d of DIRS_TO_CHECK) {
  sweep(path.join(ROOT, d));
}

if (violations === 0) {
  console.log("Sweep passed: 0 rule violations found in src/ and tests/.");
} else {
  console.error(`Sweep failed: ${violations} rule violation(s) found.`);
  process.exit(1);
}
