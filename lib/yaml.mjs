/**
 * A reader for the YAML that `design/flows.yml` is written in
 * (`templates/design/flows.yml`), and no more: design-fence has no
 * dependencies. Top-level keys, each a list of maps; a map's values are
 * scalars (plain or quoted), inline lists (`[a, b]`), or a folded or literal
 * block (`>-`, `|`). Comments and blank lines are skipped. Anything else
 * (nested maps, anchors, multi-document files) is reported, not guessed:
 * `{data, errors}`, the errors with their line numbers.
 */

const unquote = text => {
  const value = text.trim();
  if (/^(['"]).*\1$/.test(value)) {
    return value.slice(1, -1);
  }
  return value === 'true' ? true : value === 'false' ? false : value === '~' || value === 'null' ? null : value;
};

/** `a, "b, c", d` split on the commas outside quotes. */
function items(text) {
  const out = [];
  let current = '';
  let quote = '';
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ',') {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) out.push(current);
  return out.map(unquote);
}

/** A value's text after `key:`, a trailing comment removed (a `#` after a space, outside quotes). */
function value(text) {
  const bare = text.replace(/^((?:[^'"#]|'[^']*'|"[^"]*")*?)\s+#.*$/, '$1').trim();
  if (/^\[.*\]$/.test(bare)) {
    return items(bare.slice(1, -1));
  }
  return unquote(bare);
}

export function parseYaml(text) {
  const data = {};
  const errors = [];
  const lines = text.split('\n');
  let list = null;
  let map = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const top = /^([\w-]+):\s*(.*)$/.exec(line);
    if (indent === 0 && top) {
      const rest = top[2].replace(/\s+#.*$/, '').trim();
      list = data[top[1]] = rest === '[]' ? [] : rest ? value(rest) : [];
      map = null;
      continue;
    }
    const item = /^(\s*)-\s+([\w-]+):\s*(.*)$/.exec(line);
    const field = /^(\s+)([\w-]+):\s*(.*)$/.exec(line);
    const found = item ?? field;
    if (!found || !Array.isArray(list) || (!item && !map)) {
      errors.push(`line ${i + 1}: not in the shape flows.yml takes ("${line.trim().slice(0, 40)}")`);
      continue;
    }
    if (item) {
      map = {};
      list.push(map);
    }
    const [, , key, rest] = found;
    if (/^[>|][+-]?$/.test(rest.trim())) {
      // A block: the lines indented deeper than its key, folded into one (or kept, for `|`).
      const base = found[1].length + (item ? 2 : 0);
      const block = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || lines[i + 1].length - lines[i + 1].trimStart().length > base)) {
        block.push(lines[++i].trim());
      }
      map[key] = rest.trim().startsWith('>') ? block.filter(Boolean).join(' ') : block.join('\n').trim();
    } else {
      map[key] = value(rest);
    }
  }
  return {data, errors};
}
