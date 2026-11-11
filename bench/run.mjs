#!/usr/bin/env node
/**
 * design-fence's measure (bench/README.md): the same request, in copies of one project (bench/fixture) that differ
 * by design-fence alone, run by an agent with no one answering, several times per arm, one run at a time.
 *
 *     node bench/run.mjs setup                          the fixture's dependencies (once)
 *     node bench/run.mjs all [options]                  every run of the round, then the summary
 *     node bench/run.mjs one <task> <arm> <n> [options] one run, as `all` makes it (to replace one that does not count)
 *     node bench/run.mjs prepare <task> <arm> <n>       only the copy
 *     node bench/run.mjs prompt <task>                  the request, word for word
 *     node bench/run.mjs tasks                          the tasks, and which need Figma
 *
 *   --agent claude|codex   (default claude)      --model <name>    (default: the agent's own)
 *   --effort <effort>      Codex's reasoning effort
 *   --tasks a,b            (default: those that need no Figma; `all`: every task)
 *   --arms without,with,next   (default without,next)
 *   --runs <n>             runs per arm (default 3)
 *   --round <name>         the results folder under bench/results (default: agent-model)
 *   --base <ref>           design-fence for the arm `with` (default origin/main)
 *   --key <file key>       your copy of the Figma file, for the tasks that need Figma (or FILE_KEY)
 *
 * Arms: `without` (the project without design-fence's layer: bench/fixture/.bench), `with` (design-fence as
 * released: --base), `next` (design-fence as it is in this working tree).
 */

import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const BENCH = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.dirname(BENCH);
const FIXTURE = path.join(BENCH, 'fixture');
const ORIGINAL_KEY = 'RpGPzmuHjXA4umtwY5M2tr';
const ARMS = ['without', 'with', 'next'];
const GIT_ENV = {GIT_AUTHOR_NAME: 'bench', GIT_AUTHOR_EMAIL: 'bench@example.com', GIT_COMMITTER_NAME: 'bench', GIT_COMMITTER_EMAIL: 'bench@example.com'};

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 ? argv[at + 1] : fallback;
};
const positional = argv.filter((arg, i) => !arg.startsWith('--') && !(argv[i - 1] ?? '').startsWith('--'));
const AGENT = option('agent', 'claude');
const MODEL = option('model', '');
const EFFORT = option('effort', '');
const RUNS = Number(option('runs', 3));
const BASE = option('base', 'origin/main');
const KEY = option('key', process.env.FILE_KEY ?? '');
const ROUND = option('round', `${AGENT}-${MODEL || 'default'}`);
const OUT = path.join(BENCH, 'results', ROUND);

const sh = (command, args, options = {}) => execFileSync(command, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options});
const git = (dir, ...args) => sh('git', ['-C', dir, ...args], {env: {...process.env, ...GIT_ENV}});

/** The tasks: bench/tasks/<name>/task.json `{title, prompt, figma, minutes}`, with score.mjs and, for some, seed.mjs. */
export function tasks() {
  return fs
    .readdirSync(path.join(BENCH, 'tasks'))
    .filter(name => fs.existsSync(path.join(BENCH, 'tasks', name, 'task.json')))
    .map(name => ({name, dir: path.join(BENCH, 'tasks', name), ...JSON.parse(fs.readFileSync(path.join(BENCH, 'tasks', name, 'task.json'), 'utf8'))}));
}
const task = name => tasks().find(t => t.name === name) ?? fail(`No task ${name}: ${tasks().map(t => t.name).join(', ')}`);
function fail(message) {
  console.error(message);
  process.exit(1);
}

/** The request, the same in every arm: only the Figma file's key and the run's name change. */
const promptOf = (t, run) => t.prompt.replaceAll('{{key}}', KEY || ORIGINAL_KEY).replaceAll('{{run}}', run);

/** design-fence's files into `target`: as released at `ref`, or as the working tree has them (what git would commit). */
function designFence(target, ref) {
  fs.mkdirSync(target, {recursive: true});
  if (ref) {
    const tar = execFileSync('git', ['-C', HOME, 'archive', ref], {maxBuffer: 1 << 28});
    execFileSync('tar', ['-x', '-C', target], {input: tar});
  } else {
    const files = sh('git', ['-C', HOME, 'ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean);
    for (const file of files) {
      if (/^(bench|test)\//.test(file) || !fs.existsSync(path.join(HOME, file))) continue;
      fs.mkdirSync(path.dirname(path.join(target, file)), {recursive: true});
      fs.copyFileSync(path.join(HOME, file), path.join(target, file));
    }
  }
  // Not part of an install: the measure itself, and the tests.
  for (const dir of ['bench', 'test']) fs.rmSync(path.join(target, dir), {recursive: true, force: true});
}

/** A copy of the fixture for one run: a repository with one commit, with or without design-fence. */
export async function prepare(t, arm, n) {
  const dir = path.join(OUT, t.name, `${arm}-${n}`);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  fs.cpSync(FIXTURE, dir, {recursive: true, filter: file => !/[/\\](node_modules|\.bench|storybook-static|package-lock\.json)$/.test(file)});
  if (fs.existsSync(path.join(FIXTURE, 'node_modules'))) {
    fs.symlinkSync(path.join(FIXTURE, 'node_modules'), path.join(dir, 'node_modules'));
  }
  git(dir, 'init', '-q', '-b', 'main');
  if (arm === 'without') {
    // design-fence's layer goes: its rules, process, playbooks, specs. The project's own files under design/ stay.
    const without = JSON.parse(fs.readFileSync(path.join(FIXTURE, '.bench/without.json'), 'utf8'));
    for (const [from, to] of Object.entries(without.keep)) {
      fs.mkdirSync(path.dirname(path.join(dir, to)), {recursive: true});
      fs.renameSync(path.join(dir, from), path.join(dir, to));
    }
    for (const gone of ['design', '.agents', 'AGENTS.md']) fs.rmSync(path.join(dir, gone), {recursive: true, force: true});
    fs.copyFileSync(path.join(FIXTURE, '.bench/AGENTS.without.md'), path.join(dir, 'AGENTS.md'));
    for (const {file, from, to} of without.replace) {
      fs.writeFileSync(path.join(dir, file), fs.readFileSync(path.join(dir, file), 'utf8').replaceAll(from, to));
    }
  } else {
    designFence(path.join(dir, '.agents/design-fence'), arm === 'with' ? BASE : null);
    // The agent's own tool only, as a person would pick it (an installer that does not know --agents wires them all).
    sh(process.execPath, [path.join(dir, '.agents/design-fence/install.mjs'), '--design', '--agents', AGENT], {cwd: dir});
  }
  if (KEY && KEY !== ORIGINAL_KEY) {
    for (const file of sh('grep', ['-rl', '--exclude-dir=node_modules', '--exclude-dir=.git', ORIGINAL_KEY, dir]).split('\n').filter(Boolean)) {
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(ORIGINAL_KEY, KEY));
    }
  }
  git(dir, 'add', '-A');
  git(dir, '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'start');
  // What the task finds not committed (a change to review).
  const seed = path.join(t.dir, 'seed.mjs');
  if (fs.existsSync(seed)) await (await import(pathToFileURL(seed))).default({dir, arm});
  return dir;
}

const NO_MCP = path.join(BENCH, 'mcp-none.json');
const FIGMA_MCP = path.join(BENCH, 'mcp.json');

/** One run of the agent in its copy, its log beside it; returns the log's path. */
function agentRun(t, dir, log, run) {
  const prompt = promptOf(t, run);
  const timeout = (t.minutes ?? 25) * 60_000;
  const started = Date.now();
  let result;
  if (AGENT === 'claude') {
    const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--max-budget-usd', String(t.budget ?? 5), '--no-session-persistence',
      '--permission-mode', 'acceptEdits', '--strict-mcp-config', '--mcp-config', t.figma ? FIGMA_MCP : NO_MCP,
      '--allowedTools', 'Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Skill', ...(t.figma ? ['mcp__figma-console'] : []),
      '--disallowedTools', 'Bash(git commit:*)', 'Bash(git push:*)', ...(MODEL ? ['--model', MODEL] : [])];
    // With Figma: the bridge plugin needs a moment to find the new server before the first call.
    if (t.figma) args.push('--settings', '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"sleep 45","timeout":90}]}]}}');
    result = spawnSync('claude', args, {cwd: dir, encoding: 'utf8', timeout, maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe']});
  } else {
    const args = ['exec', '--json', '--sandbox', 'workspace-write', '-c', 'sandbox_workspace_write.network_access=true',
      ...(t.figma
        ? ['-c', 'mcp_servers.figma-console.default_tools_approval_mode="approve"', '-c', 'mcp_servers.figma-console.command="node"',
            '-c', `mcp_servers.figma-console.args=["${path.join(BENCH, 'wait-bridge.mjs')}","npx","-y","figma-console-mcp@latest"]`,
            '-c', 'mcp_servers.figma-console.tool_timeout_sec=180']
        : []),
      ...(MODEL ? ['-m', MODEL] : []), ...(EFFORT ? ['-c', `model_reasoning_effort=${EFFORT}`] : []), '-C', dir, prompt];
    result = spawnSync('codex', args, {encoding: 'utf8', timeout, maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe']});
    const config = fs.existsSync(`${process.env.HOME}/.codex/config.toml`) ? fs.readFileSync(`${process.env.HOME}/.codex/config.toml`, 'utf8').split(/^\[/m)[0] : '';
    const top = key => config.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'))?.[1];
    fs.writeFileSync(`${log}.meta.json`, JSON.stringify({
      model: MODEL || top('model'), effort: EFFORT || top('model_reasoning_effort'),
      agentVersion: sh('codex', ['--version']).trim(), seconds: Math.round((Date.now() - started) / 1000),
    }));
  }
  fs.writeFileSync(`${log}.jsonl`, result.stdout ?? '');
  fs.writeFileSync(`${log}.err`, `${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`);
}

const figma = (...args) => spawnSync(process.execPath, [path.join(BENCH, 'figma.mjs'), ...args, '--key', KEY], {encoding: 'utf8', timeout: 240_000});

/** After a run on Figma, not measured: its page audited (bench/audit.js), then deleted. */
function figmaReset(log, page) {
  const audit = figma(path.join(BENCH, 'audit.js'));
  let found = null;
  try {
    found = (JSON.parse(audit.stdout).result ?? []).find(p => p.page === page) ?? null;
  } catch {
    // No audit: the bridge was not there.
  }
  fs.writeFileSync(`${log}.audit.json`, JSON.stringify(found));
  figma('-e', `await figma.loadAllPagesAsync();
    const bench = figma.root.children.filter(p => p.name.startsWith("Bench "));
    if (figma.currentPage.name.startsWith("Bench ")) await figma.setCurrentPageAsync(figma.root.children.find(p => !p.name.startsWith("Bench ")));
    bench.forEach(p => p.remove()); return bench.length;`);
  return found;
}

/** One run: the copy, the agent, its numbers (bench/measure.mjs) and its score (the task's score.mjs). */
export async function one(t, arm, n) {
  if (t.figma && !KEY) fail(`${t.name} works in Figma: give --key <the key of your copy of the file> (bench/README.md).`);
  const run = `${ROUND}-${arm}-${n}`;
  const dir = await prepare(t, arm, n);
  const log = path.join(OUT, t.name, `${arm}-${n}`);
  process.stdout.write(`${new Date().toTimeString().slice(0, 8)} ${t.name} ${arm}-${n} … `);
  agentRun(t, dir, log, run);
  const measured = JSON.parse(sh(process.execPath, [path.join(BENCH, 'measure.mjs'), `${log}.jsonl`, '--json']));
  const audit = t.figma && t.page ? figmaReset(log, t.page.replaceAll('{{run}}', run)) : undefined;
  const changed = git(dir, 'status', '--porcelain', '--untracked-files=all').split('\n').filter(Boolean).map(line => line.slice(3));
  const diff = git(dir, 'diff', 'HEAD');
  let checks = [];
  try {
    checks = await (await import(pathToFileURL(path.join(t.dir, 'score.mjs')))).default({dir, arm, answer: measured.answer ?? '', changed, diff, audit, measured});
  } catch (error) {
    checks = [{name: 'score.mjs ran', pass: false, note: error.message}];
  }
  const result = {task: t.name, arm, n, ...measured, score: {passed: checks.filter(c => c.pass).length, of: checks.length, checks}};
  fs.writeFileSync(`${log}.json`, JSON.stringify(result, null, 1));
  console.log(
    `${result.ok ? 'finished' : `DID NOT FINISH (${result.subtype})`}, $${(result.cost ?? 0).toFixed(2)}, ${Math.round(result.total / 1000)}k tokens, ` +
      `${Object.values(result.tools).reduce((a, b) => a + b, 0)} tool calls, ${result.seconds}s, score ${result.score.passed}/${result.score.of}`,
  );
  return result;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = positional;
  if (!['claude', 'codex'].includes(AGENT)) fail('--agent is claude or codex');
  const chosen = () => {
    const names = option('tasks', '');
    const all = tasks();
    return names === 'all' ? all : names ? names.split(',').map(task) : all.filter(t => !t.figma);
  };
  const arms = option('arms', 'without,next').split(',');
  if (arms.some(arm => !ARMS.includes(arm))) fail(`--arms takes ${ARMS.join(', ')}`);
  if (command === 'setup') {
    spawnSync('npm', ['install', '--no-audit', '--no-fund'], {cwd: FIXTURE, stdio: 'inherit'});
  } else if (command === 'tasks') {
    for (const t of tasks()) console.log(`${t.name.padEnd(18)} ${t.figma ? 'Figma' : '     '}  ${t.title}`);
  } else if (command === 'prompt') {
    console.log(promptOf(task(rest[0]), `${ROUND}-<arm>-<n>`));
  } else if (command === 'prepare') {
    console.log(await prepare(task(rest[0]), rest[1], rest[2]));
  } else if (command === 'one') {
    await one(task(rest[0]), rest[1], rest[2]);
  } else if (command === 'all') {
    // One at a time, the arms alternating, so that what changes over an hour (the provider's load) touches both.
    for (const t of chosen()) for (let n = 1; n <= RUNS; n++) for (const arm of arms) await one(t, arm, n);
    spawnSync(process.execPath, [path.join(BENCH, 'summary.mjs'), OUT], {stdio: 'inherit'});
  } else {
    fail('usage: node bench/run.mjs setup | tasks | prompt <task> | prepare <task> <arm> <n> | one <task> <arm> <n> | all   (options: bench/run.mjs, top)');
  }
}
