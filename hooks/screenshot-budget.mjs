#!/usr/bin/env node
/**
 * One design-tool screenshot per phase (PROCESS.md, "Enforcement").
 *
 * - PreToolUse on the screenshot tools: the first one in the current phase
 *   goes ahead; another is refused (exit 2, the reason on stderr, which the
 *   agent reads), pointing it at reading the file's properties instead.
 * - UserPromptSubmit: a new human prompt gives the screenshot back.
 *
 * The phase is the one `design-fence phase` recorded (see lib/phase.mjs).
 * Fails open (allows) on anything unexpected: a guard that crashed into
 * refusing every screenshot would be worse than none.
 */

import fs from 'node:fs';

import {projectRoot} from '../lib/git.mjs';
import {currentPhase, resetScreenshot, spendScreenshot} from '../lib/phase.mjs';

function main() {
  let payload = {};
  try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return 0;
  }
  const root = projectRoot(payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!root) {
    return 0;
  }
  if (payload.hook_event_name === 'UserPromptSubmit') {
    resetScreenshot(root, payload.session_id);
    return 0;
  }
  if (spendScreenshot(root, payload.session_id)) {
    return 0;
  }
  const phase = currentPhase(root);
  process.stderr.write(
    `design-fence: this phase${phase ? ` (${phase})` : ''} already had its screenshot. ` +
      'Check the result by reading the design file instead (sizes, positions, auto layout, ' +
      'bound variables, text overflow: one figma_execute that returns them), and keep the ' +
      'screenshot for the end of the next phase, for the human.\n',
  );
  return 2;
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`[design-fence] screenshot budget skipped: ${error.message}\n`);
  process.exitCode = 0;
}
