/**
 * The router (`lib/route.mjs`) against the labelled requests of
 * `bench/routing.jsonl`, on the measure's fixture and three variants of it:
 * the way and the mode of each, and the share it gets right.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {route, routeText} from '../lib/route.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FIXTURE = path.join(HOME, 'bench/fixture');
const config = root => JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8'));

/** The fixture, and what it would be with the design module off, or with nothing listed yet (new, or existing). */
function projects() {
  const copy = change => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-route-')));
    fs.cpSync(FIXTURE, root, {recursive: true, filter: file => !file.includes('node_modules')});
    change(root);
    return root;
  };
  const empty = root => {
    fs.rmSync(path.join(root, 'design/components'), {recursive: true});
    const index = path.join(root, 'design/index.md');
    fs.writeFileSync(index, fs.readFileSync(index, 'utf8').split('## Components')[0]);
  };
  return {
    fixture: FIXTURE,
    'no-design': copy(root => {
      const file = path.join(root, '.agents/validate.json');
      const {design, ...rest} = config(root);
      fs.writeFileSync(file, JSON.stringify(rest));
    }),
    'empty-existing': copy(empty),
    'empty-new': copy(root => {
      empty(root);
      fs.rmSync(path.join(root, 'src/components'), {recursive: true});
      const agents = path.join(root, 'AGENTS.md');
      fs.writeFileSync(agents, fs.readFileSync(agents, 'utf8').replace(/^- Figma:.*$/m, ''));
    }),
  };
}

/**
 * A labelled set through the router: `{right, sureWrong, unsure, of}`. A route it is sure of and gets wrong is the
 * costly one (the agent starts in the wrong file, told to); one it says it is unsure of names both ways.
 */
function score(file) {
  const roots = projects();
  const rows = fs.readFileSync(path.join(HOME, 'bench', file), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
  const tally = {right: 0, sureWrong: 0, unsure: 0, of: rows.length};
  const lines = [];
  for (const row of rows) {
    const got = route(roots[row.project], row.request, config(roots[row.project]));
    const right = got.way === row.way && (!row.mode || got.mode === row.mode);
    if (right) tally.right++;
    if (!got.sure) tally.unsure++;
    if (!right) {
      if (got.sure) tally.sureWrong++;
      lines.push(`${got.sure ? 'SURE  ' : 'unsure'} "${row.request.slice(0, 70)}" → ${got.way}${got.mode ? `/${got.mode}` : ''}, expected ${row.way}${row.mode ? `/${row.mode}` : ''}`);
    }
  }
  console.log(`${file}: right ${tally.right} of ${tally.of} (${((tally.right / tally.of) * 100).toFixed(1)}%), sure and wrong ${tally.sureWrong}, unsure ${tally.unsure}${lines.length ? `\n  ${lines.join('\n  ')}` : ''}`);
  return tally;
}

// The bars. Right: the way and the mode. Sure and wrong: 3% at most. The third set was written after the rules
// were last changed and they were not changed for it: its numbers are the ones to quote.
for (const [file, bar] of [['routing.jsonl', 0.95], ['routing-holdout.jsonl', 0.9], ['routing-final.jsonl', 0.85]]) {
  test(`the router on bench/${file}: ${bar * 100}% right or more, 3% at most sure and wrong`, () => {
    const {right, sureWrong, of} = score(file);
    assert.ok(right / of >= bar, `${right} of ${of} right`);
    assert.ok(sureWrong / of <= 0.03, `${sureWrong} sure and wrong`);
  });
}

test("the route names the project's own files for the request, in a few lines", () => {
  const got = route(FIXTURE, 'Add a small "Beta" label next to the wordmark in the top bar.', config(FIXTURE));
  assert.equal(got.way, 'design');
  assert.deepEqual(got.read, ['design/index.md', 'design/components/top-bar.md', 'src/components/top-bar/']);
  const text = routeText(got);
  assert.match(text, /Read \.agents\/design-fence\/playbooks\/design\.md before the first step/);
  assert.ok(text.length < 1200, `${text.length} characters`);
  const build = route(FIXTURE, 'Build the Command component in Storybook', config(FIXTURE));
  assert.equal(build.way, 'component');
  assert.deepEqual(build.read, ['design/index.md', 'design/components/command.md']);
  assert.equal(routeText(route(FIXTURE, 'thanks', config(FIXTURE))), '');
  const tokens = route(FIXTURE, 'Change the link hover colour', config(FIXTURE));
  assert.ok(tokens.read.includes('src/tokens.css'));
});
