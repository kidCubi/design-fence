#!/usr/bin/env node
/**
 * The Stop hook: when the agent stops, the project's checks run on what
 * changed (`design-fence check`). If one fails, the agent is sent back to
 * fix it (exit 2, the failure on stderr). After three failed stops in a row
 * it lets the agent stop, telling it to say what still fails: a check that
 * cannot pass for a reason outside the work must not trap the session.
 *
 * Fails open (lets the agent stop, with a note) when there is no project or
 * no validate.json, and when the checks cannot run at all.
 */

import fs from 'node:fs';
import path from 'node:path';

import {runChecks, tail} from '../lib/check.mjs';
import {projectRoot, stateDir} from '../lib/git.mjs';

const MAX_ATTEMPTS = 3;

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function attemptsFile(root, session) {
  const safe = String(session || 'unknown').replace(/[^\w-]/g, '_');
  return path.join(stateDir(root), `stop-attempts-${safe}`);
}

function main() {
  const payload = readPayload();
  const root = projectRoot(payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!root) {
    return 0;
  }
  let results;
  try {
    ({results} = runChecks(root));
  } catch (error) {
    process.stderr.write(`[design-fence] checks not run: ${error.message}\n`);
    return 0;
  }
  const attempts = attemptsFile(root, payload.session_id);
  const failed = results.filter(result => !result.ok);
  if (failed.length === 0) {
    fs.rmSync(attempts, {force: true});
    return 0;
  }
  const count = (Number(fs.existsSync(attempts) && fs.readFileSync(attempts, 'utf8')) || 0) + 1;
  fs.mkdirSync(path.dirname(attempts), {recursive: true});
  fs.writeFileSync(attempts, String(count));
  const report = failed.map(result => `## ${result.name}\n${tail(result.output)}`).join('\n\n');
  if (count > MAX_ATTEMPTS) {
    fs.rmSync(attempts, {force: true});
    // Allowed to stop: the JSON reaches the human, not the agent.
    console.log(
      JSON.stringify({
        systemMessage: `design-fence: still failing after ${MAX_ATTEMPTS} attempts: ${failed
          .map(result => result.name)
          .join(', ')}. Not fixed; say so in the report.`,
      }),
    );
    return 0;
  }
  process.stderr.write(
    `design-fence: the project's checks fail on what changed (attempt ${count} of ${MAX_ATTEMPTS}). ` +
      'Fix the cause, not the check. If it cannot pass for a reason outside this work, ' +
      'stop trying and say so plainly in your report.\n\n' +
      report +
      '\n',
  );
  return 2;
}

process.exitCode = main();
