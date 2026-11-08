/**
 * The tokens export (`playbooks/design.md`, step 5): a Figma file's local
 * variables as the text of the project's tokens file, run through the bridge
 * with `figma_execute`, as this file's text followed by
 *
 *     return await tokens({format: 'dtcg', px: ['space/', 'radius/']});   // or 'css'
 *     return await tokens({format: 'dtcg', px: […], hashOnly: true});
 *
 * It reads only, and returns `{format, count, hash, text, collisions}`:
 *
 * - `dtcg`: the W3C design-token format (JSON, two-space indented), one
 *   group per `/` of a variable's name, aliases as `{group.name}`, easings
 *   as `cubicBezier`, the other modes of a collection under
 *   `$extensions["figma.modes"]`. For a project whose pipeline (Style
 *   Dictionary, …) builds its code tokens from it;
 * - `css`: custom properties on `:root` (`--surface-raised`), aliases as
 *   `var(…)`, easings as `cubic-bezier(…)`, the other modes under
 *   `[data-<collection>="<mode>"]`. For a project whose tokens file is
 *   that CSS;
 * - a number is a `px` size when its variable is scoped to sizes (gap,
 *   radius, width and height, stroke, font size, …) or its name starts
 *   with one of `px` (the prefixes `AGENTS.md` lists: a variable scoped to
 *   all uses says nothing about its unit);
 * - `hash`: FNV-1a of `text`, as `design-fence hash <file>` computes it on
 *   the repo's copy: equal hashes, nothing to export, and the text need not
 *   come through the conversation (`hashOnly`);
 * - `collisions`: names that are both a token and a group (`a/b` and
 *   `a/b/c`), which the DTCG format cannot hold.
 */
async function tokens({format = 'dtcg', px = [], hashOnly = false} = {}) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const byId = Object.fromEntries(variables.map(v => [v.id, v]));
  const SIZES = ['CORNER_RADIUS', 'GAP', 'WIDTH_HEIGHT', 'STROKE_FLOAT', 'FONT_SIZE', 'LINE_HEIGHT', 'LETTER_SPACING', 'PARAGRAPH_SPACING', 'EFFECT_FLOAT'];
  const hex = c => {
    const part = v => Math.round(v * 255).toString(16).padStart(2, '0');
    return '#' + part(c.r) + part(c.g) + part(c.b) + (c.a !== undefined && c.a < 1 ? part(c.a) : '');
  };
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const typeOf = v => {
    if (v.resolvedType === 'COLOR') return 'color';
    if (v.resolvedType === 'EASING') return 'cubicBezier';
    if (v.resolvedType === 'BOOLEAN') return 'boolean';
    if (v.resolvedType === 'STRING') return (v.scopes || []).includes('FONT_FAMILY') ? 'fontFamily' : 'string';
    const sized = (v.scopes || []).some(s => SIZES.includes(s)) || px.some(prefix => v.name.startsWith(prefix));
    return sized ? 'dimension' : 'number';
  };
  const path = v => v.name.split('/');
  const plain = (v, value) => {
    if (value && value.type === 'VARIABLE_ALIAS') {
      const target = byId[value.id];
      return target ? {alias: target} : {raw: 'library variable'};
    }
    if (v.resolvedType === 'COLOR') return {raw: hex(value)};
    if (value && value.easingFunctionCubicBezier) {
      const b = value.easingFunctionCubicBezier;
      const points = [b.x1, b.y1, b.x2, b.y2].map(n => Math.round(n * 1000) / 1000);
      return {raw: points, css: `cubic-bezier(${points.join(', ')})`};
    }
    if (value && typeof value === 'object') return {raw: JSON.stringify(value)};
    if (typeof value === 'number') {
      const n = Math.round(value * 1000) / 1000;
      return {raw: typeOf(v) === 'dimension' ? `${n}px` : n};
    }
    return {raw: value};
  };

  const entries = [];
  for (const c of collections) {
    for (const id of c.variableIds) {
      const v = byId[id];
      if (!v) continue;
      const modes = c.modes.map(m => ({mode: m.name, ...plain(v, v.valuesByMode[m.modeId])}));
      entries.push({v, collection: c.name, type: typeOf(v), modes});
    }
  }

  const leaves = new Set(entries.map(e => e.v.name));
  const collisions = entries.map(e => e.v.name).filter(name => [...leaves].some(other => other.startsWith(name + '/')));

  let text;
  if (format === 'css') {
    const prop = v => '--' + slug(v.name);
    const value = m => (m.alias ? `var(${prop(m.alias)})` : m.css || String(m.raw));
    const blocks = {':root': []};
    for (const e of entries) {
      blocks[':root'].push(`  ${prop(e.v)}: ${value(e.modes[0])};`);
      for (const m of e.modes.slice(1)) {
        const selector = `[data-${slug(e.collection)}="${slug(m.mode)}"]`;
        (blocks[selector] = blocks[selector] || []).push(`  ${prop(e.v)}: ${value(m)};`);
      }
    }
    text = Object.entries(blocks).map(([selector, lines]) => `${selector} {\n${lines.join('\n')}\n}\n`).join('\n');
  } else {
    const root = {};
    const value = m => (m.alias ? `{${path(m.alias).join('.')}}` : m.raw);
    for (const e of entries) {
      if (collisions.includes(e.v.name)) continue;
      let group = root;
      for (const part of path(e.v).slice(0, -1)) group = group[part] = group[part] || {};
      const token = {$type: e.type, $value: value(e.modes[0])};
      if (e.modes.length > 1) {
        token.$extensions = {'figma.modes': Object.fromEntries(e.modes.map(m => [m.mode, value(m)]))};
      }
      group[path(e.v).slice(-1)[0]] = token;
    }
    text = JSON.stringify(root, null, 2) + '\n';
  }

  // FNV-1a over the UTF-8 bytes, as `design-fence hash` computes it.
  let hash = 0x811c9dc5;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const bytes =
      cp < 0x80 ? [cp]
      : cp < 0x800 ? [0xc0 | (cp >> 6), 0x80 | (cp & 63)]
      : cp < 0x10000 ? [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]
      : [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
    for (const b of bytes) {
      hash ^= b;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return {format, count: entries.length, hash: hash.toString(16).padStart(8, '0'), text: hashOnly ? undefined : text, collisions};
}
