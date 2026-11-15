/**
 * The design module's check (`design-fence design`, run by the pre-commit
 * hook and CI through `.agents/validate.json`): what the repository alone
 * can say about whether the design still holds, from its files, with no
 * Figma and no browser.
 *
 * - the specs against Storybook (`lib/specs.mjs`: a built spec's stories,
 *   one for each value its properties list), and Storybook's index not older
 *   than the stories it lists;
 * - `design/index.md` against the specs: a row for each, saying the same
 *   status, Figma node and story;
 * - `design/flows.yml`: ids are unique, actions go between views that exist,
 *   a flow's steps exist and follow each other, a view's components are in
 *   the index;
 * - the library's CSS holds no value written raw where a token belongs (a
 *   colour, a length, a time), for the components whose spec is approved or
 *   built;
 * - the tokens file is as the tokens export wrote it (`design/tokens.lock`);
 * - a component's code uses the tokens its design in Figma is bound to, and
 *   no other (`design/components/<name>.bound.json`, which
 *   `design-fence figma bound --spec <name> --out` writes): the look, held
 *   by its tokens, with no browser.
 *
 * What it reports is a problem (the commit is refused) or a warning (said,
 * not refused): a component adopted as it is, a library story with no spec
 * yet, are warnings until `design.strict` is true, so a project can adopt
 * design-fence without rewriting everything first.
 *
 * validate.json, `design`: `dir`, `storybookIndex`, `library` (as
 * `lib/specs.mjs`), `tokens: {file, private: ["--mono-*"]}` (the tokens
 * components do not bind: the primitives), `strict`, and `raw: ["1px", …]`, the
 * values allowed raw. In a CSS file, `design-fence: raw` in a comment on a
 * line, or on the line before, allows that line, with its reason; and
 * `design-fence: not in Figma` allows a token the design is not bound to.
 */

import fs from 'node:fs';
import path from 'node:path';

import {checkSpecs, readSpecs, readStories} from './specs.mjs';
import {parseYaml} from './yaml.mjs';

const read = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const slug = name => (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** A text's FNV-1a, as `design-fence hash` and `figma/tokens.js` compute it. */
export function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (const byte of Buffer.from(text, 'utf8')) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Every file under `dir` (relative to `root`, `/` separators) that `test` accepts. */
function walk(root, dir, test, out = []) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return out;
  for (const entry of fs.readdirSync(full, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(root, file, test, out);
    else if (test(file)) out.push(file);
  }
  return out;
}

/**
 * Values written raw in CSS lines: hex and functional colours, and lengths
 * or times other than 0 outside `var()`. A media query's condition cannot
 * read a token and is left out. Returns `[{line, value}]`, lines from 1.
 */
export function rawValuesIn(lines, allowed = []) {
  const found = [];
  let comment = false;
  lines.forEach((line, i) => {
    let code = '';
    // Comments out, across lines.
    for (let at = 0; at < line.length; ) {
      if (comment) {
        const end = line.indexOf('*/', at);
        if (end < 0) break;
        comment = false;
        at = end + 2;
      } else {
        const start = line.indexOf('/*', at);
        if (start < 0) {
          code += line.slice(at);
          break;
        }
        code += line.slice(at, start);
        comment = true;
        at = start + 2;
      }
    }
    const excused = /design-fence:\s*raw/.test(line) || /design-fence:\s*raw/.test(lines[i - 1] ?? '');
    if (excused || /^\s*@(media|container|supports|import|font-face)\b/.test(code) || !code.includes(':')) return;
    // Not values: a token read, a file, and a unit given to a bare number (`calc(var(--duration-fast) * 1ms)`).
    const declaration = code.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '').replace(/url\([^)]*\)/g, '').replace(/[*/]\s*1(?:px|ms|s|rem|em)\b/g, '');
    for (const match of declaration.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|hwb|lab|lch|oklab|oklch)a?\([^)]*\)|(?<![\w.#-])(?!0(?:px|ms|s|rem|em)\b)\d*\.?\d+(?:px|rem|em|ms|s)\b/g)) {
      if (!allowed.includes(match[0])) found.push({line: i + 1, value: match[0]});
    }
  });
  return found;
}

/** The custom properties of a CSS tokens file whose value is a literal: `{value: [name, …]}`. */
function tokensByValue(text) {
  const byValue = {};
  for (const match of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const value = match[2].trim();
    if (!value.startsWith('var(')) (byValue[value.toLowerCase()] ??= []).push(match[1]);
  }
  return byValue;
}

/** The rows of the index's "Components" table: `{name, status, spec, figma, story}`. */
export function indexRows(text) {
  const start = text.split('\n').findIndex(line => /^##\s+Components\b/.test(line));
  if (start < 0) return [];
  const lines = text.split('\n').slice(start + 1);
  const end = lines.findIndex(line => /^##\s/.test(line));
  return lines
    .slice(0, end < 0 ? undefined : end)
    .filter(line => line.trim().startsWith('|'))
    .slice(2)
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells[0])
    .map(([name, status, spec, figma, story]) => ({
      name,
      status: (status ?? '').split(/[\s(]/)[0],
      spec: (spec ?? '').replace(/`/g, ''),
      figma: (figma ?? '').replace(/`/g, ''),
      story: (story ?? '').replace(/`/g, ''),
    }));
}

function checkIndex(root, design, specs) {
  const dir = design.dir ?? 'design';
  const file = `${dir}/index.md`;
  const rows = indexRows(read(path.join(root, file)));
  const problems = [];
  for (const spec of specs) {
    const own = path.posix.relative(dir, spec.file);
    const row = rows.find(r => r.spec === own || r.spec === spec.file);
    if (!row) {
      problems.push(`${file}: no row for ${spec.file} ("Components").`);
      continue;
    }
    for (const [field, said, is] of [['status', row.status, spec.status], ['Figma node', row.figma, spec.figma ?? ''], ['story', row.story, spec.story ?? '']]) {
      if ((said ?? '') !== (is ?? '')) {
        problems.push(`${file}: ${row.name}'s ${field} is "${said}", its spec (${spec.file}) says "${is}".`);
      }
    }
  }
  for (const row of rows.filter(r => r.spec && !specs.some(spec => path.posix.relative(dir, spec.file) === r.spec || spec.file === r.spec))) {
    problems.push(`${file}: ${row.name}'s spec, ${row.spec}, is not there.`);
  }
  return {problems, rows};
}

function checkFlows(root, design, known) {
  const file = `${design.dir ?? 'design'}/flows.yml`;
  const text = read(path.join(root, file));
  if (!text) return [];
  const {data, errors} = parseYaml(text);
  const problems = errors.map(error => `${file}: ${error}.`);
  const list = key => (Array.isArray(data[key]) ? data[key].filter(entry => entry && typeof entry === 'object') : []);
  const [views, actions, flows] = [list('views'), list('actions'), list('flows')];
  for (const [kind, entries] of [['view', views], ['action', actions], ['flow', flows]]) {
    const seen = new Set();
    for (const entry of entries) {
      if (!entry.id) problems.push(`${file}: a ${kind} has no id.`);
      else if (seen.has(entry.id)) problems.push(`${file}: two ${kind}s are named ${entry.id}.`);
      seen.add(entry.id);
    }
  }
  const viewIds = new Set(views.map(view => view.id));
  const place = to => typeof to === 'string' && (viewIds.has(to) || /^external:/.test(to));
  for (const view of views) {
    if (!view.route && !view.modal && !view.state) problems.push(`${file}: view ${view.id} has no route (or modal, or state).`);
    for (const of of ['modal', 'state']) {
      if (view[of] && !viewIds.has(view[of])) problems.push(`${file}: view ${view.id} is a ${of} of ${view[of]}, which is not a view.`);
    }
    for (const component of Array.isArray(view.components) ? view.components : []) {
      if (!known.has(slug(component))) problems.push(`${file}: view ${view.id} shows ${component}, which the index does not list.`);
    }
  }
  const byId = Object.fromEntries(actions.map(action => [action.id, action]));
  for (const action of actions) {
    if (!viewIds.has(action.from)) problems.push(`${file}: action ${action.id} starts from ${action.from}, which is not a view.`);
    if (!place(action.to)) problems.push(`${file}: action ${action.id} leads to ${action.to}, which is not a view (or "external: …").`);
  }
  for (const flow of flows) {
    const steps = Array.isArray(flow.steps) ? flow.steps : [];
    steps.forEach((step, i) => {
      if (!byId[step]) {
        problems.push(`${file}: flow ${flow.id} has the step ${step}, which is not an action.`);
      } else if (i > 0 && byId[steps[i - 1]] && viewIds.has(byId[steps[i - 1]].to) && byId[step].from !== byId[steps[i - 1]].to) {
        problems.push(`${file}: flow ${flow.id}: ${step} starts from ${byId[step].from}, but ${steps[i - 1]} led to ${byId[steps[i - 1]].to}.`);
      }
    });
  }
  return problems;
}

function checkRaw(root, design, specs) {
  const library = (design.library ?? '').replace(/^\.\//, '').replace(/\/$/, '');
  const problems = [];
  const warnings = [];
  if (!library) return {problems, warnings};
  const tokensFile = design.tokens?.file;
  const byValue = tokensFile ? tokensByValue(read(path.join(root, tokensFile))) : {};
  const hidden = (design.tokens?.private ?? []).map(glob => new RegExp('^' + glob.split('*').map(part => part.replace(/[^\w-]/g, '\\$&')).join('.*') + '$'));
  for (const file of walk(root, library, name => /\.(css|scss|less)$/.test(name))) {
    const component = file.slice(library.length + 1).split('/')[0].replace(/\.\w+$/, '');
    const spec = specs.find(s => slug(s.name) === slug(component) || path.basename(s.file, '.md') === component);
    const held = spec && (spec.status === 'built' || spec.status === 'approved');
    const lines = read(path.join(root, file)).split('\n');
    // A token of a layer components do not bind (the primitives: `tokens.private`, as `--mono-*`).
    lines.forEach((text, i) => {
      for (const match of text.matchAll(/var\((--[\w-]+)/g)) {
        if (hidden.some(test => test.test(match[1])) && !/design-fence:\s*raw/.test(text)) {
          (held || design.strict ? problems : warnings).push(`${file}:${i + 1}: ${match[1]} is not for components (design.tokens.private): bind the role that aliases it.`);
        }
      }
    });
    for (const {line, value} of rawValuesIn(lines, design.raw ?? [])) {
      const token = byValue[value.toLowerCase()]?.[0];
      const message = `${file}:${line}: ${value} is written raw${token ? ` (a token holds this value: ${token})` : ''}.`;
      (held || design.strict ? problems : warnings).push(message);
    }
  }
  return {problems, warnings};
}

/** Where `design-fence figma bound --out` records the tokens a component's design is bound to: beside its spec. */
export const boundFile = spec => spec.file.replace(/\.md$/, '.bound.json');

/** A Figma variable's name as the tokens export writes it in CSS (`figma/tokens.js`): `line/frame`, `--line-frame`. */
export const cssName = name => `--${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/** A component's own files in the library, stories and tests apart: `library/<component>/…`, or `library/<component>.<ext>`. */
function codeOf(root, library, spec) {
  const own = file => {
    const component = file.slice(library.length + 1).split('/')[0].replace(/\.\w+$/, '');
    return slug(spec.name) === slug(component) || path.basename(spec.file, '.md') === component;
  };
  return walk(root, library, name => /\.(css|scss|less|js|mjs|ts|jsx|tsx|vue|svelte)$/.test(name) && !/\.(stories|test|spec)\.\w+$/.test(name)).filter(own);
}

/**
 * A component's code against the tokens its design is bound to (Figma's
 * names): `{files, missing, extra}`. `missing`: `{token, name}`, bound in the
 * design and read nowhere in the code. `extra`: `{file, line, name}`, a token
 * of the tokens file the code reads and the design is not bound to, unless
 * its line (or the one before) says `design-fence: not in Figma`, or it is
 * of a group no design here binds (`groups`, CSS prefixes: Figma has no
 * place for a duration or an easing, so none is held).
 */
export function boundAgainstCode(root, design, spec, tokens, groups = null) {
  const library = (design.library ?? '').replace(/^\.\//, '').replace(/\/$/, '');
  const files = library ? codeOf(root, library, spec) : [];
  const known = new Set([...read(path.join(root, design.tokens?.file ?? '')).matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  const wanted = new Map(tokens.map(token => [cssName(token), token]));
  const used = new Map();
  const extra = [];
  for (const file of files) {
    const raw = read(path.join(root, file)).split('\n');
    // Comments out, their lines kept: a token named in a comment is not read.
    const code = raw.join('\n').replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g, ' ')).split('\n');
    code.forEach((text, i) => {
      for (const match of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
        const name = match[1];
        if (!used.has(name)) used.set(name, {file, line: i + 1});
        const excused = /design-fence:\s*not in Figma/i.test(raw[i]) || /design-fence:\s*not in Figma/i.test(raw[i - 1] ?? '');
        const held = !groups || groups.some(prefix => name.startsWith(prefix));
        if (known.has(name) && !wanted.has(name) && !excused && held && !extra.some(found => found.name === name)) extra.push({file, line: i + 1, name});
      }
    });
  }
  const missing = [...wanted].filter(([name]) => !used.has(name)).map(([name, token]) => ({token, name}));
  return {files, missing, extra};
}

/** The records of `design-fence figma bound --out` against the components' code: `{problems, warnings, notes}`. */
function checkBound(root, design, specs) {
  const problems = [];
  const warnings = [];
  const notes = [];
  if (!design.tokens?.file || !design.library) return {problems, warnings, notes};
  const records = [];
  for (const spec of specs) {
    const file = boundFile(spec);
    const text = read(path.join(root, file));
    if (!text) continue;
    try {
      const record = JSON.parse(text);
      if (!Array.isArray(record.tokens)) throw new Error('no tokens');
      records.push({spec, file, tokens: record.tokens});
    } catch {
      problems.push(`${file}: not a record of design-fence figma bound (write it again: design-fence figma bound --spec ${path.basename(spec.file, '.md')} --out).`);
    }
  }
  // The groups a design binds here: `space/…`, `text/…`. A token of another group is the code's own business.
  const groups = [...new Set(records.flatMap(record => record.tokens).map(token => `${cssName(token.split('/')[0])}-`))];
  const without = [];
  for (const spec of specs.filter(s => s.status === 'built' || s.status === 'approved')) {
    const record = records.find(r => r.spec === spec);
    const held = spec.status === 'built' || design.strict ? problems : warnings;
    if (!record) {
      if (spec.status === 'built' && codeOf(root, design.library.replace(/^\.\//, '').replace(/\/$/, ''), spec).length) without.push(path.basename(spec.file, '.md'));
      continue;
    }
    const {files, missing, extra} = boundAgainstCode(root, design, spec, record.tokens, groups);
    if (!files.length) continue; // approved, not built yet
    const again = `design-fence figma bound --spec ${path.basename(spec.file, '.md')} --out`;
    for (const {file, line, name} of extra) {
      held.push(`${file}:${line}: ${name} is not in ${spec.name}'s design in Figma (${record.file}). The design changed: record it again (${again}). The code's alone: say so on the line (/* design-fence: not in Figma. Why. */).`);
    }
    for (const {token, name} of missing) {
      held.push(`${record.file}: ${spec.name}'s design in Figma is bound to ${token}, and its code does not read ${name} (${files.filter(f => /\.(css|scss|less)$/.test(f)).join(', ') || files[0]}). If the design changed: ${again}.`);
    }
  }
  if (without.length) notes.push(`${without.length} built component(s) not held to their design's tokens yet (${without.join(', ')}): design-fence figma bound --spec <name> --out records them`);
  return {problems, warnings, notes};
}

/** Where the tokens export records what it wrote: `{file, hash}`, beside the design's index. */
export const lockFile = design => `${design.dir ?? 'design'}/tokens.lock`;

function checkTokens(root, design) {
  const lock = read(path.join(root, lockFile(design)));
  if (!lock) return [];
  let recorded;
  try {
    recorded = JSON.parse(lock);
  } catch {
    return [`${lockFile(design)}: not JSON.`];
  }
  const text = read(path.join(root, recorded.file ?? ''));
  if (!text) return [`${lockFile(design)}: the tokens file it names, ${recorded.file}, is not there.`];
  const hash = fnv1a(text);
  return hash === recorded.hash
    ? []
    : [`${recorded.file}: changed since the tokens export wrote it (${hash}, exported ${recorded.hash}). A token's value changes in Figma, then the export writes the file (design-fence figma tokens --out).`];
}

/** The newest change among the library's story files against Storybook's index: a problem when the index is older. */
function checkIndexAge(root, design) {
  const index = design.storybookIndex && path.join(root, design.storybookIndex);
  const library = (design.library ?? '').replace(/^\.\//, '').replace(/\/$/, '');
  if (!index || !fs.existsSync(index) || !library) return [];
  const built = fs.statSync(index).mtimeMs;
  const newer = walk(root, library, name => /\.stories\.\w+$/.test(name)).filter(file => fs.statSync(path.join(root, file)).mtimeMs > built);
  return newer.length ? [`${design.storybookIndex} is older than ${newer[0]}${newer.length > 1 ? ` (and ${newer.length - 1} more)` : ''}: build Storybook again, so the stories are checked as they are.`] : [];
}

/** The whole check: `{problems, warnings, notes}`, each a list of sentences. */
export function checkDesign(root, design) {
  const specs = readSpecs(root, design);
  const stories = readStories(root, design);
  const problems = [];
  const warnings = [];
  const notes = [`${specs.length} spec(s)`, stories ? `${stories.length} stories of ${design.storybookIndex}` : 'stories NOT checked: no Storybook index (design.storybookIndex): build Storybook'];
  for (const problem of checkSpecs(specs, stories, design)) {
    (/^Storybook: .* has no spec\.$/.test(problem) && !design.strict ? warnings : problems).push(problem);
  }
  problems.push(...checkIndexAge(root, design));
  const index = checkIndex(root, design, specs);
  problems.push(...index.problems);
  const known = new Set([...specs.map(spec => slug(spec.name)), ...index.rows.map(row => slug(row.name))]);
  problems.push(...checkFlows(root, design, known));
  const raw = checkRaw(root, design, specs);
  problems.push(...raw.problems);
  warnings.push(...raw.warnings);
  problems.push(...checkTokens(root, design));
  if (design.tokens?.file && !fs.existsSync(path.join(root, lockFile(design)))) {
    notes.push(`the tokens file is not held yet (no ${lockFile(design)}): the next tokens export writes it`);
  }
  const bound = checkBound(root, design, specs);
  problems.push(...bound.problems);
  warnings.push(...bound.warnings);
  notes.push(...bound.notes);
  return {problems, warnings, notes};
}
