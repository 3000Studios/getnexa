import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'public/games/index.js'), 'utf8');
const ids = [...source.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);
const folders = [...source.matchAll(/mountExternalGame\('([^']+)'\)/g)].map((m) => m[1]);
const failures = [];
for (const folder of folders) {
  const file = path.join(root, 'public/games', folder, 'index.html');
  if (!fs.existsSync(file)) failures.push(`Missing external game entry: ${folder}/index.html`);
  else if (!/<(?:canvas|button|div|main|body)\b/i.test(fs.readFileSync(file, 'utf8'))) failures.push(`No playable markup: ${folder}`);
}
for (const file of fs.readdirSync(path.join(root, 'public/games')).filter((f) => f.endsWith('.js'))) {
  const text = fs.readFileSync(path.join(root, 'public/games', file), 'utf8');
  if (text.includes('<<<<<<<') || text.includes('>>>>>>>')) failures.push(`Conflict marker: ${file}`);
}
if (new Set(ids).size !== ids.length) failures.push('Duplicate game IDs detected');
if (ids.length < 50) failures.push(`Expected at least 50 games, found ${ids.length}`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Game smoke test passed: ${ids.length} catalog entries, ${folders.length} embedded games.`);
