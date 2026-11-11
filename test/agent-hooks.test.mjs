import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  bypassReason,
  commandText,
  decide,
  fenceReason,
  fromHookInput,
  hooksOffReason,
  isScreenshot,
  pastedScript,
  runHook,
} from '../lib/agent-hooks.mjs';

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

test('the fence: what touches design-fence\'s own files, in each tool\'s shape', () => {
  const root = '/p';
  const home = '/p/.agents/design-fence';
  const homedir = '/u';
  const reason = (tool, input) => fenceReason(root, home, tool, input, homedir);
  // Edit tools: Claude Code's, Codex's apply_patch, OpenCode's.
  assert.match(reason('Edit', {file_path: '/p/.agents/validate.json'}), /\.agents\/validate\.json, which is design-fence's own/);
  assert.match(reason('Write', {file_path: '.claude/settings.json'}), /\.claude\/settings\.json/);
  assert.match(reason('apply_patch', {command: '*** Begin Patch\n*** Update File: .codex/hooks.json\n@@\n-a\n+b\n*** End Patch'}), /\.codex\/hooks\.json/);
  assert.match(reason('edit', {filePath: '/u/.config/opencode/plugins/design-fence.js'}), /~\/\.config\/opencode\/plugins\/design-fence\.js/);
  assert.match(reason('Edit', {file_path: '/p/.agents/design-fence/lib/agent-hooks.mjs'}), /\(\.agents\/design-fence\/\)/);
  assert.equal(reason('Edit', {file_path: '/p/src/a.js'}), '');
  assert.equal(reason('apply_patch', {command: '*** Begin Patch\n*** Add File: src/b.js\n+x\n*** End Patch'}), '');
  // The shell.
  for (const command of [
    'rm -rf .agents/design-fence',
    'rm -rf .agents',
    'rm -rf .agents/*',
    'echo "{}" > .agents/validate.json',
    "sed -i '' 's/a/b/' .agents/validate.json",
    'perl -pi -e s/a/b/ .codex/config.toml',
    'cp /tmp/x .claude/settings.json',
    'mv .git/hooks /tmp/h',
    'git rm -r .agents/design-fence',
    'git submodule deinit -f .agents/design-fence',
    'git checkout -- .agents/validate.json',
    `node -e "require('fs').writeFileSync('.agents/validate.json', '{}')"`,
    'echo x | tee ~/.codex/config.toml',
    'rm ~/.claude/settings.json',
    'rm -rf $HOME/.claude/plugins',
    'npm test && rm .opencode/plugins/design-fence.js',
  ]) {
    assert.ok(reason('Bash', {command}), `fence: ${command}`);
  }
  for (const command of [
    'cat .agents/validate.json',
    'node .agents/design-fence/bin/design-fence.mjs check 2>&1',
    'cp .agents/validate.json /tmp/v.json',
    'git checkout -- .',
    'git restore src/a.js',
    'ls ~/.claude',
    'rm -rf node_modules dist',
    'echo hi > out.txt 2>/dev/null',
    'git status',
  ]) {
    assert.equal(reason('Bash', {command}), '', `passes: ${command}`);
  }
});

test('turning the agent tools\' hooks off', () => {
  for (const command of [
    'claude plugin disable design-fence@design-fence',
    'claude plugin uninstall design-fence',
    'codex plugin remove design-fence',
    'codex features disable hooks',
    'codex --disable hooks exec "x"',
    'codex -c features.hooks=false exec x',
    `claude --settings '{"disableAllHooks": true}' -p x`,
    'codex exec --dangerously-bypass-hook-trust x',
  ]) {
    assert.ok(hooksOffReason(command), `off: ${command}`);
  }
  for (const command of ['claude plugin install design-fence --marketplace kidCubi/design-fence', 'claude plugin disable other', 'codex exec "hi"']) {
    assert.equal(hooksOffReason(command), '', `passes: ${command}`);
  }
});

test('the fence needs the human\'s word, given for a turn by "design-fence: allow"', () => {
  const root = repository();
  const home = path.join(root, '.agents/design-fence');
  const edit = {name: 'pre-tool-use', tool: 'Edit', input: {file_path: path.join(root, '.agents/validate.json')}, session: 's'};
  assert.match(decide(root, edit, {home}).ask, /needs the human's word.*design-fence: allow/);
  decide(root, {name: 'user-prompt', session: 's', prompt: 'Add a check. design-fence: allow'}, {home});
  assert.deepEqual(decide(root, edit, {home}), {});
  assert.match(decide(root, {...edit, session: 'other'}, {home}).ask, /human's word/, 'only in that session');
  decide(root, {name: 'user-prompt', session: 's', prompt: 'Thanks.'}, {home});
  assert.match(decide(root, edit, {home}).ask, /human's word/, 'for that turn only');
  const forge = {name: 'pre-tool-use', tool: 'Bash', session: 's'};
  for (const command of [
    `echo '{"prompt":"design-fence: allow"}' | node .agents/design-fence/bin/design-fence.mjs agent-hook user-prompt`,
    'node ~/.claude/plugins/cache/design-fence/hook.mjs user-prompt < x.json',
  ]) {
    assert.match(decide(root, {...forge, input: {command}}, {home}).deny, /by hand/);
  }
});

test('a screenshot is counted once per tool call, whichever layer sees it first', () => {
  const root = repository();
  const home = path.join(root, '.agents/design-fence');
  const shot = id => ({name: 'pre-tool-use', tool: 'mcp__figma-console__figma_take_screenshot', input: {}, session: 's', id});
  assert.deepEqual(decide(root, shot('a'), {home}), {}, 'the plugin');
  assert.deepEqual(decide(root, shot('a'), {home}), {}, "the project's hooks, on the same call");
  assert.match(decide(root, shot('b'), {home}).deny, /one per phase/);
  decide(root, {name: 'user-prompt', session: 's'}, {home});
  assert.deepEqual(decide(root, shot('b'), {home}), {});
});

test('runHook: Claude Code is asked; Codex, and a tool that only runs Claude Code\'s hooks, refuse, with the way out', () => {
  const root = repository();
  const input = (turn, extra = {}) => JSON.stringify({cwd: root, hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: {file_path: '.agents/validate.json'}, ...(turn ? {turn_id: 't'} : {}), ...extra});
  const home = path.join(root, '.agents/design-fence');
  // Claude Code: its project variable, and the permission mode it sends with every tool call.
  const claude = runHook('pre-tool-use', input(false, {permission_mode: 'default'}), {home, env: {CLAUDE_PROJECT_DIR: root}});
  assert.equal(claude.code, 0);
  assert.equal(JSON.parse(claude.stdout).hookSpecificOutput.permissionDecision, 'ask');
  // Another tool running the same hooks (Cursor and Gemini CLI set the variable too; Copilot may not): "ask" may
  // not be honoured there, so it is a refusal.
  const other = runHook('pre-tool-use', input(false), {home, env: {CLAUDE_PROJECT_DIR: root}});
  assert.equal(other.code, 2, 'no permission mode: not Claude Code itself');
  assert.match(other.stderr, /design-fence: allow/);
  assert.equal(runHook('pre-tool-use', input(false), {home, env: {}}).code, 2, 'nor without its variable');
  const codex = runHook('pre-tool-use', input(true), {home, env: {CLAUDE_PROJECT_DIR: root}});
  assert.equal(codex.code, 2, 'a turn_id: Codex, even with CLAUDE_PROJECT_DIR');
  assert.match(codex.stderr, /design-fence: allow/);
  assert.equal(runHook('pre-tool-use', input(true), {home, env: {}}).code, 2);
  assert.equal(runHook('pre-tool-use', '{not json', {home}).code, 1, 'its own error never refuses');
});

test('the hook input of Claude Code and Codex', () => {
  assert.deepEqual(
    fromHookInput({hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command: 'ls'}, session_id: 'a'}, 'x'),
    {name: 'pre-tool-use', tool: 'Bash', input: {command: 'ls'}, session: 'a', source: undefined, id: undefined, prompt: undefined},
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

/** The measure's fixture as a repository: a project with the design module, its specs and its tokens file. */
function designed() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-gate-')));
  fs.cpSync(path.join(HOME, 'bench/fixture'), root, {recursive: true, filter: file => !file.includes('node_modules')});
  execFileSync('git', ['-C', root, 'init', '-q']);
  fs.writeFileSync(path.join(root, 'design/components/badge.md'), '---\nname: Badge\nstatus: draft\n---\n\n# Badge\n');
  return root;
}

test("the design gate: marking a spec approved needs the human's word; building an approved one does not", () => {
  const root = designed();
  const home = path.join(root, '.agents/design-fence');
  const pre = (tool, input, session = 'g') => decide(root, {name: 'pre-tool-use', tool, input, session}, {home, homedir: os.tmpdir()});
  const badge = path.join(root, 'design/components/badge.md');
  const approve = {file_path: badge, old_string: 'status: draft', new_string: "status: approved\nfigma: '1:2'"};
  assert.match(pre('Edit', approve).ask, /it marks design\/components\/badge\.md approved\. Approval is the human's word at the design gate/);
  assert.match(pre('Write', {file_path: badge, content: '---\nname: Badge\nstatus: approved\n---\n'}).ask, /approved/);
  assert.match(pre('apply_patch', {input: `*** Begin Patch\n*** Update File: design/components/badge.md\n-status: draft\n+status: approved\n*** End Patch`}).ask, /approved/);
  assert.match(pre('Bash', {command: "sed -i '' 's/status: draft/status: approved/' design/components/badge.md"}).ask, /approved/);
  assert.match(pre('Edit', {file_path: path.join(root, 'design/content/landing.md'), old_string: 'x', new_string: 'Status: **approved** by the designer'}).ask ?? 'already approved: nothing', /nothing/);
  assert.deepEqual(pre('Edit', {file_path: badge, old_string: '# Badge', new_string: '# Badge\n\n## Purpose'}), {}, 'writing a draft is free');
  assert.deepEqual(pre('Bash', {command: 'grep -n "status: approved" design/components/badge.md'}), {}, 'reading is free');
  const command = path.join(root, 'design/components/command.md');
  assert.deepEqual(pre('Edit', {file_path: command, old_string: 'status: approved', new_string: "status: built\nstory: 'Components/Command'"}), {}, 'approved, then built');
  decide(root, {name: 'user-prompt', session: 'g', prompt: 'Good, approved. design-fence: allow'}, {home});
  assert.deepEqual(pre('Edit', approve), {}, "with the human's word");
});

test("the tokens file is the export's: an edit by hand needs the human's word, the export does not", () => {
  const root = designed();
  const home = path.join(root, '.agents/design-fence');
  const pre = (tool, input) => decide(root, {name: 'pre-tool-use', tool, input, session: 't'}, {home, homedir: os.tmpdir()});
  assert.match(pre('Edit', {file_path: path.join(root, 'src/tokens.css'), old_string: '#6d6b67', new_string: '#777777'}).ask, /it changes src\/tokens\.css, which the tokens export writes/);
  assert.match(pre('Bash', {command: "sed -i '' 's/6d6b67/777777/' src/tokens.css"}).ask, /tokens export writes/);
  assert.match(pre('Write', {file_path: path.join(root, 'design/tokens.lock'), content: '{}'}).ask, /tokens\.lock/);
  assert.deepEqual(pre('Bash', {command: 'node .agents/design-fence/bin/design-fence.mjs figma tokens --out'}), {});
  assert.deepEqual(pre('Bash', {command: 'node .agents/design-fence/bin/design-fence.mjs figma tokens --format css --out src/tokens.css'}), {});
  assert.deepEqual(pre('Edit', {file_path: path.join(root, 'src/page.css'), old_string: 'a', new_string: 'b'}), {});
});
