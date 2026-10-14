/** GitHub project creation and safe two-way Git subtree synchronization. */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHARED_REPOSITORY = 'https://github.com/raillogistic/rail-react.git';
export const SHARED_BRANCH = 'master';
const packageRoot = fileURLToPath(new URL('../', import.meta.url));

/** Execute Git without a shell so paths and commit messages remain literal arguments. */
export function git(cwd, args, capture = false) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
}

/** Invoke npm's JavaScript entry point, including when called through npx on Windows. */
export function npm(cwd, args) {
  const cli = process.env.npm_execpath?.replace(/npx-cli\.js$/, 'npm-cli.js')
    ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(cli)) throw new Error('Cannot locate npm. Run this command through npm or npx.');
  execFileSync(process.execPath, [cli, ...args], { cwd, stdio: 'inherit' });
}

/** Run the same architecture, unit, and build checks in every consuming project. */
export function verifyFrontend(cwd) {
  for (const script of ['check:architecture', 'test:unit', 'build']) npm(cwd, ['run', script]);
}

/** Create an independent application and import its foundation directly from GitHub. */
export function createRailApp(destination, {
  repository = SHARED_REPOSITORY, ref = SHARED_BRANCH,
  install = cwd => npm(cwd, ['install']),
} = {}) {
  if (!destination?.trim()) throw new Error('Usage: create-rail-app <destination>');
  const target = path.resolve(destination);
  if (existsSync(target)) throw new Error(`Destination already exists: ${target}`);
  git(process.cwd(), ['--version'], true);
  git(process.cwd(), ['var', 'GIT_AUTHOR_IDENT'], true);
  // Check access before creating any destination files.
  const revision = git(process.cwd(), ['ls-remote', '--exit-code', repository, `refs/heads/${ref}`], true).split(/\s/)[0];
  if (!/^[a-f\d]{40,64}$/.test(revision)) throw new Error(`Cannot resolve shared branch: ${ref}`);
  mkdirSync(target, { recursive: true });
  cpSync(path.join(packageRoot, 'templates/app'), target, { recursive: true });
  renameSync(path.join(target, 'gitignore.template'), path.join(target, '.gitignore'));
  cpSync(path.join(target, '.env.example'), path.join(target, '.env'));
  const manifestPath = path.join(target, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.name = path.basename(target).toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'rail-application';
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  git(target, ['init', '-b', 'main']);
  git(target, ['add', '--', '.']);
  git(target, ['commit', '-m', 'Create Rail application']);
  git(target, ['remote', 'add', 'rail', repository]);
  git(target, ['fetch', '--no-tags', 'rail', revision]);
  git(target, ['subtree', 'add', '--prefix=rail', revision, '--squash']);
  install(target);
  if (existsSync(path.join(target, 'package-lock.json'))) {
    git(target, ['add', '--', 'package-lock.json']);
    git(target, ['commit', '-m', 'Lock application dependencies']);
  }
  console.log(`\nCreated ${target}\nConfigure your backend in .env, then run:\n  cd "${target}"\n  npm run dev`);
  return target;
}

/** Refuse unrelated changes and unfinished Git operations before synchronizing. */
export function assertSyncReady(cwd, mode) {
  const root = git(cwd, ['rev-parse', '--show-toplevel'], true).trim();
  if (path.resolve(root).toLowerCase() !== path.resolve(cwd).toLowerCase()) {
    throw new Error('Run shared commands from the application root.');
  }
  if (!existsSync(path.join(cwd, 'rail/package.json'))) throw new Error('This application has no rail/ subtree.');
  for (const operation of ['MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD']) {
    const state = git(cwd, ['rev-parse', '--git-path', operation], true).trim();
    if (existsSync(path.resolve(cwd, state))) throw new Error('Finish or abort the current Git operation before synchronizing.');
  }
  const scope = mode === 'push' ? ['--', '.', ':(exclude)rail'] : [];
  if (git(cwd, ['status', '--porcelain=v1', '--untracked-files=all', ...scope], true).trim()) {
    throw new Error(mode === 'push'
      ? 'Commit or stash application-owned changes first. Only rail/ changes may be submitted.'
      : 'Commit or stash your changes before pulling shared updates.');
  }
  git(cwd, ['remote', 'get-url', 'rail'], true);
}

/** Submit only shared source, or pull updates, without force-pushing or hiding conflicts. */
export function syncShared(mode, {
  cwd = process.cwd(), message,
  install = dir => npm(dir, ['install']), verify = verifyFrontend,
} = {}) {
  if (!['pull', 'push'].includes(mode)) throw new Error('Usage: shared.mjs <pull|push> [commit message]');
  if (mode === 'push' && !message?.trim()) throw new Error('Supply a commit message: npm run shared:push -- "Describe your change"');
  assertSyncReady(cwd, mode);
  if (mode === 'push' && git(cwd, ['status', '--porcelain=v1', '--untracked-files=all', '--', 'rail'], true).trim()) {
    git(cwd, ['add', '--', 'rail']);
    git(cwd, ['commit', '-m', message, '--only', '--', 'rail']);
  }
  git(cwd, ['subtree', 'pull', '--prefix=rail', 'rail', SHARED_BRANCH, '--squash']);
  install(cwd);
  verify(cwd);
  if (mode === 'push') git(cwd, ['subtree', 'push', '--prefix=rail', 'rail', SHARED_BRANCH]);
  console.log(`Shared ${mode} completed. ${mode === 'push' ? 'Other applications can now run npm run shared:pull.' : 'Review the update before deploying.'}`);
  if (git(cwd, ['status', '--porcelain=v1', '--', 'package-lock.json'], true).trim()) {
    console.log('Dependencies changed. Commit package-lock.json in this application.');
  }
}
