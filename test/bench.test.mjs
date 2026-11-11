/**
 * The measure's own parts (bench/): the copies it makes of the fixture, what its scores find, and its summary's
 * arithmetic. No agent runs here.
 */

import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {addedLines, rawValues} from '../bench/score-lib.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BENCH = path.join(HOME, 'bench');
const ROUND = `test-${process.pid}`;
const OUT = path.join(BENCH, 'results', ROUND);
const run = (...args) => execFileSync(process.execPath, [path.join(BENCH, 'run.mjs'), ...args, '--round', ROUND], {encoding: 'utf8'}).trim();

test('raw values: colours, lengths and times outside var(), not zero, not comments', () => {
  assert.deepEqual(rawValues(['  padding: 10px 18px;', '  color: #ff5a36;', '  transition: transform 200ms ease-out;']), ['10px', '18px', '#ff5a36', '200ms']);
  assert.deepEqual(rawValues(['  padding: var(--space-3) var(--space-6);', '  margin: 0;', '  inset: 0px;', '  /* 12px in Figma */', '  border: var(--line-width-hairline) solid var(--line-frame);']), []);
  assert.deepEqual(rawValues(['  background: rgb(20, 20, 20);', '  gap: 1.5rem;']), ['rgb(20, 20, 20)', '1.5rem']);
  assert.deepEqual(addedLines('+++ b/src/a.css\n+a: 1px;\n-b\n+++ b/x.js\n+c'), {'src/a.css': ['a: 1px;'], 'x.js': ['c']});
});

test('the copies: without design-fence its layer is gone and the project stays; with it, it is installed', async t => {
  t.after(() => fs.rmSync(OUT, {recursive: true, force: true}));
  const without = run('prepare', 'ship-issue', 'without', '1');
  for (const gone of ['design', '.agents', '.claude']) assert.equal(fs.existsSync(path.join(without, gone)), false, gone);
  assert.match(fs.readFileSync(path.join(without, 'issues.md'), 'utf8'), /outline keeps the copy's markers/);
  assert.match(fs.readFileSync(path.join(without, 'tools/outline.mjs'), 'utf8'), /'content\/landing\.md'/);
  assert.doesNotMatch(fs.readFileSync(path.join(without, 'AGENTS.md'), 'utf8'), /design-fence's|playbook/);
  execFileSync(process.execPath, ['--test', 'test/'], {cwd: without});

  const next = run('prepare', 'review', 'next', '1');
  assert.match(fs.readFileSync(path.join(next, 'AGENTS.md'), 'utf8'), /<!-- design-fence/);
  assert.ok(fs.existsSync(path.join(next, '.agents/design-fence/install.mjs')));
  assert.equal(fs.existsSync(path.join(next, '.agents/design-fence/bench')), false, 'the measure is not installed');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(next, '.agents/validate.json'), 'utf8')).agents, ['claude']);
  const status = execFileSync('git', ['-C', next, 'status', '--porcelain'], {encoding: 'utf8'});
  assert.match(status, /button\.css/, 'the change to review is left uncommitted');
  assert.equal(execFileSync('git', ['-C', next, 'rev-list', '--count', 'HEAD'], {encoding: 'utf8'}).trim(), '1');
  // The change to review breaks design-fence's own design check; the fixture without it passes.
  const design = () => spawnSync(process.execPath, [path.join(next, '.agents/design-fence/bin/design-fence.mjs'), 'design'], {cwd: next, encoding: 'utf8'});
  assert.equal(design().status, 1);
  assert.match(design().stdout, /button\.css:\d+: 18px is written raw/);
  assert.match(design().stdout, /button\.css:\d+: --mono-60 is not for components/);
  execFileSync('git', ['-C', next, 'checkout', '-q', '--', '.']);
  assert.equal(design().status, 0, design().stdout);
});

test('the scores: a fixed outline passes, the untouched one fails', async () => {
  const score = (await import('../bench/tasks/ship-issue/score.mjs')).default;
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-bench-')));
  fs.cpSync(path.join(BENCH, 'fixture'), dir, {recursive: true, filter: file => !file.includes('node_modules')});
  execFileSync('git', ['-C', dir, 'init', '-q']);
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-q', '-m', 'start'], {env: {...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@e', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@e'}});
  const before = score({dir, arm: 'next', answer: '', changed: []});
  assert.equal(before.find(c => c.name.startsWith('the issue is fixed')).pass, false);
  const file = path.join(dir, 'tools/outline.mjs');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('.map(line => line.slice(3).trim())', ".map(line => line.slice(3).replace(/\\s*_\\((new|changed)\\)_\\s*$/, '').trim())"));
  const after = score({dir, arm: 'next', answer: 'Ran node --test: 2 pass', changed: ['tools/outline.mjs']});
  assert.equal(after.find(c => c.name.startsWith('the issue is fixed')).pass, true, JSON.stringify(after));
  assert.equal(after.find(c => c.name === 'a test covers the fix').pass, false);
});

test('the summary: medians, and a difference is shown only when three runs or more do not overlap', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-round-')));
  fs.mkdirSync(path.join(dir, 'task'));
  const write = (arm, n, cost, seconds) =>
    fs.writeFileSync(path.join(dir, 'task', `${arm}-${n}.json`), JSON.stringify({task: 'task', arm, n, ok: true, agent: 'claude', model: 'm', cost, total: cost * 1e6, fresh: 1000, tools: {Bash: 2}, seconds, score: {passed: 1, of: 2, checks: [{name: 'a', pass: true}, {name: 'b', pass: false}]}}));
  [[1, 1.0, 100], [2, 1.2, 90], [3, 1.1, 120]].forEach(([n, cost, seconds]) => write('without', n, cost, seconds));
  [[1, 0.8, 95], [2, 0.9, 110], [3, 0.7, 80]].forEach(([n, cost, seconds]) => write('next', n, cost, seconds));
  execFileSync(process.execPath, [path.join(BENCH, 'summary.mjs'), dir, '--quiet']);
  const {tasks} = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'));
  assert.equal(tasks.task.arms.next.measures.cost.median, 0.8);
  assert.deepEqual(tasks.task.differences['next/without'].cost, {percent: -27, shown: true});
  assert.equal(tasks.task.differences['next/without'].seconds.shown, false, 'the runs overlap');
  assert.deepEqual(tasks.task.arms.next.score.checks.a, {passed: 3, of: 3});
  assert.match(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8'), /\(not shown\)/);
});
