#!/usr/bin/env node
/**
 * design-fence's command line, for agents, hooks and people alike:
 *
 *     design-fence check [--all] [--no-cache]   the project's checks on what changed
 *     design-fence rules                        the rules, the checks, the ledger
 *     design-fence phase <name>                 record the phase the work enters
 *
 * Run from anywhere inside the project.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {CONFIG, loadConfig, runChecks, tail} from '../lib/check.mjs';
import {projectRoot} from '../lib/git.mjs';
import {currentPhase, setPhase} from '../lib/phase.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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

function check(root, args) {
  const {node, results} = runChecks(root, {
    all: args.includes('--all'),
    cache: !args.includes('--no-cache'),
    log: line => console.log(`→ ${line}`),
  });
  if (!loadConfig(root)) {
    console.log(`No ${CONFIG}: nothing to check.`);
    return 0;
  }
  if (results.length === 0) {
    console.log('Nothing changed that a check covers.');
    return 0;
  }
  console.log(`Node ${node.version} (${node.executable})`);
  for (const result of results) {
    const how = result.cached ? 'passed before, same contents' : `${result.ms} ms`;
    console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.name} (${how})`);
    if (!result.ok) {
      console.log(tail(result.output));
    }
  }
  return results.every(result => result.ok) ? 0 : 1;
}

function rules(root) {
  const config = loadConfig(root);
  const parts = [
    section(read(path.join(HOME, 'PROCESS.md')), 'non-negotiables'),
    section(read(path.join(root, 'AGENTS.md')), 'Non-negotiables'),
    `## Phase\n\n${currentPhase(root) || '(none recorded)'}`,
    `## Checks (${CONFIG})\n\n` +
      (config
        ? (config.checks ?? []).map(c => `- ${c.name}: when ${[c.when].flat().join(', ')}`).join('\n')
        : 'None.'),
    read(path.join(root, '.agents/ENFORCEMENT.md')).trim(),
    'Now read AGENTS.md in full.',
  ];
  console.log(parts.filter(Boolean).join('\n\n'));
  return 0;
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
    case 'rules':
      return rules(root);
    case 'phase':
      if (!args[0]) {
        console.log(currentPhase(root) || '(none recorded)');
        return 0;
      }
      setPhase(root, args.join(' '));
      return 0;
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
