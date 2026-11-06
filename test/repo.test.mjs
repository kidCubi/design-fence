/**
 * design-fence on a real (temporary) git repository: which checks run, the
 * cache of passes, and the two hooks as Claude Code calls them (a JSON
 * payload on stdin, the exit code and stderr as the verdict).
 */

import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {changedFiles} from '../lib/git.mjs';
import {plan, runChecks} from '../lib/check.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** A repository with one commit and the given validate.json. */
function repository(config) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-')));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], {stdio: 'ignore'});
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.mkdirSync(path.join(root, 'src'));
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, 'src/a.js'), 'ok\n');
  fs.writeFileSync(path.join(root, '.agents/validate.json'), JSON.stringify(config));
  git('add', '-A');
  git('commit', '-q', '-m', 'start');
  return root;
}

// A check that fails when a changed file contains "bad".
const NO_BAD = {
  name: 'no bad',
  when: 'src/**',
  cwd: 'src',
  run: `node -e "const fs=require('fs');process.exit(process.argv.slice(1).some(f=>fs.readFileSync(f,'utf8').includes('bad'))?1:0)" {files}`,
};

function hook(script, root, payload) {
  return spawnSync(process.execPath, [path.join(HOME, 'hooks', script)], {
    cwd: root,
    input: JSON.stringify({cwd: root, session_id: 's1', ...payload}),
    encoding: 'utf8',
  });
}

test('only checks whose files changed run, on those files', () => {
  const root = repository({checks: [NO_BAD, {name: 'other', when: 'docs/**', run: 'true'}]});
  assert.deepEqual(changedFiles(root), []);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'changed\n');
  fs.writeFileSync(path.join(root, 'src/b.js'), 'new\n');
  const changed = changedFiles(root);
  assert.deepEqual(changed, ['src/a.js', 'src/b.js']);
  const steps = plan(root, {checks: [NO_BAD, {name: 'other', when: 'docs/**', run: 'true'}]}, changed);
  assert.deepEqual(steps.map(step => step.check.name), ['no bad']);
  assert.match(steps[0].run, /"a\.js" "b\.js"$/);
});

test('commits since the base count as changed', () => {
  const root = repository({checks: []});
  execFileSync('git', ['-C', root, 'branch', 'base']);
  fs.writeFileSync(path.join(root, 'src/c.js'), 'c\n');
  execFileSync('git', ['-C', root, 'add', '-A']);
  execFileSync('git', ['-C', root, 'commit', '-q', '-m', 'c']);
  assert.deepEqual(changedFiles(root), []);
  assert.deepEqual(changedFiles(root, 'base'), ['src/c.js']);
  assert.deepEqual(changedFiles(root, 'no-such-ref'), []);
});

test('a deleted file triggers its check but is not passed to it', () => {
  const root = repository({checks: [NO_BAD]});
  fs.rmSync(path.join(root, 'src/a.js'));
  assert.deepEqual(plan(root, {checks: [NO_BAD]}, changedFiles(root)), []);
  const always = {name: 'tests', when: 'src/**', run: 'true'};
  assert.equal(plan(root, {checks: [always]}, changedFiles(root)).length, 1);
});

test('a pass is not run again on the same contents', () => {
  const root = repository({checks: [NO_BAD]});
  fs.writeFileSync(path.join(root, 'src/a.js'), 'fine\n');
  const first = runChecks(root).results;
  assert.deepEqual(first.map(r => [r.ok, r.cached]), [[true, false]]);
  assert.deepEqual(runChecks(root).results.map(r => [r.ok, r.cached]), [[true, true]]);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'bad\n');
  assert.deepEqual(runChecks(root).results.map(r => [r.ok, r.cached]), [[false, false]]);
  assert.deepEqual(runChecks(root).results.map(r => [r.ok, r.cached]), [[false, false]]);
});

test('the Stop hook blocks while a check fails, then gives up after three tries', () => {
  const root = repository({checks: [NO_BAD]});
  assert.equal(hook('validate.mjs', root, {hook_event_name: 'Stop'}).status, 0);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'bad\n');
  for (const attempt of [1, 2, 3]) {
    const result = hook('validate.mjs', root, {hook_event_name: 'Stop'});
    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(`attempt ${attempt} of 3`));
    assert.match(result.stderr, /## no bad/);
  }
  const fourth = hook('validate.mjs', root, {hook_event_name: 'Stop'});
  assert.equal(fourth.status, 0);
  assert.match(JSON.parse(fourth.stdout).systemMessage, /still failing after 3 attempts: no bad/);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'good\n');
  assert.equal(hook('validate.mjs', root, {hook_event_name: 'Stop'}).status, 0);
});

test('the Stop hook lets the agent stop where there is nothing to check', () => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-none-'));
  assert.equal(hook('validate.mjs', outside, {hook_event_name: 'Stop'}).status, 0);
  const root = repository({checks: [NO_BAD]});
  fs.rmSync(path.join(root, '.agents/validate.json'));
  assert.equal(hook('validate.mjs', root, {hook_event_name: 'Stop'}).status, 0);
});

test('one screenshot per phase; a prompt or a new phase gives it back', () => {
  const root = repository({checks: []});
  const shoot = () =>
    hook('screenshot-budget.mjs', root, {
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__figma-console__figma_take_screenshot',
    });
  const cli = (...args) =>
    execFileSync(process.execPath, [path.join(HOME, 'bin/design-fence.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  assert.equal(shoot().status, 0);
  const refused = shoot();
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /already had its screenshot/);
  assert.equal(hook('screenshot-budget.mjs', root, {hook_event_name: 'UserPromptSubmit'}).status, 0);
  assert.equal(shoot().status, 0);
  assert.equal(shoot().status, 2);
  cli('phase', 'build');
  assert.equal(cli('phase').trim(), 'build');
  assert.equal(shoot().status, 0);
  assert.match(shoot().stderr, /\(build\)/);
  // Another session has its own budget.
  const other = hook('screenshot-budget.mjs', root, {
    hook_event_name: 'PreToolUse',
    session_id: 's2',
  });
  assert.equal(other.status, 0);
});

test('the command line: check reports and fails, rules prints the ledger', () => {
  const root = repository({checks: [NO_BAD]});
  const cli = (...args) =>
    spawnSync(process.execPath, [path.join(HOME, 'bin/design-fence.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  assert.match(cli('check').stdout, /Nothing changed that a check covers/);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'bad\n');
  const failed = cli('check');
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /FAIL no bad/);
  fs.writeFileSync(path.join(root, '.agents/ENFORCEMENT.md'), '## Enforcement ledger\n| x |\n');
  const rules = cli('rules').stdout;
  assert.match(rules, /The non-negotiables/);
  assert.match(rules, /- no bad: when src\/\*\*/);
  assert.match(rules, /Enforcement ledger/);
});

test('install adds what is missing and nothing on a second run', () => {
  const root = repository({checks: []});
  fs.rmSync(path.join(root, '.agents'), {recursive: true});
  const target = path.join(root, '.agents/design-fence');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.cpSync(HOME, target, {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}test`),
  });
  const run = () =>
    execFileSync(process.execPath, [path.join(target, 'install.mjs')], {cwd: root, encoding: 'utf8'});
  assert.match(run(), /Wrote: .claude\/settings.json, CLAUDE.md, AGENTS.md, .agents\/validate.json, .agents\/ENFORCEMENT.md/);
  assert.match(run(), /Already installed/);
  const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /^@AGENTS\.md$/m);
  assert.match(claude, /^@\.agents\/design-fence\/PROCESS\.md$/m);
  const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
  assert.equal(settings.extraKnownMarketplaces['design-fence'].source.path, './.agents/design-fence');
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), new RegExp(path.basename(root)));
});
