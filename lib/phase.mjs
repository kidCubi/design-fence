/**
 * The phase the work is in (see PROCESS.md), and what a phase allows once:
 * a design-tool screenshot. The `ship` skill records each phase it enters
 * (`design-fence phase <name>`); a new human prompt resets the budgets too,
 * so outside `ship` each turn counts as a phase.
 *
 * Kept in the repository's state directory (inside `.git`): never committed.
 */

import fs from 'node:fs';
import path from 'node:path';

import {stateDir} from './git.mjs';

const PHASE = 'phase';

/** The phase recorded for the project, or '' if none. */
export function currentPhase(root) {
  try {
    return fs.readFileSync(path.join(stateDir(root), PHASE), 'utf8').trim();
  } catch {
    return '';
  }
}

/** Records the phase the work enters. */
export function setPhase(root, name) {
  const dir = stateDir(root);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, PHASE), `${name}\n`);
}

function budgetFile(root, session) {
  const safe = String(session || 'unknown').replace(/[^\w-]/g, '_');
  return path.join(stateDir(root), `screenshot-${safe}.json`);
}

/**
 * Spends this phase's screenshot for the session: true if it was still
 * there (the screenshot may go ahead), false if already spent.
 */
export function spendScreenshot(root, session) {
  const file = budgetFile(root, session);
  const phase = currentPhase(root);
  let spent = null;
  try {
    spent = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // Nothing spent yet.
  }
  if (spent && spent.phase === phase) {
    return false;
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify({phase, at: new Date().toISOString()}));
  return true;
}

/** Gives the session its screenshot back (a new human prompt). */
export function resetScreenshot(root, session) {
  fs.rmSync(budgetFile(root, session), {force: true});
}
