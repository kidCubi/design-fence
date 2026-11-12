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

import {addedLines, fileCheck, rawValues} from '../bench/score-lib.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BENCH = path.join(HOME, 'bench');
const ROUND = `test-${process.pid}`;
const OUT = path.join(BENCH, 'results', ROUND);
const run = (...args) => execFileSync(process.execPath, [path.join(BENCH, 'run.mjs'), ...args, '--round', ROUND], {encoding: 'utf8'}).trim();

test('raw values: colours, lengths and times outside var(), not zero, not comments', () => {
  assert.deepEqual(rawValues(['  padding: 10px 18px;', '  color: #ff5a36;', '  transition: transform 200ms ease-out;']), ['10px', '18px', '#ff5a36', '200ms']);
  assert.deepEqual(rawValues(['  padding: var(--space-3) var(--space-6);', '  margin: 0;', '  inset: 0px;', '  /* 12px in Figma */', '  border: var(--line-width-hairline) solid var(--line-frame);']), []);
  assert.deepEqual(rawValues(['  background: rgb(20, 20, 20);', '  gap: 1.5rem;']), ['rgb(20, 20, 20)', '1.5rem']);
  // A comment over several lines names values on a line that reads like code; a unit given to a bare number is none.
  assert.deepEqual(rawValues(['/* The size of the Command', '   here (the Desktop variant is 52px tall: the hairlines, the padding). */', '  transition: color calc(var(--duration-fast) * 1ms) ease-out;', '  width: 304px;']), ['304px']);
  assert.deepEqual(addedLines('+++ b/src/a.css\n+a: 1px;\n-b\n+++ b/x.js\n+c'), {'src/a.css': ['a: 1px;'], 'x.js': ['c']});
});

test('a run on Figma that changed the file elsewhere fails a check of the runner; an unread file says nothing', () => {
  assert.deepEqual(fileCheck(''), [{name: 'nothing else in the Figma file changed', pass: true, note: ''}]);
  const [changed] = fileCheck('the file was [{"name":"Tokens","layers":147}], and is [{"name":"Tokens","layers":148}]');
  assert.equal(changed.pass, false);
  assert.match(changed.note, /"layers":148/);
  // The bridge did not answer: the file's state is not known, and no check is made up.
  assert.deepEqual(fileCheck(undefined), []);
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

test('the report: rounds side by side, the runs that hold, and only the differences that are shown', () => {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-report-')));
  const round = (name, model, runs) => {
    const dir = path.join(home, name);
    fs.mkdirSync(path.join(dir, 'figma-badge'), {recursive: true});
    for (const [arm, n, cost, checks, ok = true] of runs) {
      fs.writeFileSync(path.join(dir, 'figma-badge', `${arm}-${n}.json`), JSON.stringify({task: 'figma-badge', arm, n, ok, agent: 'claude', model, cost, total: cost * 1e6, fresh: 1000, tools: {Bash: 2}, seconds: 60, score: {passed: checks.filter(Boolean).length, of: checks.length, checks: ['every value bound to a variable', 'one screenshot at most', 'a draft spec is left'].slice(0, checks.length).map((check, i) => ({name: check, pass: checks[i]}))}}));
    }
    execFileSync(process.execPath, [path.join(BENCH, 'summary.mjs'), dir, '--quiet']);
    return dir;
  };
  // Without: its design holds twice of three, and it never keeps to design-fence's own rule, which is not held against it.
  const a = round('a', 'model-a', [['without', 1, 1.0, [true, false]], ['without', 2, 1.2, [false, false]], ['without', 3, 1.1, [true, false]], ['next', 1, 0.8, [true, true, true]], ['next', 2, 0.9, [true, true, true]], ['next', 3, 0.7, [true, true, true]]]);
  // A run that did not finish does not count, and two runs an arm show nothing.
  const b = round('b', 'model-b', [['without', 1, 1.0, [true, false]], ['without', 2, 1.0, [true, false]], ['next', 1, 0.5, [true, true, true]], ['next', 2, 0.5, [true, true, true]], ['next', 3, 0, [false, false, false], false]]);
  const out = path.join(home, 'report');
  execFileSync(process.execPath, [path.join(BENCH, 'report.mjs'), a, b, '--out', out]);
  const report = JSON.parse(fs.readFileSync(`${out}.json`, 'utf8'));
  assert.deepEqual(report.rounds.map(r => r.model), ['model-a', 'model-b']);
  assert.deepEqual(report.rounds[0].tasks['figma-badge'].holds, {without: {held: 2, of: 3}, with: {held: 3, of: 3}});
  assert.deepEqual(report.rounds[1].tasks['figma-badge'].holds, {without: {held: 2, of: 2}, with: {held: 2, of: 2}});
  assert.deepEqual(report.shown.map(item => [item.model, item.measure, item.percent]), [['model-a', 'Cost', -27], ['model-a', 'Tokens', -27]]);
  const text = fs.readFileSync(`${out}.md`, 'utf8');
  assert.match(text, /\| figma-badge \| 2 of 3 → 3 of 3 \| 2 of 2 → 2 of 2 \|/);
  // What a result that holds cost: 3.30 spent for two that hold, 2.40 for three; the run that did not finish is not counted.
  assert.equal(report.rounds[0].tasks['figma-badge'].spent.without.toFixed(2), '3.30');
  assert.match(text, /\| figma-badge \| \$1\.65 → \$0\.80 \| \$1\.00 → \$0\.50 \|/);
  assert.match(text, /\$1\.10 → \$0\.80 \(−27%\*\) \| \$1\.00 → \$0\.50 \(−50%\) \|/);
  assert.match(text, /one screenshot at most \(design-fence's own rule\) \| 0 of 3 → 3 of 3/);
});
