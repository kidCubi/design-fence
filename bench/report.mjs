#!/usr/bin/env node
/**
 * Several rounds side by side (bench/README.md): one model a round, the same tasks, without design-fence and with
 * it. For a page that quotes the measure: what the runs show, what they do not, and what each number rests on.
 *
 *     node bench/report.mjs <bench/results/round> [<round> ...] [--out <file without extension>]
 *
 * Reads each round's summary.json (bench/summary.mjs) and its runs, so it is run where the rounds were. Writes
 * <out>.md and <out>.json (default bench/results/report). Its rules are the summary's: medians of the runs that
 * finished, and a difference "shown" only when each arm has three runs or more and their runs do not overlap.
 *
 * "Holds" is a run that passes every check both arms share, a rule of design-fence's own left out (the arm without
 * it was never told: OWN_RULES): what a person would have to send back otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = path.resolve(outAt >= 0 ? args[outAt + 1] : 'bench/results/report');
const rounds = args.filter((arg, i) => !arg.startsWith('--') && (outAt < 0 || i !== outAt + 1));
if (!rounds.length) {
  console.error('usage: node bench/report.mjs <bench/results/round> [<round> ...] [--out <file without extension>]');
  process.exit(1);
}

/** Checks of design-fence's own rules, by name: scored in both arms, but no fault of an agent that was never told. */
const OWN_RULES = ['one screenshot at most'];
const TASKS = ['figma-badge', 'component-build', 'drift-probe', 'review', 'ship-issue'];
const MEASURES = [
  ['cost', 'Cost', value => `$${value.toFixed(value < 0.1 ? 3 : 2)}`],
  ['seconds', 'Seconds', value => String(Math.round(value))],
  ['tokens', 'Tokens', value => (value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : `${Math.round(value / 1e3)}k`)],
  ['calls', 'Tool calls', value => String(Math.round(value))],
  ['figmaCalls', 'Figma calls', value => String(Math.round(value))],
  ['screenshots', 'Screenshots', value => String(Math.round(value))],
];
const percent = (a, b) => (a ? Math.round((b / a - 1) * 100) : null);
const signed = value => (value == null ? '—' : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}%`);

/** One round: its summary, and for each task the runs of each arm that hold. */
function roundOf(dir) {
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'));
  const tasks = {};
  for (const [task, {arms}] of Object.entries(summary.tasks)) {
    const withArm = arms.next ? 'next' : 'with';
    const a = arms.without;
    const b = arms[withArm];
    if (!a || !b) continue;
    const shared = Object.keys(a.score.checks).filter(name => name in b.score.checks && !OWN_RULES.includes(name));
    // What the arm's counted runs cost together, for what each result that holds cost.
    const spent = {};
    const holds = arm => {
      let held = 0;
      let counted = 0;
      for (const file of fs.readdirSync(path.join(dir, task)).filter(name => new RegExp(`^${arm}-\\d+\\.json$`).test(name))) {
        const run = JSON.parse(fs.readFileSync(path.join(dir, task, file), 'utf8'));
        if (!run.ok) continue;
        counted++;
        spent[arm] = (spent[arm] ?? 0) + (run.cost ?? 0);
        if (run.score.checks.filter(check => shared.includes(check.name)).every(check => check.pass)) held++;
      }
      return {held, of: counted};
    };
    const measures = {};
    for (const [key] of MEASURES) {
      const x = a.measures[key];
      const y = b.measures[key];
      if (!x || !y) continue;
      measures[key] = {without: x, with: y, percent: percent(x.median, y.median), shown: a.counted >= 3 && b.counted >= 3 && (x.max < y.min || y.max < x.min)};
    }
    tasks[task] = {
      runs: {without: a.counted, with: b.counted},
      measures,
      holds: {without: holds('without'), with: holds(withArm)},
      spent: {without: spent.without ?? 0, with: spent[withArm] ?? 0},
      checks: Object.fromEntries(Object.keys(a.score.checks).filter(name => name in b.score.checks).map(name => [name, {without: a.score.checks[name], with: b.score.checks[name], ownRule: OWN_RULES.includes(name)}])),
    };
  }
  return {round: summary.round, model: summary.model, agent: summary.agent === 'codex' ? 'Codex' : 'Claude Code', agentVersion: summary.agentVersion, tree: summary.tree, tasks};
}

const report = {made: new Date().toISOString().slice(0, 10), rounds: rounds.map(dir => roundOf(path.resolve(dir)))};
// A column is named by its model, and by its round too when two rounds measured the same model.
for (const round of report.rounds) {
  round.label = report.rounds.filter(other => other.model === round.model).length > 1 ? `${round.model} (${round.round})` : round.model;
}
const taskNames = [...TASKS, ...new Set(report.rounds.flatMap(round => Object.keys(round.tasks)))].filter((name, i, all) => all.indexOf(name) === i && report.rounds.some(round => round.tasks[name]));

// What is shown: every difference whose runs do not overlap, and every task where the count of runs that hold moved.
report.shown = [];
for (const task of taskNames) {
  for (const round of report.rounds) {
    for (const [key, label] of MEASURES) {
      const m = round.tasks[task]?.measures[key];
      if (m?.shown && m.percent) report.shown.push({task, model: round.model, round: round.round, label: round.label, measure: label, percent: m.percent, without: m.without.median, with: m.with.median});
    }
  }
}

const lines = ['# design-fence, measured', ''];
lines.push(`Made ${report.made} by \`bench/report.mjs\` from the rounds below. Each cell is the median of the runs that finished, without design-fence → with it. A difference is marked * when it is shown: three runs or more an arm, and no run of one arm inside the other's range. The others are differences of medians, which one more run could reverse: no claim rests on them.`, '');
lines.push('| Model | Agent | Round | design-fence | Codex hooks |', '| --- | --- | --- | --- | --- |');
for (const round of report.rounds) {
  const tree = round.tree?.next;
  lines.push(`| ${round.model} | ${round.agent} ${round.agentVersion ?? ''} | \`${round.round}\` | ${tree ? `${tree.head}${tree.uncommittedFiles ? ` + ${tree.uncommittedFiles} uncommitted file(s)` : ''} (snapshot ${tree.id})` : '?'} | ${round.tree && 'codexHooks' in round.tree ? (round.tree.codexHooks ? 'on' : 'off') : '—'} |`);
}
lines.push('');

lines.push('## Does the result hold', '', `Runs that pass every check both arms share, of the runs that finished (a rule of design-fence's own is left out: ${OWN_RULES.map(name => `"${name}"`).join(', ')}).`, '');
lines.push(`| Task | ${report.rounds.map(round => round.label).join(' | ')} |`, `| --- | ${report.rounds.map(() => '---').join(' | ')} |`);
for (const task of taskNames) {
  lines.push(`| ${task} | ${report.rounds.map(round => (round.tasks[task] ? `${round.tasks[task].holds.without.held} of ${round.tasks[task].holds.without.of} → ${round.tasks[task].holds.with.held} of ${round.tasks[task].holds.with.of}` : '—')).join(' | ')} |`);
}
lines.push('');

// What each result that holds cost: the arm's whole spend on the task over its runs that hold. A run a person would
// have to send back was paid for too.
const perHeld = (spent, {held, of}) => (held ? `$${(spent / held).toFixed(spent / held < 0.1 ? 3 : 2)}` : `none of ${of} held`);
lines.push('## What a result that holds costs', '', "The arm's whole spend on the task, over its runs that hold (the table above): a run that has to be sent back was paid for too.", '');
lines.push(`| Task | ${report.rounds.map(round => round.label).join(' | ')} |`, `| --- | ${report.rounds.map(() => '---').join(' | ')} |`);
for (const task of taskNames) {
  const cells = report.rounds.map(round => {
    const t = round.tasks[task];
    return t ? `${perHeld(t.spent.without, t.holds.without)} → ${perHeld(t.spent.with, t.holds.with)}` : '—';
  });
  lines.push(`| ${task} | ${cells.join(' | ')} |`);
}
lines.push('');

for (const [key, label, format] of MEASURES) {
  if (!report.rounds.some(round => Object.values(round.tasks).some(task => task.measures[key] && (task.measures[key].without.median || task.measures[key].with.median)))) continue;
  lines.push(`## ${label}`, '', `| Task | ${report.rounds.map(round => round.label).join(' | ')} |`, `| --- | ${report.rounds.map(() => '---').join(' | ')} |`);
  for (const task of taskNames) {
    const cells = report.rounds.map(round => {
      const m = round.tasks[task]?.measures[key];
      if (!m || (!m.without.median && !m.with.median)) return '—';
      return `${format(m.without.median)} → ${format(m.with.median)}${m.percent == null ? (m.shown ? '*' : '') : ` (${signed(m.percent)}${m.shown ? '*' : ''})`}`;
    });
    if (cells.some(cell => cell !== '—')) lines.push(`| ${task} | ${cells.join(' | ')} |`);
  }
  lines.push('');
}

lines.push('## What is shown', '');
if (!report.shown.length) lines.push('Nothing: no difference stands clear of the runs\' spread.', '');
for (const task of taskNames) {
  const found = report.shown.filter(item => item.task === task);
  if (!found.length) continue;
  lines.push(`- **${task}**: ${found.map(item => `${item.measure.toLowerCase()} ${signed(item.percent)} (${item.label})`).join('; ')}.`);
}
lines.push('');

lines.push('## The checks', '');
for (const task of taskNames) {
  const names = [...new Set(report.rounds.flatMap(round => Object.keys(round.tasks[task]?.checks ?? {})))];
  if (!names.length) continue;
  lines.push(`### ${task}`, '', `| Check (runs that pass) | ${report.rounds.map(round => round.label).join(' | ')} |`, `| --- | ${report.rounds.map(() => '---').join(' | ')} |`);
  for (const name of names) {
    lines.push(`| ${name}${OWN_RULES.includes(name) ? " (design-fence's own rule)" : ''} | ${report.rounds.map(round => { const c = round.tasks[task]?.checks[name]; return c ? `${c.without.passed} of ${c.without.of} → ${c.with.passed} of ${c.with.of}` : '—'; }).join(' | ')} |`);
  }
  lines.push(`| Runs counted | ${report.rounds.map(round => (round.tasks[task] ? `${round.tasks[task].runs.without}, ${round.tasks[task].runs.with}` : '—')).join(' | ')} |`, '');
}

lines.push('## To run it again', '', '```sh', 'node bench/run.mjs setup', 'node bench/run.mjs all --agent <claude|codex> --model <model> --runs 5 --arms without,next --tasks all --key <your Figma file\'s key> --round <name>', `node bench/report.mjs ${rounds.map(dir => path.relative(process.cwd(), path.resolve(dir))).join(' ')}`, '```', '', 'The tasks, the fixture and what each check reads: `bench/README.md`. Prices are list prices (`bench/prices.json`).', '');

fs.writeFileSync(`${out}.md`, lines.join('\n'));
fs.writeFileSync(`${out}.json`, JSON.stringify(report, null, 1));
console.log(lines.join('\n'));
