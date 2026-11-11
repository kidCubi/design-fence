// The issue's own test, kept out of the copy: run against the run's tools/outline.mjs (OUTLINE).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';

const {outline} = await import(pathToFileURL(process.env.OUTLINE));

test('a marker is not part of the title or the anchor', () => {
  const sections = outline('## One source for every decision _(new)_\n\n## How it works _(changed)_\n\n## Plain\n');
  assert.deepEqual(sections, [
    {title: 'One source for every decision', anchor: 'one-source-for-every-decision'},
    {title: 'How it works', anchor: 'how-it-works'},
    {title: 'Plain', anchor: 'plain'},
  ]);
});

test('a heading that only looks like it keeps its words', () => {
  assert.deepEqual(outline('## What is new\n'), [{title: 'What is new', anchor: 'what-is-new'}]);
});
