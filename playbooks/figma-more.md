# Working in Figma: what is rarely needed

The parts of `figma.md` most sessions never use: fixing a connection, importing images, capturing HTML into Figma. Read the section the work needs.

## Not connected

`figma_get_status` says `transport.active: "none"`: stop and tell the human, with the fix.

1. Figma Desktop (not the browser), the file open.
2. Plugins → Development → Figma Desktop Bridge → Run; wait a few seconds.
3. Not in the menu: Plugins → Development → Import plugin from manifest → `~/.figma-console-mcp/plugin/manifest.json` (hidden folder on macOS: Cmd+Shift+G in the dialog).
4. Still failing: the server falls back to ports 9224–9232 when 9223 is taken, and old servers from other sessions hold ports (`otherInstances` in the status, `lsof -i :9223`). Re-import the manifest, restart the plugin, then restart the agent's session.

## Images

The bridge plugin may fail to load images (`figma_set_image_fill` times out; `createImageAsync` and `fetch` blocked by its network allowlist; base64 typed into code gets corrupted). Then use the official Figma MCP: `create_session`, `upload_assets` with `nodeIds` set to the target nodes, and `curl -F file=@…` each image to its `submitUrl`. Upload serially: bursts return 504s; retry with fresh URLs, re-encode stubborn JPEGs to PNG. Check the fills afterwards through the bridge.

## Capturing HTML into Figma (`html_to_figma`)

Prepare the HTML so the result needs no cleanup:

- **Names** come only from `aria-label`; the importer prefixes roles ("Button - …") and adds wrapper frames for margins and every text run.
- **CSS grid becomes a Figma grid; flex-wrap gets no auto layout.** Convert to flex rows and columns first; overlapping children become absolute layers.
- **Colours are auto-bound to any local variable of the exact same value**, mode-dependent ones included. Nudge every colour by 1/255 so nothing matches, then bind by role.
- SVG `viewBox` is ignored (scale paths to pixels); a canvas must become an `<img>`; icon fonts the file lacks must become SVG or library instances.
- Nodes land beside the target node, not inside it: move them afterwards.
- A long bridge script can be stored once with `figma.root.setPluginData` and run from there; clear it afterwards.
