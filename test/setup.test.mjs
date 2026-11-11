/**
 * The installer as `npx design-fence` runs it (`bin/setup.mjs`), without a
 * terminal (as an agent runs it): in a temporary repository, from a copy of
 * design-fence committed in a temporary repository of its own, with stand-ins
 * for `claude`, `codex` and `npx` that record what they are asked, and a
 * temporary home folder.
 */

import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {agentsFor} from '../install.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SETUP = path.join(HOME, 'bin/setup.mjs');
const temp = name => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `design-fence-${name}-`)));
const GIT_ENV = {
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

/** design-fence as it is here, committed in a repository of its own: where the submodule comes from. */
let source;
function designFence() {
  if (!source) {
    source = temp('source');
    fs.cpSync(HOME, source, {
      recursive: true,
      filter: file => !/[/\\](\.git|node_modules|test|bench|LEARNINGS\.md)$/.test(file),
    });
    execFileSync('git', ['-C', source, 'init', '-q', '-b', 'main']);
    execFileSync('git', ['-C', source, 'add', '-A']);
    execFileSync('git', ['-C', source, 'commit', '-q', '-m', 'design-fence'], {env: {...process.env, ...GIT_ENV}});
  }
  return source;
}

/** A person's machine: a home folder, and `claude`, `codex`, `npx` that log their arguments. */
function machine({tools = ['claude', 'codex', 'npx']} = {}) {
  const home = temp('home');
  const bin = path.join(home, 'bin');
  fs.mkdirSync(bin);
  const log = path.join(home, 'calls.log');
  const scripts = {
    claude: 'if [ "$2" = list ]; then echo "[]"; fi',
    codex: 'true',
    npx: [
      'mkdir -p "$HOME/.figma-console-mcp/plugin"',
      'echo "{}" > "$HOME/.figma-console-mcp/plugin/manifest.json"',
      'echo "$HOME/.figma-console-mcp/plugin/manifest.json"',
    ].join('\n'),
  };
  for (const tool of tools) {
    fs.writeFileSync(path.join(bin, tool), `#!/bin/sh\necho "${tool} $*" >> "${log}"\n${scripts[tool]}\n`, {mode: 0o755});
  }
  const env = {
    ...GIT_ENV,
    PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter),
    HOME: home,
    XDG_CONFIG_HOME: path.join(home, '.config'),
  };
  return {home, env, calls: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '')};
}

function setup(cwd, env, ...args) {
  const result = spawnSync(process.execPath, [SETUP, '--source', designFence(), ...args], {cwd, env, encoding: 'utf8'});
  return {status: result.status, output: `${result.stdout}${result.stderr}`};
}

function repository() {
  const root = temp('project');
  execFileSync('git', ['-C', root, 'init', '-q', '-b', 'main']);
  return root;
}

const config = root => JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8'));
const hooksPath = root => execFileSync('git', ['-C', root, 'config', 'core.hooksPath'], {encoding: 'utf8'}).trim();

test('npx design-fence, for an agent: the submodule, the project, the plugin in each tool, Figma, and what is left', () => {
  const root = repository();
  const {home, env, calls} = machine();
  const run = setup(root, env, '--yes', '--agents', 'claude,codex,opencode', '--design');
  assert.equal(run.status, 0, run.output);
  assert.ok(fs.existsSync(path.join(root, '.agents/design-fence/bin/design-fence.mjs')), 'the submodule');
  assert.match(fs.readFileSync(path.join(root, '.gitmodules'), 'utf8'), /path = \.agents\/design-fence/);
  assert.equal(hooksPath(root), '.agents/design-fence/hooks');
  assert.deepEqual(config(root).agents, ['claude', 'codex', 'opencode']);
  assert.deepEqual(config(root).design, {dir: 'design'});
  for (const file of ['AGENTS.md', '.claude/settings.json', '.codex/hooks.json', '.opencode/plugins/design-fence.js', '.mcp.json', 'opencode.json', 'design/index.md']) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  const log = calls();
  assert.match(log, new RegExp(`claude plugin install design-fence --marketplace ${designFence()}`));
  assert.match(log, new RegExp(`codex plugin marketplace add ${designFence()}`));
  assert.match(log, /codex plugin add design-fence@design-fence/);
  assert.match(log, /npx -y figma-console-mcp@\d+\.\d+\.\d+ --print-path/);
  assert.equal(
    fs.readFileSync(path.join(home, '.config/opencode/plugins/design-fence.js'), 'utf8'),
    fs.readFileSync(path.join(HOME, 'harness/opencode/design-fence.js'), 'utf8'),
    "OpenCode's plugin, in the person's folder",
  );
  assert.match(run.output, /git add .*\.gitmodules/);
  assert.match(run.output, /Reflect: design-fence's files, installed as they come/);
  assert.match(run.output, /Left for you:[\s\S]*\/hooks[\s\S]*Import plugin from manifest/);

  const again = setup(root, env, '--yes', '--agents', 'claude,codex,opencode', '--design');
  assert.equal(again.status, 0, again.output);
  assert.doesNotMatch(again.output, /To commit/, 'nothing new the second time');
});

test('npx design-fence outside a git repository: stops without --git-init, makes one with it', () => {
  const folder = temp('folder');
  const {env} = machine();
  const stopped = setup(folder, env, '--yes', '--agents', 'other');
  assert.equal(stopped.status, 2);
  assert.match(stopped.output, /not a git repository[\s\S]*--git-init/);
  assert.equal(fs.existsSync(path.join(folder, '.agents')), false);
  const made = setup(folder, env, '--yes', '--agents', 'other', '--git-init');
  assert.equal(made.status, 0, made.output);
  assert.ok(fs.existsSync(path.join(folder, '.git')));
  assert.ok(fs.existsSync(path.join(folder, '.agents/design-fence/install.mjs')));
});

test('npx design-fence for another agent: AGENTS.md and the git hooks, no tool hooks, no plugin', () => {
  const root = repository();
  const {env, calls} = machine();
  const run = setup(root, env, '--yes', '--agents', 'other');
  assert.equal(run.status, 0, run.output);
  assert.deepEqual(config(root).agents, []);
  for (const file of ['.claude/settings.json', '.codex/hooks.json', '.opencode/plugins/design-fence.js']) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
  assert.ok(fs.existsSync(path.join(root, 'AGENTS.md')));
  assert.equal(hooksPath(root), '.agents/design-fence/hooks');
  assert.equal(calls(), '');
  assert.match(run.output, /Read AGENTS\.md first/);
  assert.match(setup(root, env, '--yes', '--agents', 'cursor').output, /--agents takes/);
});

test("npx design-fence in a teammate's fresh clone: checks the submodule out, turns the hooks on, installs their tool's plugin", () => {
  const root = repository();
  const {env, calls} = machine();
  assert.equal(setup(root, env, '--yes', '--agents', 'claude').status, 0);
  execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null', 'add', '-A']);
  execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'install'], {env: {...process.env, ...GIT_ENV}});
  const clone = path.join(temp('clone'), 'project');
  execFileSync('git', ['clone', '-q', root, clone]);
  assert.equal(fs.existsSync(path.join(clone, '.agents/design-fence/install.mjs')), false, 'not checked out');
  const run = setup(clone, env, '--yes', '--agents', 'codex');
  assert.equal(run.status, 0, run.output);
  assert.match(run.output, /design-fence checked out/);
  assert.equal(hooksPath(clone), '.agents/design-fence/hooks');
  assert.deepEqual(config(clone).agents, ['claude', 'codex'], "the project's tools, and the teammate's");
  assert.match(calls(), /codex plugin add design-fence@design-fence/);
});

test('npx design-fence says how to install the plugin by hand where the tool is not on the PATH', () => {
  const root = repository();
  const {env} = machine({tools: []});
  const run = setup(root, env, '--yes', '--agents', 'claude,codex');
  assert.equal(run.status, 1, 'the plugin is part of the install');
  assert.match(run.output, /\/plugin marketplace add kidCubi\/design-fence/);
  assert.match(run.output, /codex plugin marketplace add kidCubi\/design-fence/);
  assert.ok(fs.existsSync(path.join(root, '.claude/settings.json')), 'the project is installed all the same');
});

test("install.mjs --agents: the project's tools, added to", () => {
  const root = repository();
  assert.deepEqual(agentsFor(root, {}), ['claude', 'codex', 'opencode'], 'none named, none wired: all');
  assert.deepEqual(agentsFor(root, {}, ['claude']), ['claude']);
  assert.deepEqual(agentsFor(root, {agents: ['codex']}, ['claude']), ['claude', 'codex']);
  assert.deepEqual(agentsFor(root, {agents: ['codex']}), ['codex']);
  assert.deepEqual(agentsFor(root, {}, ['other']), []);
  fs.mkdirSync(path.join(root, '.opencode/plugins'), {recursive: true});
  fs.writeFileSync(path.join(root, '.opencode/plugins/design-fence.js'), '');
  assert.deepEqual(agentsFor(root, {}), ['claude', 'codex', 'opencode'], 'no list, no --agents: all, as before');
  assert.deepEqual(agentsFor(root, {}, ['claude']), ['claude', 'opencode'], 'no list yet: added to the tools wired already');
});

const cli = (root, env, ...args) => {
  const result = spawnSync(process.execPath, [path.join(root, '.agents/design-fence/bin/design-fence.mjs'), ...args], {cwd: root, env, encoding: 'utf8'});
  return {status: result.status, output: `${result.stdout}${result.stderr}`};
};

test('design-fence doctor: all in place after the installer, and the fix for what is then undone', () => {
  const root = repository();
  const {env} = machine();
  assert.equal(setup(root, env, '--yes', '--agents', 'claude,opencode').status, 0);
  const fine = cli(root, env, 'doctor');
  assert.equal(fine.status, 0, fine.output);
  assert.match(fine.output, /ok {3}The git hooks are on[\s\S]*ok {3}Claude Code: the session hooks are in the project[\s\S]*ok {3}OpenCode: your own copy of the plugin is this version[\s\S]*note The design module is off[\s\S]*All in place\./);

  execFileSync('git', ['-C', root, 'config', '--unset', 'core.hooksPath']);
  fs.rmSync(path.join(root, '.claude/settings.json'));
  const agents = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agents, fs.readFileSync(agents, 'utf8').replace('### design-fence\'s non-negotiables', '### The non-negotiables, as an earlier version wrote them'));
  const off = cli(root, env, 'doctor');
  assert.equal(off.status, 1);
  assert.match(off.output, /OFF {2}The git hooks are off in this clone\n {7}→ node \.agents\/design-fence\/install\.mjs/);
  assert.match(off.output, /OFF {2}AGENTS\.md's design-fence block is an earlier version's/);
  assert.match(off.output, /OFF {2}Claude Code: the session hooks are not in the project/);
  assert.match(off.output, /3 to put right\./);
});

test('design-fence doctor, with the design module: the check, the Figma server at its version, the bridge plugin', () => {
  const root = repository();
  const {env} = machine();
  assert.equal(setup(root, env, '--yes', '--agents', 'claude', '--design').status, 0);
  const fine = cli(root, env, 'doctor');
  assert.match(fine.output, /ok {3}The design module's check is among the project's checks/);
  assert.match(fine.output, /ok {3}Claude Code: Figma's server is figma-console-mcp@\d+\.\d+\.\d+\n/);
  assert.match(fine.output, /ok {3}The Desktop Bridge plugin's files are on this machine/);
  const mcp = path.join(root, '.mcp.json');
  fs.writeFileSync(mcp, fs.readFileSync(mcp, 'utf8').replace(/figma-console-mcp@[\d.]+/, 'figma-console-mcp@latest'));
  assert.match(cli(root, env, 'doctor').output, /OFF {2}Claude Code: Figma's server is figma-console-mcp@latest; design-fence works with figma-console-mcp@\d/);
});

test('design-fence update: the submodule to its newest commit, the installer again, and the commit to make', () => {
  const root = repository();
  const {env} = machine();
  // Its own source, so that a commit can be added to it: a copy of the shared one.
  const origin = path.join(temp('origin'), 'design-fence');
  execFileSync('git', ['clone', '-q', designFence(), origin]);
  const local = {...env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'protocol.file.allow', GIT_CONFIG_VALUE_0: 'always'};
  const first = spawnSync(process.execPath, [SETUP, '--source', origin, '--yes', '--agents', 'claude'], {cwd: root, env: local, encoding: 'utf8'});
  assert.equal(first.status, 0, first.stdout + first.stderr);
  execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null', 'add', '-A']);
  execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'install'], {env: {...process.env, ...GIT_ENV}});
  assert.match(cli(root, local, 'update').output, /design-fence is up to date/);

  // A new version: a line more in the block of AGENTS.md.
  const block = path.join(origin, 'templates/agents-block.md');
  fs.writeFileSync(block, `${fs.readFileSync(block, 'utf8')}\nA line of the next version.\n`);
  execFileSync('git', ['-C', origin, 'commit', '-qam', 'next'], {env: {...process.env, ...GIT_ENV}});
  const updated = cli(root, local, 'update');
  assert.equal(updated.status, 0, updated.output);
  assert.match(updated.output, /design-fence \w+ → \w+\. To commit the update[\s\S]*git add [^\n]*\.agents\/design-fence[^\n]*AGENTS\.md|git add [^\n]*AGENTS\.md[^\n]*\.agents\/design-fence/);
  assert.match(updated.output, /Reflect: design-fence's files, as released/);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /A line of the next version\./);
  assert.equal(execFileSync('git', ['-C', root, 'rev-list', '--count', 'HEAD'], {encoding: 'utf8'}).trim(), '1', 'not committed');
});
