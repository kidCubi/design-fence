// The audit of a round's designs (bench/README.md), the same for both arms: run in Figma through figma-console's
// `figma_execute`, outside the measured runs. It reads every page named "Bench …" and changes nothing. Per page:
// frames without auto-layout, values not bound to a variable (fills, strokes, padding, gaps, radii), texts whose size
// or colour is not bound, and the file's components it reuses. A design passes with no unbound value and no frame
// without auto-layout, as the first rounds' did.
await figma.loadAllPagesAsync();
const pages = figma.root.children.filter(p => p.name.startsWith('Bench '));
const out = [];
for (const p of pages) {
  const all = p.findAll(() => true);
  const unbound = [];
  const instances = new Set();
  let [noAuto, frames, comps, texts, textUnbound] = [0, 0, 0, 0, 0];
  for (const n of all) {
    if (n.type === 'INSTANCE') {
      const mc = await n.getMainComponentAsync();
      instances.add(mc?.parent?.type === 'COMPONENT_SET' ? mc.parent.name : mc?.name);
    }
    if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') comps++;
    if (['FRAME', 'COMPONENT', 'INSTANCE'].includes(n.type)) {
      frames++;
      if (n.layoutMode === 'NONE' && n.type !== 'INSTANCE') noAuto++;
      const bv = n.boundVariables ?? {};
      if (n.layoutMode && n.layoutMode !== 'NONE' && n.type !== 'INSTANCE') {
        for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing'])
          if (n[k] > 0 && !bv[k]) unbound.push(`${n.name}.${k}=${n[k]}`);
      }
      if (n.type !== 'INSTANCE') {
        for (const f of n.fills ?? [])
          if (f.type === 'SOLID' && f.visible !== false && !f.boundVariables?.color) unbound.push(`${n.name}.fill`);
        for (const f of n.strokes ?? [])
          if (f.type === 'SOLID' && !f.boundVariables?.color) unbound.push(`${n.name}.stroke`);
        if (n.strokes?.length && !bv.strokeWeight && !bv.strokeTopWeight && !bv.strokeLeftWeight)
          unbound.push(`${n.name}.strokeWeight`);
        if (n.cornerRadius > 0 && !bv.topLeftRadius) unbound.push(`${n.name}.radius`);
      }
    }
    if (n.type === 'TEXT') {
      texts++;
      if (!n.boundVariables?.fontSize || !(n.fills ?? []).every(f => f.boundVariables?.color)) textUnbound++;
    }
  }
  out.push({
    page: p.name,
    passes: unbound.length === 0 && noAuto === 0,
    nodes: all.length,
    components: comps,
    frames,
    framesWithoutAutoLayout: noAuto,
    unboundCount: unbound.length,
    unbound: unbound.slice(0, 6),
    texts,
    textsUnbound: textUnbound,
    reuses: [...instances].filter(Boolean),
  });
}
return out;
