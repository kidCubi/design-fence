/**
 * What design-fence knows of a project it is in, without its installer:
 * where design-fence is, its block in `AGENTS.md`, whether the git hooks and
 * the agent tools' hooks are on. Used by `install.mjs`, the command line, and
 * the plugins (`harness/build.mjs` bundles it into them), so it imports only
 * node's own modules and `./git.mjs`.
 */

import fs from 'node:fs';
import path from 'node:path';

import {git} from './git.mjs';

/**
 * The figma-console server design-fence works with, pinned: its status and
 * its results are read by `lib/figma.mjs` and by the playbooks, and the
 * package changes several times a week. One place to change it, with a
 * design-fence release that was tried against the new one.
 */
export const FIGMA_CONSOLE = 'figma-console-mcp@1.46.0';

/** Where design-fence is installed by convention: the paths its files name. */
export const CONVENTION = '.agents/design-fence';

export const readText = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

/** The markers around design-fence's block in `AGENTS.md`; the start marker is matched by its prefix. */
export const BLOCK_START = '<!-- design-fence: written by install.mjs and replaced each time it runs; edit outside these markers -->';
export const BLOCK_END = '<!-- /design-fence -->';
export const isBlockStart = line => /^<!-- design-fence\b/.test(line.trim());

/** design-fence's block in an `AGENTS.md`, between its markers (without them), or '' when it has none. */
export function blockIn(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(isBlockStart);
  const end = lines.findIndex((line, i) => i > start && line.trim() === BLOCK_END);
  return start >= 0 && end > start ? lines.slice(start + 1, end).join('\n').trim() : '';
}

/**
 * Where design-fence is in the project (absolute): at its usual place, or the
 * submodule holding `bin/design-fence.mjs`; null when there is none.
 */
export function designFenceHome(root) {
  const dirs = [CONVENTION];
  for (const match of readText(path.join(root, '.gitmodules')).matchAll(/^\s*path\s*=\s*(.+?)\s*$/gm)) {
    dirs.push(match[1]);
  }
  const found = dirs.find(dir => fs.existsSync(path.join(root, dir, 'bin/design-fence.mjs')));
  return found ? path.join(root, found) : null;
}

/** Whether design-fence is in the project: its folder, or its block in `AGENTS.md` (which stays when the folder goes). */
export const isFenced = root =>
  Boolean(designFenceHome(root)) || Boolean(blockIn(readText(path.join(root, 'AGENTS.md'))));

/** `file` relative to `root`, with `/` separators. */
export const relativeTo = (root, file) => path.relative(root, file).split(path.sep).join('/');

/**
 * Whether the project's git hooks are design-fence's (at `home`): `{state,
 * current, wanted}`, the state `on`, `off` (no hooks path set) or `other`
 * (set to another directory, left alone).
 */
export function hooksState(root, home) {
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

/**
 * The project's files where `install.mjs` puts the agent tools' hooks.
 * GitHub Copilot's is Claude Code's: its CLI runs the hooks of
 * `.claude/settings.json` in a folder it trusts, as Claude Code does (its
 * tool names mapped to Claude Code's), and reads the same `.mcp.json`.
 */
export const AGENT_FILES = {
  claude: '.claude/settings.json',
  copilot: '.claude/settings.json',
  codex: '.codex/hooks.json',
  opencode: '.opencode/plugins/design-fence.js',
};

/** Whether each agent tool has design-fence's hooks in the project. */
export function agentHooksState(root) {
  // In the JSON, the command's quote is escaped.
  const has = file => /design-fence\.mjs\\" agent-hook /.test(readText(path.join(root, file)));
  return {
    claude: has(AGENT_FILES.claude),
    copilot: has(AGENT_FILES.copilot),
    codex: has(AGENT_FILES.codex),
    opencode: fs.existsSync(path.join(root, AGENT_FILES.opencode)),
  };
}
