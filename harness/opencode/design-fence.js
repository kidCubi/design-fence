/**
 * design-fence's hooks for OpenCode: what the git hooks cannot see between
 * two commits (lib/agent-hooks.mjs). It runs the project's own design-fence
 * (`.agents/design-fence`, or the submodule holding `bin/design-fence.mjs`),
 * so its rules are the version the project pins; in a project without one
 * it does nothing.
 *
 * In a project: `.opencode/plugins/design-fence.js`, copied there by
 * `install.mjs`. For every project: `~/.config/opencode/plugins/`, where it
 * leaves alone a project that has its own copy, so nothing runs twice.
 *
 * - a tool call design-fence refuses (a hook skipped, a second design-tool
 *   screenshot in a phase, a figma/ script pasted) throws, with the reason;
 * - a message from the human ends a phase (the screenshot budget);
 * - a compaction keeps design-fence's block of AGENTS.md in the summary;
 * - the git hooks off in this clone: said in the system prompt.
 */

import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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

export const DesignFence = async ({directory, worktree}) => {
  const root = projectRoot(worktree || directory || process.cwd());
  const cli = root && designFence(root);
  if (!cli) {
    return {};
  }
  const own = path.join(root, '.opencode/plugins/design-fence.js');
  if (fs.existsSync(own) && path.resolve(fileURLToPath(import.meta.url)) !== path.resolve(own)) {
    return {};
  }
  // OpenCode runs plugins in its own runtime: the command line runs on the Node of the PATH.
  const run = (name, payload) =>
    spawnSync('node', [cli, 'agent-hook', name], {cwd: root, input: JSON.stringify({cwd: root, ...payload}), encoding: 'utf8'});
  const start = run('session-start', {hook_event_name: 'SessionStart', source: 'startup'});
  const warning = start.status === 0 ? start.stdout.trim() : '';

  return {
    'tool.execute.before': async (input, output) => {
      const result = run('pre-tool-use', {
        hook_event_name: 'PreToolUse',
        tool_name: input.tool,
        tool_input: output.args,
        session_id: input.sessionID,
      });
      if (result.status === 2) {
        throw new Error(result.stderr.trim());
      }
    },
    'chat.message': async input => {
      run('user-prompt', {hook_event_name: 'UserPromptSubmit', session_id: input.sessionID});
    },
    'experimental.session.compacting': async (input, output) => {
      const result = run('session-start', {hook_event_name: 'SessionStart', source: 'compact', session_id: input.sessionID});
      if (result.status === 0 && result.stdout.trim()) {
        output.context.push(result.stdout.trim());
      }
    },
    'experimental.chat.system.transform': async (input, output) => {
      if (warning) {
        output.system.push(warning);
      }
    },
  };
};
