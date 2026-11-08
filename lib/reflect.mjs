/**
 * The reflect line: a commit that changes code carries, in its message, the
 * verdict of the reflect review run on it (playbooks/reflect.md), as a line
 * `Reflect: <verdict>`. What counts as code: validate.json's `reflect.when`
 * patterns, or by default every file but prose (Markdown, plain text).
 */

import path from 'node:path';

import {git} from './git.mjs';
import {matchesAny} from './glob.mjs';

const PROSE = ['**/*.md', '**/*.txt'];
const LINE = /^Reflect:[ \t]*(\S.*)$/m;

/** The files among `files` that need the review, by the project's config. */
export function needingReview(files, config) {
  const when = config?.reflect?.when;
  return files.filter(file => (when ? matchesAny(file, when) : !matchesAny(file, PROSE)));
}

/** The verdict on a message's `Reflect:` line, or '' if it has none. */
export function reflectVerdict(message) {
  const match = LINE.exec(message);
  return match ? match[1].trim() : '';
}

/**
 * The commit that brought design-fence (the directory `home`) into the
 * project, or '' if none did: the commits before it were made without the
 * rule, so none of them is asked for a Reflect line.
 */
export function adoptionCommit(root, home) {
  const relative = path.relative(root, home).split(path.sep).join('/');
  try {
    return git(root, ['log', '--diff-filter=A', '--reverse', '--format=%H', '--', relative]).split('\n')[0];
  } catch {
    return '';
  }
}

/**
 * The commits git selects with `revs` (e.g. `['a..b']`, or `[sha, '--not',
 * '--remotes']`) that change code and have no Reflect line, as `{sha,
 * subject, files}`, oldest first. Merges are left out: their changes were
 * reviewed in the commits they bring.
 */
export function commitsMissingReflect(root, revs, config) {
  const shas = git(root, ['rev-list', '--reverse', '--no-merges', ...revs])
    .split('\n')
    .filter(Boolean);
  const missing = [];
  for (const sha of shas) {
    const files = needingReview(
      git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', sha])
        .split('\0')
        .filter(Boolean),
      config,
    );
    const message = git(root, ['log', '-1', '--format=%B', sha]);
    if (files.length > 0 && !reflectVerdict(message)) {
      missing.push({sha, subject: message.split('\n')[0], files});
    }
  }
  return missing;
}
