#!/usr/bin/env node
/** Application command for pulling and submitting shared frontend source. */
import { syncShared } from './project-commands.mjs';
try { syncShared(process.argv[2], { message: process.argv.slice(3).join(' ') }); }
catch (error) {
  console.error(`Shared synchronization stopped: ${error.message}\nYour work is preserved. Resolve any Git conflicts or failed checks before retrying.`);
  process.exitCode = 1;
}
