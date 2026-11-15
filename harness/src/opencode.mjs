/**
 * design-fence's plugin for OpenCode, 1.x and 2.x: the agent tools' hooks of
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
 *
 * One default export for both: OpenCode 1.x (1.18.29 and later) calls its
 * `server`, which returns 1.x's hooks; 2.x calls its `setup`, which
 * registers the same through 2.x's `tool.hook` and `session.hook`.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {decide} from '../../lib/agent-hooks.mjs';
import {AGENT_FILES, CONVENTION, designFenceHome, isFenced} from '../../lib/fence.mjs';
import {projectRoot} from '../../lib/git.mjs';

/** OpenCode 1.x's hooks for the project at `directory`, or none outside one with design-fence. */
async function hooksFor({directory, worktree} = {}) {
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
}

/** OpenCode 2.x: the same hooks, through its plugin API (`@opencode/plugin`). A refusal throws. */
async function setup(context) {
  const hooks = await hooksFor({directory: context.location?.directory, worktree: context.location?.project?.directory});
  if (!hooks['tool.execute.before']) {
    return;
  }
  const system = async (hook, event, input) => {
    const output = {context: [], system: []};
    await hooks[hook](input, output);
    for (const text of [...output.context, ...output.system]) {
      event.system.push({type: 'text', text});
    }
  };
  await context.tool.hook('execute.before', event =>
    hooks['tool.execute.before']({tool: event.tool, sessionID: event.sessionID, callID: event.id}, {args: event.input}),
  );
  await context.session.hook('prompt', event =>
    hooks['chat.message']({sessionID: event.sessionID}, {parts: [{type: 'text', text: event.prompt?.text ?? ''}]}),
  );
  await context.session.hook('compaction', event =>
    system('experimental.session.compacting', event, {sessionID: event.sessionID}),
  );
  await context.session.hook('context', event =>
    system('experimental.chat.system.transform', event, {sessionID: event.sessionID}),
  );
}

export default {id: 'design-fence', server: hooksFor, setup};
