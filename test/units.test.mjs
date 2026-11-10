import assert from 'node:assert/strict';
import {test} from 'node:test';

import {parseStatus} from '../lib/git.mjs';
import {globToRegExp, matchesAny} from '../lib/glob.mjs';
import {findNode, majorOf} from '../lib/node.mjs';
import {needingReview, reflectVerdict} from '../lib/reflect.mjs';
import {claudeNext, withBlock} from '../install.mjs';
import {section} from '../lib/markdown.mjs';

test('** spans directories, * and ? stay within a name', () => {
  const glob = globToRegExp('viewer/**/*.js');
  assert.ok(glob.test('viewer/a.js'));
  assert.ok(glob.test('viewer/src/control/Button.js'));
  assert.ok(!glob.test('viewer/src/Button.css'));
  assert.ok(!glob.test('backend/a.js'));
  assert.ok(globToRegExp('viewer/**').test('viewer/styles/tree.css'));
  assert.ok(globToRegExp('a/?.js').test('a/b.js'));
  assert.ok(!globToRegExp('a/*.js').test('a/b/c.js'));
});

test('braces are alternatives, dots are literal', () => {
  const glob = globToRegExp('src/*.{js,css}');
  assert.ok(glob.test('src/a.js'));
  assert.ok(glob.test('src/a.css'));
  assert.ok(!glob.test('src/a.json'));
  assert.ok(!globToRegExp('a.js').test('abjs'));
});

test('matchesAny takes a pattern or a list', () => {
  assert.ok(matchesAny('backend/x.js', 'backend/**'));
  assert.ok(matchesAny('b/x.css', ['a/**', 'b/*.css']));
  assert.ok(!matchesAny('c/x.css', ['a/**', 'b/*.css']));
});

test('git status: modified, untracked, deleted and renamed paths', () => {
  const output = [' M viewer/a.js', '?? new file.txt', ' D old.js', 'R  b.js', 'a.js', ''].join('\0');
  assert.deepEqual(parseStatus(output), ['viewer/a.js', 'new file.txt', 'old.js', 'b.js']);
});

test('the major version of a Node version string', () => {
  assert.equal(majorOf('v22.21.1'), 22);
  assert.equal(majorOf('24.5.0\n'), 24);
  assert.equal(majorOf('nonsense'), 0);
});

test('findNode takes the running Node when it is recent enough, else none', () => {
  assert.equal(findNode(1, [process.execPath]).executable, process.execPath);
  assert.equal(findNode(999, [process.execPath, '/no/such/node']), null);
  assert.equal(findNode(undefined, [process.execPath]).version, process.version);
});

test('by default every file but prose needs the review', () => {
  const files = ['README.md', 'doc/a.md', 'notes.txt', 'src/a.js', 'package.json', '.agents/x'];
  assert.deepEqual(needingReview(files, null), ['src/a.js', 'package.json', '.agents/x']);
  assert.deepEqual(needingReview(files, {checks: []}), ['src/a.js', 'package.json', '.agents/x']);
});

test("the project's reflect.when replaces the default", () => {
  const config = {reflect: {when: ['src/**', 'doc/**']}};
  assert.deepEqual(needingReview(['README.md', 'doc/a.md', 'src/a.js', 'x.js'], config), [
    'doc/a.md',
    'src/a.js',
  ]);
});

test('the verdict of a Reflect line, on a line of its own', () => {
  const message = 'feat: a thing (#3)\n\nWhy it changed.\n\nReflect: holds the bar; one magic number named\nCo-Authored-By: X\n';
  assert.equal(reflectVerdict(message), 'holds the bar; one magic number named');
  assert.equal(reflectVerdict('fix: x\n\nReflect:   spaced out  \n'), 'spaced out');
  assert.equal(reflectVerdict('fix: x\n\nReflect:\n'), '');
  assert.equal(reflectVerdict('fix: x\n\nReflect:    \n'), '');
  assert.equal(reflectVerdict('fix: x\n\nWe Reflect: later\n'), '');
  assert.equal(reflectVerdict('fix: x\n\n# Reflect: in a comment\n'), '');
  assert.equal(reflectVerdict('fix: x'), '');
});

test("CLAUDE.md gains @AGENTS.md and loses design-fence's PROCESS.md import; none stays none", () => {
  assert.equal(claudeNext('', 'x'), '');
  const old =
    "<!-- Claude Code reads CLAUDE.md; the rules live in AGENTS.md (read by every agent) and in design-fence's process. -->\n" +
    '@AGENTS.md\n@.agents/design-fence/PROCESS.md\n';
  assert.equal(claudeNext(old, '.agents/design-fence'), '@AGENTS.md\n');
  const text = claudeNext('# Notes\n', 'tools/df');
  assert.equal(text, '# Notes\n\n@AGENTS.md\n');
  assert.equal(claudeNext(text, 'tools/df'), text);
  assert.equal(claudeNext('@AGENTS.md\n@tools/df/PROCESS.md\n# Ours\n', 'tools/df'), '@AGENTS.md\n# Ours\n');
});

test("AGENTS.md: design-fence's block between its markers, added once, then replaced", () => {
  const block = body => `<!-- design-fence: [^\\n]*-->\\n\\n${body}\\n\\n<!-- /design-fence -->`;
  const added = withBlock('# P\n\nIntro\nmore.\n\n## Commands\n', 'B1');
  assert.match(added, new RegExp(`^# P\\n\\nIntro\\nmore\\.\\n\\n${block('B1')}\\n\\n## Commands\\n$`));
  const replaced = withBlock(added, 'B2');
  assert.equal(replaced, added.replace('B1', 'B2'));
  assert.equal(withBlock(replaced, 'B2'), replaced);
  assert.match(withBlock('<!-- design-fence -->\n<!-- /design-fence -->\n## X\n', 'B'), new RegExp(`^${block('B')}\\n## X\\n$`));
  assert.match(withBlock('# P\n\nIntro', 'B'), new RegExp(`^# P\\n\\nIntro\\n\\n${block('B')}\\n$`));
  assert.match(withBlock('no title\n', 'B'), new RegExp(`^${block('B')}\\n\\nno title\\n$`));
});

test('a Markdown section, up to the next one', () => {
  const text = '# T\n## One\na\n## Two non-negotiables\nb\nc\n## Three\nd';
  assert.equal(section(text, 'non-negotiables'), '## Two non-negotiables\nb\nc');
  assert.equal(section(text, 'Three'), '## Three\nd');
  assert.equal(section(text, 'Four'), '');
});
