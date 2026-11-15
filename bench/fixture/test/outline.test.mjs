import assert from 'node:assert/strict';
import {test} from 'node:test';

import {anchor, outline} from '../tools/outline.mjs';

test('an anchor is the heading in lower case, hyphenated', () => {
  assert.equal(anchor('How it works'), 'how-it-works');
  assert.equal(anchor('Any agent, any model'), 'any-agent-any-model');
});

test('the outline lists second-level headings in order', () => {
  const sections = outline('# Title\n\n## Top bar\n\ntext\n\n### Not this\n\n## Creative freedom\n');
  assert.deepEqual(sections, [
    {title: 'Top bar', anchor: 'top-bar'},
    {title: 'Creative freedom', anchor: 'creative-freedom'},
  ]);
});
