// @vitest-environment node
/** Reject ambiguous version arguments before a shared command can change any files. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/shared.mjs', import.meta.url));

it.each([['v0'], ['--force'], ['v1', 'v2']])('rejects invalid pull arguments %j', (...args) => {
  const result = spawnSync(process.execPath, [script, 'pull', ...args], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/Use npm run shared:pull|Supply one version/);
  expect(result.stderr).not.toMatch(/fatal:|Command failed: git/);
});
