#!/usr/bin/env node
/**
 * design-fence's plugin for Claude Code and Codex (Codex reads the same
 * marketplace, manifest and hooks.json): the agent tools' hooks of
 * `lib/agent-hooks.mjs`, carried by the plugin itself, so an agent that edits
 * or deletes the project's design-fence does not disarm them. It acts only in
 * a project with design-fence (its folder, or its block in `AGENTS.md`).
 *
 *     node hook.mjs session-start | user-prompt | pre-tool-use   (the tool's JSON on stdin)
 *
 * Exit 2 refuses the tool call, so it exits 2 only when design-fence refuses.
 * The plugin's `hook.mjs` is this file and `lib/` in one (`harness/build.mjs`).
 */

import fs from 'node:fs';

import {runHook} from '../../lib/agent-hooks.mjs';

let input = '';
try {
  input = fs.readFileSync(0, 'utf8');
} catch {
  // No input: an empty event.
}
const {code, stdout, stderr} = runHook(process.argv[2], input, {plugin: true});
if (stdout) process.stdout.write(`${stdout}\n`);
if (stderr) process.stderr.write(`${stderr}\n`);
process.exit(code);
