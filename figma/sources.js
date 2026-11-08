/**
 * What a Figma file's design system is made of, for `design/index.md`,
 * "Sources" (`playbooks/start.md`, "Adopt", step 1, and `design.md`, step 1):
 * run once through the bridge with `figma_execute`, as this file's text
 * followed by
 *
 *     return await sources();
 *
 * It reads only, and returns:
 *
 * - `local`: how many component sets and components the file defines;
 * - `remote`: the library components the file uses, by set (or component)
 *   name, with how many of its variants are in use and its key, which
 *   `figma.importComponentSetByKeyAsync` (or `importComponentByKeyAsync`)
 *   takes. A library's other components cannot be listed from the file:
 *   what is not here was never imported;
 * - `variables`: the file's own collections, and those of the libraries
 *   enabled for it, with their library's name.
 *
 * It walks every instance in the file once, which takes a few seconds on a
 * large file: give `figma_execute` a timeout of 60000.
 */
async function sources() {
  await figma.loadAllPagesAsync();
  const local = {sets: 0, components: 0};
  const remote = {};
  const seen = new Set();
  for (const page of figma.root.children) {
    for (const node of page.findAllWithCriteria({types: ['COMPONENT_SET', 'COMPONENT']})) {
      if (node.type === 'COMPONENT_SET') {
        local.sets++;
      } else if (!(node.parent && node.parent.type === 'COMPONENT_SET')) {
        local.components++;
      }
    }
    for (const instance of page.findAllWithCriteria({types: ['INSTANCE']})) {
      const main = await instance.getMainComponentAsync();
      if (!main || !main.remote || seen.has(main.id)) {
        continue;
      }
      seen.add(main.id);
      const set = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;
      const name = set ? set.name : main.name;
      remote[name] = remote[name] || {key: set ? set.key : main.key, kind: set ? 'set' : 'component', variants: 0};
      remote[name].variants++;
    }
  }
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let libraries = [];
  try {
    libraries = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  } catch (e) {
    // Needs the teamlibrary permission, which a plugin may not have.
  }
  return {
    local,
    remote: Object.keys(remote)
      .sort()
      .map(name => `${name} (${remote[name].kind}, ${remote[name].variants} in use) ${remote[name].key}`),
    variables: {
      local: collections.map(c => `${c.name} (${c.variableIds.length})`),
      libraries: libraries.map(c => `${c.libraryName} / ${c.name}`),
    },
  };
}
