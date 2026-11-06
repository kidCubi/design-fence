#!/usr/bin/env node
/**
 * Installs design-fence into the project holding it (as a submodule, by
 * convention at `.agents/design-fence`). Run from anywhere in the project:
 *
 *     node .agents/design-fence/install.mjs
 *
 * It only adds what is missing, so running it again changes nothing:
 *
 * - `.claude/settings.json`: design-fence as a plugin of the project, loaded
 *   from this directory (its skills and hooks), once the folder is trusted;
 * - `CLAUDE.md`: imports `AGENTS.md` and this `PROCESS.md`;
 * - `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`: from the
 *   templates, for the project to fill in, if it has none.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {projectRoot} from './lib/git.mjs';

const HOME = path.dirname(fileURLToPath(import.meta.url));
const NAME = 'design-fence';

/** The settings with design-fence's marketplace and plugin added. */
export function withPlugin(settings, relative) {
  const next = structuredClone(settings);
  next.extraKnownMarketplaces ??= {};
  next.extraKnownMarketplaces[NAME] ??= {source: {source: 'directory', path: `./${relative}`}};
  next.enabledPlugins ??= {};
  next.enabledPlugins[`${NAME}@${NAME}`] ??= true;
  return next;
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
  const relative = path.relative(root, HOME).split(path.sep).join('/');
  const done = [];
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), content);
    done.push(file);
  };
  const template = name => fs.readFileSync(path.join(HOME, name), 'utf8');

  const settingsFile = '.claude/settings.json';
  const settingsPath = path.join(root, settingsFile);
  const settings = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    : {};
  const next = withPlugin(settings, relative);
  if (JSON.stringify(next) !== JSON.stringify(settings)) {
    write(settingsFile, `${JSON.stringify(next, null, 2)}\n`);
  }

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
  ];
  for (const [file, source] of fresh) {
    if (!fs.existsSync(path.join(root, file))) {
      write(file, template(source).replaceAll('{{project}}', path.basename(root)));
    }
  }
  return done;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = projectRoot(process.cwd());
  if (!root) {
    console.error('Run this inside the project (a git repository).');
    process.exit(2);
  }
  const done = install(root);
  console.log(done.length ? `Wrote: ${done.join(', ')}` : 'Already installed: nothing to do.');
  console.log(
    'Commit .claude/settings.json (check it is not ignored), CLAUDE.md, AGENTS.md and .agents/. ' +
      'Each person trusts the folder once in Claude Code for the plugin to load.',
  );
}
