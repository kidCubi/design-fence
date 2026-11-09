/**
 * figma/lint-gaps.js on toy node trees, with a stand-in for the plugin API's
 * `figma` global.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lintGaps = new Function(`${fs.readFileSync(path.join(HOME, 'figma/lint-gaps.js'), 'utf8')}\nreturn lintGaps;`)();

/** Runs lintGaps on `root` (its nodes linked to their parents), returning the rules found, in order. */
async function rules(root, spec) {
  const link = node => (node.children ?? []).forEach(child => link(Object.assign(child, {parent: node})));
  link(root);
  globalThis.figma = {getNodeByIdAsync: async id => (id === root.id ? root : null)};
  const result = await lintGaps(root.id, spec);
  return result.findings.map(f => [f.rule, f.prop ?? f.property ?? f.name]);
}

const frame = (props = {}) => ({id: '1:1', name: 'Card', type: 'FRAME', children: [], ...props});

test('an unbound padding, gap, radius or stroke is found; a bound or zero one is not', async () => {
  const node = frame({
    layoutMode: 'VERTICAL',
    paddingLeft: 16,
    paddingTop: 16,
    itemSpacing: 0,
    topLeftRadius: 8,
    strokes: [{}],
    strokeWeight: 1,
    boundVariables: {paddingTop: {id: 'v'}},
  });
  assert.deepEqual(await rules(node), [
    ['unbound-spacing', 'paddingLeft'],
    ['unbound-radius', 'topLeftRadius'],
    ['unbound-stroke', 'Card'],
  ]);
});

test('four equal unbound corners are one finding', async () => {
  const corners = {topLeftRadius: 4, topRightRadius: 4, bottomLeftRadius: 4, bottomRightRadius: 4};
  assert.deepEqual(await rules(frame({cornerRadius: 4, ...corners})), [['unbound-radius', 'cornerRadius']]);
});

test('spacing counts only with auto-layout, and the wrap gap only when it wraps', async () => {
  assert.deepEqual(await rules(frame({layoutMode: 'NONE', paddingLeft: 16})), []);
  assert.deepEqual(await rules(frame({layoutMode: 'HORIZONTAL', layoutWrap: 'WRAP', counterAxisSpacing: 8})), [
    ['unbound-spacing', 'counterAxisSpacing'],
  ]);
});

test('instances, vectors and layers named with . or _ inside the node are left out', async () => {
  const bad = {topLeftRadius: 4};
  const node = frame({
    children: [
      {id: '2', name: 'Icon', type: 'INSTANCE', ...bad, children: [{id: '3', name: 'x', type: 'FRAME', ...bad}]},
      {id: '4', name: 'Shape', type: 'VECTOR', ...bad},
      {id: '5', name: '_logo', type: 'FRAME', ...bad},
      {id: '6', name: 'Body', type: 'FRAME', ...bad},
    ],
  });
  assert.deepEqual(await rules(node), [['unbound-radius', 'topLeftRadius']]);
});

test("a variant's set carries the description and the properties, checked against the spec", async () => {
  const set = {
    id: '1:0',
    name: 'Button',
    type: 'COMPONENT_SET',
    cornerRadius: 5,
    topLeftRadius: 5,
    topRightRadius: 5,
    bottomLeftRadius: 5,
    bottomRightRadius: 5,
    description: '',
    componentPropertyDefinitions: {Size: {}, 'Label#12:3': {}, Extra: {}},
    children: [{id: '1:1', name: 'Size=md', type: 'COMPONENT', description: 'ignored'}],
  };
  const variant = set.children[0];
  Object.assign(variant, {parent: set});
  globalThis.figma = {getNodeByIdAsync: async () => variant};
  const result = await lintGaps('1:1', {properties: ['Size', 'Label', 'State']});
  assert.deepEqual(
    result.findings.map(f => [f.rule, f.name, f.property]),
    [
      ['no-description', 'Button', undefined],
      ['property-not-in-spec', 'Button', 'Extra'],
      ['property-missing', 'Button', 'State'],
    ],
  );
});

test('a node that does not exist says so', async () => {
  globalThis.figma = {getNodeByIdAsync: async () => null};
  assert.deepEqual(await lintGaps('9:9'), {node: '9:9', error: 'not found'});
});

test("a default name on the component's own layers is found, not inside an instance", async () => {
  const node = frame({
    children: [
      {id: '2', name: 'Frame 12', type: 'FRAME'},
      {id: '3', name: 'Text', type: 'TEXT'},
      {id: '4', name: 'Content', type: 'TEXT'},
      {id: '5', name: 'Icon', type: 'INSTANCE', children: [{id: '6', name: 'Vector', type: 'VECTOR'}]},
    ],
  });
  assert.deepEqual(await rules(node), [
    ['default-name', 'Frame 12'],
    ['default-name', 'Text'],
  ]);
});

const GREY = {r: 0.16, g: 0.16, b: 0.18};
const LIGHT = {r: 0.23, g: 0.23, b: 0.25};
const fillOf = color => [{type: 'SOLID', color}];

test('a stroke or a line the colour of what is behind it is found, inside instances too', async () => {
  const node = frame({
    fills: fillOf(GREY),
    children: [
      {id: '2', name: 'Toolbar', type: 'FRAME', fills: [], strokes: fillOf(GREY), strokeWeight: 1},
      {id: '3', name: 'Visible', type: 'FRAME', fills: [], strokes: fillOf(LIGHT), strokeWeight: 1},
      {id: '4', name: 'Separator', type: 'INSTANCE', fills: [], children: [{id: '5', name: 'Rule', type: 'VECTOR', fills: fillOf(GREY)}]},
      {id: '6', name: 'Hidden', type: 'FRAME', visible: false, fills: [], strokes: fillOf(GREY), strokeWeight: 1},
    ],
  });
  assert.deepEqual(
    (await rules(node)).filter(([rule]) => rule.startsWith('invisible')),
    [
      ['invisible-stroke', 'Toolbar'],
      ['invisible-line', 'Rule'],
    ],
  );
});

test("a stroke is judged against the node's own fill when it has one", async () => {
  const node = frame({
    fills: fillOf(GREY),
    children: [{id: '2', name: 'Button', type: 'FRAME', fills: fillOf(LIGHT), strokes: fillOf(GREY), strokeWeight: 1}],
  });
  assert.deepEqual((await rules(node)).filter(([rule]) => rule.startsWith('invisible')), []);
});

test('sources lists local components, the library components in use once each, and the collections', async () => {
  const sources = new Function(`${fs.readFileSync(path.join(HOME, 'figma/sources.js'), 'utf8')}\nreturn sources;`)();
  const check = {id: 'r1', remote: true, name: 'Format=Outline', key: 'k1'};
  const caret = {id: 'r2', remote: true, name: 'Format=Fill', key: 'k2'};
  check.parent = caret.parent = {type: 'COMPONENT_SET', name: 'Check', key: 'set1'};
  const button = {id: 'l1', remote: false};
  const instances = [check, check, caret, button].map(main => ({getMainComponentAsync: async () => main}));
  const set = {type: 'COMPONENT_SET', name: 'Button'};
  const page = {
    findAllWithCriteria: ({types}) =>
      types.includes('INSTANCE') ? instances : [set, {type: 'COMPONENT', parent: set}, {type: 'COMPONENT', name: 'Avatar', parent: page}],
  };
  globalThis.figma = {
    loadAllPagesAsync: async () => {},
    root: {children: [page]},
    variables: {getLocalVariableCollectionsAsync: async () => [{name: 'Colors', variableIds: [1, 2]}]},
    teamLibrary: {getAvailableLibraryVariableCollectionsAsync: async () => [{libraryName: 'Icons', name: 'Sizes'}]},
  };
  assert.deepEqual(await sources(), {
    local: {sets: 1, components: 1, names: ['Avatar', 'Button']},
    remote: ['Check (set, 2 in use) set1'],
    variables: {local: ['Colors (2)'], libraries: ['Icons / Sizes']},
  });
});

test('a bound paint that shows another colour than its variable is found', async () => {
  const variables = {
    strong: {name: 'border/strong', resolveForConsumer: () => ({value: LIGHT})},
    focus: {name: 'border/focus', resolveForConsumer: () => ({value: LIGHT})},
  };
  const bound = (color, id) => [{type: 'SOLID', color, boundVariables: {color: {id}}}];
  const node = frame({
    children: [
      {id: '2', name: 'Box', type: 'FRAME', strokes: bound(LIGHT, 'strong'), strokeWeight: 1, boundVariables: {strokeWeight: {}}},
      {id: '3', name: 'Focus box', type: 'FRAME', strokes: bound({r: 0, g: 0, b: 0}, 'focus'), strokeWeight: 1, boundVariables: {strokeWeight: {}}},
    ],
  });
  const link = n => (n.children ?? []).forEach(c => link(Object.assign(c, {parent: n})));
  link(node);
  globalThis.figma = {
    getNodeByIdAsync: async id => (id === node.id ? node : null),
    variables: {getVariableByIdAsync: async id => variables[id]},
  };
  const result = await lintGaps(node.id);
  assert.deepEqual(result.findings, [
    {rule: 'stale-paint', id: '3', name: 'Focus box', prop: 'strokes', variable: 'border/focus', shows: '#000000', value: '#3b3b40'},
  ]);
});
