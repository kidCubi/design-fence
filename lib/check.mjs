/**
 * The project's checks (`.agents/validate.json`), run on what changed.
 *
 * validate.json:
 *
 *     {
 *       "node": 22,                  // the major version the checks need
 *       "base": "origin/main",       // commits since it count as changed
 *       "checks": [
 *         {"name": "format", "when": ["viewer/**\/*.js"], "cwd": "viewer",
 *          "run": "npx --yes prettier@3.3.3 --check {files}"},
 *         {"name": "viewer tests", "when": "viewer/**", "cwd": "viewer",
 *          "run": "node --test test/*.test.js"}
 *       ],
 *       "visual": {"run": "…", "cwd": "…"}  // phase 6, not run here
 *     }
 *
 * A check runs when a changed file matches its `when`. `{files}` in `run`
 * becomes those files that still exist, relative to the check's `cwd`; a
 * check whose `run` names `{files}` is skipped when there are none. A check
 * that passed on the same contents is not run again (its fingerprint is
 * kept in the state directory), so stopping twice costs nothing.
 */

import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {changedFiles, stateDir} from './git.mjs';
import {matchesAny} from './glob.mjs';
import {findNode} from './node.mjs';

export const CONFIG = '.agents/validate.json';

/** The project's validate.json, or null if it has none. */
export function loadConfig(root) {
  const file = path.join(root, CONFIG);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const quote = file => `"${file.replaceAll('"', '\\"')}"`;

/**
 * What each check would do with these changed files: `{check, files, run,
 * cwd}` for those to run, the others left out. `all` runs every check, on
 * every file `when` matches among the changed ones.
 */
export function plan(root, config, changed, {all = false} = {}) {
  const planned = [];
  for (const check of config.checks ?? []) {
    const matched = changed.filter(file => matchesAny(file, check.when ?? '**'));
    if (!all && matched.length === 0) {
      continue;
    }
    const cwd = path.join(root, check.cwd ?? '.');
    const existing = matched.filter(file => fs.existsSync(path.join(root, file)));
    const names = check.run.includes('{files}');
    if (names && existing.length === 0) {
      continue;
    }
    const relative = existing.map(file =>
      path.relative(cwd, path.join(root, file)).split(path.sep).join('/'),
    );
    const run = check.run.replaceAll('{files}', relative.map(quote).join(' '));
    planned.push({check, files: existing, run, cwd});
  }
  return planned;
}

/** The fingerprint of a check on these files: its command and their contents. */
export function fingerprint(root, step) {
  const hash = crypto.createHash('sha1');
  hash.update(`${step.check.name}\0${step.run}\0`);
  for (const file of step.files) {
    hash.update(`${file}\0`);
    hash.update(fs.readFileSync(path.join(root, file)));
  }
  return hash.digest('hex');
}

function readPassed(file) {
  try {
    return new Set(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return new Set();
  }
}

/**
 * Runs the checks on what changed. Returns `{node, results}`: the Node used,
 * and for each check that ran or was already passed `{name, ok, cached,
 * output, ms}`. Throws if the project needs a Node that cannot be found.
 */
export function runChecks(root, {all = false, cache = true, log = () => {}} = {}) {
  const config = loadConfig(root);
  if (!config) {
    return {node: null, results: []};
  }
  const node = findNode(config.node);
  if (!node) {
    throw new Error(
      `This project's checks need Node ${config.node} or newer, and none was found ` +
        '(set DESIGN_FENCE_NODE to its path).',
    );
  }
  const env = {
    ...process.env,
    PATH: `${path.dirname(node.executable)}${path.delimiter}${process.env.PATH}`,
  };
  const state = stateDir(root);
  const passedFile = path.join(state, 'passed.json');
  const passed = cache ? readPassed(passedFile) : new Set();
  const changed = changedFiles(root, config.base);
  const results = [];
  for (const step of plan(root, config, changed, {all})) {
    const print = fingerprint(root, step);
    if (passed.has(print)) {
      results.push({name: step.check.name, ok: true, cached: true, output: '', ms: 0});
      continue;
    }
    log(`${step.check.name}: ${step.run}`);
    const started = Date.now();
    const run = spawnSync(step.run, {
      cwd: step.cwd,
      env,
      shell: true,
      encoding: 'utf8',
      timeout: (step.check.timeout ?? 300) * 1000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const ok = run.status === 0;
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? `\n${run.error.message}` : ''}`;
    results.push({name: step.check.name, ok, cached: false, output, ms: Date.now() - started});
    if (ok) {
      passed.add(print);
    }
  }
  fs.mkdirSync(state, {recursive: true});
  // Only the latest passes are worth keeping.
  fs.writeFileSync(passedFile, JSON.stringify([...passed].slice(-200)));
  return {node, results};
}

/** The last lines of a check's output, enough to act on. */
export function tail(output, lines = 60) {
  return output.trimEnd().split('\n').slice(-lines).join('\n');
}
