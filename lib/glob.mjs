/**
 * Glob patterns of `.agents/validate.json` (`viewer/**\/*.{js,css}`), matched
 * against paths relative to the project root, with `/` separators: `**`
 * any number of directories, `*` and `?` within one name, `{a,b}`
 * alternatives. Nothing else: no negation, no character classes.
 */

const SPECIAL = /[.+^$()|[\]\\]/;

/** The regular expression of a glob pattern. */
export function globToRegExp(pattern) {
  let source = '';
  let braces = 0;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*' && pattern[i + 1] === '*') {
      // `**/` is zero or more directories; a trailing `**` is anything.
      if (pattern[i + 2] === '/') {
        source += '(?:[^/]*/)*';
        i += 2;
      } else {
        source += '.*';
        i += 1;
      }
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else if (char === '{') {
      braces++;
      source += '(?:';
    } else if (char === '}' && braces > 0) {
      braces--;
      source += ')';
    } else if (char === ',' && braces > 0) {
      source += '|';
    } else {
      source += SPECIAL.test(char) ? `\\${char}` : char;
    }
  }
  return new RegExp(`^${source}$`);
}

/** Whether a path matches any of the patterns (a pattern or a list). */
export function matchesAny(path, patterns) {
  return [patterns]
    .flat()
    .some(pattern => globToRegExp(pattern).test(path));
}
