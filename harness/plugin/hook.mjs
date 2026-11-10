#!/usr/bin/env node
/**
 * design-fence's plugin for Claude Code, installed once for every project:
 * each hook runs the project's own design-fence (`.agents/design-fence`, or
 * the submodule holding `bin/design-fence.mjs`), so its rules are the version
 * the project pins. In a project without design-fence it does nothing, and in
 * one whose `install.mjs` wrote the hooks into `.claude/settings.json`,
 * `agent-hook --plugin` leaves the call to those, so nothing runs twice.
 * (Codex 0.167 has no plugin hooks: it has the project's `.codex/hooks.json`.)
 *
 *     node hook.mjs session-start | user-prompt | pre-tool-use   (the tool's JSON on stdin)
 *
 * Exit 2 refuses the tool call, so it exits 2 only when design-fence does.
 */

import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function projectRoot(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
  } catch {
    return null;
  }
}

/** The project's design-fence command line: at its usual place, or in a submodule. */
function designFence(root) {
  const cli = dir => path.join(root, dir, 'bin/design-fence.mjs');
  const dirs = ['.agents/design-fence'];
  const modules = path.join(root, '.gitmodules');
  if (fs.existsSync(modules)) {
    for (const match of fs.readFileSync(modules, 'utf8').matchAll(/^\s*path\s*=\s*(.+?)\s*$/gm)) {
      dirs.push(match[1]);
    }
  }
  const found = dirs.find(dir => fs.existsSync(cli(dir)));
  return found ? cli(found) : null;
}

const input = fs.readFileSync(0, 'utf8');
let cwd = process.cwd();
try {
  cwd = JSON.parse(input).cwd || cwd;
} catch {
  // Not JSON: design-fence says so.
}
const root = projectRoot(cwd);
const cli = root && designFence(root);
if (!cli) {
  process.exit(0);
}
const result = spawnSync(process.execPath, [cli, 'agent-hook', process.argv[2], '--plugin'], {
  cwd: root,
  input,
  stdio: ['pipe', 'inherit', 'inherit'],
});
process.exit(result.status === 2 ? 2 : result.status ? 1 : 0);
