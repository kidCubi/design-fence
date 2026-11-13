#!/usr/bin/env node
/**
 * design-fence's command line, for any agent, any person, the git hooks and CI:
 *
 *     design-fence check [--all] [--no-cache] [--base <ref>]   the project's checks on what changed
 *     design-fence commits <revs…>                             commits changing code with no Reflect line
 *     design-fence rules                                       the rules, the checks, the ledger, the hooks
 *     design-fence doctor [--bridge]                           what is in place for design-fence to work here, and the fix
 *                                                              for what is not (--bridge: also whether Figma's bridge answers)
 *     design-fence update                                      the submodule to its newest version, the installer run again,
 *                                                              and the commit to make
 *     design-fence route "<request>"                           which playbook a request needs, and the project's files it touches
 *     design-fence design                                      the design module's check: specs against Storybook, the index,
 *                                                              flows.yml, raw values in the library's CSS, the tokens file
 *                                                              (`specs`: its earlier name)
 *     design-fence spec <component>                            one spec's status, Figma node, version, story and properties
 *     design-fence hash <file>                                 a file's FNV-1a, to compare with figma/tokens.js
 *     design-fence figma lint-gaps <node id> [--properties <name,…>]   figma/*.js through the Desktop Bridge,
 *     design-fence figma sources                                       so their text stays out of the agent's
 *     design-fence figma tokens [--format dtcg|css] [--px <prefix,…>] [--ms <prefix,…>] [--hash-only] [--out <file>]
 *     design-fence figma bound <node id> | --spec <component> [--out]  the tokens a component's design is bound to;
 *                      with --spec, against its code (exit 1 when they differ), and with --out, recorded beside
 *                      the spec for `design-fence design` to hold the code to
 *     design-fence figma read <node id> | --spec <component>           a component's design, to build it from: its
 *                      properties and, per variant, each part's layout, sizes, variables by name, text and instances
 *                      (each takes --key <file key>: refuse to run on another file. From validate.json's `design`,
 *                      when it has them: the key (`fileKey`), the tokens' format, prefixes and file (`tokens`;
 *                      `--out` alone writes there); `lint-gaps --spec <component>` takes the node and the
 *                      properties from its spec)
 *     design-fence hook pre-commit | commit-msg <file> | pre-push   what the git hooks run
 *     design-fence agent-hook session-start | user-prompt | pre-tool-use
 *                      what the agent tools' hooks run (Claude Code, Codex: their JSON on stdin;
 *                      exit 2 refuses the tool call, with the reason on stderr; stdout is context,
 *                      or Claude Code's "ask")
 *
 * Run from anywhere inside the project.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {agentHooksState, agentsState, hooksState} from '../install.mjs';
import {runHook} from '../lib/agent-hooks.mjs';
import {CONFIG, loadConfig, runChecks, tail} from '../lib/check.mjs';
import {parseArgs, runInFigma, scriptCode} from '../lib/figma.mjs';
import {git, projectRoot, stagedFiles} from '../lib/git.mjs';
import {section} from '../lib/markdown.mjs';
import {route, routeText} from '../lib/route.mjs';
import {adoptionCommit, commitsMissingReflect, needingReview, reflectVerdict} from '../lib/reflect.mjs';
import {spawnSync} from 'node:child_process';

import {boundAgainstCode, boundFile, checkDesign, cssName, fnv1a, lockFile} from '../lib/design-check.mjs';
import {doctor, doctorText} from '../lib/doctor.mjs';
import {parseStatus} from '../lib/git.mjs';
import {findSpec} from '../lib/specs.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ZERO = /^0+$/;

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const short = files => files.slice(0, 5).join(', ') + (files.length > 5 ? `, and ${files.length - 5} more` : '');

/** Runs the checks and prints their results; true when all passed. */
function report(root, options, print) {
  const {node, results, kept} = runChecks(root, {...options, log: line => print(`→ ${line}`)});
  if (!loadConfig(root)) {
    print(`No ${CONFIG}: nothing to check.`);
    return true;
  }
  if (results.length === 0) {
    print('Nothing changed that a check covers.');
    return true;
  }
  print(`Node ${node.version} (${node.executable})`);
  for (const result of results) {
    const how = result.cached ? 'passed before, same contents' : `${result.ms} ms`;
    print(`${result.ok ? 'ok  ' : 'FAIL'} ${result.name} (${how})`);
    if (!result.ok) {
      print(tail(result.output));
    }
  }
  if (!kept && results.some(result => result.ok && !result.cached)) {
    print('The passes are not remembered: .git cannot be written here (a sandbox). The commit runs the checks again.');
  }
  return results.every(result => result.ok);
}

function check(root, args) {
  const at = args.indexOf('--base');
  const options = {
    all: args.includes('--all'),
    cache: !args.includes('--no-cache'),
    base: at >= 0 ? args[at + 1] : undefined,
  };
  return report(root, options, line => console.log(line)) ? 0 : 1;
}

/** Prints the commits missing their Reflect line; true when there are none. */
function printMissing(missing, print) {
  for (const commit of missing) {
    print(`${commit.sha.slice(0, 8)} ${commit.subject}: changes ${short(commit.files)}`);
  }
  return missing.length === 0;
}

function commits(root, revs) {
  if (revs.length === 0) {
    console.error('Name the commits, e.g. design-fence commits origin/main..HEAD');
    return 2;
  }
  const missing = commitsMissingReflect(root, revs, loadConfig(root));
  if (printMissing(missing, line => console.log(line))) {
    console.log('Every commit that changes code has its Reflect line.');
    return 0;
  }
  console.log(`\n${missing.length} commit(s) change code without a Reflect line (playbooks/reflect.md).`);
  return 1;
}

function rules(root) {
  const config = loadConfig(root);
  const hooks = hooksState(root, HOME);
  const agents = agentsState(root, HOME, Boolean(config?.design));
  const install = `run \`node ${path.relative(root, HOME)}/install.mjs\``;
  const skills = Object.entries(agents.skills)
    .map(([dir, n]) => `${n} of ${agents.wanted} in ${dir}/`)
    .join(', ');
  const parts = [
    section(read(path.join(HOME, 'PROCESS.md')), 'non-negotiables'),
    section(read(path.join(root, 'AGENTS.md')), 'Non-negotiables'),
    `## Git hooks\n\n${
      hooks.state === 'on'
        ? `On (core.hooksPath ${hooks.wanted}).`
        : `Off: ${install} to turn them on.`
    }`,
    '## What agents load\n\n' +
      [
        agents.block
          ? "- AGENTS.md has design-fence's block (which playbook for which work)."
          : `- AGENTS.md has no design-fence block: ${install}.`,
        `- Skills: ${skills}${Object.values(agents.skills).every(n => n === agents.wanted) ? '.' : `: ${install}.`}`,
        (() => {
          const wired = agentHooksState(root);
          const names = {claude: 'Claude Code', codex: 'Codex', opencode: 'OpenCode'};
          const off = Object.keys(names).filter(tool => !wired[tool]);
          return off.length
            ? `- Agent hooks (what the git hooks cannot see between commits): not in ${off.map(t => names[t]).join(', ')}: ${install}.`
            : '- Agent hooks in Claude Code, Codex and OpenCode (Codex asks to trust them once, in /hooks).';
        })(),
        {
          none: '- No CLAUDE.md: Claude Code (2.1.277 or later) reads AGENTS.md, unless /config, "Project instructions", says otherwise.',
          imports: '- CLAUDE.md imports AGENTS.md.',
          missing: `- CLAUDE.md does not import AGENTS.md, so Claude Code does not read it: ${install}.`,
        }[agents.claude],
      ].join('\n'),
    `## Checks (${CONFIG})\n\n` +
      (config
        ? (config.checks ?? []).map(c => `- ${c.name}: when ${[c.when].flat().join(', ')}`).join('\n')
        : 'None.'),
    `## Design module\n\n${
      config?.design
        ? `On: read ${config.design.dir ?? 'design'}/index.md first. Anything users see goes through ${path.relative(root, HOME)}/playbooks/design.md, or start.md while the index lists nothing yet.`
        : 'Off.'
    }`,
    read(path.join(root, '.agents/ENFORCEMENT.md')).trim(),
    'Now read AGENTS.md in full.',
  ];
  console.log(parts.filter(Boolean).join('\n\n'));
  return 0;
}

function design(root) {
  const config = loadConfig(root)?.design;
  if (!config) {
    console.log(`The design module is off (no design section in ${CONFIG}).`);
    return 0;
  }
  const {problems, warnings, notes} = checkDesign(root, config);
  console.log(`${notes.join('; ')}.`);
  for (const problem of problems) {
    console.log(`- ${problem}`);
  }
  if (warnings.length) {
    console.log(`Not refused, to bring in step (${warnings.length}; all refused once design.strict is true):`);
    for (const warning of warnings.slice(0, 20)) {
      console.log(`  ${warning}`);
    }
    if (warnings.length > 20) console.log(`  … and ${warnings.length - 20} more.`);
  }
  return problems.length ? 1 : 0;
}

export {fnv1a};

/**
 * A script of figma/ run through the bridge; its result printed as one line
 * of JSON. A tokens export with --out goes to the file, not to the output.
 */
async function figmaScript(root, [name, ...argv]) {
  const parsed = parseArgs(argv);
  // What the project's config already says is not asked again: the file, the tokens file and its format, a
  // component's properties from its spec (`design` in validate.json; README, "The design module").
  const design = loadConfig(root)?.design ?? {};
  const options = parsed.options;
  options.key ??= design.fileKey;
  if (name === 'tokens' && design.tokens) {
    options.format ??= design.tokens.format;
    options.px ??= design.tokens.px?.join(',');
    options.ms ??= design.tokens.ms?.join(',');
    if (options.out === true) options.out = design.tokens.file;
  }
  if (name === 'lint-gaps' && typeof options.spec === 'string') {
    const spec = findSpec(root, design, options.spec);
    if (!spec) throw new Error(`No spec "${options.spec}" in ${design.dir ?? 'design'}/components.`);
    options.properties ??= spec.properties.join(',');
    parsed.args[0] ??= spec.figma;
  }
  // `bound --spec <component>`: its node from the spec, its record beside the spec (`--out`), its code compared.
  // `read --spec <component>`: its node from the spec.
  const bySpec = ['bound', 'read'].includes(name) && typeof options.spec === 'string';
  const itsSpec = bySpec ? findSpec(root, design, options.spec) : null;
  if (bySpec) {
    if (!itsSpec) throw new Error(`No spec "${options.spec}" in ${design.dir ?? 'design'}/components.`);
    parsed.args[0] ??= itsSpec.figma;
  }
  const {file, result} = await runInFigma(scriptCode(name, parsed), {fileKey: typeof options.key === 'string' ? options.key : undefined});
  const out = parsed.options.out;
  if (name === 'bound') {
    if (!Array.isArray(result?.tokens)) {
      console.log(JSON.stringify({file, ...result}));
      return 1;
    }
    const said = {file, ...result};
    if (itsSpec && out) {
      const record = boundFile(itsSpec);
      fs.writeFileSync(path.join(root, record), `${JSON.stringify({component: itsSpec.name, figma: result.node, tokens: result.tokens, instances: result.instances}, null, 2)}\n`);
      said.written = record;
    }
    let differs = false;
    if (itsSpec) {
      // The design's tokens against the component's code, where it is built: the look, by its tokens.
      const groups = [...new Set(result.tokens.map(token => `${cssName(token.split('/')[0])}-`))];
      const {files, missing, extra} = boundAgainstCode(root, design, itsSpec, result.tokens, groups);
      if (files.length) {
        said.code = {files, notRead: missing.map(found => found.token), notInTheDesign: extra.map(found => `${found.file}:${found.line} ${found.name}`)};
        differs = missing.length + extra.length > 0;
      }
    }
    console.log(JSON.stringify(said));
    return differs ? 1 : 0;
  }
  if (name === 'read') {
    console.log(JSON.stringify({file, ...result}));
    return Array.isArray(result?.variants) ? 0 : 1;
  }
  if (name === 'tokens' && typeof out === 'string' && typeof result?.text === 'string') {
    fs.writeFileSync(path.resolve(process.cwd(), out), result.text);
    // What was exported, for `design-fence design` to hold the file to (lib/design-check.mjs).
    if (design.dir || design.tokens) {
      const written = path.relative(root, path.resolve(process.cwd(), out)).split(path.sep).join('/');
      fs.writeFileSync(path.join(root, lockFile(design)), `${JSON.stringify({file: written, hash: result.hash, format: result.format, figma: file ?? null}, null, 2)}\n`);
    }
    const {text, ...rest} = result;
    console.log(JSON.stringify({file, written: out, ...rest}));
    return 0;
  }
  console.log(JSON.stringify({file, ...result}));
  return 0;
}

/** `design-fence doctor`: `lib/doctor.mjs`, and with --bridge a call through Figma's bridge. */
async function checkUp(root, args) {
  const lines = doctor(root, HOME);
  if (args.includes('--bridge')) {
    const key = loadConfig(root)?.design?.fileKey;
    try {
      const {file} = await runInFigma('return 1;', {fileKey: key, wait: 30_000});
      lines.push({state: 'ok', what: `Figma's bridge answers, on "${file}"`});
    } catch (error) {
      lines.push({state: 'off', what: "Figma's bridge does not answer", fix: error.message});
    }
  }
  const {text, off} = doctorText(lines);
  console.log(text);
  console.log(off ? `\n${off} to put right.` : '\nAll in place.');
  return off ? 1 : 0;
}

/**
 * `design-fence update`: the submodule to its remote's newest commit, then
 * that version's installer (a new process: this file is the old one), then
 * what to commit. It does not commit.
 */
function update(root) {
  const at = path.relative(root, HOME).split(path.sep).join('/');
  const run = (command, args) => spawnSync(command, args, {cwd: root, encoding: 'utf8'});
  const before = new Set(parseStatus(git(root, ['status', '--porcelain', '-z'])));
  const from = run('git', ['-C', HOME, 'rev-parse', '--short', 'HEAD']).stdout.trim();
  const pulled = run('git', ['submodule', 'update', '--remote', '--', at]);
  if (pulled.status !== 0) {
    console.error(`design-fence is not a submodule here (${at}), or its remote cannot be reached:\n${pulled.stderr.trim()}`);
    return 1;
  }
  const to = run('git', ['-C', HOME, 'rev-parse', '--short', 'HEAD']).stdout.trim();
  const config = loadConfig(root);
  const installed = run(process.execPath, [path.join(HOME, 'install.mjs'), ...(config?.design ? ['--design'] : [])]);
  process.stdout.write(installed.stdout);
  if (installed.status !== 0) {
    console.error(installed.stderr.trim());
    return 1;
  }
  const changed = parseStatus(git(root, ['status', '--porcelain', '-z'])).filter(file => !before.has(file));
  if (from === to && !changed.length) {
    console.log(`design-fence is up to date (${to}).`);
    return 0;
  }
  console.log(`\ndesign-fence ${from} → ${to}. To commit the update (it does not commit):`);
  console.log(`  git add ${changed.join(' ')}`);
  console.log(`  git commit -m "chore: design-fence ${to}" -m "Reflect: design-fence's files, as released"`);
  console.log(`Then: node ${at}/bin/design-fence.mjs doctor`);
  return 0;
}

const NEVER_SKIP = 'Fix the cause, not the check, and never skip the hooks (--no-verify).';

function preCommit(root) {
  const lines = [];
  if (report(root, {}, line => lines.push(line))) {
    return 0;
  }
  console.error(`design-fence: the project's checks fail on what changed. ${NEVER_SKIP}\n`);
  console.error(lines.join('\n'));
  return 1;
}

function commitMsg(root, file) {
  if (fs.existsSync(path.resolve(root, git(root, ['rev-parse', '--git-path', 'MERGE_HEAD']).trim()))) {
    return 0;
  }
  const files = needingReview(stagedFiles(root), loadConfig(root));
  if (files.length === 0 || reflectVerdict(read(file))) {
    return 0;
  }
  console.error(
    `design-fence: this commit changes ${short(files)} and its message has no Reflect line. ` +
      `Run the reflect review on it (${path.relative(root, HOME)}/playbooks/reflect.md), then add ` +
      'its verdict to the message as a line of its own:\n\n    Reflect: <the verdict, in a sentence>\n',
  );
  return 1;
}

/**
 * The revisions a pushed ref brings: since its remote tip, or all not yet on
 * a remote; never those from before design-fence came into the project (a
 * first push to an empty remote brings the whole history).
 */
function pushedRevs(root, localSha, remoteSha, adoption) {
  let known = false;
  if (!ZERO.test(remoteSha)) {
    try {
      git(root, ['cat-file', '-e', `${remoteSha}^{commit}`]);
      known = true;
    } catch {
      // The remote moved to a commit not fetched here.
    }
  }
  return [localSha, '--not', ...(known ? [remoteSha] : ['--remotes']), ...(adoption ? [adoption] : [])];
}

function prePush(root, input) {
  const config = loadConfig(root);
  const adoption = adoptionCommit(root, HOME);
  const missing = [];
  for (const line of input.split('\n').filter(Boolean)) {
    const [, localSha, , remoteSha] = line.split(' ');
    if (!ZERO.test(localSha)) {
      missing.push(...commitsMissingReflect(root, pushedRevs(root, localSha, remoteSha, adoption), config));
    }
  }
  const lines = [];
  const checked = report(root, {}, line => lines.push(line));
  if (missing.length === 0 && checked) {
    return 0;
  }
  if (missing.length > 0) {
    console.error('design-fence: commits that change code without a Reflect line (playbooks/reflect.md):');
    printMissing(missing, line => console.error(`  ${line}`));
    console.error('Add the line with `git commit --amend` or `git rebase -i`, then push again.\n');
  }
  if (!checked) {
    console.error(`design-fence: the project's checks fail. ${NEVER_SKIP}\n`);
    console.error(lines.join('\n'));
  }
  return 1;
}

function hook(root, [name, ...args]) {
  switch (name) {
    case 'pre-commit':
      return preCommit(root);
    case 'commit-msg':
      return commitMsg(root, args[0]);
    case 'pre-push':
      return prePush(root, fs.readFileSync(0, 'utf8'));
    default:
      console.error(`No git hook named ${name}.`);
      return 2;
  }
}

/**
 * A hook of an agent tool, wired into the project by `install.mjs`: its JSON
 * on stdin, the decision out (`lib/agent-hooks.mjs`, `runHook`): exit 2 with
 * the reason on stderr refuses the tool call; stdout is context, or Claude
 * Code's "ask". Nothing else exits 2.
 */
function agentHook(name) {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    // No input: an empty event.
  }
  const {code, stdout, stderr} = runHook(name, input, {home: HOME});
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  return code;
}

function main(argv) {
  const [command, ...args] = argv;
  if (command === 'agent-hook') {
    return agentHook(args[0]);
  }
  const root = projectRoot(process.cwd());
  if (!root) {
    console.error('design-fence runs inside a git repository.');
    return 2;
  }
  switch (command) {
    case 'check':
      return check(root, args);
    case 'commits':
      return commits(root, args);
    case 'rules':
      return rules(root);
    case 'design':
    case 'specs':
      return design(root);
    case 'doctor':
      return checkUp(root, args);
    case 'update':
      return update(root);
    case 'spec': {
      const design = loadConfig(root)?.design;
      const spec = design && args[0] ? findSpec(root, design, args[0]) : null;
      console.log(spec ? JSON.stringify(spec) : `No spec "${args[0] ?? ''}"${design ? '' : ': the design module is off'}.`);
      return spec ? 0 : 1;
    }
    case 'route': {
      const way = route(root, args.join(' '), loadConfig(root) ?? {});
      console.log(routeText(way, path.relative(root, HOME).split(path.sep).join('/')) || 'Not a request: nothing to route.');
      return 0;
    }
    case 'hash':
      console.log(fnv1a(fs.readFileSync(path.resolve(process.cwd(), args[0]), 'utf8')));
      return 0;
    case 'figma':
      return figmaScript(root, args);
    case 'hook':
      return hook(root, args);
    default:
      // The usage: this file's comment.
      console.log(
        fs
          .readFileSync(fileURLToPath(import.meta.url), 'utf8')
          .split('*/')[0]
          .split('\n')
          .filter(line => line.startsWith(' *'))
          .map(line => line.replace(/^ \* ?/, ''))
          .join('\n'),
      );
      return command ? 2 : 0;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
