import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {bypassReason, commandText, decide, fromHookInput, isScreenshot, pastedScript} from '../lib/agent-hooks.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CLI = path.join(HOME, 'bin/design-fence.mjs');

/** An empty repository. */
function repository() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-agent-')));
  execFileSync('git', ['-C', root, 'init', '-q', '-b', 'main']);
  return root;
}

test('commands that skip or turn off the git hooks are refused', () => {
  for (const command of [
    'git commit --no-verify -m "x"',
    'git commit -n -m x',
    'git commit -anm x',
    'git commit --no-veri -m x',
    'git push --no-verify origin main',
    'npm test && git commit --no-verify -m x',
    'GIT_AUTHOR_NAME=a git -C . commit --no-verify',
    'git -c core.hooksPath=/dev/null commit -m x',
    'git -c "core.hooksPath=/dev/null" commit -m x',
    'git config core.hooksPath .git/hooks',
    'git config --unset core.hooksPath',
    'git config unset core.hooksPath',
    ['bash', '-lc', 'git commit --no-verify -m x'],
    ['git', 'commit', '--no-verify', '-m', 'a message'],
  ]) {
    assert.ok(bypassReason(command), `refused: ${JSON.stringify(command)}`);
  }
});

test('ordinary commands, and messages that only mention the flag, pass', () => {
  for (const command of [
    'git commit -m "x"',
    'git commit -m "docs: never use --no-verify"',
    "git commit -m 'refuse -n and --no-verify'",
    'git commit -F - <<\'EOF\'\nfeat: a hook refusing --no-verify\nEOF',
    'git commit -m "$(cat <<\'EOF\'\nrefuse git commit --no-verify\nEOF\n)"',
    'git commit -mn',
    'git push -n origin main',
    'git config --get core.hooksPath',
    'git config core.hooksPath',
    'echo --no-verify',
    'grep -n --no-verify README.md',
    ['git', 'commit', '-m', 'mentions --no-verify'],
  ]) {
    assert.equal(bypassReason(command), '', `passes: ${JSON.stringify(command)}`);
  }
});

test('a command as an argument list reads as shell', () => {
  assert.equal(commandText(['bash', '-lc', 'git status']), 'git status');
  assert.equal(commandText(['git', 'commit', '-m', 'a b']), "git commit -m 'a b'");
  assert.equal(commandText(undefined), '');
});

test('the design tools\' screenshots, in each tool\'s naming', () => {
  assert.ok(isScreenshot('mcp__figma-console__figma_take_screenshot'));
  assert.ok(isScreenshot('mcp__claude_ai_Figma__get_screenshot'));
  assert.ok(isScreenshot('figma-console_figma_capture_screenshot'));
  assert.ok(isScreenshot('mcp__figma-console__figma_get_component_image'));
  assert.ok(!isScreenshot('mcp__chrome__get_screenshot'));
  assert.ok(!isScreenshot('mcp__figma-console__figma_get_status'));
});

test('a figma/ script pasted into an execute call is found', () => {
  const lint = fs.readFileSync(path.join(HOME, 'figma/lint-gaps.js'), 'utf8');
  assert.equal(pastedScript('mcp__figma-console__figma_execute', {code: `${lint}\nreturn await lintGaps('1:2');`}), 'lint-gaps');
  assert.equal(pastedScript('mcp__claude_ai_Figma__use_figma', {code: 'async function tokens() {}'}), 'tokens');
  assert.equal(pastedScript('mcp__figma-console__figma_execute', {code: 'return figma.currentPage.name'}), '');
  assert.equal(pastedScript('Bash', {command: 'async function sources() {}'}), '');
});

test('one screenshot per phase, the phase ending when the human writes', () => {
  const root = repository();
  const shot = {name: 'pre-tool-use', tool: 'mcp__figma-console__figma_take_screenshot', input: {}, session: 's1'};
  assert.deepEqual(decide(root, shot, {home: HOME}), {});
  assert.match(decide(root, shot, {home: HOME}).deny, /one per phase/);
  assert.deepEqual(decide(root, {...shot, session: 's2'}, {home: HOME}), {}, 'another session has its own budget');
  decide(root, {name: 'user-prompt', session: 's1'}, {home: HOME});
  assert.deepEqual(decide(root, shot, {home: HOME}), {});
  assert.ok(fs.existsSync(path.join(root, '.git/design-fence/agent-sessions.json')));
});

test('a pasted script goes through once its command has been tried in the session', () => {
  const root = repository();
  const paste = {name: 'pre-tool-use', tool: 'mcp__figma-console__figma_execute', input: {code: 'async function lintGaps(id) {}'}, session: 's'};
  assert.match(decide(root, paste, {home: HOME}).deny, /figma lint-gaps/);
  const shot = {name: 'pre-tool-use', tool: 'mcp__figma-console__figma_take_screenshot', input: {}, session: 's'};
  decide(root, shot, {home: HOME});
  const tried = {name: 'pre-tool-use', tool: 'Bash', input: {command: 'node .agents/design-fence/bin/design-fence.mjs figma lint-gaps 1:2'}, session: 's'};
  assert.deepEqual(decide(root, tried, {home: HOME}), {});
  assert.deepEqual(decide(root, paste, {home: HOME}), {});
  assert.match(decide(root, {...paste, session: 'other'}, {home: HOME}).deny, /refused/, 'only in that session');
  assert.match(decide(root, shot, {home: HOME}).deny, /one per phase/, 'the screenshot count was kept');
  decide(root, {name: 'user-prompt', session: 's'}, {home: HOME});
  assert.deepEqual(decide(root, paste, {home: HOME}), {}, 'a new phase keeps what was tried');
});

test('after a compaction, the AGENTS.md block again; at a start, the hooks when off', () => {
  const root = repository();
  fs.writeFileSync(
    path.join(root, 'AGENTS.md'),
    '# P\n\n<!-- design-fence: written by install.mjs -->\n\nRead the playbook.\n\n<!-- /design-fence -->\n\nMore.\n',
  );
  const compact = decide(root, {name: 'session-start', source: 'compact'}, {home: HOME});
  assert.match(compact.context, /again after the compaction/);
  assert.match(compact.context, /Read the playbook\./);
  assert.doesNotMatch(compact.context, /More\./);
  assert.match(decide(root, {name: 'session-start', source: 'startup'}, {home: HOME}).context, /git hooks are off/);
});

test('the hook input of Claude Code and Codex', () => {
  assert.deepEqual(
    fromHookInput({hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command: 'ls'}, session_id: 'a'}, 'x'),
    {name: 'pre-tool-use', tool: 'Bash', input: {command: 'ls'}, session: 'a', source: undefined},
  );
  assert.equal(fromHookInput({}, 'user-prompt').name, 'user-prompt');
});

/** Runs `design-fence agent-hook <name>` with `payload` on stdin. */
function agentHook(name, payload, cwd) {
  return spawnSync(process.execPath, [CLI, 'agent-hook', name], {cwd, input: JSON.stringify(payload), encoding: 'utf8'});
}

test('agent-hook: exit 2 with the reason refuses; anything else lets the call through', () => {
  const root = repository();
  const refused = agentHook('pre-tool-use', {hook_event_name: 'PreToolUse', cwd: root, tool_name: 'Bash', tool_input: {command: 'git commit --no-verify'}}, root);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /never skip it/);
  const allowed = agentHook('pre-tool-use', {cwd: root, tool_name: 'Bash', tool_input: {command: 'git status'}}, root);
  assert.equal(allowed.status, 0);
  const outside = agentHook('pre-tool-use', {cwd: os.tmpdir(), tool_name: 'Bash', tool_input: {command: 'git commit --no-verify'}}, os.tmpdir());
  assert.equal(outside.status, 0, 'outside a repository, nothing is refused');
  const broken = spawnSync(process.execPath, [CLI, 'agent-hook', 'pre-tool-use'], {cwd: root, input: '{not json', encoding: 'utf8'});
  assert.equal(broken.status, 1, 'its own error never refuses');
  const start = agentHook('session-start', {hook_event_name: 'SessionStart', cwd: root, source: 'startup'}, root);
  assert.equal(start.status, 0);
  assert.match(start.stdout, /git hooks are off/);
});
