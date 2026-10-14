#!/usr/bin/env node
/** Application command for pulling and submitting shared frontend source. */
import { getSharedVersions, syncShared } from './project-commands.mjs';
try {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === '--help' || args.includes('--help')) {
    console.log('npm run shared:push -- "Describe your change"\nnpm run shared:pull [-- latest|v2|--list]');
  } else if (mode === 'pull' && args.length > 1) {
    throw new Error('Supply one version, for example: npm run shared:pull -- v2');
  } else if (mode === 'pull' && args[0] === '--list') {
    const versions = getSharedVersions(process.cwd());
    console.log(versions.length ? versions.map((item, index) => `${item.version}${index === 0 ? ' (latest)' : ''}`).join('\n') : 'No versions yet. The first shared push will create v1.');
  } else {
    syncShared(mode, { message: args.join(' '), version: args[0] ?? 'latest' });
  }
}
catch (error) {
  console.error(`Shared synchronization stopped: ${error.message}\nYour work is preserved. Resolve any Git conflicts or failed checks before retrying.`);
  process.exitCode = 1;
}
