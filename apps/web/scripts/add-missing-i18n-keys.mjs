// One-shot: add missing en nav_* translation keys to apps/web/src/lib/i18n.ts
import fs from 'fs';

// 1. Collect tKey -> label pairs from the sidebar navigation definitions.
const layout = fs.readFileSync('src/components/AppLayout.tsx', 'utf8');
const map = new Map();
for (const line of layout.split('\n')) {
  const m = line.match(/label:\s*(['"])(.+?)\1/);
  const t = line.match(/tKey:\s*(['"])(.+?)\1/);
  if (m && t && !map.has(t[2])) map.set(t[2], m[2]);
}

// 2. Locate the English translation block in i18n.ts.
const file = 'src/lib/i18n.ts';
let i18n = fs.readFileSync(file, 'utf8');
const enStart = i18n.search(/\n  en: \{/);
if (enStart === -1) throw new Error('en block not found in i18n.ts');
const enEnd = i18n.indexOf('\n  },', enStart);
if (enEnd === -1) throw new Error('en block end not found in i18n.ts');
const enBlock = i18n.slice(enStart, enEnd);

const existing = new Set(
  [...enBlock.matchAll(/['"]([a-z0-9_.\-()]+)['"]:\s*['"]/g)].map((m) => m[1]),
);

// 3. Insert the missing keys just before the closing brace of the en block.
const additions = [];
for (const [key, label] of map) {
  if (existing.has(key)) continue;
  additions.push(`    '${key}': '${label.replace(/'/g, "\\'")}',`);
}
if (additions.length === 0) {
  console.log('No missing keys — nothing to do.');
  process.exit(0);
}

i18n = i18n.slice(0, enEnd) + additions.join('\n') + '\n' + i18n.slice(enEnd);
fs.writeFileSync(file, i18n);
console.log(`Added ${additions.length} en nav keys to ${file}`);
