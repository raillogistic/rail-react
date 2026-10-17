/** Compare permission matching against a saved source file without browser state or caches. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';

const [baselinePath, outputPath] = process.argv.slice(2);
assert(baselinePath && outputPath, 'Usage: node rail/scripts/benchmark-permissions.mjs baseline.ts results.json');
/** Load this self-contained TypeScript utility with the installed compiler. */
async function load(path) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const baseline = await load(baselinePath);
const current = await load(new URL('../src/features/auth/utils/permission-matching.ts', import.meta.url));
const permissions = Array.from({ length: 1000 }, (_, i) => `catalog.view_model${i}`);
const scenarios = {
  early_grant: { user: { permissions }, required: permissions[0], iterations: 1000 },
  missing_grant: { user: { permissions }, required: 'catalog.change_missing', iterations: 100 },
  wildcard: { user: { permissions: ['catalog.*'] }, required: 'catalog.change_order', iterations: 10000 },
  repeated_stars: { user: { permissions: ['a*'.repeat(12) + 'b'] }, required: 'a'.repeat(24) + 'c', iterations: 1 },
};
const results = { node: process.version, samples: 30, warmups: 5, scenarios: {} };
for (const [name, scenario] of Object.entries(scenarios)) {
  const expected = baseline.userHasPermission(scenario.user, scenario.required);
  assert.equal(current.userHasPermission(scenario.user, scenario.required), expected);
  const measured = {};
  for (const [label, implementation] of [['baseline', baseline], ['current', current]]) {
    const samples = [];
    for (let repetition = 0; repetition < 35; repetition++) {
      const start = performance.now();
      for (let i = 0; i < scenario.iterations; i++) {
        assert.equal(implementation.userHasPermission(scenario.user, scenario.required), expected);
      }
      if (repetition >= 5) samples.push((performance.now() - start) / scenario.iterations);
    }
    samples.sort((a, b) => a - b);
    measured[label] = { median_ms_per_check: (samples[14] + samples[15]) / 2 };
  }
  results.scenarios[name] = { iterations_per_sample: scenario.iterations, ...measured };
}
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results));
