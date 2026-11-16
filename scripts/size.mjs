// Reports the raw and gzip size of every JS and CSS file in dist/ and the total.
// Usage: npm run build && npm run size
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.argv[2] || 'dist';
if (!fs.existsSync(root)) {
  console.error(`No ${root}/ folder. Run npm run build first.`);
  process.exit(1);
}
const rows = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(js|mjs|css)$/.test(e.name)) {
      const buf = fs.readFileSync(full);
      rows.push({ file: path.relative(root, full), raw: buf.length, gzip: zlib.gzipSync(buf).length });
    }
  }
};
walk(root);
rows.sort((a, b) => b.gzip - a.gzip);
for (const r of rows) console.log(`${(r.gzip / 1024).toFixed(1).padStart(7)} kB gz  ${(r.raw / 1024).toFixed(1).padStart(7)} kB  ${r.file}`);
const js = rows.filter((r) => /\.m?js$/.test(r.file)).reduce((s, r) => s + r.gzip, 0);
const css = rows.filter((r) => r.file.endsWith('.css')).reduce((s, r) => s + r.gzip, 0);
console.log(`total JS ${(js / 1024).toFixed(1)} kB gz, CSS ${(css / 1024).toFixed(1)} kB gz`);
