/**
 * The tokens a component's design is bound to, for `playbooks/component.md`,
 * step 5, and for `design-fence design`, which holds the component's code to
 * them: run through the bridge with `figma_execute`, as this file's text
 * followed by
 *
 *     return await bound('<node id>');
 *
 * It reads only. On a component or a component set it returns
 * `{node, name, tokens, instances}`:
 *
 * - `tokens`: the names of the variables its own layers are bound to, every
 *   variant together, sorted: fills, strokes and effects, padding and gaps,
 *   radius, stroke weight, sizes, type (through a text style too);
 * - `instances`: the components it places. Their insides are their own
 *   component's, recorded with it; only their names are given here.
 *
 * A set's own frame is left out: its padding and gap arrange the variants on
 * the canvas and are no part of the component.
 */
async function bound(nodeId) {
  const root = await figma.getNodeByIdAsync(nodeId);
  if (!root) {
    return {node: nodeId, error: 'not found'};
  }
  if (root.type !== 'COMPONENT' && root.type !== 'COMPONENT_SET') {
    return {node: nodeId, name: root.name, error: `a ${root.type.toLowerCase()}, not a component or a component set`};
  }
  const tokens = new Set();
  const instances = new Set();
  const names = new Map();
  const add = async alias => {
    if (!alias || !alias.id) return;
    if (!names.has(alias.id)) {
      const variable = await figma.variables.getVariableByIdAsync(alias.id);
      names.set(alias.id, variable ? variable.name : null);
    }
    if (names.get(alias.id)) tokens.add(names.get(alias.id));
  };
  const addAll = async bindings => {
    for (const value of Object.values(bindings || {})) {
      for (const alias of Array.isArray(value) ? value : [value]) await add(alias);
    }
  };

  const walk = async (node, top) => {
    if (node.type === 'INSTANCE' && !top) {
      const main = await node.getMainComponentAsync();
      instances.add(main ? (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name) : node.name);
      return;
    }
    await addAll(node.boundVariables);
    for (const key of ['fills', 'strokes', 'effects', 'layoutGrids']) {
      const list = node[key];
      if (Array.isArray(list)) for (const item of list) await addAll(item.boundVariables);
    }
    if (node.type === 'TEXT' && typeof node.textStyleId === 'string' && node.textStyleId) {
      const style = await figma.getStyleByIdAsync(node.textStyleId);
      if (style) await addAll(style.boundVariables);
    }
    if ('children' in node) {
      for (const child of node.children) await walk(child, false);
    }
  };
  for (const start of root.type === 'COMPONENT_SET' ? root.children : [root]) {
    await walk(start, true);
  }
  return {node: nodeId, name: root.name, tokens: [...tokens].sort(), instances: [...instances].sort()};
}
