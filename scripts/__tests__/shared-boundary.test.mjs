/** The boundary check must fail before generated backend types can enter shared source. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('shared source cannot import generated application models', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'rail-boundary-'));
  try {
    mkdirSync(path.join(directory, 'src'));
    writeFileSync(path.join(directory, 'src/widget.ts'), "import type { User } from '@/models';\n");
    const checker = fileURLToPath(new URL('../check-shared-boundary.mjs', import.meta.url));
    assert.throws(() => execFileSync(process.execPath, [checker], { cwd: directory, stdio: 'pipe' }), error => error.status === 1);
  } finally {
    assert.ok(path.resolve(directory).startsWith(`${path.resolve(tmpdir())}${path.sep}`));
    rmSync(directory, { recursive: true, force: true });
  }
});
