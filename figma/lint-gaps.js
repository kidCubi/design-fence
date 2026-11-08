/**
 * The checks `figma_lint_design` does not make, for `playbooks/design.md`,
 * step 3: run through the bridge with `figma_execute`, as this file's text
 * followed by
 *
 *     return await lintGaps('<node id>', {properties: ['Size', 'State', …]});
 *
 * (at the end of the build call). It reads only. On a component, a
 * component set or a frame, it returns what breaks a rule, as
 * `{node, total, findings}` (at most 50 findings):
 *
 * - `unbound-spacing`: an auto-layout padding or gap above 0 not bound to a
 *   variable;
 * - `unbound-radius`, `unbound-stroke`: a corner radius or a stroke weight
 *   above 0 not bound to a variable (one finding for four equal corners);
 * - `default-name`: a layer of the component's own with a name Figma gives
 *   (Frame 2, Text, Rectangle 4);
 * - `invisible-stroke`, `invisible-line`: a stroke, or a vector or line's
 *   fill, of the same colour as what is behind it, instances included (a
 *   border token that matches the surface it sits on);
 * - `stale-paint`: a fill or stroke bound to a variable that shows another
 *   colour than the variable's (a script that rebinds a paint to the
 *   variable it already had keeps the colour the script gave it);
 * - `no-description`: a component (or its set) with an empty description;
 * - `property-not-in-spec`, `property-missing`: the component's properties
 *   against the names the spec lists (left out when `properties` is not
 *   given).
 *
 * Instances inside the node are left out of the other checks (their values
 * are their component's, linted on its own), and so are vectors, hidden
 * layers, and layers whose name starts with `.` or `_` (artwork, by the
 * convention figmalint and Figma use).
 */
async function lintGaps(nodeId, spec = {}) {
  const root = await figma.getNodeByIdAsync(nodeId);
  if (!root) {
    return {node: nodeId, error: 'not found'};
  }
  const findings = [];
  const add = (rule, node, detail = {}) => findings.push({rule, id: node.id, name: node.name, ...detail});
  const bound = (node, prop) => Boolean(node.boundVariables && node.boundVariables[prop]);

  const SPACING = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing'];
  const RADII = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
  const SKIP = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'POLYGON']);
  const DEFAULT_NAME =
    /^(Frame|Group|Rectangle|Ellipse|Line|Vector|Polygon|Star|Text|Section|Slice|Component|Instance|Union|Subtract|Intersect|Exclude)( \d+)?$/;
  const skipped = node => node.visible === false || /^[._]/.test(node.name);

  const walk = (node, depth) => {
    if (depth > 0 && (skipped(node) || node.type === 'INSTANCE')) {
      return;
    }
    if (depth > 0 && DEFAULT_NAME.test(node.name)) {
      add('default-name', node);
    }
    if (SKIP.has(node.type)) {
      return;
    }
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      const spacing = node.layoutWrap === 'WRAP' ? [...SPACING, 'counterAxisSpacing'] : SPACING;
      for (const prop of spacing) {
        if (node[prop] > 0 && !bound(node, prop)) {
          add('unbound-spacing', node, {prop, value: node[prop]});
        }
      }
    }
    // A component set's own radius is Figma's frame around its variants, not part of a component.
    const radii = node.type === 'COMPONENT_SET' ? [] : RADII.filter(prop => node[prop] > 0 && !bound(node, prop));
    if (radii.length === 4 && typeof node.cornerRadius === 'number') {
      add('unbound-radius', node, {prop: 'cornerRadius', value: node.cornerRadius});
    } else {
      for (const prop of radii) {
        add('unbound-radius', node, {prop, value: node[prop]});
      }
    }
    if (node.strokes && node.strokes.length && typeof node.strokeWeight === 'number' && node.strokeWeight > 0) {
      if (!bound(node, 'strokeWeight') && !bound(node, 'strokeTopWeight')) {
        add('unbound-stroke', node, {value: node.strokeWeight});
      }
    }
    if ('children' in node) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  };
  walk(root, 0);

  // Invisible lines: the colour of a stroke (or of a vector's fill) against the nearest solid fill behind it.
  const solid = paints => {
    const p = Array.isArray(paints) ? paints.filter(x => x.visible !== false && x.type === 'SOLID') : [];
    const top = p[p.length - 1];
    return top && (top.opacity === undefined || top.opacity === 1) ? top.color : null;
  };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  let behind = null;
  for (let p = root.parent; p && !behind; p = p.parent) {
    behind = 'fills' in p ? solid(p.fills) : null;
  }
  const look = (node, back) => {
    if (skipped(node)) {
      return;
    }
    const own = solid(node.fills);
    const line = node.type === 'VECTOR' || node.type === 'LINE';
    const stroke = node.strokes && node.strokes.length && node.strokeWeight !== 0 ? solid(node.strokes) : null;
    const against = own && !line ? own : back;
    if (stroke && against && hex(stroke) === hex(against)) {
      add('invisible-stroke', node, {color: hex(stroke)});
    }
    if (line && own && back && hex(own) === hex(back)) {
      add('invisible-line', node, {color: hex(own)});
    }
    if ('children' in node) {
      for (const child of node.children) {
        look(child, own && !line ? own : back);
      }
    }
  };
  look(root, behind);

  // Stale paints: a paint bound to a variable that shows another colour than the variable's. Figma keeps
  // the colour a script gave the paint when the binding did not change (rebinding the same variable).
  const own = [];
  const gather = (node, depth) => {
    if (depth > 0 && (skipped(node) || node.type === 'INSTANCE')) {
      return;
    }
    own.push(node);
    if ('children' in node) {
      for (const child of node.children) {
        gather(child, depth + 1);
      }
    }
  };
  gather(root, 0);
  for (const node of own) {
    for (const prop of ['fills', 'strokes']) {
      for (const p of Array.isArray(node[prop]) ? node[prop] : []) {
        const id = p.type === 'SOLID' && p.boundVariables && p.boundVariables.color && p.boundVariables.color.id;
        const variable = id && (await figma.variables.getVariableByIdAsync(id));
        const value = variable && variable.resolveForConsumer(node).value;
        if (value && typeof value === 'object' && hex(value) !== hex(p.color)) {
          add('stale-paint', node, {prop, variable: variable.name, shows: hex(p.color), value: hex(value)});
        }
      }
    }
  }

  const component =
    root.type === 'COMPONENT' && root.parent && root.parent.type === 'COMPONENT_SET' ? root.parent : root;
  if (component.type === 'COMPONENT' || component.type === 'COMPONENT_SET') {
    if (!component.description || !component.description.trim()) {
      add('no-description', component);
    }
    if (spec.properties) {
      const names = Object.keys(component.componentPropertyDefinitions || {}).map(key => key.split('#')[0]);
      for (const name of names.filter(n => !spec.properties.includes(n))) {
        add('property-not-in-spec', component, {property: name});
      }
      for (const name of spec.properties.filter(n => !names.includes(n))) {
        add('property-missing', component, {property: name});
      }
    }
  }

  return {node: `${root.name} (${root.id})`, total: findings.length, findings: findings.slice(0, 50)};
}
