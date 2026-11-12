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
  'component.md': 6900, // 6400 until two rules became checks: the design's tokens against the code's, and how stories are named
  'flows.md': 2200,
  'figma.md': 9200, // 8100 until the Plugin API's four most common faults were named: one to two scripts a run failed on them, on every model
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
  // design, component and flows read figma.md: their ceilings follow its own (1100 more).
  const ceilings = {design: 19500, ship: 5600, reflect: 7100, component: 16100, flows: 21700};
  for (const [way, files] of Object.entries(upFront)) {
    const total = files.reduce((sum, name) => sum + size(name), 0);
    assert.ok(total <= ceilings[way], `${way}: ${total} bytes, ceiling ${ceilings[way]}`);
  }
  const fixture = path.join(HOME, 'bench/fixture');
  const config = JSON.parse(fs.readFileSync(path.join(fixture, '.agents/validate.json'), 'utf8'));
  assert.ok(routeText(route(fixture, 'Add a disabled state to the Button and the Link, with new tokens', config)).length <= 1200);
});
