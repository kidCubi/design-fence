/**
 * What git says about the project: its root, the files that changed, and a
 * private directory for design-fence's state (inside `.git`, so it is never
 * committed and each worktree has its own).
 */

import {execFileSync} from 'node:child_process';
import path from 'node:path';

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/** The root of the repository holding `cwd`, or null outside one. */
export function projectRoot(cwd) {
  try {
    return git(cwd, ['rev-parse', '--show-toplevel']).trim();
  } catch {
    return null;
  }
}

/** A directory of `.git` for design-fence's state (`.git/design-fence`). */
export function stateDir(root) {
  return path.resolve(root, git(root, ['rev-parse', '--git-path', 'design-fence']).trim());
}

/**
 * The paths `git status --porcelain -z` lists: modified, added, renamed (the
 * new name) and untracked, deleted ones included. `-z` paths are literal.
 */
export function parseStatus(output) {
  const entries = output.split('\0');
  const paths = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.length < 4) {
      continue;
    }
    paths.push(entry.slice(3));
    // A rename or a copy is followed by its old name: skip it.
    if (entry[0] === 'R' || entry[0] === 'C') {
      i++;
    }
  }
  return paths;
}

/**
 * The files changed by the work in progress, relative to the root: those
 * not committed, and those committed since `base` (a ref, e.g.
 * `origin/main`; its absence is not an error: commits are then not counted).
 */
export function changedFiles(root, base) {
  const files = new Set(
    parseStatus(git(root, ['status', '--porcelain', '-z', '--untracked-files=all'])),
  );
  if (base) {
    try {
      git(root, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]);
      const committed = git(root, ['diff', '--name-only', '-z', `${base}...HEAD`]);
      committed.split('\0').filter(Boolean).forEach(file => files.add(file));
    } catch {
      // No such base here (a fresh clone without the remote): only the
      // uncommitted work counts.
    }
  }
  return [...files].sort();
}
