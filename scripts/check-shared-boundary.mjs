/** Reject application dependencies and generated backend types inside reusable source. */
import fs from 'node:fs';
import path from 'node:path';
import { sharedRoot, resolveSourceImport } from './source-paths.mjs';

const root = path.join(sharedRoot, 'src');
const violations = [];
/** Inspect source recursively, including tests, without reading build artifacts. */
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.(ts|tsx)$/.test(file) || entry.name.includes('.backup.')) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)) {
      const specifier = match[1];
      const resolved = resolveSourceImport(specifier, file);
      if (/^@\/(models|schema|application)(\/|$)/.test(specifier)
        || (/^@\/projects\//.test(specifier) && !specifier.startsWith('@/projects/core/'))
        || (resolved && !resolved.startsWith(`${root}${path.sep}`))) {
        violations.push(`${path.relative(sharedRoot, file)} imports ${specifier}`);
      }
    }
  }
}
scan(root);
if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; }
else console.log('Shared source has no application-specific imports.');
