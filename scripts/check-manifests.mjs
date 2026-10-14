/** Validate both generic manifests and any application-owned registry assertions. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { sharedRoot } from './source-paths.mjs';
const tests = [
  path.join(sharedRoot, 'src/app/router/__tests__/manifestRegistry.test.ts'),
  'src/application/__tests__/manifestRegistry.test.ts',
  'src/projects/achat/__tests__/achatManifest.test.tsx',
].filter(file => existsSync(file));
execFileSync(process.execPath, [path.resolve('node_modules/vitest/vitest.mjs'), 'run', ...tests, '--reporter=dot'], { stdio: 'inherit' });
