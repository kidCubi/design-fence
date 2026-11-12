/**
 * The design module's specs against Storybook, from the repo's files only
 * (`design-fence specs`; PROCESS.md, "The design module"):
 *
 * - each spec's status is one of draft, approved, built, as-is;
 * - an approved or built spec names its Figma node, the Figma version
 *   approved, and who approved it;
 * - a built spec names its Storybook title;
 * - with Storybook's index (`design.storybookIndex`, an `index.json` from a
 *   build or the dev server): a built or as-is spec's title has stories, and,
 *   when `design.library` says where the library's stories live, each of
 *   their titles has a spec;
 * - a built spec's stories show what its "Properties" table lists: for each
 *   property with a list of values (two or more, its default one of them), a
 *   story for each value but the default, named with that value ("Secondary",
 *   "Secondary focus"); for one that is on or off, with the property's own
 *   name ("Wide"). The defaults together are the first story's. Not asked: a
 *   pointer's states (hover, pressed, active), which a story cannot hold
 *   still, and a row that says "no story", with its reason. The convention is
 *   the one the project design-fence was drawn from already followed.
 *
 * validate.json:
 *
 *     "design": {"dir": "design", "storybookIndex": "storybook-static/index.json", "library": "./src/components/"}
 */

import fs from 'node:fs';
import path from 'node:path';

const STATUSES = ['draft', 'approved', 'built', 'as-is'];

/** The front matter of a Markdown text, as strings: `key: value  # comment` lines between `---` lines. */
export function frontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  const fields = {};
  for (const line of match ? match[1].split('\n') : []) {
    const field = /^([\w-]+):\s*(.*?)\s*(?:\s#.*)?$/.exec(line);
    if (field) {
      fields[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return fields;
}

/** A table's rows under a `## <heading>`, as cells; the first is the header. */
function table(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => new RegExp(`^##\\s+${heading}\\b`, 'i').test(line));
  if (start < 0) {
    return [];
  }
  const end = lines.findIndex((line, i) => i > start && /^##\s/.test(line));
  const rows = lines.slice(start + 1, end < 0 ? undefined : end).filter(line => line.trim().startsWith('|')).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  return rows.filter((row, i) => i !== 1);
}

/** States a pointer makes, which a story cannot hold still. */
const POINTER = ['hover', 'pressed', 'active'];
const SWITCHES = [['on', 'off'], ['true', 'false'], ['yes', 'no']];
const bare = cell => (cell ?? '').replace(/\(.*?\)/g, '').replace(/`/g, '').trim();

/**
 * What a spec's stories are to show, from its "Properties" table:
 * `[{property, value, phrase}]`, `phrase` being what a story's name must
 * have. A property counts when its Values list two or more and its Default
 * is one of them (so "text, one or more lines" is no list); the default
 * needs no story, nor a pointer's state, nor a row that says "no story".
 */
export function storiesToShow(text) {
  const [header, ...rows] = table(text, 'Properties');
  const column = name => (header ?? []).findIndex(cell => new RegExp(`^${name}$`, 'i').test(cell));
  const [property, values, fallback] = [column('Property'), column('Values'), column('Default')];
  if (property < 0 || values < 0 || fallback < 0) {
    return [];
  }
  const shows = [];
  for (const row of rows) {
    const listed = (row[values] ?? '').split(',').map(bare).filter(Boolean);
    const usual = bare(row[fallback]).toLowerCase();
    if (listed.length < 2 || !listed.some(value => value.toLowerCase() === usual) || row.some(cell => /\bno story\b/i.test(cell))) {
      continue;
    }
    const lower = listed.map(value => value.toLowerCase());
    const onOff = SWITCHES.some(pair => lower.length === 2 && pair.every(word => lower.includes(word)));
    for (const value of listed.filter(v => v.toLowerCase() !== usual && !POINTER.includes(v.toLowerCase()))) {
      shows.push({property: bare(row[property]), value, phrase: onOff ? bare(row[property]) : value});
    }
  }
  return shows;
}

/** Whether a story's name has `phrase` as whole words, whatever the case and the punctuation ("Copy, phone"). */
const words = text => ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
export const named = (name, phrase) => words(name ?? '').includes(words(phrase));

/** The specs of `design/components/`: `{file, name, status, figma, figma_version, approved_by, story, shows}`. */
export function readSpecs(root, design = {}) {
  const dir = path.join(root, design.dir ?? 'design', 'components');
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.md') && !name.startsWith('_'))
    .sort()
    .map(name => {
      const file = path.relative(root, path.join(dir, name)).split(path.sep).join('/');
      const text = fs.readFileSync(path.join(dir, name), 'utf8');
      return {file, ...frontMatter(text), shows: storiesToShow(text)};
    });
}

/**
 * The Figma properties a spec's "Properties" table names (its "Figma" column: the first name in backticks of each
 * row), for the lint to compare with the component's own (`figma/lint-gaps.js`).
 */
export function specProperties(text) {
  const [header, ...rows] = table(text, 'Properties');
  const column = (header ?? []).findIndex(cell => /^figma$/i.test(cell));
  if (column < 0) {
    return [];
  }
  return rows.map(row => /`([^`]+)`/.exec(row[column] ?? '')?.[1]).filter(Boolean);
}

/** The spec of a component, by its name or its file's: `readSpecs`' entry with its `properties`; null when none. */
export function findSpec(root, design, name) {
  const wanted = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const spec = readSpecs(root, design).find(s => [s.name, path.basename(s.file, '.md')].some(n => (n ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === wanted));
  return spec ? {...spec, properties: specProperties(fs.readFileSync(path.join(root, spec.file), 'utf8'))} : null;
}

/** The stories of Storybook's index.json, as `{title, name, importPath}`; null when there is no index. */
export function readStories(root, design = {}) {
  const file = design.storybookIndex && path.join(root, design.storybookIndex);
  if (!file || !fs.existsSync(file)) {
    return null;
  }
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Object.values(index.entries ?? index.stories ?? {})
    .filter(entry => (entry.type ?? 'story') === 'story')
    .map(entry => ({title: entry.title, name: entry.name ?? '', importPath: entry.importPath ?? ''}));
}

/** What breaks the rules above, as sentences; empty when the specs hold. */
export function checkSpecs(specs, stories, design = {}) {
  const problems = [];
  for (const spec of specs) {
    const where = `${spec.file}:`;
    if (!STATUSES.includes(spec.status)) {
      problems.push(`${where} status "${spec.status ?? ''}" is none of ${STATUSES.join(', ')}.`);
      continue;
    }
    if (spec.status === 'approved' || spec.status === 'built') {
      for (const field of ['figma', 'figma_version', 'approved_by']) {
        if (!spec[field]) {
          problems.push(`${where} ${spec.status}, but no ${field}.`);
        }
      }
    }
    if (spec.status === 'built' && !spec.story) {
      problems.push(`${where} built, but no story (its Storybook title).`);
    }
    if (stories && spec.story && (spec.status === 'built' || spec.status === 'as-is')) {
      const own = stories.filter(story => story.title === spec.story);
      if (!own.length) {
        problems.push(`${where} no story titled "${spec.story}" in Storybook's index.`);
      }
      // What its "Properties" list, shown: a component adopted as it is (as-is) is not asked.
      for (const {property, value, phrase} of own.length && spec.status === 'built' ? (spec.shows ?? []) : []) {
        if (!own.some(story => named(story.name, phrase))) {
          problems.push(`${where} no story of "${spec.story}" shows ${property}: ${value} (a story whose name has "${phrase}"). Its "Properties" list it: a story for each value but the default, or "no story" and why in its row.`);
        }
      }
    }
  }
  if (stories && design.library) {
    const titled = new Set(specs.map(spec => spec.story).filter(Boolean));
    const library = stories.filter(story => story.importPath.startsWith(design.library));
    for (const title of [...new Set(library.map(story => story.title))].sort()) {
      if (!titled.has(title)) {
        problems.push(`Storybook: "${title}" (${design.library}) has no spec.`);
      }
    }
  }
  return problems;
}
