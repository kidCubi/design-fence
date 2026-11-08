#!/usr/bin/env node
/**
 * design-fence's command line, for any agent, any person, the git hooks and CI:
 *
 *     design-fence check [--all] [--no-cache] [--base <ref>]   the project's checks on what changed
 *     design-fence commits <revs…>                             commits changing code with no Reflect line
 *     design-fence rules                                       the rules, the checks, the ledger, the hooks
 *     design-fence specs                                       the design specs against Storybook's index
 *     design-fence hash <file>                                 a file's FNV-1a, to compare with figma/tokens.js
 *     design-fence hook pre-commit | commit-msg <file> | pre-push   what the git hooks run
 *
 * Run from anywhere inside the project.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {hooksState} from '../install.mjs';
import {CONFIG, loadConfig, runChecks, tail} from '../lib/check.mjs';
import {git, projectRoot, stagedFiles} from '../lib/git.mjs';
import {adoptionCommit, commitsMissingReflect, needingReview, reflectVerdict} from '../lib/reflect.mjs';
import {checkSpecs, readSpecs, readStories} from '../lib/specs.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ZERO = /^0+$/;

/** The section of a Markdown text under `## <title>`, up to the next one. */
export function section(text, title) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line.startsWith('## ') && line.includes(title));
  if (start < 0) {
    return '';
  }
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start, end < 0 ? undefined : end).join('\n').trim();
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const short = files => files.slice(0, 5).join(', ') + (files.length > 5 ? `, and ${files.length - 5} more` : '');

/** Runs the checks and prints their results; true when all passed. */
function report(root, options, print) {
  const {node, results} = runChecks(root, {...options, log: line => print(`→ ${line}`)});
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
  const parts = [
    section(read(path.join(HOME, 'PROCESS.md')), 'non-negotiables'),
    section(read(path.join(root, 'AGENTS.md')), 'Non-negotiables'),
    `## Git hooks\n\n${
      hooks.state === 'on'
        ? `On (core.hooksPath ${hooks.wanted}).`
        : `Off: run \`node ${path.relative(root, HOME)}/install.mjs\` to turn them on.`
    }`,
    `## Checks (${CONFIG})\n\n` +
      (config
        ? (config.checks ?? []).map(c => `- ${c.name}: when ${[c.when].flat().join(', ')}`).join('\n')
        : 'None.'),
    `## Design module\n\n${
      config?.design
        ? `On: read ${config.design.dir ?? 'design'}/index.md first; the way in is ${path.relative(root, HOME)}/playbooks/start.md.`
        : 'Off.'
    }`,
    read(path.join(root, '.agents/ENFORCEMENT.md')).trim(),
    'Now read AGENTS.md in full.',
  ];
  console.log(parts.filter(Boolean).join('\n\n'));
  return 0;
}

function specs(root) {
  const design = loadConfig(root)?.design;
  if (!design) {
    console.log(`The design module is off (no design section in ${CONFIG}).`);
    return 0;
  }
  const all = readSpecs(root, design);
  const stories = readStories(root, design);
  const problems = checkSpecs(all, stories, design);
  const against = stories ? `${stories.length} stories of ${design.storybookIndex}` : 'no Storybook index (design.storybookIndex)';
  console.log(`${all.length} spec(s), against ${against}.`);
  for (const problem of problems) {
    console.log(`- ${problem}`);
  }
  return problems.length ? 1 : 0;
}

/** FNV-1a (32 bits) of a text, in hex: the same as figma/tokens.js computes in Figma. */
export function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (const byte of Buffer.from(text, 'utf8')) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
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

function main(argv) {
  const [command, ...args] = argv;
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
    case 'specs':
      return specs(root);
    case 'hash':
      console.log(fnv1a(fs.readFileSync(path.resolve(process.cwd(), args[0]), 'utf8')));
      return 0;
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
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
