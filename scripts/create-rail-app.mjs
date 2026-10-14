#!/usr/bin/env node
/** Public GitHub-installable project generator. */
import { createRailApp } from './project-commands.mjs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: create-rail-app <destination>\nCreates a frontend from github.com/raillogistic/rail-react.');
} else {
  try { createRailApp(process.argv[2]); }
  catch (error) {
    console.error(`Project creation stopped: ${error.message}\nExisting files have been preserved. If creation started, inspect the destination before retrying.`);
    process.exitCode = 1;
  }
}
