#!/usr/bin/env node
/**
 * Installs design-fence into the project holding it (as a submodule, by
 * convention at `.agents/design-fence`). Run from anywhere in the project,
 * once per clone and after each update:
 *
 *     node .agents/design-fence/install.mjs [--design]
 *
 * It only adds what is missing, and refreshes what is its own, so running it
 * again changes nothing:
 *
 * - the git hooks: `core.hooksPath` set to this directory's `hooks/`, in this
 *   clone (git does not share it: every clone runs this once);
 * - `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md` and the
 *   CI workflow `.github/workflows/design-fence.yml`: from the templates,
 *   for the project to fill in, if it has none;
 * - design-fence's block in `AGENTS.md` (`templates/agents-block.md`: which
 *   playbook for which work, and the process's non-negotiables), between its
 *   markers, added or replaced: every agent loads `AGENTS.md`;
 * - the playbooks as skills (`skills/`), linked into `.agents/skills/` (Codex)
 *   and `.claude/skills/` (Claude Code), or copied when design-fence is not at
 *   `.agents/design-fence` or links fail;
 * - in an existing `CLAUDE.md` (Claude Code reads it instead of `AGENTS.md`):
 *   `@AGENTS.md`, and no import of `PROCESS.md`. No `CLAUDE.md` is created:
 *   without one, Claude Code reads `AGENTS.md`;
 * - with `--design`, the design module (PROCESS.md, "The design module"): a
 *   `design` section in `.agents/validate.json` if it has none, the `design/`
 *   templates the project does not have, and the design playbooks' skills.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {git, projectRoot} from './lib/git.mjs';
import {section} from './lib/markdown.mjs';

const HOME = path.dirname(fileURLToPath(import.meta.url));

/** Where design-fence is installed by convention: the paths its files name. */
const CONVENTION = '.agents/design-fence';

/** `path` relative to `root`, with `/` separators. */
const relativeTo = (root, file) => path.relative(root, file).split(path.sep).join('/');

const read = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

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

/** The playbooks installed as skills (`skills/design-fence-<name>`): always, and with the design module. */
const SKILLS = ['ship', 'reflect'];
const DESIGN_SKILLS = ['start', 'design', 'component', 'flows', 'figma'];

/** Where agents look for a project's skills: Codex (and others), Claude Code. */
const SKILL_DIRS = ['.agents/skills', '.claude/skills'];

const skillNames = design => (design ? [...SKILLS, ...DESIGN_SKILLS] : SKILLS);

/** The markers around design-fence's block in `AGENTS.md`; the start marker is matched by its prefix. */
const BLOCK_START = '<!-- design-fence: written by install.mjs and replaced each time it runs; edit outside these markers -->';
const BLOCK_END = '<!-- /design-fence -->';
const isBlockStart = line => /^<!-- design-fence\b/.test(line.trim());

/** design-fence's block for `AGENTS.md`, its paths relative to the project's root. */
export function agentsBlock(relative, design, home = HOME) {
  const at = name => `\`${relative}/playbooks/${name}.md\``;
  const routes = [
    `| A request or an issue, to the default branch | ${at('ship')} |`,
    ...(design
      ? [
          `| Anything users see (a component, a view, a token, a change to any of them) | ${at('design')}, then ${at('component')}; ${at('flows')} first when a view, a route or a path is new or moves. ${at('start')} instead while \`design/index.md\` lists nothing yet, or when the way is unclear |`,
          `| Any Figma read or write | ${at('figma')}, "Connect" first |`,
        ]
      : []),
    `| Before committing code | ${at('reflect')}: its verdict is the commit's \`Reflect:\` line |`,
  ];
  const rules = section(read(path.join(home, 'PROCESS.md')), 'non-negotiables').split('\n').slice(1).join('\n').trim();
  return read(path.join(home, 'templates/agents-block.md'))
    .replaceAll(CONVENTION, relative)
    .replace('{{routes}}', routes.join('\n'))
    .replace('{{non-negotiables}}', rules)
    .trim();
}

/**
 * `AGENTS.md` with design-fence's block: replaced between its markers, or
 * added after the title and its first paragraph.
 */
export function withBlock(text, block) {
  const wrapped = [BLOCK_START, '', block.trim(), '', BLOCK_END];
  const lines = text.split('\n');
  const start = lines.findIndex(isBlockStart);
  const end = lines.findIndex((line, i) => i > start && line.trim() === BLOCK_END);
  if (start >= 0 && end > start) {
    return [...lines.slice(0, start), ...wrapped, ...lines.slice(end + 1)].join('\n');
  }
  const title = lines.findIndex(line => line.startsWith('# '));
  if (title < 0) {
    return [...wrapped, '', ...lines].join('\n');
  }
  let at = title + 1;
  while (at < lines.length && !lines[at].trim()) at++;
  while (at < lines.length && lines[at].trim()) at++;
  const rest = lines.slice(at);
  return [...lines.slice(0, at), '', ...wrapped, ...(rest.length ? rest : [''])].join('\n');
}

/** The comment design-fence's `CLAUDE.md` template had, dropped with its import of `PROCESS.md`. */
const OLD_POINTER = "<!-- Claude Code reads CLAUDE.md; the rules live in AGENTS.md (read by every agent) and in design-fence's process. -->";

/**
 * An existing `CLAUDE.md`, with `@AGENTS.md` (Claude Code reads `CLAUDE.md`
 * rather than `AGENTS.md` where both exist) and without design-fence's import
 * of `PROCESS.md` (`AGENTS.md`'s block says which playbook to read). No file
 * stays no file.
 */
export function claudeNext(text, relative) {
  if (!text) {
    return text;
  }
  const drop = [OLD_POINTER, `@${relative}/PROCESS.md`];
  const kept = text.split('\n').filter(line => !drop.includes(line.trim()));
  let next = kept.join('\n').replace(/^\n+/, '');
  if (!kept.some(line => line.trim() === '@AGENTS.md')) {
    next = `${next}${next && !next.endsWith('\n') ? '\n' : ''}${next.trim() ? '\n' : ''}@AGENTS.md\n`;
  }
  return next.trim() === text.trim() ? text : next;
}

/** A skill's file, its paths rewritten for where design-fence is. */
const skillText = (home, name, relative) =>
  read(path.join(home, 'skills', `design-fence-${name}`, 'SKILL.md')).replaceAll(CONVENTION, relative);

/**
 * What agents load from the project: `{block, skills, wanted, claude}`:
 * whether `AGENTS.md` has design-fence's block, how many of the `wanted`
 * skills each skills folder has, and `CLAUDE.md` as `none`, `imports` (it
 * imports `AGENTS.md`) or `missing` (it does not).
 */
export function agentsState(root, home = HOME, design = false) {
  const agents = read(path.join(root, 'AGENTS.md')).split('\n');
  const names = skillNames(design);
  const skills = Object.fromEntries(
    SKILL_DIRS.map(dir => [
      dir,
      names.filter(name => fs.existsSync(path.join(root, dir, `design-fence-${name}`, 'SKILL.md'))).length,
    ]),
  );
  const claudePath = path.join(root, 'CLAUDE.md');
  const claude = !fs.existsSync(claudePath)
    ? 'none'
    : read(claudePath).split('\n').some(line => line.trim() === '@AGENTS.md')
      ? 'imports'
      : 'missing';
  return {
    block: agents.some(isBlockStart) && agents.some(line => line.trim() === BLOCK_END),
    skills,
    wanted: names.length,
    claude,
  };
}

/** A directory link, `false` where the system refuses one (Windows without the right). */
function symlink(target, link) {
  try {
    fs.mkdirSync(path.dirname(link), {recursive: true});
    fs.symlinkSync(target, link, 'dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * The skills, into each skills folder: a link to `skills/<name>` where
 * design-fence is at its conventional path (an update of the submodule
 * updates them), a copy with its paths rewritten otherwise. A link that
 * resolves is left as it is, a broken one replaced, a copy refreshed.
 */
function installSkills(root, relative, names, write) {
  const added = [];
  for (const dir of SKILL_DIRS) {
    for (const name of names) {
      const file = `${dir}/design-fence-${name}`;
      const link = path.join(root, file);
      let stat = null;
      try {
        stat = fs.lstatSync(link);
      } catch {
        // Not there.
      }
      if (stat?.isSymbolicLink()) {
        if (fs.existsSync(link)) {
          continue;
        }
        fs.unlinkSync(link);
      } else if (stat) {
        const text = skillText(HOME, name, relative);
        if (read(path.join(link, 'SKILL.md')) !== text) {
          write(`${file}/SKILL.md`, text);
          added.push(file);
        }
        continue;
      }
      const source = path.join(HOME, 'skills', `design-fence-${name}`);
      if (!(relative === CONVENTION && symlink(path.relative(path.dirname(link), source), link))) {
        write(`${file}/SKILL.md`, skillText(HOME, name, relative));
      }
      added.push(file);
    }
  }
  return added;
}

/** The design module's templates (`templates/design/`), copied to its folder. */
const DESIGN = ['PHILOSOPHY.md', 'tokens.md', 'index.md', 'flows.yml'];

function install(root, {design = false} = {}) {
  const relative = relativeTo(root, HOME);
  const done = [];
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), content);
    if (!done.includes(file)) {
      done.push(file);
    }
  };
  const template = name => fs.readFileSync(path.join(HOME, name), 'utf8');
  const fill = (file, source) => {
    if (!fs.existsSync(path.join(root, file))) {
      write(
        file,
        template(source)
          .replaceAll('{{project}}', path.basename(root))
          .replaceAll(CONVENTION, relative),
      );
    }
  };

  const claude = read(path.join(root, 'CLAUDE.md'));
  const claudeAfter = claudeNext(claude, relative);
  if (claudeAfter !== claude) {
    write('CLAUDE.md', claudeAfter);
  }

  const fresh = [
    ['AGENTS.md', 'templates/AGENTS.md'],
    ['.agents/validate.json', 'templates/validate.json'],
    ['.agents/ENFORCEMENT.md', 'ENFORCEMENT.md'],
    ['.github/workflows/design-fence.yml', 'templates/design-fence.yml'],
  ];
  for (const [file, source] of fresh) {
    fill(file, source);
  }

  const config = JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8'));
  if (design) {
    if (!config.design) {
      config.design = {dir: 'design'};
      write('.agents/validate.json', `${JSON.stringify(config, null, 2)}\n`);
    }
    for (const name of DESIGN) {
      fill(`${config.design.dir ?? 'design'}/${name}`, `templates/design/${name}`);
    }
  }

  const agents = read(path.join(root, 'AGENTS.md'));
  const agentsAfter = withBlock(agents, agentsBlock(relative, Boolean(config.design)));
  if (agentsAfter !== agents) {
    write('AGENTS.md', agentsAfter);
  }

  const skills = installSkills(root, relative, skillNames(Boolean(config.design)), write).map(file =>
    path.basename(file),
  );

  const hooks = hooksState(root);
  if (hooks.state === 'off') {
    git(root, ['config', 'core.hooksPath', hooks.wanted]);
  }
  return {done, skills: [...new Set(skills)], hooks};
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = projectRoot(process.cwd());
  if (!root) {
    console.error('Run this inside the project (a git repository).');
    process.exit(2);
  }
  const {done, skills, hooks} = install(root, {design: process.argv.includes('--design')});
  const wrote = done.filter(file => !SKILL_DIRS.some(dir => file.startsWith(`${dir}/`)));
  console.log(wrote.length ? `Wrote: ${wrote.join(', ')}` : 'The project files are there: nothing to write.');
  if (skills.length) {
    console.log(`Skills written to ${SKILL_DIRS.join('/ and ')}/: ${skills.join(', ')}`);
  }
  if (hooks.state === 'other') {
    console.log(
      `Git hooks NOT on: core.hooksPath is already ${hooks.current}. Point it to ${hooks.wanted}, ` +
        'or call its pre-commit, commit-msg and pre-push from your own hooks.',
    );
  } else {
    console.log(`Git hooks on: core.hooksPath ${hooks.wanted} (this clone).`);
  }
  console.log('Commit what it wrote.');
}
