/**
 * The page's outline: its sections and their anchors, from the copy (`design/content/landing.md`), for links to a
 * section and for the page's table of contents.
 *
 *     node tools/outline.mjs [file]
 */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export const COPY = 'design/content/landing.md';

/** A heading's anchor: lower case, its words joined by hyphens. */
export function anchor(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The sections of a copy file: `{title, anchor}` for each second-level heading, in order. */
export function outline(markdown) {
  return markdown
    .split('\n')
    .filter(line => line.startsWith('## '))
    .map(line => line.slice(3).trim())
    .map(title => ({title, anchor: anchor(title)}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const section of outline(fs.readFileSync(process.argv[2] ?? COPY, 'utf8'))) {
    console.log(`#${section.anchor}  ${section.title}`);
  }
}
