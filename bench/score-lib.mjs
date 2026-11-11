/** What the tasks' score.mjs share: reading a run's diff, and finding values written raw where a token belongs. */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** The lines a diff adds, per file: `{file: [line, …]}`. Untracked files are not in a diff: see `addedText`. */
export function addedLines(diff) {
  const files = {};
  let file = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) file = line.slice(4).replace(/^b\//, '');
    else if (file && line.startsWith('+') && !line.startsWith('+++')) (files[file] ??= []).push(line.slice(1));
  }
  return files;
}

/** Everything a run added under `prefix`: the diff's added lines, and the whole of each new file. */
export function addedText({dir, diff, changed}, test) {
  const lines = Object.entries(addedLines(diff)).filter(([file]) => test(file)).flatMap(([, added]) => added);
  const tracked = new Set(Object.keys(addedLines(diff)));
  for (const file of changed.filter(file => test(file) && !tracked.has(file))) {
    const full = path.join(dir, file);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) lines.push(...fs.readFileSync(full, 'utf8').split('\n'));
  }
  return lines;
}

/** Values written raw in CSS lines: hex and functional colours, and lengths or times other than 0 outside `var()`. */
export function rawValues(lines) {
  const found = [];
  for (const line of lines) {
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/var\([^)]*\)/g, '');
    if (/^\s*(\/\/|\*|\/\*|@media|import )/.test(line) || !/:/.test(code)) continue;
    for (const match of code.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)a?\([^)]*\)|(?<![\w.-])(?!0(?:px|ms|s|rem|em)\b)\d*\.?\d+(?:px|rem|em|ms|s)\b/g)) {
      found.push(match[0]);
    }
  }
  return found;
}

export const run = (command, args, options = {}) => {
  // A `node --test` started from inside another reports to it, and exits 0 whatever its tests did.
  const {NODE_TEST_CONTEXT, ...env} = options.env ?? process.env;
  const result = spawnSync(command, args, {encoding: 'utf8', timeout: 120_000, ...options, env});
  return {ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}`};
};

export const read = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
export const check = (name, pass, note = '') => ({name, pass: Boolean(pass), note});
