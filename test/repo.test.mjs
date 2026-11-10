/**
 * design-fence on a real (temporary) git repository: which checks run, the
 * cache of passes, the installer, and the git hooks as git runs them on a
 * commit and a push.
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
const REFLECT = 'Reflect: holds the bar';

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

/** design-fence copied into a repository, as a submodule would put it, and installed. */
function installed(root) {
  const target = path.join(root, '.agents/design-fence');
  fs.cpSync(HOME, target, {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}test`),
  });
  const output = execFileSync(process.execPath, [path.join(target, 'install.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  return {target, output};
}

/** Runs git in `root`, returning `{status, output}` instead of throwing. */
function gitRun(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {encoding: 'utf8'});
  return {status: result.status, output: `${result.stdout}${result.stderr}`};
}

// A check that fails when a changed file contains "bad".
const NO_BAD = {
  name: 'no bad',
  when: 'src/**',
  cwd: 'src',
  run: `node -e "const fs=require('fs');process.exit(process.argv.slice(1).some(f=>fs.readFileSync(f,'utf8').includes('bad'))?1:0)" {files}`,
};

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
  assert.deepEqual(runChecks(root, {base: 'base'}).results, []);
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

test('install adds what is missing, turns the hooks on, and does nothing a second time', () => {
  const root = repository({checks: []});
  fs.rmSync(path.join(root, '.agents'), {recursive: true});
  const {target, output} = installed(root);
  assert.match(
    output,
    /Wrote: AGENTS.md, .agents\/validate.json, .agents\/ENFORCEMENT.md, .github\/workflows\/design-fence.yml\n/,
  );
  assert.match(output, /Skills written to .agents\/skills\/ and .claude\/skills\/: design-fence-ship, design-fence-reflect\n/);
  assert.match(output, /Git hooks on: core.hooksPath .agents\/design-fence\/hooks/);
  assert.equal(gitRun(root, 'config', '--get', 'core.hooksPath').output.trim(), '.agents/design-fence/hooks');
  const again = execFileSync(process.execPath, [path.join(target, 'install.mjs')], {cwd: root, encoding: 'utf8'});
  assert.match(again, /nothing to write/);
  assert.doesNotMatch(again, /Skills/);
  assert.equal(fs.existsSync(path.join(root, 'CLAUDE.md')), false);
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, new RegExp(path.basename(root)));
  assert.match(agents, /<!-- design-fence: [^\n]*-->\n\n## The process: design-fence\n/);
  assert.match(agents, /\| `\.agents\/design-fence\/playbooks\/ship\.md` \|/);
  assert.match(agents, /1\. \*\*Ground before writing\.\*\*/);
  assert.doesNotMatch(agents, /figma\.md/);
  for (const dir of ['.agents/skills', '.claude/skills']) {
    const skill = path.join(root, dir, 'design-fence-ship');
    assert.equal(fs.lstatSync(skill).isSymbolicLink(), true);
    assert.match(fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8'), /^name: design-fence-ship$/m);
    assert.equal(fs.existsSync(path.join(root, dir, 'design-fence-design')), false);
  }
  assert.match(
    fs.readFileSync(path.join(root, '.github/workflows/design-fence.yml'), 'utf8'),
    /\.agents\/design-fence\/bin\/design-fence\.mjs commits/,
  );
});

test('install puts its block into an existing AGENTS.md once, and fixes an existing CLAUDE.md', () => {
  const root = repository({checks: []});
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Ours\n\nWhat we are.\n\n## Commands\n\nnpm test\n');
  fs.writeFileSync(
    path.join(root, 'CLAUDE.md'),
    "<!-- Claude Code reads CLAUDE.md; the rules live in AGENTS.md (read by every agent) and in design-fence's process. -->\n" +
      '@AGENTS.md\n@.agents/design-fence/PROCESS.md\n',
  );
  const {target, output} = installed(root);
  assert.match(output, /Wrote: CLAUDE.md, .agents\/ENFORCEMENT.md, .github\/workflows\/design-fence.yml, AGENTS.md\n/);
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /^# Ours\n\nWhat we are\.\n\n<!-- design-fence: /);
  assert.match(agents, /<!-- \/design-fence -->\n\n## Commands\n\nnpm test\n$/);
  assert.equal(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
  assert.match(execFileSync(process.execPath, [path.join(target, 'install.mjs')], {cwd: root, encoding: 'utf8'}), /nothing to write/);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agents);
});

test('install elsewhere than .agents/design-fence copies the skills, with their paths', () => {
  const root = repository({checks: []});
  const target = path.join(root, 'tools/df');
  fs.cpSync(HOME, target, {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}test`),
  });
  const run = () => execFileSync(process.execPath, [path.join(target, 'install.mjs')], {cwd: root, encoding: 'utf8'});
  assert.match(run(), /Skills written to/);
  const skill = path.join(root, '.agents/skills/design-fence-ship');
  assert.equal(fs.lstatSync(skill).isSymbolicLink(), false);
  assert.match(fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8'), /`tools\/df\/playbooks\/ship\.md`/);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /`tools\/df\/playbooks\/reflect\.md`/);
  const again = run();
  assert.match(again, /nothing to write/);
  assert.doesNotMatch(again, /Skills/);
});

test('install --design adds the design module once, and keeps what the project has', () => {
  const root = repository({checks: [NO_BAD]});
  fs.mkdirSync(path.join(root, 'design'));
  fs.writeFileSync(path.join(root, 'design/index.md'), 'ours\n');
  const {target} = installed(root);
  const run = () =>
    execFileSync(process.execPath, [path.join(target, 'install.mjs'), '--design'], {cwd: root, encoding: 'utf8'});
  const output = run();
  assert.match(output, /Wrote: .agents\/validate.json, design\/PHILOSOPHY.md, design\/tokens.md, design\/flows.yml, AGENTS.md\n/);
  assert.match(output, /: design-fence-start, design-fence-design, design-fence-component, design-fence-flows, design-fence-figma\n/);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /`\.agents\/design-fence\/playbooks\/figma\.md`, "Connect" first/);
  assert.equal(fs.lstatSync(path.join(root, '.claude/skills/design-fence-figma')).isSymbolicLink(), true);
  const config = JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8'));
  assert.deepEqual(config, {checks: [NO_BAD], design: {dir: 'design'}});
  assert.equal(fs.readFileSync(path.join(root, 'design/index.md'), 'utf8'), 'ours\n');
  assert.match(fs.readFileSync(path.join(root, 'design/PHILOSOPHY.md'), 'utf8'), new RegExp(path.basename(root)));
  assert.match(run(), /nothing to write/);
});

test('install --design declares the Figma server for each agent tool, once, keeping what is there', () => {
  const root = repository({checks: []});
  fs.writeFileSync(path.join(root, 'opencode.json'), JSON.stringify({model: 'x', mcp: {other: {type: 'remote', url: 'u'}}}));
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex/config.toml'), 'model = "x"');
  const {target} = installed(root);
  assert.equal(fs.existsSync(path.join(root, '.mcp.json')), false, 'not without the design module');
  const run = () =>
    execFileSync(process.execPath, [path.join(target, 'install.mjs'), '--design'], {cwd: root, encoding: 'utf8'});
  assert.match(run(), /Figma's server \(figma-console, [^)]*\) declared in: \.mcp\.json, opencode\.json, \.codex\/config\.toml\n/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')), {
    mcpServers: {'figma-console': {command: 'npx', args: ['-y', 'figma-console-mcp@latest']}},
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8')), {
    model: 'x',
    mcp: {other: {type: 'remote', url: 'u'}, 'figma-console': {type: 'local', command: ['npx', '-y', 'figma-console-mcp@latest']}},
  });
  const codex = fs.readFileSync(path.join(root, '.codex/config.toml'), 'utf8');
  assert.match(codex, /^model = "x"\n\n# design-fence[^\n]*\n\[mcp_servers\.figma-console\]\ncommand = "npx"\nargs = \["-y", "figma-console-mcp@latest"\]\n$/);
  assert.doesNotMatch(codex, /FIGMA_ACCESS_TOKEN/);
  const again = run();
  assert.match(again, /nothing to write/);
  assert.doesNotMatch(again, /Figma's server/);
  assert.equal(fs.readFileSync(path.join(root, '.codex/config.toml'), 'utf8'), codex);
});

test('install --design leaves a declared Figma server, and a file it cannot read, alone', () => {
  const root = repository({checks: []});
  const ours = {mcpServers: {'figma-console': {command: 'node', args: ['mine.js'], env: {A: '1'}}}};
  fs.writeFileSync(path.join(root, '.mcp.json'), JSON.stringify(ours));
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), '{ // ours\n}');
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex/config.toml'), '[mcp_servers."figma-console"]\ncommand = "node"\n');
  const {target} = installed(root);
  const output = execFileSync(process.execPath, [path.join(target, 'install.mjs'), '--design'], {cwd: root, encoding: 'utf8'});
  assert.doesNotMatch(output, /no token\) declared in/);
  assert.match(output, /Figma's server NOT declared in opencode\.jsonc/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')), ours);
  assert.equal(fs.readFileSync(path.join(root, '.codex/config.toml'), 'utf8'), '[mcp_servers."figma-console"]\ncommand = "node"\n');
  assert.equal(fs.existsSync(path.join(root, 'opencode.json')), false);
});

test('install leaves another hooks path alone, and says so', () => {
  const root = repository({checks: []});
  gitRun(root, 'config', 'core.hooksPath', '.husky');
  const {output} = installed(root);
  assert.match(output, /Git hooks NOT on: core.hooksPath is already .husky/);
  assert.equal(gitRun(root, 'config', '--get', 'core.hooksPath').output.trim(), '.husky');
});

test('install merges the agent hooks into the tools\' settings once, keeping theirs', () => {
  const root = repository({checks: []});
  const theirs = {matcher: 'Bash', hooks: [{type: 'command', command: 'echo theirs'}]};
  fs.mkdirSync(path.join(root, '.claude'));
  fs.writeFileSync(path.join(root, '.claude/settings.json'), JSON.stringify({model: 'x', hooks: {PreToolUse: [theirs]}}));
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex/hooks.json'), '{not json');
  const {target, output} = installed(root);
  assert.match(output, /Agent hooks written to: \.claude\/settings\.json, \.opencode\/plugins\/design-fence\.js\n/);
  assert.match(output, /Agent hooks NOT in \.codex\/hooks\.json: it is not JSON/);
  const claude = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
  assert.equal(claude.model, 'x');
  assert.deepEqual(claude.hooks.PreToolUse[0], theirs);
  assert.equal(
    claude.hooks.PreToolUse[1].hooks[0].command,
    'node "$CLAUDE_PROJECT_DIR/.agents/design-fence/bin/design-fence.mjs" agent-hook pre-tool-use',
  );
  assert.deepEqual(Object.keys(claude.hooks), ['PreToolUse', 'SessionStart', 'UserPromptSubmit']);
  assert.equal(
    fs.readFileSync(path.join(root, '.opencode/plugins/design-fence.js'), 'utf8'),
    fs.readFileSync(path.join(HOME, 'harness/opencode/design-fence.js'), 'utf8'),
  );

  fs.rmSync(path.join(root, '.codex/hooks.json'));
  const run = () => execFileSync(process.execPath, [path.join(target, 'install.mjs')], {cwd: root, encoding: 'utf8'});
  assert.match(run(), /Agent hooks written to: \.codex\/hooks\.json\n/);
  const codex = JSON.parse(fs.readFileSync(path.join(root, '.codex/hooks.json'), 'utf8'));
  assert.match(codex.hooks.SessionStart[0].hooks[0].command, /^node "\$\(git rev-parse --show-toplevel\)\/\.agents\/design-fence\/bin\/design-fence\.mjs" agent-hook session-start$/);
  const again = run();
  assert.match(again, /nothing to write/);
  assert.doesNotMatch(again, /Agent hooks/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8')).hooks.PreToolUse.length, 2);
});

test('a commit is refused while a check fails, and passes once fixed', () => {
  const root = repository({checks: [NO_BAD]});
  installed(root);
  gitRun(root, 'add', '-A');
  assert.equal(gitRun(root, 'commit', '-q', '-m', `chore: design-fence\n\n${REFLECT}`).status, 0);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'bad\n');
  gitRun(root, 'add', '-A');
  const refused = gitRun(root, 'commit', '-q', '-m', `fix: a\n\n${REFLECT}`);
  assert.notEqual(refused.status, 0);
  assert.match(refused.output, /the project's checks fail/);
  assert.match(refused.output, /FAIL no bad/);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'good\n');
  gitRun(root, 'add', '-A');
  assert.equal(gitRun(root, 'commit', '-q', '-m', `fix: a\n\n${REFLECT}`).status, 0);
});

test('a commit of code needs its Reflect line; prose does not', () => {
  const root = repository({checks: []});
  installed(root);
  gitRun(root, 'add', '-A');
  gitRun(root, 'commit', '-q', '-m', `chore: design-fence\n\n${REFLECT}`);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'changed\n');
  gitRun(root, 'add', '-A');
  const refused = gitRun(root, 'commit', '-q', '-m', 'fix: a');
  assert.notEqual(refused.status, 0);
  assert.match(refused.output, /changes src\/a\.js and its message has no Reflect line/);
  assert.match(refused.output, /playbooks\/reflect\.md/);
  assert.equal(gitRun(root, 'commit', '-q', '-m', `fix: a\n\n${REFLECT}`).status, 0);
  fs.writeFileSync(path.join(root, 'README.md'), '# Notes\n');
  gitRun(root, 'add', '-A');
  assert.equal(gitRun(root, 'commit', '-q', '-m', 'docs: notes').status, 0);
});

test('commits lists those of code without a Reflect line; a push of one is refused', () => {
  const root = repository({checks: []});
  const remote = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-remote-')));
  execFileSync('git', ['init', '-q', '--bare', remote]);
  gitRun(root, 'remote', 'add', 'origin', remote);
  assert.equal(gitRun(root, 'push', '-q', 'origin', 'main').status, 0);
  installed(root);
  gitRun(root, 'add', '-A');
  gitRun(root, 'commit', '-q', '-m', `chore: design-fence\n\n${REFLECT}`);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'skipped\n');
  gitRun(root, 'add', '-A');
  // Made where the hooks did not run.
  gitRun(root, 'commit', '-q', '--no-verify', '-m', 'fix: no review');
  const cli = (...args) =>
    spawnSync(process.execPath, [path.join(root, '.agents/design-fence/bin/design-fence.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  const listed = cli('commits', 'origin/main..HEAD');
  assert.equal(listed.status, 1);
  assert.match(listed.stdout, /fix: no review: changes src\/a\.js/);
  assert.doesNotMatch(listed.stdout, /chore: design-fence/);
  const pushed = gitRun(root, 'push', 'origin', 'main');
  assert.notEqual(pushed.status, 0);
  assert.match(pushed.output, /without a Reflect line/);
  assert.match(pushed.output, /fix: no review/);
  gitRun(root, 'commit', '-q', '--amend', '-m', `fix: reviewed\n\n${REFLECT}`);
  assert.equal(cli('commits', 'origin/main..HEAD').status, 0);
  assert.equal(gitRun(root, 'push', '-q', 'origin', 'main').status, 0);
});

test('a first push to an empty remote asks nothing of the commits from before design-fence', () => {
  const root = repository({checks: []});
  fs.writeFileSync(path.join(root, 'src/a.js'), 'older work, never reviewed\n');
  gitRun(root, 'add', '-A');
  gitRun(root, 'commit', '-q', '-m', 'feat: from before design-fence');
  const remote = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-empty-')));
  execFileSync('git', ['init', '-q', '--bare', remote]);
  gitRun(root, 'remote', 'add', 'origin', remote);
  installed(root);
  gitRun(root, 'add', '-A');
  gitRun(root, 'commit', '-q', '-m', `chore: design-fence\n\n${REFLECT}`);
  assert.equal(gitRun(root, 'push', '-q', 'origin', 'main').status, 0);
  fs.writeFileSync(path.join(root, 'src/a.js'), 'after, skipped\n');
  gitRun(root, 'add', '-A');
  gitRun(root, 'commit', '-q', '--no-verify', '-m', 'fix: no review');
  gitRun(root, 'checkout', '-q', '-b', 'topic');
  const pushed = gitRun(root, 'push', 'origin', 'topic');
  assert.notEqual(pushed.status, 0);
  assert.match(pushed.output, /fix: no review/);
  assert.doesNotMatch(pushed.output, /from before design-fence/);
});

test('the command line: check reports and fails, rules says whether the hooks are on', () => {
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
  assert.match(rules, /## Git hooks\n\nOff: run/);
  assert.match(rules, /## What agents load\n\n- AGENTS.md has no design-fence block: run/);
  assert.match(rules, /- Skills: 0 of 2 in .agents\/skills\/, 0 of 2 in .claude\/skills\/: run/);
  assert.match(rules, /- No CLAUDE.md: Claude Code \(2\.1\.277 or later\) reads AGENTS.md/);
  assert.match(rules, /- no bad: when src\/\*\*/);
  assert.match(rules, /Enforcement ledger/);
  assert.match(rules, /## Design module\n\nOff\./);
  fs.writeFileSync(path.join(root, '.agents/validate.json'), JSON.stringify({checks: [NO_BAD], design: {dir: 'ui'}}));
  assert.match(cli('rules').stdout, /## Design module\n\nOn: read ui\/index.md first/);
  assert.equal(cli('commits').status, 2);
});
