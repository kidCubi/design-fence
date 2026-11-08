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
 *   their titles has a spec.
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

/** The specs of `design/components/`: `{file, name, status, figma, figma_version, approved_by, story}`. */
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
      return {file, ...frontMatter(fs.readFileSync(path.join(dir, name), 'utf8'))};
    });
}

/** The stories of Storybook's index.json, as `{title, importPath}`; null when there is no index. */
export function readStories(root, design = {}) {
  const file = design.storybookIndex && path.join(root, design.storybookIndex);
  if (!file || !fs.existsSync(file)) {
    return null;
  }
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Object.values(index.entries ?? index.stories ?? {})
    .filter(entry => (entry.type ?? 'story') === 'story')
    .map(entry => ({title: entry.title, importPath: entry.importPath ?? ''}));
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
      if (!stories.some(story => story.title === spec.story)) {
        problems.push(`${where} no story titled "${spec.story}" in Storybook's index.`);
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
