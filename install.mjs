#!/usr/bin/env node
/**
 * Installs design-fence into the project holding it (as a submodule, by
 * convention at `.agents/design-fence`). Run from anywhere in the project,
 * once per clone:
 *
 *     node .agents/design-fence/install.mjs
 *
 * It only adds what is missing, so running it again changes nothing:
 *
 * - the git hooks: `core.hooksPath` set to this directory's `hooks/`, in this
 *   clone (git does not share it: every clone runs this once);
 * - `CLAUDE.md`: a pointer to `AGENTS.md` and `PROCESS.md`, for the tools
 *   that read their own file rather than `AGENTS.md`;
 * - `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md` and the
 *   CI workflow `.github/workflows/design-fence.yml`: from the templates,
 *   for the project to fill in, if it has none.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {git, projectRoot} from './lib/git.mjs';

const HOME = path.dirname(fileURLToPath(import.meta.url));

/** `path` relative to `root`, with `/` separators. */
const relativeTo = (root, file) => path.relative(root, file).split(path.sep).join('/');

/**
 * Whether the project's git hooks are design-fence's: `{state, current,
 * wanted}`, the state `on`, `off` (no hooks path set) or `other` (set to
 * another directory, left alone).
 */
export function hooksState(root, home = HOME) {
  const wanted = relativeTo(root, path.join(home, 'hooks'));
  let current = '';
  try {
    current = git(root, ['config', '--get', 'core.hooksPath']).trim();
  } catch {
    // Not set.
  }
  const state = !current ? 'off' : path.resolve(root, current) === path.resolve(root, wanted) ? 'on' : 'other';
  return {state, current, wanted};
}

/** CLAUDE.md with the two imports, added if missing. */
export function withImports(text, relative) {
  const imports = ['@AGENTS.md', `@${relative}/PROCESS.md`];
  const missing = imports.filter(line => !text.split('\n').some(l => l.trim() === line));
  if (missing.length === 0) {
    return text;
  }
  return `${text}${text && !text.endsWith('\n') ? '\n' : ''}${text ? '\n' : ''}${missing.join('\n')}\n`;
}

function install(root) {
  const relative = relativeTo(root, HOME);
  const done = [];
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), content);
    done.push(file);
  };
  const template = name => fs.readFileSync(path.join(HOME, name), 'utf8');

  const claudePath = path.join(root, 'CLAUDE.md');
  const claude = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, 'utf8') : '';
  const claudeNext = claude
    ? withImports(claude, relative)
    : template('templates/CLAUDE.md').replaceAll('.agents/design-fence', relative);
  if (claudeNext !== claude) {
    write('CLAUDE.md', claudeNext);
  }

  const fresh = [
    ['AGENTS.md', 'templates/AGENTS.md'],
    ['.agents/validate.json', 'templates/validate.json'],
    ['.agents/ENFORCEMENT.md', 'ENFORCEMENT.md'],
    ['.github/workflows/design-fence.yml', 'templates/design-fence.yml'],
  ];
  for (const [file, source] of fresh) {
    if (!fs.existsSync(path.join(root, file))) {
      write(
        file,
        template(source)
          .replaceAll('{{project}}', path.basename(root))
          .replaceAll('.agents/design-fence', relative),
      );
    }
  }

  const hooks = hooksState(root);
  if (hooks.state === 'off') {
    git(root, ['config', 'core.hooksPath', hooks.wanted]);
  }
  return {done, hooks};
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = projectRoot(process.cwd());
  if (!root) {
    console.error('Run this inside the project (a git repository).');
    process.exit(2);
  }
  const {done, hooks} = install(root);
  console.log(done.length ? `Wrote: ${done.join(', ')}` : 'The project files are there: nothing to write.');
  if (hooks.state === 'other') {
    console.log(
      `Git hooks NOT on: core.hooksPath is already ${hooks.current}. Point it to ${hooks.wanted}, ` +
        'or call its pre-commit, commit-msg and pre-push from your own hooks.',
    );
  } else {
    console.log(`Git hooks on: core.hooksPath ${hooks.wanted} (this clone).`);
  }
  console.log('Commit CLAUDE.md, AGENTS.md, .agents/ and .github/workflows/design-fence.yml.');
}
