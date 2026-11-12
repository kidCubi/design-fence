/**
 * Which way a request goes (`design-fence route "<request>"`, and the agent
 * tools' prompt hook): the playbook to read, the mode, and the project's
 * files the request touches, from what the repository already says. No
 * model: `playbooks/start.md`'s "Which way" as rules, the words of the
 * request against the names the project gives its components, views and
 * tokens, and a short list of words for the rest.
 *
 * It answers in a few lines so the agent starts in the right file without
 * reading the others to find out. It is a guess from words: where it is
 * unsure it says so, and `AGENTS.md`'s table still decides.
 *
 * Used by `bin/design-fence.mjs` and by `lib/agent-hooks.mjs` (bundled into
 * the plugins): it imports only node's own modules and `./specs.mjs`.
 */

import fs from 'node:fs';
import path from 'node:path';

import {readSpecs} from './specs.mjs';

const read = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** `words` as one pattern, whole words, any case; `é` and `e` alike. */
const any = words => new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.join('|')})s?(?![\\p{L}\\p{N}])`, 'iu');
const plain = text => text.normalize('NFD').replace(/\p{M}/gu, '');

// What a request's words say. English and French: the two the project is used in.
const REVIEW = any(['review', 'reflect', 'critique', 'audit my', 'look over', 'critical look', 'up to the bar', 'relis', 'relire', 'revue', 'revois']);
const MODES = [
  ['status', any(['status', 'audit the issues', 'audit', 'etat des tickets'])],
  ['land', any(['land', 'land it', 'merge it', 'atterris'])],
  ['ticket', any(['ticket', 'file an issue', 'open an issue', 'write an issue', 'write a ticket', 'cree un ticket'])],
  ['quick', any(['quick', 'quickly', 'prototype', 'spike', 'rapide', 'rapidement', 'proto'])],
];
// A view, a route or a path that is new (the noun within two words of the verb: "add a pricing page", not "a new
// component for this page"), or one that moves.
const VIEW = '(?:views?|pages?|screens?|routes?|flows?|modals?|dialogs?|vues?|ecrans?|parcours)';
const FLOW_NEW = new RegExp(`\\b(?:new|add|create|another|need|needs|nouvelle|nouveau|nouvel|ajoute|cree)\\s+(?:[\\p{L}\\p{N}-]+\\s+){0,2}${VIEW}\\b`, 'iu');
const FLOW_MOVES = new RegExp(`\\b(?:move|split|rename|merge|deplace|renomme)\\b.*\\b${VIEW}\\b`, 'iu');
// A page of the Figma file, where a design is put ("on a new page named …"), is no view of the product. Only in a
// request that speaks of Figma: "add a new page named Pricing" alone is a view.
const FIGMA_PAGE = /\b(?:(?:a|an|the|its own)\s+)?(?:(?:new|separate|fresh)\s+)?(?:(?:figma|canvas)\s+page\b|pages?\s+(?:named|called|nommee|appelee)\s+(?:"[^"]*"|'[^']*'|\S+))/giu;
// Work on what users do not see, said by its own words: a tool, a test, a dependency.
const CODE = /\b(?:tools?|scripts?|tests?|ci|dependenc(?:y|ies)|deps|crash(?:es)?|flag|env(?:ironment)?|cli|lint|prettier|refactor|bug|readme|docs?|document|module|parser|function|types?|typescript|changelog|workflow|actions?|version|warning|cache)\b|[\w/.-]+\.(?:mjs|cjs|js|ts|json|ya?ml|sh)\b/i;
const VISIBLE = any([
  'button', 'buttons', 'link', 'links', 'card', 'cards', 'badge', 'label', 'labels', 'icon', 'icons', 'banner', 'header', 'footer', 'sidebar', 'menu', 'nav', 'navbar', 'tab', 'tabs',
  'modal', 'dialog', 'tooltip', 'toast', 'form', 'input', 'field', 'dropdown', 'avatar', 'chart', 'hero', 'section', 'layout', 'grid', 'component', 'components',
  'colour', 'colours', 'color', 'colors', 'spacing', 'padding', 'margin', 'gap', 'radius', 'corner', 'corners', 'border', 'shadow', 'font', 'fonts', 'typography', 'type scale', 'token', 'tokens',
  'theme', 'dark mode', 'light mode', 'style', 'styles', 'styling', 'hover', 'focus state', 'animation', 'animate', 'transition', 'motion', 'responsive', 'mobile', 'tablet', 'breakpoint',
  'wording', 'heading', 'headline', 'tagline', 'placeholder', 'empty state', 'error message', 'ui', 'ux', 'look', 'looks', 'visual', 'visuals', 'figma', 'storybook', 'story', 'stories', 'mockup', 'wireframe', 'wordmark', 'logo', 'typeface', 'illustration', 'image', 'images', 'wording',
  'view', 'views', 'page', 'pages', 'screen', 'screens', 'landing',
  'grey', 'gray', 'text', 'divider', 'separator', 'focus ring', 'underline', 'opacity', 'contrast', 'alignment', 'align', 'centered', 'centred', 'width', 'height', 'size',
  'lighter', 'darker', 'bigger', 'smaller', 'taller', 'wider', 'narrower', 'rounded', 'bolder', 'thinner', 'thicker', 'prominent', 'brighter', 'warmer', 'cooler', 'subtle',
  'bouton', 'boutons', 'lien', 'couleur', 'couleurs', 'espacement', 'police', 'libelle', 'texte', 'ecran', 'vue', 'maquette', 'composant', 'composants', 'icone',
]);
const FIGMA = any(['figma', 'canvas', 'maquette']);
const TO_CODE = any(['build', 'implement', 'bring', 'construis', 'implemente']);
const START_BUILD = /^(?:please\s+)?(?:fix|add|build|implement|create|make|change|update|remove|rename|refactor|ship|ajoute|corrige|cree|modifie|supprime)\b/i;

/** The views' ids of `flows.yml`, without a YAML reader: `- id:` lines before `actions:`. */
function viewIds(text) {
  const views = text.split(/^actions:/m)[0];
  return [...views.matchAll(/^\s*-\s*id:\s*([\w-]+)/gm)].map(match => match[1]);
}

/** What the project's design module knows, read once: specs, views, where the tokens and the library are. */
export function designOf(root, config) {
  const design = config?.design;
  if (!design) {
    return null;
  }
  const dir = design.dir ?? 'design';
  const agents = read(path.join(root, 'AGENTS.md'));
  const specs = readSpecs(root, design).filter(spec => spec.name);
  const index = read(path.join(root, dir, 'index.md'));
  const rows = [...index.matchAll(/^\|\s*([^|]+?)\s*\|\s*(draft|approved|built|as-is)\b/gm)].map(match => match[1]);
  const tokens = design.tokens?.file ?? /Tokens file:\s*`([^`]+)`/.exec(agents)?.[1] ?? null;
  const library = (design.storybook?.library ?? design.library ?? '').replace(/^\.\//, '').replace(/\/$/, '');
  return {
    dir,
    specs,
    listed: specs.length > 0 || rows.length > 0,
    views: viewIds(read(path.join(root, dir, 'flows.yml'))),
    tokens,
    // The tokens' names as the tokens file has them (`--line-frame`: "line-frame", and "line/frame" in a request).
    tokenNames: tokens ? [...new Set([...read(path.join(root, tokens)).matchAll(/--([a-z][\w-]*-[\w-]+)\s*:/g)].map(match => match[1]))] : [],
    library,
    // The Figma file's name, as the index gives it: its words are no component's and no view's ("Design fence landing").
    fileName: /Figma file:\s*"([^"]+)"/.exec(index)?.[1] ?? /Figma file:\s*"([^"]+)"/.exec(agents)?.[1] ?? '',
    // A design exists somewhere: a Figma file named, a library, stories.
    exists: /file key\s*`?\w{10,}/i.test(agents) || Boolean(design.fileKey) || (library && fs.existsSync(path.join(root, library))),
  };
}

/**
 * The way of a request: `{way, mode, playbooks, read, why, sure}`.
 * `way`: `ship`, `reflect`, `design`, `component`, `flows`, `foundation`,
 * `adopt`, or `none` (not a request: a thanks, an answer). `playbooks` are
 * design-fence's files, in the order to read them; `read`, the project's.
 */
export function route(root, request, config) {
  const text = plain(request ?? '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const design = designOf(root, config);
  const mode = MODES.find(([, test]) => test.test(text))?.[0] ?? 'full';
  const out = (way, playbooks, why, extra = {}) => ({way, mode: way === 'ship' ? mode : null, playbooks, read: [], why, sure: true, ...extra});

  if (words.length < 3 && !MODES.some(([, test]) => test.test(text)) && !REVIEW.test(text) && !/\bissue\s*#?\d+/i.test(text)) {
    return out('none', [], 'not a request');
  }
  if (REVIEW.test(text) && !START_BUILD.test(text)) {
    return out('reflect', ['reflect.md'], 'a review of work done');
  }
  if (!design) {
    return out('ship', ['ship.md'], 'the design module is off: every request goes to ship');
  }
  if (!design.listed) {
    return design.exists
      ? out('adopt', ['adopt.md'], `${design.dir}/index.md lists nothing yet, and a design exists`)
      : out('foundation', ['foundation.md'], `${design.dir}/index.md lists nothing yet, and there is no design`);
  }
  if (mode === 'status' || mode === 'land') {
    return out('ship', ['ship.md'], `"${mode}"`);
  }

  // The project's own names in the request: components (their specs), views, the tokens file. A request written
  // as a paragraph names things in passing: the Figma file by its name, a page of it to work on.
  const own = design.fileName ? text.replace(new RegExp(escape(plain(design.fileName)), 'giu'), ' ') : text;
  const named = design.specs.filter(spec => any([escape(plain(spec.name)), `df-${slug(spec.name)}`, escape(slug(spec.name))]).test(own));
  const views = design.views.filter(id => any([escape(id)]).test(own));
  const tokens = design.tokenNames.filter(name => any([escape(name), escape(name.replace('-', '/'))]).test(own));
  const places = FIGMA.test(text) ? own.replace(FIGMA_PAGE, ' ') : own;
  const flow = (FLOW_NEW.test(places) || FLOW_MOVES.test(places)) && !CODE.test(text);
  const code = CODE.test(text);
  const said = VISIBLE.test(text);
  // Sure it is something users see: the project's own name for it with no sign of other work, a token, Figma, a
  // view that is new or moves. Sure it is not: signs of other work. Otherwise a guess, said as one: a component's
  // name is often a common word ("the outline command", "a link checker"), and no list holds every visual word.
  const sureVisible = (named.length > 0 && !code) || tokens.length > 0 || FIGMA.test(text) || flow;
  if (!sureVisible && (code || !(named.length || said))) {
    return out('ship', ['ship.md'], 'nothing users see is named', {sure: code && !said && !named.length});
  }

  const files = [`${design.dir}/index.md`];
  for (const spec of named) {
    files.push(spec.file);
    const folder = design.library && `${design.library}/${slug(spec.name)}`;
    if (folder && fs.existsSync(path.join(root, folder))) {
      files.push(`${folder}/`);
    }
  }
  if (design.tokens && (tokens.length || /\b(token|tokens|colou?rs?|couleurs?|spacing|espacement|radius|font|fonts|police|typeface)\b/i.test(text))) {
    files.push(design.tokens);
  }
  if (flow || views.length) {
    files.push(`${design.dir}/flows.yml`);
  }
  const state = named.map(spec => `${spec.name}: ${spec.status}`).join(', ');

  // An approved design waiting to be built: straight to the library. A component already built may be named with it
  // (the Button a Command places): sure when the request says the design is approved, a guess otherwise.
  const waiting = named.filter(spec => spec.status === 'approved' && !spec.story);
  if (waiting.length && TO_CODE.test(text) && !/^(?:re)?design\b/i.test(text)) {
    const alone = waiting.length === named.length;
    return out('component', ['component.md'], `${waiting.map(spec => spec.name).join(', ')}: approved, to build`, {read: files, sure: alone || /\bapproved\b/i.test(text)});
  }
  if (flow) {
    return out('flows', ['flows.md', 'design.md'], 'a view, a route or a path is new or moves', {read: files});
  }
  return out('design', ['design.md'], named.length ? `something users see (${state})` : 'something users see', {read: files, sure: sureVisible});
}

/** The route as the few lines an agent reads; '' for `none`. `home`: design-fence's folder, relative to the root. */
export function routeText(result, home = '.agents/design-fence') {
  if (result.way === 'none') {
    return '';
  }
  // design-fence's own repository is its own home: no folder before its files.
  const at = name => `${home ? `${home}/` : ''}playbooks/${name}`;
  const [first, ...then] = result.playbooks;
  const lines = [`design-fence route: ${result.way}${result.mode && result.mode !== 'full' ? ` (${result.mode})` : ''}: ${result.why}.`, `Read ${at(first)} before the first step${then.length ? `, then ${then.map(at).join(', ')}` : ''}.`];
  if (result.read.length) {
    // The wording is measured. "Read only: …" can be read as "do not write" (three GPT 6.1 Sol runs given it, on a
    // wrong route, wrote nothing in the project; not proven to be the cause). "To read before the rest" invites the
    // rest: the same model then read the project's every document and cost twice as much on a small request.
    lines.push(`In the project, read these and no others, unless a step of the playbook names one: ${result.read.join(', ')}.`);
  }
  if (['design', 'flows', 'component'].includes(result.way)) {
    lines.push(`Before any Figma call: ${at('figma.md')}, "Connect". Before committing code: ${at('reflect.md')}.`);
  } else if (result.way === 'ship') {
    lines.push(`Before committing code: ${at('reflect.md')}.`);
  }
  if (!result.sure) {
    lines.push(
      result.way === 'ship'
        ? `Unsure from the words alone: if it changes anything users see, it is ${at('design.md')} first.`
        : result.way === 'component'
          ? `Unsure from the words alone: if a design is to change too (a component already built is named), it is ${at('design.md')} first.`
          : `Unsure from the words alone: if nothing users see changes, it is ${at('ship.md')} instead.`,
    );
  }
  return lines.join('\n');
}
