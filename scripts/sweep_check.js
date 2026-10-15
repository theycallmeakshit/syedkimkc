const fs = require('fs');
const path = require('path');

const terms = [
  '\u2014', // em dash
  '\u2013', // en dash
  '&mdash;',
  'gradient',
  'purple',
  'violet',
  'indigo',
  'rounded-full',
  'border-radius: 9999px',
  'mousemove',
  'pointermove',
  'IntersectionObserver',
  'Lorem',
  'Acme',
  'John Doe'
];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next' || file === '__pycache__' || file === 'sweep_check.js') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      if (!file.endsWith('.pyc') && file !== 'package-lock.json') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const files = walk('.');
let totalHits = 0;

for (const term of terms) {
  const hits = [];
  const lowerTerm = term.toLowerCase();
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerTerm)) {
        hits.push({ file: f, line: index + 1, text: line.trim() });
      }
    });
  }
  if (hits.length > 0) {
    console.log(`=== Hit for: "${term}" (${hits.length}) ===`);
    hits.slice(0, 15).forEach(h => console.log(`  ${h.file}:${h.line} -> ${h.text.slice(0, 100)}`));
    totalHits += hits.length;
  }
}

console.log(`Total hits across all terms: ${totalHits}`);
