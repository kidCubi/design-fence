#!/usr/bin/env node
/**
 * A round's numbers (bench/README.md): for each task and arm, the median of the runs that finished, with their
 * least and most, and the score of what they left. A difference between two arms is "shown" only when their runs do
 * not overlap (every run of one below every run of the other) and each has three runs or more; otherwise it is the
 * difference of two medians, which a sixth run could reverse.
 *
 *     node bench/summary.mjs <bench/results/round> [--quiet]
 *
 * Prints the tables, and writes them beside the runs as summary.md, with summary.json for a page to read.
 */

import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] ?? '.');
const ARMS = ['without', 'with', 'next'];
const LABEL = {without: 'Without', with: 'With design-fence (released)', next: 'With design-fence (this tree)'};

const median = values => {
  const sorted = values.filter(value => value != null && !Number.isNaN(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
};
const MEASURES = [
  ['cost', 'Cost (USD, list price)', run => run.cost, value => `$${value.toFixed(value < 0.1 ? 3 : 2)}`],
  ['tokens', 'Tokens', run => run.total, value => (value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : `${Math.round(value / 1e3)}k`)],
  ['fresh', 'Tokens not from cache', run => run.fresh, value => `${Math.round(value / 1e3)}k`],
  ['calls', 'Tool calls', run => Object.values(run.tools ?? {}).reduce((a, b) => a + b, 0), value => String(Math.round(value))],
  ['figmaCalls', 'Figma calls', run => run.figmaCalls, value => String(Math.round(value))],
  ['screenshots', 'Screenshots', run => run.screenshots, value => String(Math.round(value))],
  ['turns', 'Turns', run => run.turns, value => String(Math.round(value))],
  ['seconds', 'Seconds', run => run.seconds, value => String(Math.round(value))],
];

function read() {
  const tasks = {};
  for (const task of fs.readdirSync(dir).filter(name => fs.statSync(path.join(dir, name)).isDirectory())) {
    for (const file of fs.readdirSync(path.join(dir, task)).filter(name => /^(without|with|next)-\d+\.json$/.test(name))) {
      const run = JSON.parse(fs.readFileSync(path.join(dir, task, file), 'utf8'));
      ((tasks[task] ??= {})[run.arm] ??= []).push(run);
    }
  }
  return tasks;
}

/** One arm's runs on a task: those that count, each measure's median and range, and the score. */
function armOf(runs) {
  const counted = runs.filter(run => run.ok);
  const measures = {};
  for (const [key, , get] of MEASURES) {
    const values = counted.map(get).filter(value => value != null && !Number.isNaN(value));
    if (values.length) measures[key] = {median: median(values), min: Math.min(...values), max: Math.max(...values)};
  }
  const checks = {};
  for (const run of counted) for (const check of run.score?.checks ?? []) (checks[check.name] ??= []).push(check.pass);
  const passed = counted.reduce((sum, run) => sum + (run.score?.passed ?? 0), 0);
  const of = counted.reduce((sum, run) => sum + (run.score?.of ?? 0), 0);
  return {
    runs: runs.length,
    counted: counted.length,
    measures,
    score: {passed, of, share: of ? passed / of : null, checks: Object.fromEntries(Object.entries(checks).map(([name, passes]) => [name, {passed: passes.filter(Boolean).length, of: passes.length}]))},
  };
}

/** `a` against `b` on one measure: the medians' difference, and whether the runs show it. */
function against(a, b, runs) {
  if (!a || !b || !b.median) return null;
  const shown = runs >= 3 && (a.max < b.min || a.min > b.max);
  return {percent: Math.round((a.median / b.median - 1) * 100), shown};
}

const tasks = read();
const first = Object.values(tasks).flatMap(arms => Object.values(arms).flat())[0];
const summary = {
  round: path.basename(dir),
  agent: first?.agent,
  agentVersion: first?.agentVersion,
  model: first?.model,
  tasks: {},
};
const lines = [`# ${summary.round}: ${summary.model ?? '?'} (${summary.agent === 'codex' ? 'Codex' : 'Claude Code'} ${summary.agentVersion ?? ''})`, ''];
const percent = diff => (diff ? `${diff.percent > 0 ? '+' : diff.percent < 0 ? '−' : ''}${Math.abs(diff.percent)}%${diff.shown ? '' : ' (not shown)'}` : '—');

for (const [task, byArm] of Object.entries(tasks).sort()) {
  const arms = Object.fromEntries(ARMS.filter(arm => byArm[arm]).map(arm => [arm, armOf(byArm[arm])]));
  const names = Object.keys(arms);
  const pairs = [...names.filter(arm => arm !== 'without' && arms.without).map(arm => [arm, 'without']), ...(arms.next && arms.with ? [['next', 'with']] : [])];
  summary.tasks[task] = {arms, differences: {}};
  lines.push(`## ${task}`, '');
  const row = cells => `| ${cells.join(' | ')} |`;
  lines.push(row(['Median (least to most)', ...names.map(arm => `${LABEL[arm]}, ${arms[arm].counted} of ${arms[arm].runs} runs`), ...pairs.map(([a, b]) => `${a} against ${b}`)]));
  lines.push(`|${' --- |'.repeat(1 + names.length + pairs.length)}`);
  for (const [key, label, , show] of MEASURES) {
    if (!names.some(arm => arms[arm].measures[key]?.max > 0)) continue;
    const cells = names.map(arm => {
      const m = arms[arm].measures[key];
      return m ? `${show(m.median)} (${show(m.min)} to ${show(m.max)})` : '—';
    });
    const diffs = pairs.map(([a, b]) => {
      const diff = against(arms[a].measures[key], arms[b].measures[key], Math.min(arms[a].counted, arms[b].counted));
      (summary.tasks[task].differences[`${a}/${b}`] ??= {})[key] = diff;
      return percent(diff);
    });
    lines.push(row([label, ...cells, ...diffs]));
  }
  lines.push(row(['Score (checks passed)', ...names.map(arm => `${arms[arm].score.passed} of ${arms[arm].score.of}`), ...pairs.map(() => '')]), '');
  const checkNames = [...new Set(names.flatMap(arm => Object.keys(arms[arm].score.checks)))];
  lines.push(`| Check (runs that pass) | ${names.map(arm => LABEL[arm]).join(' | ')} |`, `|${' --- |'.repeat(1 + names.length)}`);
  for (const name of checkNames) {
    lines.push(`| ${name} | ${names.map(arm => (arms[arm].score.checks[name] ? `${arms[arm].score.checks[name].passed} of ${arms[arm].score.checks[name].of}` : '—')).join(' | ')} |`);
  }
  const lost = names.flatMap(arm => byArm[arm].filter(run => !run.ok).map(run => `${arm}-${run.n} (${run.subtype})`));
  if (lost.length) lines.push('', `Not counted (did not finish): ${lost.join(', ')}.`);
  lines.push('');
}

fs.writeFileSync(path.join(dir, 'summary.md'), `${lines.join('\n')}\n`);
fs.writeFileSync(path.join(dir, 'summary.json'), `${JSON.stringify(summary, null, 1)}\n`);
if (!process.argv.includes('--quiet')) console.log(lines.join('\n'));
