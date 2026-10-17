/** Measure the static JavaScript closure needed by the application entry and login route. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

assert(process.argv[2], 'Usage: node rail/scripts/measure-login-build.mjs dist-directory');
const root = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.vite/manifest.json'), 'utf8'));
const entries = Object.keys(manifest).filter(key => manifest[key].isEntry ||
  key.endsWith('/App.tsx') || key.endsWith('/pages/auth/LoginPage.tsx'));
assert(entries.length > 0, 'No application entry found');
const visited = new Set();
/** Follow static imports only; optional routes stay out of this measurement. */
function visit(key) {
  if (visited.has(key)) return;
  assert(manifest[key], `Missing manifest entry: ${key}`);
  visited.add(key);
  for (const dependency of manifest[key].imports ?? []) visit(dependency);
}
entries.forEach(visit);
const files = [...new Set([...visited].map(key => manifest[key].file).filter(file => file.endsWith('.js')))];
let rawBytes = 0;
let gzipBytes = 0;
for (const file of files) {
  const absolute = path.resolve(root, file);
  assert(absolute.startsWith(root + path.sep), 'Asset must be inside the build directory');
  const bytes = fs.readFileSync(absolute);
  rawBytes += bytes.length;
  gzipBytes += gzipSync(bytes).length;
}
console.log(JSON.stringify({ node: process.version, entries, js_files: files.length, raw_bytes: rawBytes, gzip_bytes: gzipBytes, files }));
