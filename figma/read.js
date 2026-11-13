/**
 * A component's design as Figma holds it, for `playbooks/component.md`,
 * step 1, the one read a build is made from: run through the bridge with
 * `figma_execute`, as this file's text followed by
 *
 *     return await readDesign('<node id>');
 *
 * It reads only. On a component or a component set it returns
 * `{node, name, properties, variants}`:
 *
 * - `properties`: the component's properties, each with its type, its default
 *   and, for a variant property, its values;
 * - `variants`: the first variant by name, as a tree of its parts; then each
 *   other as `{name, sameAs, except}`: what it sets otherwise than the first,
 *   part by part (a part by its name; null: not set in this one).
 *
 * A part has its name, its type, and only what is set on it: `layout`
 * (horizontal, vertical or none) with `gap`, `padding` (as CSS orders it),
 * `justify` and `align`; `width` and `height` (hug, fill, or the size);
 * `fill`, `stroke`, `strokeWeight`, `radius`, `opacity`, `effects`; a text's
 * `text`, `style` and `font`; an instance's `component` and the `properties`
 * it sets; `hidden`; and `follows`, the component's property that sets its
 * text, its visibility or its instance.
 *
 * A value bound to a variable is the variable's name ("space/4"); one that is
 * not is given raw (16, "#3b3b40"). An instance's insides are its own
 * component's and are not read.
 */
async function readDesign(nodeId) {
  const root = await figma.getNodeByIdAsync(nodeId);
  if (!root) {
    return {node: nodeId, error: 'not found'};
  }
  if (root.type !== 'COMPONENT' && root.type !== 'COMPONENT_SET') {
    return {node: nodeId, name: root.name, error: `a ${root.type.toLowerCase()}, not a component or a component set`};
  }

  const mixed = value => typeof value === 'symbol';
  const round = value => Math.round(value * 100) / 100;
  const hex = ({r, g, b}) => `#${[r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
  const names = new Map();
  /** The name of the variable an alias (or the first of a list of them) points to, or null. */
  const variable = async alias => {
    const one = Array.isArray(alias) ? alias[0] : alias;
    if (!one || !one.id) return null;
    if (!names.has(one.id)) {
      const found = await figma.variables.getVariableByIdAsync(one.id);
      names.set(one.id, found ? found.name : null);
    }
    return names.get(one.id);
  };
  /** A node's value for `key`: its variable's name when bound, or the value itself. */
  const value = async (node, key, raw = node[key]) => (await variable((node.boundVariables || {})[key])) ?? (typeof raw === 'number' ? round(raw) : raw);
  const strip = name => name.replace(/#[^#]*$/, '');

  const paints = async list => {
    if (mixed(list)) return 'mixed';
    const out = [];
    for (const paint of Array.isArray(list) ? list : []) {
      if (paint.visible === false) continue;
      if (paint.type !== 'SOLID') {
        out.push(paint.type.toLowerCase().replace(/_/g, ' '));
        continue;
      }
      const bound = await variable((paint.boundVariables || {}).color);
      const alpha = paint.opacity !== undefined && paint.opacity < 1 ? ` ${Math.round(paint.opacity * 100)}%` : '';
      out.push(`${bound ?? hex(paint.color)}${alpha}`);
    }
    return out.length > 1 ? out : out[0];
  };

  /** Four sides as CSS writes them: one value, two (vertical, horizontal), or four. */
  const sides = ([top, right, bottom, left]) => (top === bottom && left === right ? (top === left ? top : [top, left]) : [top, right, bottom, left]);
  const set = (out, key, v) => {
    if (v !== undefined && v !== null && v !== 0 && !(Array.isArray(v) && !v.length)) out[key] = v;
  };

  const sizing = async (node, out) => {
    for (const [axis, key] of [['width', 'layoutSizingHorizontal'], ['height', 'layoutSizingVertical']]) {
      const how = node[key] || 'FIXED';
      out[axis] = how === 'HUG' ? 'hug' : how === 'FILL' ? 'fill' : await value(node, axis);
      for (const limit of ['min', 'max']) {
        const name = `${limit}${axis[0].toUpperCase()}${axis.slice(1)}`;
        if (typeof node[name] === 'number') out[name] = await value(node, name);
      }
    }
  };

  const type = async (node, out) => {
    const style = typeof node.textStyleId === 'string' && node.textStyleId ? await figma.getStyleByIdAsync(node.textStyleId) : null;
    if (style) out.style = style.name;
    /** The variable bound to one of `keys`, on the text first, then on its style; or the raw value. */
    const from = async (keys, raw) => {
      for (const holder of [node, style]) {
        for (const key of keys) {
          const bound = holder ? await variable((holder.boundVariables || {})[key]) : null;
          if (bound) return bound;
        }
      }
      return raw;
    };
    const font = {};
    const name = mixed(node.fontName) ? null : node.fontName;
    set(font, 'family', await from(['fontFamily'], name ? name.family : 'mixed'));
    set(font, 'weight', await from(['fontWeight', 'fontStyle'], name ? name.style : 'mixed'));
    set(font, 'size', await from(['fontSize'], mixed(node.fontSize) ? 'mixed' : round(node.fontSize)));
    const unit = v => (!v || mixed(v) || v.unit === 'AUTO' || !v.value ? undefined : `${round(v.value)}${v.unit === 'PERCENT' ? '%' : 'px'}`);
    set(font, 'lineHeight', await from(['lineHeight'], unit(node.lineHeight)));
    set(font, 'letterSpacing', await from(['letterSpacing'], unit(node.letterSpacing)));
    out.font = font;
    if (node.textAlignHorizontal && node.textAlignHorizontal !== 'LEFT') out.textAlign = node.textAlignHorizontal.toLowerCase();
    if (node.textCase && !mixed(node.textCase) && node.textCase !== 'ORIGINAL') out.case = node.textCase.toLowerCase();
    if (node.textDecoration && !mixed(node.textDecoration) && node.textDecoration !== 'NONE') out.decoration = node.textDecoration.toLowerCase();
    if (node.textTruncation === 'ENDING') out.truncate = node.maxLines || true;
  };

  const effects = async node => {
    const out = [];
    for (const effect of Array.isArray(node.effects) ? node.effects : []) {
      if (effect.visible === false) continue;
      const bound = effect.boundVariables || {};
      const one = {type: effect.type.toLowerCase().replace(/_/g, ' ')};
      if (effect.offset) {
        set(one, 'x', (await variable(bound.offsetX)) ?? round(effect.offset.x));
        set(one, 'y', (await variable(bound.offsetY)) ?? round(effect.offset.y));
      }
      set(one, 'blur', (await variable(bound.radius)) ?? round(effect.radius ?? 0));
      set(one, 'spread', (await variable(bound.spread)) ?? round(effect.spread ?? 0));
      if (effect.color) one.color = (await variable(bound.color)) ?? `${hex(effect.color)}${effect.color.a < 1 ? ` ${Math.round(effect.color.a * 100)}%` : ''}`;
      out.push(one);
    }
    return out;
  };

  const part = async (node, top, parent) => {
    const out = top ? {name: node.name} : {name: node.name, type: node.type.toLowerCase().replace(/_/g, ' ')};
    if (node.visible === false) out.hidden = true;
    const references = Object.entries(node.componentPropertyReferences || {});
    if (references.length) out.follows = Object.fromEntries(references.map(([what, property]) => [what === 'characters' ? 'text' : what === 'mainComponent' ? 'component' : what, strip(property)]));
    if (parent && (parent.layoutMode === undefined || parent.layoutMode === 'NONE' || node.layoutPositioning === 'ABSOLUTE')) {
      if (node.layoutPositioning === 'ABSOLUTE') out.absolute = true;
      out.x = round(node.x ?? 0);
      out.y = round(node.y ?? 0);
    }
    await sizing(node, out);
    if (node.type === 'INSTANCE' && !top) {
      const main = await node.getMainComponentAsync();
      out.component = main ? (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name) : null;
      const properties = Object.entries(node.componentProperties || {});
      if (properties.length) out.properties = Object.fromEntries(properties.map(([name, property]) => [strip(name), property.value]));
      return out;
    }
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      out.layout = node.layoutWrap === 'WRAP' ? `${node.layoutMode.toLowerCase()}, wrapping` : node.layoutMode.toLowerCase();
      const between = node.primaryAxisAlignItems === 'SPACE_BETWEEN';
      if (!between) set(out, 'gap', await value(node, 'itemSpacing'));
      if (node.layoutWrap === 'WRAP') set(out, 'rowGap', await value(node, 'counterAxisSpacing'));
      const padding = [];
      for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) padding.push(await value(node, side));
      set(out, 'padding', sides(padding));
      const justify = {CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between'}[node.primaryAxisAlignItems];
      if (justify) out.justify = justify;
      const align = {CENTER: 'center', MAX: 'end', BASELINE: 'baseline'}[node.counterAxisAlignItems];
      if (align) out.align = align;
    } else if ('children' in node && node.type !== 'BOOLEAN_OPERATION') {
      out.layout = 'none';
    }
    set(out, 'fill', await paints(node.fills));
    const stroke = await paints(node.strokes);
    if (stroke) {
      out.stroke = stroke;
      if (mixed(node.strokeWeight)) {
        const weights = [];
        for (const side of ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight']) weights.push(await value(node, side));
        out.strokeWeight = sides(weights);
      } else {
        out.strokeWeight = (await variable((node.boundVariables || {}).strokeWeight)) ?? (await value(node, 'strokeTopWeight', node.strokeWeight));
      }
      if (node.strokeAlign && node.strokeAlign !== 'INSIDE') out.strokeAlign = node.strokeAlign.toLowerCase();
    }
    if ('cornerRadius' in node) {
      const corners = [];
      for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']) corners.push(await value(node, corner, typeof node[corner] === 'number' ? node[corner] : mixed(node.cornerRadius) ? undefined : node.cornerRadius));
      set(out, 'radius', corners.every(corner => corner === corners[0]) ? corners[0] : corners);
    }
    if (typeof node.opacity === 'number' && node.opacity < 1) out.opacity = await value(node, 'opacity');
    set(out, 'effects', await effects(node));
    if (node.type === 'TEXT') {
      out.text = node.characters.length > 120 ? `${node.characters.slice(0, 120)}…` : node.characters;
      await type(node, out);
    } else if ('children' in node && node.type !== 'BOOLEAN_OPERATION') {
      const children = [];
      for (const child of node.children) children.push(await part(child, false, node));
      set(out, 'children', children);
    }
    return out;
  };

  // A variant has no definitions of its own, and reading them throws: they are its set's.
  const owner = root.type === 'COMPONENT' && root.parent && root.parent.type === 'COMPONENT_SET' ? root.parent : root;
  const properties = {};
  for (const [name, definition] of Object.entries(owner.componentPropertyDefinitions || {})) {
    properties[strip(name)] = {type: definition.type.toLowerCase().replace(/_/g, ' '), default: definition.defaultValue, ...(definition.variantOptions ? {values: definition.variantOptions} : {})};
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /** What part `b` sets otherwise than `a`: its own value, or null for what only `a` sets; its parts likewise, by name. */
  const except = (a, b) => {
    const out = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (key !== 'name' && key !== 'children' && !same(a[key], b[key])) out[key] = key in b ? b[key] : null;
    }
    const [before, after] = [a.children || [], b.children || []];
    const named = new Set(after.map(child => child.name)).size === after.length;
    if (!named || before.length !== after.length || before.some((child, i) => child.name !== after[i].name || child.type !== after[i].type)) {
      // Other parts, or parts a name does not tell apart: given whole.
      if (!same(before, after)) out.children = after;
    } else {
      const changed = after.map((child, i) => ({name: child.name, ...except(before[i], child)})).filter(child => Object.keys(child).length > 1);
      if (changed.length) out.children = changed;
    }
    return out;
  };
  const variants = [];
  for (const variant of root.type === 'COMPONENT_SET' ? root.children : [root]) {
    const whole = await part(variant, true, null);
    variants.push(variants.length ? {name: whole.name, sameAs: variants[0].name, except: except(variants[0], whole)} : whole);
  }
  return {node: nodeId, name: root.name, properties, variants};
}
