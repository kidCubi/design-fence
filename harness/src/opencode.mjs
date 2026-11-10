/**
 * design-fence's plugin for OpenCode: the agent tools' hooks of
 * `lib/agent-hooks.mjs`, carried by the file itself (`harness/build.mjs`
 * makes it one file with `lib/`), so an agent that edits or deletes the
 * project's design-fence does not disarm it. It acts only in a project with
 * design-fence (its folder, or its block in `AGENTS.md`).
 *
 * - Per person, as the guard: `~/.config/opencode/plugins/design-fence.js`,
 *   outside the repository.
 * - In the project: `.opencode/plugins/design-fence.js` (`install.mjs`), for
 *   whoever has not got the first. Both decide on every tool call, and agree
 *   (a screenshot is counted once per call); only one gives context.
 *
 * - a tool call design-fence refuses, or one that needs the human's word
 *   (OpenCode cannot ask before a tool call), throws, with the reason;
 * - a message from the human ends a phase (the screenshot budget), and
 *   "design-fence: allow" in it allows the fence's files for that turn;
 * - a compaction keeps design-fence's block of AGENTS.md in the summary;
 * - the git hooks off in this clone: said in the system prompt.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {decide} from '../../lib/agent-hooks.mjs';
import {AGENT_FILES, CONVENTION, designFenceHome, isFenced} from '../../lib/fence.mjs';
import {projectRoot} from '../../lib/git.mjs';

export const DesignFence = async ({directory, worktree} = {}) => {
  const root = projectRoot(worktree || directory || process.cwd());
  if (!root || !isFenced(root)) {
    return {};
  }
  const home = designFenceHome(root) ?? path.join(root, CONVENTION);
  const own = path.join(root, AGENT_FILES.opencode);
  // The project's copy gives the context; the person's, only where the project has none.
  const context = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(own) || !fs.existsSync(own);
  const on = event => decide(root, event, {home});
  const warning = context ? (on({name: 'session-start', source: 'startup'}).context ?? '') : '';

  return {
    'tool.execute.before': async (input, output) => {
      const decision = on({name: 'pre-tool-use', tool: input.tool, input: output.args, session: input.sessionID, id: input.callID});
      if (decision.deny || decision.ask) {
        throw new Error(decision.deny ?? decision.ask);
      }
    },
    'chat.message': async (input, output) => {
      const prompt = (output?.parts ?? [])
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n');
      on({name: 'user-prompt', session: input.sessionID, prompt});
    },
    'experimental.session.compacting': async (input, output) => {
      if (!context) {
        return;
      }
      const decision = on({name: 'session-start', source: 'compact', session: input.sessionID});
      if (decision.context) {
        output.context.push(decision.context);
      }
    },
    'experimental.chat.system.transform': async (input, output) => {
      if (warning) {
        output.system.push(warning);
      }
    },
  };
};
