/** Exercise creation and bidirectional updates against actual disposable Git repositories. */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRailApp, git, syncShared } from '../project-commands.mjs';

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
  syncShared('push', { ...noNpm, cwd: first, message: 'Improve component', verify: () => { checks++; } });
  syncShared('pull', { ...noNpm, cwd: second, install: cwd => {
    assert.equal(JSON.parse(readFileSync(path.join(cwd, 'rail/package.json'), 'utf8')).dependencies.example, '1.0.0');
  } });
  assert.equal(checks, 1);
  assert.equal(readFileSync(path.join(second, 'rail/component.txt'), 'utf8'), 'improved component\n');
  assert.equal(readFileSync(path.join(second, 'src/application.ts'), 'utf8'), applicationBefore);
  assert.equal(git(upstream, ['ls-tree', '--name-only', 'master'], true).includes('src/application.ts'), false);
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
  assert.equal(readFileSync(path.join(project, 'rail/component.txt'), 'utf8'), 'local improvement\n');
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
