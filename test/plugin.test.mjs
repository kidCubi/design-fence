/**
 * The plugins as the agent tools run them: copied out of the repository
 * (Claude Code's and Codex's cache, OpenCode's plugins folder), alone,
 * carrying their own logic, in projects with and without design-fence.
 */

import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {TARGETS, build} from '../harness/build.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const temp = name => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `design-fence-${name}-`)));

/** A repository with design-fence copied in, as a submodule would put it; installed when `install`. */
function project({install = false} = {}) {
  const root = temp('plugin-project');
  execFileSync('git', ['-C', root, 'init', '-q', '-b', 'main']);
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents/validate.json'), '{"checks": []}\n');
  fs.cpSync(HOME, path.join(root, '.agents/design-fence'), {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}test`),
  });
  if (install) {
    execFileSync(process.execPath, [path.join(root, '.agents/design-fence/install.mjs')], {cwd: root, encoding: 'utf8'});
  }
  return root;
}

/** The Claude Code and Codex plugin, copied alone, as the tools' cache holds it. */
function cachedPlugin() {
  const dir = temp('plugin-cache');
  fs.cpSync(path.join(HOME, 'harness/plugin'), dir, {recursive: true});
  return path.join(dir, 'hook.mjs');
}

/** Runs the plugin's hook on a tool call; `claude`: as Claude Code runs it (CLAUDE_PROJECT_DIR set, no turn_id). */
function run(hook, cwd, event, payload, claude = true) {
  return spawnSync(process.execPath, [hook, event], {
    cwd,
    env: {...process.env, CLAUDE_PROJECT_DIR: claude ? cwd : ''},
    input: JSON.stringify({cwd, ...(claude ? {} : {turn_id: 't'}), ...payload}),
    encoding: 'utf8',
  });
}
const bash = command => ({hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command}, session_id: 's'});
const edit = file => ({hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: {file_path: file}, session_id: 's'});

test('the plugins are as harness/build.mjs makes them', () => {
  for (const [target, text] of Object.entries(build())) {
    assert.equal(fs.readFileSync(path.join(HOME, target), 'utf8'), text, `${target}: run node harness/build.mjs`);
  }
  assert.deepEqual(Object.keys(TARGETS), ['harness/plugin/hook.mjs', 'harness/opencode/design-fence.js']);
});

test('the plugin, alone in a cache, guards a project with design-fence, and nothing else', () => {
  const hook = cachedPlugin();
  const root = project();
  const refused = run(hook, root, 'pre-tool-use', bash('git commit --no-verify -m x'));
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /git commit --no-verify/);
  const asked = run(hook, root, 'pre-tool-use', edit('.agents/validate.json'));
  assert.equal(asked.status, 0);
  assert.equal(JSON.parse(asked.stdout).hookSpecificOutput.permissionDecision, 'ask', 'Claude Code asks the human');
  const codex = run(hook, root, 'pre-tool-use', edit('.agents/validate.json'), false);
  assert.equal(codex.status, 2, 'Codex refuses');
  assert.match(codex.stderr, /design-fence: allow/);
  assert.equal(run(hook, root, 'pre-tool-use', bash('git status')).status, 0);
  const elsewhere = temp('plain');
  execFileSync('git', ['-C', elsewhere, 'init', '-q']);
  assert.equal(run(hook, elsewhere, 'pre-tool-use', bash('git commit --no-verify')).status, 0, 'no design-fence: nothing');
  assert.equal(run(hook, os.tmpdir(), 'pre-tool-use', bash('git commit --no-verify')).status, 0, 'no repository: nothing');
});

test("the plugin still guards once the project's design-fence is gone, and alongside the project's own hooks", () => {
  const hook = cachedPlugin();
  const root = project({install: true});
  assert.equal(run(hook, root, 'pre-tool-use', bash('git commit --no-verify')).status, 2, "beside the project's hooks");
  assert.equal(run(hook, root, 'session-start', {hook_event_name: 'SessionStart', source: 'compact'}).stdout, '', "the project's hooks give the context");
  fs.rmSync(path.join(root, '.agents/design-fence'), {recursive: true});
  assert.equal(run(hook, root, 'pre-tool-use', bash('git commit --no-verify')).status, 2, 'AGENTS.md keeps its block');
  assert.equal(run(hook, root, 'pre-tool-use', bash('rm -rf .agents/validate.json'), false).status, 2);
  const context = run(hook, root, 'session-start', {hook_event_name: 'SessionStart', source: 'startup'});
  assert.equal(context.status, 0);
});

test('the plugin gives the context where the project has no hooks of its own', () => {
  const hook = cachedPlugin();
  const root = project();
  const start = run(hook, root, 'session-start', {hook_event_name: 'SessionStart', source: 'startup'});
  assert.match(start.stdout, /git hooks are off/);
});

/** OpenCode's plugin, copied alone into a folder of its own (a person's plugins folder), and loaded. */
async function opencode(root, where = temp('opencode-plugins')) {
  const file = path.join(where, 'design-fence.js');
  fs.mkdirSync(where, {recursive: true});
  fs.copyFileSync(path.join(HOME, 'harness/opencode/design-fence.js'), file);
  const {DesignFence} = await import(`${file}?${Date.now()}`);
  return DesignFence({directory: root, worktree: root});
}
const refuses = async (hooks, tool, args, callID = 'c') => {
  try {
    await hooks['tool.execute.before']({tool, sessionID: 'o', callID}, {args});
    return '';
  } catch (error) {
    return error.message;
  }
};
const says = (hooks, text) => hooks['chat.message']({sessionID: 'o'}, {message: {}, parts: [{type: 'text', text}]});

test("OpenCode's plugin, alone: refuses, asks the human's word through a message, counts screenshots once per call", async () => {
  const root = project();
  const hooks = await opencode(root);
  assert.match(await refuses(hooks, 'bash', {command: 'git commit --no-verify'}), /--no-verify/);
  assert.equal(await refuses(hooks, 'bash', {command: 'git status'}), '');
  assert.match(await refuses(hooks, 'edit', {filePath: path.join(root, '.agents/validate.json')}), /design-fence: allow/);
  await says(hooks, 'Add the check. design-fence: allow');
  assert.equal(await refuses(hooks, 'edit', {filePath: path.join(root, '.agents/validate.json')}), '');
  await says(hooks, 'Thanks.');
  assert.match(await refuses(hooks, 'edit', {filePath: path.join(root, '.agents/validate.json')}), /human's word/);
  const shot = 'figma-console_figma_take_screenshot';
  assert.equal(await refuses(hooks, shot, {}, 'one'), '');
  assert.equal(await refuses(hooks, shot, {}, 'one'), '', 'the same call, seen by the other copy');
  assert.match(await refuses(hooks, shot, {}, 'two'), /one per phase/);
  const elsewhere = temp('plain');
  execFileSync('git', ['-C', elsewhere, 'init', '-q']);
  assert.deepEqual(await opencode(elsewhere), {}, 'no design-fence: no hooks');
});

test("OpenCode's plugins: the person's copy gives no context where the project has its own", async () => {
  const root = project({install: true});
  const person = await opencode(root);
  const output = {context: []};
  await person['experimental.session.compacting']({sessionID: 'o'}, output);
  assert.deepEqual(output.context, []);
  assert.match(await refuses(person, 'bash', {command: 'git commit --no-verify'}), /--no-verify/, 'it still decides');
  const own = await opencode(root, path.join(root, '.opencode/plugins'));
  await own['experimental.session.compacting']({sessionID: 'o'}, output);
  assert.match(output.context[0], /again after the compaction/);
});

test("the plugin's hooks look at the same tool calls as the project's", async () => {
  const {PRE_TOOL_MATCHER} = await import('../install.mjs');
  const hooks = JSON.parse(fs.readFileSync(path.join(HOME, 'harness/plugin/hooks/hooks.json'), 'utf8')).hooks;
  assert.equal(hooks.PreToolUse[0].matcher, PRE_TOOL_MATCHER);
  assert.deepEqual(Object.keys(hooks).sort(), ['PreToolUse', 'SessionStart', 'UserPromptSubmit']);
});
