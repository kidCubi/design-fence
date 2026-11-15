/**
 * The design module's check (`lib/design-check.mjs`) on the measure's
 * fixture: it holds as it is, and each kind of drift seeded into a copy is
 * named. And the reader of `flows.yml` (`lib/yaml.mjs`).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {boundAgainstCode, checkDesign, cssName, fnv1a, indexRows, lockFile, rawValuesIn} from '../lib/design-check.mjs';
import {parseYaml} from '../lib/yaml.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FIXTURE = path.join(HOME, 'bench/fixture');

/** A copy of the fixture with `change` made to it, checked: `{problems, warnings, notes, root}`. */
function drift(change = () => {}, design = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-design-')));
  fs.cpSync(FIXTURE, root, {recursive: true, filter: file => !file.includes('node_modules')});
  const edit = (file, from, to) => {
    const full = path.join(root, file);
    const text = fs.readFileSync(full, 'utf8');
    assert.ok(typeof from !== 'string' || text.includes(from), `${file} has "${from}"`);
    fs.writeFileSync(full, text.replace(from, to));
  };
  change({root, edit});
  const config = {...JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8')).design, ...design};
  return {...checkDesign(root, config), root};
}
const one = (result, pattern) => {
  assert.equal(result.problems.length, 1, result.problems.join('\n'));
  assert.match(result.problems[0], pattern);
};

test('the fixture holds, and says what it could not check', () => {
  const {problems, warnings, notes} = drift();
  assert.deepEqual(problems, []);
  assert.deepEqual(warnings, []);
  assert.match(notes.join('; '), /5 spec\(s\).*stories NOT checked.*tokens file is not held yet/);
});

test('a value written raw in a built component is refused; in one adopted as it is, said', () => {
  const css = 'src/components/link/link.css';
  one(drift(({edit}) => edit(css, /$/, '\n.x {\n  color: #ff5a36;\n}\n')), /link\.css:\d+: #ff5a36 is written raw\.$/);
  one(drift(({edit}) => edit(css, /$/, '\n.x {\n  gap: 24px;\n}\n')), /24px is written raw \(a token holds this value: --space-6\)/);
  one(drift(({edit}) => edit(css, /$/, '\n.x {\n  color: var(--mono-40);\n}\n')), /--mono-40 is not for components/);
  const excused = drift(({edit}) => edit(css, /$/, '\n.x {\n  /* design-fence: raw, the logo is this wide */\n  width: 40px;\n}\n'));
  assert.deepEqual(excused.problems, []);
  const adopted = drift(({edit}) => {
    edit(css, /$/, '\n.x {\n  gap: 24px;\n}\n');
    edit('design/components/link.md', 'status: built', 'status: as-is');
    edit('design/index.md', '| Link | built |', '| Link | as-is |');
  });
  assert.deepEqual(adopted.problems, []);
  assert.match(adopted.warnings[0], /24px is written raw/);
  assert.equal(drift(({edit}) => {
    edit(css, /$/, '\n.x {\n  gap: 24px;\n}\n');
    edit('design/components/link.md', 'status: built', 'status: as-is');
    edit('design/index.md', '| Link | built |', '| Link | as-is |');
  }, {strict: true}).problems.length, 1, 'strict: refused');
  assert.deepEqual(rawValuesIn(['@media (max-width: 767px) {', '  margin: 0 auto;', '  inset: 0px;', '  transition: color calc(var(--d) * 1ms);']), []);
});

test('the index says what the specs say', () => {
  one(drift(({edit}) => edit('design/index.md', '| Button | built |', '| Button | approved |')), /index\.md: Button's status is "approved", its spec .* says "built"/);
  one(drift(({edit}) => edit('design/index.md', '| 2:184 |', '| 9:999 |')), /Link's Figma node is "9:999"/);
  one(drift(({root}) => fs.writeFileSync(path.join(root, 'design/components/badge.md'), "---\nname: Badge\nstatus: draft\n---\n")), /no row for design\/components\/badge\.md/);
  one(drift(({root}) => fs.rmSync(path.join(root, 'design/components/link.md'))), /Link's spec, components\/link\.md, is not there/);
  assert.equal(indexRows(fs.readFileSync(path.join(FIXTURE, 'design/index.md'), 'utf8')).length, 5);
});

test('flows.yml holds together', () => {
  one(drift(({edit}) => edit('design/flows.yml', 'components: [Top bar, Link, Section]', 'components: [Top bar, Link, Carousel]')), /view landing shows Carousel, which the index does not list/);
  one(drift(({edit}) => edit('design/flows.yml', '    from: landing', '    from: pricing')), /action read-process starts from pricing, which is not a view/);
  one(drift(({edit}) => edit('design/flows.yml', 'steps: [read-process]', 'steps: [read-process, sign-up]')), /flow read-the-process has the step sign-up, which is not an action/);
  one(drift(({edit}) => edit('design/flows.yml', /$/, '  - id: read-the-process\n    goal: again\n    steps: [read-process]\n')), /two flows are named read-the-process/);
  one(drift(({edit}) => edit('design/flows.yml', '    route: /\n', '')), /view landing has no route/);
  one(drift(({edit}) => edit('design/flows.yml', 'flows:', 'flows:\n  nested: {a: 1}')), /line \d+: not in the shape flows\.yml takes/);
  const chain = '  - id: a\n    from: one\n    trigger: t\n    to: two\n  - id: b\n    from: one\n    trigger: t\n    to: one\n';
  const {data} = parseYaml(`views:\n  - id: one\n    route: /\n    purpose: >-\n      Folded\n      text.\n  - id: two\n    modal: one\nactions:\n${chain}flows:\n  - id: f\n    steps: [a, b]\n`);
  assert.equal(data.views[0].purpose, 'Folded text.');
  assert.deepEqual(data.flows[0].steps, ['a', 'b']);
});

test('the tokens file is held to what the export wrote', () => {
  const lock = ({root}) => fs.writeFileSync(path.join(root, lockFile({dir: 'design'})), JSON.stringify({file: 'src/tokens.css', hash: fnv1a(fs.readFileSync(path.join(root, 'src/tokens.css'), 'utf8'))}));
  assert.deepEqual(drift(lock).problems, []);
  one(drift(context => {
    lock(context);
    context.edit('src/tokens.css', '--mono-40: #6d6b67;', '--mono-40: #777777;');
  }), /src\/tokens\.css: changed since the tokens export wrote it/);
});

test("Storybook's index: a library story without a spec is said, then refused; an index older than its stories is refused", () => {
  const index = (root, entries) => {
    fs.mkdirSync(path.join(root, 'storybook-static'), {recursive: true});
    fs.writeFileSync(path.join(root, 'storybook-static/index.json'), JSON.stringify({v: 5, entries}));
  };
  // The fixture's own stories, by the names Storybook gives them.
  const stories = (title, folder, names) => Object.fromEntries(names.map(name => [`${folder}--${name}`, {type: 'story', title, name, importPath: `./src/components/${folder}/${folder}.stories.js`}]));
  const story = (title, folder) => Object.values(stories(title, folder, ['Default']))[0];
  const all = {
    ...stories('Components/Link', 'link', ['Default', 'Focus']),
    ...stories('Components/Button', 'button', ['Default', 'Focus', 'After its action', 'Secondary', 'Secondary Focus']),
    ...stories('Components/Section', 'section', ['Default', 'Wide', 'Tablet', 'Mobile', 'Statement', 'Statement Mobile']),
    ...stories('Components/Top bar', 'top-bar', ['Default', 'Mobile']),
  };
  assert.deepEqual(drift(({root}) => index(root, all)).problems, []);
  // A story for each value its spec's properties list, by the value's name: the Button's Secondary gone, its Kind is not shown.
  const {'button--Secondary': gone, 'button--Secondary Focus': too, ...fewer} = all;
  one(drift(({root}) => index(root, fewer)), /button\.md: no story of "Components\/Button" shows Kind: Secondary \(a story whose name has "Secondary"\)/);
  const extra = drift(({root}) => index(root, {...all, e: story('Components/Carousel', 'carousel')}));
  assert.deepEqual(extra.problems, []);
  assert.match(extra.warnings[0], /"Components\/Carousel" .* has no spec/);
  one(drift(({root}) => index(root, {...all, e: story('Components/Carousel', 'carousel')}), {strict: true}), /Carousel/);
  one(drift(({root}) => {
    index(root, all);
    const old = new Date(Date.now() - 3600_000);
    fs.utimesSync(path.join(root, 'storybook-static/index.json'), old, old);
  }), /storybook-static\/index\.json is older than src\/components\/.*\.stories\.js/);
});

// The Button's design, as `design-fence figma bound --spec button --out` recorded it from the project's Figma file.
const BUTTON = ['font-size/body', 'font/family', 'font/weight-text', 'line-width/hairline', 'line/focus', 'line/frame', 'radius/none', 'space/3', 'space/6', 'surface/raised', 'text/default'];
const record = ({root}, tokens = BUTTON) => fs.writeFileSync(path.join(root, 'design/components/button.bound.json'), JSON.stringify({component: 'Button', figma: '2:193', tokens, instances: []}));

test("a component's code reads the tokens its design is bound to, and no other", () => {
  const css = 'src/components/button/button.css';
  assert.equal(cssName('Line Width/hairline'), '--line-width-hairline');
  // As it is: the code and the design agree (the fixture holds the five records, as the command wrote them from
  // the project's Figma file); a built component with no record is named, not refused.
  const fine = drift(record);
  assert.deepEqual([fine.problems, fine.warnings], [[], []]);
  assert.doesNotMatch(fine.notes.join('; '), /not held to their design/);
  const fewer = drift(({root}) => ['link', 'top-bar'].forEach(name => fs.rmSync(path.join(root, `design/components/${name}.bound.json`))));
  assert.deepEqual(fewer.problems, []);
  assert.match(fewer.notes.join('; '), /2 built component\(s\) not held to their design's tokens yet \(link, top-bar\)/);
  // A padding off its design: the token the code reads instead, and the one it no longer reads.
  const off = drift(change => (record(change), change.edit(css, /var\(--space-3\)/g, 'var(--space-4)')));
  assert.equal(off.problems.length, 2, off.problems.join('\n'));
  assert.match(off.problems[0], /button\.css:\d+: --space-4 is not in Button's design in Figma \(design\/components\/button\.bound\.json\)/);
  assert.match(off.problems[1], /button\.bound\.json: Button's design in Figma is bound to space\/3, and its code does not read --space-3 \(src\/components\/button\/button\.css\)/);
  // A token the design does not have: refused; said to be the code's alone, allowed; of a group no design binds
  // (a duration), not held; a property of the component's own, or a token named in a comment, not seen.
  one(drift(change => (record(change), change.edit(css, /$/, '\n.hint {\n  color: var(--text-muted);\n}\n'))), /button\.css:\d+: --text-muted is not in Button's design/);
  const allowed = '\n.hint {\n  /* design-fence: not in Figma. A hint only the code shows. */\n  color: var(--text-muted);\n  transition: color calc(var(--duration-fast) * 1ms);\n  width: var(--own);\n  /* once var(--line-raster) */\n}\n';
  assert.deepEqual(drift(change => (record(change), change.edit(css, /$/, allowed))).problems, []);
  // The design gained a token the code does not read yet.
  one(drift(change => record(change, [...BUTTON, 'space/12'])), /bound to space\/12, and its code does not read --space-12/);
  // A record that is not one.
  one(drift(({root}) => fs.writeFileSync(path.join(root, 'design/components/button.bound.json'), '{"tokens": "all"}')), /button\.bound\.json: not a record of design-fence figma bound/);
});

test('an approved component not built yet is not held; being built, it is said, then refused when strict', () => {
  // The Command: approved, its design recorded, not built in the fixture.
  const command = ({root}) => fs.writeFileSync(path.join(root, 'design/components/command.bound.json'), JSON.stringify({tokens: ['space/4', 'text/muted']}));
  assert.deepEqual(drift(command).problems, []);
  const half = change => {
    command(change);
    fs.mkdirSync(path.join(change.root, 'src/components/command'));
    fs.writeFileSync(path.join(change.root, 'src/components/command/command.css'), ':host {\n  padding: var(--space-4);\n}\n');
  };
  assert.deepEqual(drift(half).problems, []);
  assert.match(drift(half).warnings.join('\n'), /Command's design in Figma is bound to text\/muted, and its code does not read --text-muted/);
  one(drift(half, {strict: true}), /does not read --text-muted/);
  const {missing, extra, files} = boundAgainstCode(drift(half).root, {library: './src/components/', tokens: {file: 'src/tokens.css'}}, {name: 'Command', file: 'design/components/command.md'}, ['space/4', 'text/muted']);
  assert.deepEqual([files, missing, extra], [['src/components/command/command.css'], [{token: 'text/muted', name: '--text-muted'}], []]);
});
