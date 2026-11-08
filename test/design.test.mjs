/**
 * The design module's repo-side checks (lib/specs.mjs, `design-fence hash`)
 * and the tokens export (figma/tokens.js, with a stand-in for the plugin
 * API's `figma` global).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {fnv1a} from '../bin/design-fence.mjs';
import {checkSpecs, frontMatter, readSpecs, readStories} from '../lib/specs.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('front matter: values, quotes and comments', () => {
  const text = '---\nname: Text area\nstatus: built    # draft | approved\nfigma: "1083:7109"\nstory: \'\'\n---\n# Text area\n';
  assert.deepEqual(frontMatter(text), {name: 'Text area', status: 'built', figma: '1083:7109', story: ''});
  assert.deepEqual(frontMatter('# No front matter\n'), {});
});

const approved = {figma: '1:2', figma_version: '99', approved_by: 'Yassine'};

test('a spec says what its status needs', () => {
  const problems = checkSpecs(
    [
      {file: 'a.md', status: 'drafted'},
      {file: 'b.md', status: 'draft'},
      {file: 'c.md', status: 'approved', figma: '1:2'},
      {file: 'd.md', status: 'built', ...approved},
      {file: 'e.md', status: 'built', ...approved, story: 'Components/Button'},
    ],
    null,
  );
  assert.deepEqual(problems, [
    'a.md: status "drafted" is none of draft, approved, built, as-is.',
    'c.md: approved, but no figma_version.',
    'c.md: approved, but no approved_by.',
    'd.md: built, but no story (its Storybook title).',
  ]);
});

test("with Storybook's index: a built spec has its stories, and the library's stories have specs", () => {
  const stories = [
    {title: 'Components/Button', importPath: './src/components/Button.stories.js'},
    {title: 'Components/Button', importPath: './src/components/Button.stories.js'},
    {title: 'Components/Chip', importPath: './src/components/Chip.stories.js'},
    {title: 'Pages/Home', importPath: './src/pages/Home.stories.js'},
  ];
  const specs = [
    {file: 'button.md', status: 'built', ...approved, story: 'Components/Button'},
    {file: 'field.md', status: 'built', ...approved, story: 'Components/Field'},
  ];
  assert.deepEqual(checkSpecs(specs, stories, {library: './src/components/'}), [
    'field.md: no story titled "Components/Field" in Storybook\'s index.',
    'Storybook: "Components/Chip" (./src/components/) has no spec.',
  ]);
});

test('specs and stories are read from the repo; a missing index is null', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-specs-'));
  fs.mkdirSync(path.join(root, 'ui/components'), {recursive: true});
  fs.writeFileSync(path.join(root, 'ui/components/button.md'), '---\nstatus: draft\n---\n');
  fs.writeFileSync(path.join(root, 'ui/components/_template.md'), '---\nstatus: nonsense\n---\n');
  fs.writeFileSync(
    path.join(root, 'index.json'),
    JSON.stringify({v: 5, entries: {a: {type: 'story', title: 'T', importPath: './x'}, b: {type: 'docs', title: 'T'}}}),
  );
  assert.deepEqual(readSpecs(root, {dir: 'ui'}), [{file: 'ui/components/button.md', status: 'draft'}]);
  assert.deepEqual(readStories(root, {storybookIndex: 'index.json'}), [{title: 'T', importPath: './x'}]);
  assert.equal(readStories(root, {storybookIndex: 'missing.json'}), null);
  assert.equal(readStories(root, {}), null);
});

test('fnv1a is FNV-1a over UTF-8', () => {
  assert.equal(fnv1a(''), '811c9dc5');
  assert.equal(fnv1a('a'), 'e40c292c');
  assert.equal(fnv1a('foobar'), 'bf9cf968');
});

/** figma/tokens.js on two collections: colours with an alias and two modes, sizes. */
async function exported(options) {
  const tokens = new Function(`${fs.readFileSync(path.join(HOME, 'figma/tokens.js'), 'utf8')}\nreturn tokens;`)();
  const v = (id, name, resolvedType, valuesByMode, scopes = []) => ({id, name, resolvedType, valuesByMode, scopes});
  const variables = [
    v('c1', 'surface/raised', 'COLOR', {light: {r: 1, g: 1, b: 1, a: 1}, dark: {r: 0.165, g: 0.165, b: 0.18, a: 1}}),
    v('c2', 'border/strong', 'COLOR', {light: {type: 'VARIABLE_ALIAS', id: 'c1'}, dark: {r: 0.227, g: 0.227, b: 0.251, a: 0.5}}),
    v('s1', 'space/2', 'FLOAT', {one: 4}, ['GAP']),
    v('s2', 'font/weight-regular', 'FLOAT', {one: 400}, ['FONT_WEIGHT']),
  ];
  globalThis.figma = {
    variables: {
      getLocalVariablesAsync: async () => variables,
      getLocalVariableCollectionsAsync: async () => [
        {variableIds: ['c1', 'c2'], modes: [{modeId: 'light', name: 'Light'}, {modeId: 'dark', name: 'Dark'}]},
        {variableIds: ['s1', 's2'], modes: [{modeId: 'one', name: 'Mode 1'}]},
      ],
    },
  };
  return tokens(options);
}

test('tokens as W3C design tokens: groups, aliases, dimensions, the other modes', async () => {
  const result = await exported({format: 'dtcg'});
  assert.equal(result.count, 4);
  assert.deepEqual(result.collisions, []);
  assert.deepEqual(JSON.parse(result.text), {
    surface: {
      raised: {$type: 'color', $value: '#ffffff', $extensions: {'figma.modes': {Light: '#ffffff', Dark: '#2a2a2e'}}},
    },
    border: {
      strong: {$type: 'color', $value: '{surface.raised}', $extensions: {'figma.modes': {Light: '{surface.raised}', Dark: '#3a3a4080'}}},
    },
    space: {2: {$type: 'dimension', $value: '4px'}},
    font: {'weight-regular': {$type: 'number', $value: 400}},
  });
  assert.equal(result.hash, fnv1a(result.text));
});

test('tokens as CSS custom properties, and the hash alone', async () => {
  const css = await exported({format: 'css'});
  assert.equal(
    css.text,
    ':root {\n  --surface-raised: #ffffff;\n  --border-strong: var(--surface-raised);\n  --space-2: 4px;\n  --font-weight-regular: 400;\n}\n\n' +
      '[data-mode="Dark"] {\n  --surface-raised: #2a2a2e;\n  --border-strong: #3a3a4080;\n}\n',
  );
  const only = await exported({format: 'css', hashOnly: true});
  assert.equal(only.text, undefined);
  assert.equal(only.hash, fnv1a(css.text));
});
