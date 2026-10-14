/** Exercise creation and bidirectional updates against actual disposable Git repositories. */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRailApp, getSharedVersions, git, syncShared } from '../project-commands.mjs';

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'rail-commands-'));
Object.assign(process.env, {
  GIT_AUTHOR_NAME: 'Rail command test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Rail command test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
});
after(() => {
  assert.ok(path.resolve(temporaryRoot).startsWith(`${path.resolve(tmpdir())}${path.sep}`));
  rmSync(temporaryRoot, { recursive: true, force: true });
});

/** Seed an upstream and two independent consumers without network or npm access. */
function fixture(name) {
  const directory = path.join(temporaryRoot, name);
  mkdirSync(directory);
  const upstream = path.join(directory, 'upstream.git');
  git(directory, ['init', '--bare', '--initial-branch=master', upstream], true);
  const seed = path.join(directory, 'seed');
  mkdirSync(seed);
  git(seed, ['init', '--initial-branch=master'], true);
  writeFileSync(path.join(seed, 'package.json'), '{"name":"rail-react","version":"0.1.0"}\n');
  writeFileSync(path.join(seed, 'component.txt'), 'original component\n');
  git(seed, ['add', '.'], true);
  git(seed, ['commit', '-m', 'Seed shared source'], true);
  git(seed, ['push', upstream, 'master'], true);
  const app = name => createRailApp(path.join(directory, name), { repository: upstream, install: () => {} });
  return { upstream, app, seed };
}
const noNpm = { install: () => {}, verify: () => {} };

test('creation refuses an existing path and preserves its files', () => {
  const target = path.join(temporaryRoot, 'existing');
  mkdirSync(target);
  writeFileSync(path.join(target, 'keep.txt'), 'keep');
  assert.throws(() => createRailApp(target), /already exists/);
  assert.equal(readFileSync(path.join(target, 'keep.txt'), 'utf8'), 'keep');
});

test('creation checks upstream access before creating the destination', () => {
  const target = path.join(temporaryRoot, 'missing-upstream');
  assert.throws(() => createRailApp(target, { repository: path.join(temporaryRoot, 'absent.git') }));
  assert.equal(existsSync(target), false);
});

test('creation tracks the installed lockfile and ignores the placeholder environment', () => {
  const { upstream } = fixture('lockfile');
  const target = path.join(temporaryRoot, 'lockfile', 'app');
  createRailApp(target, { repository: upstream, install: cwd => {
    writeFileSync(path.join(cwd, 'package-lock.json'), '{"lockfileVersion":3}\n');
  } });
  assert.equal(git(target, ['status', '--porcelain'], true).trim(), '');
  assert.equal(git(target, ['ls-files', '.env'], true).trim(), '');
  assert.equal(git(target, ['ls-files', 'package-lock.json'], true).trim(), 'package-lock.json');
});

test('a component and dependency change travel between independent projects', () => {
  const { upstream, app } = fixture('roundtrip');
  const first = app('first');
  const second = app('second');
  assert.equal(git(first, ['remote', 'get-url', 'rail'], true).trim(), upstream);
  assert.equal(git(first, ['status', '--porcelain'], true).trim(), '');
  const applicationBefore = readFileSync(path.join(second, 'src/application.ts'), 'utf8');
  writeFileSync(path.join(first, 'rail/component.txt'), 'improved component\n');
  writeFileSync(path.join(first, 'rail/package.json'), '{"name":"rail-react","version":"0.1.0","dependencies":{"example":"1.0.0"}}\n');
  let checks = 0;
  assert.equal(syncShared('push', { ...noNpm, cwd: first, message: 'Improve component', verify: () => { checks++; } }), 'v1');
  assert.equal(syncShared('pull', { ...noNpm, cwd: second, install: cwd => {
    assert.equal(JSON.parse(readFileSync(path.join(cwd, 'rail/package.json'), 'utf8')).dependencies.example, '1.0.0');
  } }), 'v1');
  assert.equal(checks, 1);
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'improved component\n');
  assert.equal(readFileSync(path.join(second, 'src/application.ts'), 'utf8'), applicationBefore);
  assert.equal(git(upstream, ['ls-tree', '--name-only', 'master'], true).includes('src/application.ts'), false);
  assert.equal(git(upstream, ['rev-parse', 'v1'], true), git(upstream, ['rev-parse', 'master'], true));
});

test('automatic releases support latest, a specific version, downgrades, and later submissions', () => {
  const { upstream, app } = fixture('versions');
  const first = app('first');
  const second = app('second');
  const applicationBefore = readFileSync(path.join(second, 'src/application.ts'), 'utf8');
  for (const version of [1, 2]) {
    writeFileSync(path.join(first, 'rail/component.txt'), `component ${version}\n`);
    assert.equal(syncShared('push', { ...noNpm, cwd: first, message: `Update ${version}` }), `v${version}`);
  }
  assert.equal(syncShared('push', { ...noNpm, cwd: first, message: 'Nothing new' }), 'v2');
  assert.equal(getSharedVersions(second).length, 2);
  assert.equal(syncShared('pull', { ...noNpm, cwd: second }), 'v2');
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'component 2\n');
  assert.equal(syncShared('pull', { ...noNpm, cwd: second, version: 'v1' }), 'v1');
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'component 1\n');
  writeFileSync(path.join(second, 'rail/local.txt'), 'new shared feature\n');
  assert.equal(syncShared('push', { ...noNpm, cwd: second, message: 'Submit from an older version' }), 'v3');
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'component 2\n');
  syncShared('pull', { ...noNpm, cwd: first, version: 'latest' });
  assert.equal(readFileSync(path.join(first, 'rail/local.txt'), 'utf8'), 'new shared feature\n');
  assert.equal(readFileSync(path.join(second, 'src/application.ts'), 'utf8'), applicationBefore);
  assert.equal(git(upstream, ['rev-parse', 'v3'], true), git(upstream, ['rev-parse', 'master'], true));
});

test('a selected version preserves committed local shared improvements', () => {
  const { app } = fixture('local-commits');
  const first = app('first');
  const second = app('second');
  writeFileSync(path.join(first, 'rail/component.txt'), 'released update\n');
  syncShared('push', { ...noNpm, cwd: first, message: 'Release update' });
  writeFileSync(path.join(second, 'rail/local.txt'), 'keep local feature\n');
  git(second, ['add', '--', 'rail/local.txt'], true);
  git(second, ['commit', '-m', 'Local shared feature'], true);
  syncShared('pull', { ...noNpm, cwd: second, version: 'v1' });
  assert.equal(readFileSync(path.join(second, 'rail/local.txt'), 'utf8'), 'keep local feature\n');
});

test('recording a published baseline preserves the application lockfile changed by installation', () => {
  const { app } = fixture('pending-lockfile');
  const project = app('app');
  const lockfile = path.join(project, 'package-lock.json');
  writeFileSync(lockfile, '{"lockfileVersion":3}\n');
  git(project, ['add', '--', 'package-lock.json'], true);
  git(project, ['commit', '-m', 'Initial application lockfile'], true);
  writeFileSync(path.join(project, 'rail/component.txt'), 'component 1\n');
  const installedLockfile = '{"lockfileVersion":3,"packages":{"example":{}}}\n';
  syncShared('push', { ...noNpm, cwd: project, message: 'First update', install: () => writeFileSync(lockfile, installedLockfile) });
  assert.equal(readFileSync(lockfile, 'utf8'), installedLockfile);
  assert.equal(git(project, ['status', '--porcelain'], true).trim(), 'M package-lock.json');
  git(project, ['add', '--', 'package-lock.json'], true);
  git(project, ['commit', '-m', 'Lock updated dependencies'], true);
  writeFileSync(path.join(project, 'rail/component.txt'), 'component 2\n');
  assert.equal(syncShared('push', { ...noNpm, cwd: project, message: 'Second update' }), 'v2');
});

test('versions sort numerically and new applications use the latest release', () => {
  const { upstream, seed, app } = fixture('newest-release');
  for (const version of ['v2', 'v10', 'v1.0.0', 'v01']) git(seed, ['tag', version], true);
  git(seed, ['push', '--tags', upstream], true);
  writeFileSync(path.join(seed, 'component.txt'), 'unreleased master change\n');
  git(seed, ['add', '.'], true);
  git(seed, ['commit', '-m', 'Unreleased change'], true);
  git(seed, ['push', upstream, 'master'], true);
  const project = app('app');
  assert.equal(readFileSync(path.join(project, 'rail/component.txt'), 'utf8'), 'original component\n');
  assert.deepEqual(getSharedVersions(project).map(item => item.version), ['v10', 'v2']);
  const script = fileURLToPath(new URL('../shared.mjs', import.meta.url));
  writeFileSync(path.join(project, 'src/application.ts'), 'unfinished application work');
  assert.equal(execFileSync(process.execPath, [script, 'pull', '--list'], { cwd: project, encoding: 'utf8' }).trim(), 'v10 (latest)\nv2');
});

test('unknown versions do not change the application or run installation', () => {
  const { app } = fixture('unknown-version');
  const project = app('app');
  const previous = git(project, ['rev-parse', 'HEAD'], true);
  assert.throws(() => syncShared('pull', { ...noNpm, cwd: project, version: 'v99', install: () => assert.fail('Must not install') }), /does not exist/);
  assert.equal(git(project, ['rev-parse', 'HEAD'], true), previous);
  assert.equal(git(project, ['status', '--porcelain'], true).trim(), '');
});

test('dirty application files block both commands without staging them', () => {
  const { app } = fixture('dirty');
  const project = app('app');
  writeFileSync(path.join(project, 'src/application.ts'), 'local application work');
  assert.throws(() => syncShared('pull', { ...noNpm, cwd: project }), /Commit or stash/);
  assert.throws(() => syncShared('push', { ...noNpm, cwd: project, message: 'Change' }), /application-owned/);
  assert.equal(git(project, ['diff', '--cached', '--name-only'], true).trim(), '');
  assert.equal(readFileSync(path.join(project, 'src/application.ts'), 'utf8'), 'local application work');
});

test('failed validation prevents pushing and preserves committed shared work', () => {
  const { upstream, app } = fixture('failed-check');
  const project = app('app');
  const previous = git(upstream, ['rev-parse', 'master'], true);
  writeFileSync(path.join(project, 'rail/component.txt'), 'local improvement\n');
  assert.throws(() => syncShared('push', { ...noNpm, cwd: project, message: 'Change', verify: () => { throw new Error('Build failed'); } }), /Build failed/);
  assert.equal(git(upstream, ['rev-parse', 'master'], true), previous);
  assert.equal(getSharedVersions(project).length, 0);
  assert.equal(readFileSync(path.join(project, 'rail/component.txt'), 'utf8'), 'local improvement\n');
});

test('a rejected version tag prevents the shared branch from being published', () => {
  const { upstream, app } = fixture('atomic-publication');
  const project = app('app');
  const previous = git(upstream, ['rev-parse', 'master'], true);
  writeFileSync(path.join(upstream, 'hooks/update'), '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\nexit 0\n', { mode: 0o755 });
  writeFileSync(path.join(project, 'rail/component.txt'), 'local improvement\n');
  assert.throws(() => syncShared('push', { ...noNpm, cwd: project, message: 'Rejected publication' }));
  assert.equal(git(upstream, ['rev-parse', 'master'], true), previous);
  assert.equal(getSharedVersions(project).length, 0);
  assert.equal(readFileSync(path.join(project, 'rail/component.txt'), 'utf8'), 'local improvement\n');
});

test('concurrent upstream changes reject publication without leaving an orphan version', () => {
  const { upstream, seed, app } = fixture('concurrent-publication');
  const project = app('app');
  writeFileSync(path.join(project, 'rail/component.txt'), 'local improvement\n');
  assert.throws(() => syncShared('push', { ...noNpm, cwd: project, message: 'Concurrent change', verify: () => {
    writeFileSync(path.join(seed, 'concurrent.txt'), 'another contributor\n');
    git(seed, ['add', '.'], true);
    git(seed, ['commit', '-m', 'Concurrent update'], true);
    git(seed, ['push', upstream, 'master'], true);
  } }));
  assert.equal(git(upstream, ['rev-parse', 'master'], true), git(seed, ['rev-parse', 'HEAD'], true));
  assert.equal(getSharedVersions(project).length, 0);
  assert.equal(syncShared('push', { ...noNpm, cwd: project, message: 'Retry after concurrent update' }), 'v1');
  assert.equal(readFileSync(path.join(project, 'rail/concurrent.txt'), 'utf8'), 'another contributor\n');
});

test('conflicting changes stop without force-pushing or losing local application files', () => {
  const { upstream, app } = fixture('conflict');
  const first = app('first');
  const second = app('second');
  writeFileSync(path.join(first, 'rail/component.txt'), 'first improvement\n');
  syncShared('push', { ...noNpm, cwd: first, message: 'First improvement' });
  const upstreamHead = git(upstream, ['rev-parse', 'master'], true);
  writeFileSync(path.join(second, 'rail/component.txt'), 'second improvement\n');
  assert.throws(() => syncShared('push', { ...noNpm, cwd: second, message: 'Second improvement' }));
  assert.equal(git(upstream, ['rev-parse', 'master'], true), upstreamHead);
  assert.ok(git(second, ['status', '--porcelain'], true).includes('rail/component.txt'));
  assert.throws(() => syncShared('pull', { ...noNpm, cwd: second }), /current Git operation/);
  git(second, ['merge', '--abort'], true);
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'second improvement\n');
});
