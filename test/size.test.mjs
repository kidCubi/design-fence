/**
 * What an agent is made to read has a ceiling, in bytes (about four to a
 * token): the block every session loads, each playbook, and what a kind of
 * request reads before its first step. A change that goes over fails here
 * until the ceiling is raised on purpose, with the reason in the commit.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {agentsBlock} from '../install.mjs';
import {route, routeText} from '../lib/route.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const size = name => fs.statSync(path.join(HOME, 'playbooks', name)).size;

const PLAYBOOKS = {
  'start.md': 1600,
  'foundation.md': 2000,
  'adopt.md': 2900,
  'design.md': 10300,
  'component.md': 6400,
  'flows.md': 2200,
  'figma.md': 8100,
  'figma-more.md': 2400,
  'ship.md': 5600,
  'ship-more.md': 3100,
  'reflect.md': 7100,
};

test('each playbook stays under its ceiling, and every playbook has one', () => {
  assert.deepEqual(fs.readdirSync(path.join(HOME, 'playbooks')).sort(), Object.keys(PLAYBOOKS).sort());
  for (const [name, ceiling] of Object.entries(PLAYBOOKS)) {
    assert.ok(size(name) <= ceiling, `${name}: ${size(name)} bytes, ceiling ${ceiling}`);
  }
});

test('what every session loads: the block of AGENTS.md', () => {
  assert.ok(agentsBlock('.agents/design-fence', true).length <= 3200, `${agentsBlock('.agents/design-fence', true).length} bytes`);
  assert.ok(agentsBlock('.agents/design-fence', false).length <= 2700);
});

test('what a request reads before its first step', () => {
  const upFront = {design: ['design.md', 'figma.md'], ship: ['ship.md'], reflect: ['reflect.md'], component: ['component.md', 'figma.md'], flows: ['flows.md', 'design.md', 'figma.md']};
  const ceilings = {design: 18400, ship: 5600, reflect: 7100, component: 14500, flows: 20600};
  for (const [way, files] of Object.entries(upFront)) {
    const total = files.reduce((sum, name) => sum + size(name), 0);
    assert.ok(total <= ceilings[way], `${way}: ${total} bytes, ceiling ${ceilings[way]}`);
  }
  const fixture = path.join(HOME, 'bench/fixture');
  const config = JSON.parse(fs.readFileSync(path.join(fixture, '.agents/validate.json'), 'utf8'));
  assert.ok(routeText(route(fixture, 'Add a disabled state to the Button and the Link, with new tokens', config)).length <= 1200);
});
