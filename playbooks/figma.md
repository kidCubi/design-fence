# Working in Figma

A playbook for any agent with the figma-console MCP server: connect (and fix the connection), read and change nodes and variables, verify without screenshot loops, export the design system's snapshots, import images, capture HTML into Figma. Use it before any Figma read or write, when the bridge is not connected, or when exporting variables or components to the repo.

The project's `AGENTS.md` names the file (file key, pages) and where its snapshots and exporters are. This playbook is how to work in it.

## Connect first, over the bridge only

1. Call `figma_get_status` with `probe: true` before the first Figma call of the session, and again only when a call fails.
2. Healthy: `setup.valid: true`, `transport.active: "websocket"`, the probe succeeds, and the connected file is the one `AGENTS.md` names. Check the file name before writing: several files may have the plugin open.
3. Not connected (`transport.active: "none"`): **stop and tell the human**, with the fix. Do not fall back to REST tools or another server.
   1. Figma Desktop (not the browser), the file open.
   2. Plugins → Development → Figma Desktop Bridge → Run; wait a few seconds.
   3. Not in the menu: Plugins → Development → Import plugin from manifest → `~/.figma-console-mcp/plugin/manifest.json` (hidden folder on macOS: Cmd+Shift+G in the dialog).
   4. Still failing: the server falls back to ports 9224–9232 when 9223 is taken, and old servers from other sessions hold ports (`otherInstances` in the status, `lsof -i :9223`). Re-import the manifest, restart the plugin, then restart the agent's session.
4. The connection can drop between two calls. When a call fails with "Cannot connect", check the status again rather than retrying blindly.

## Calls, cheaply

Every response stays in the conversation and is paid again on each later turn, and every script sent is written out by the agent. One run (a new component, from grounding to the gate, with no snapshot) took 12 calls and about 24k tokens, counted from the characters sent and returned; the same result fits in about 4 calls and 8k when what follows and `design.md`, step 3, are kept to.

- Read the repo's snapshot, not Figma, for what it holds. Grounding through Figma was more than half of that run.
- Load the schemas of the tools the work needs in one search at the start (`figma_get_status`, `figma_execute`, `figma_lint_design`, `figma_capture_screenshot`), not one at a time.
- Return only what the next decision needs. Compute in the plugin what needs only an answer (a free spot, a count, a match) instead of returning the list to compute it from.
- One call that changes and verifies (it returns the values it set, and lints what it built) instead of a change, then a read, then a lint.
- Put the work where it will be judged right the first time (on the product's surface, every property set explicitly), so no call is spent fixing the setup.

## Read and verify through the bridge

- Use `figma_execute` (the plugin API) to read and change nodes and variables, and `figma_get_variables` for variables. **Not** the REST-backed audit tools (`figma_audit_design_system_report`, `figma_get_design_system_summary`): they serve stale or empty data (0 tokens while dozens exist), and their failure says nothing about the file.
- The lint tools that run through the bridge are sound: `figma_lint_design` and `figma_audit_component_accessibility`. Give them a `nodeId` and their `rules`; how the design loop uses them, with design-fence's `figma/lint-gaps.js` for what they do not check, is in `design.md`, step 3.
- One `figma_execute` that returns what matters beats several small calls: sizes, positions, auto-layout settings, bound variables by name, text overflow, instance counts. That is how a result is verified.
- Instances: change their text and variants with `figma_set_instance_properties`; direct text edits on instances fail silently.
- Before a destructive change, read the target. After a failed attempt, delete what it left behind (partial frames, empty pages) before retrying.

## Screenshots: one per phase, for the human

At most **one** screenshot (`figma_take_screenshot`, `figma_capture_screenshot`, `figma_get_component_image`, `get_screenshot`) per phase of the work, at its end, to show the human. Within a phase, verify by reading properties as above, never by a loop of screenshots. This overrides the figma-console server's own advice to screenshot after every change. Nothing enforces it in every tool: hold to it.

## Variables and snapshots

- What the repo's snapshot already holds is read from the snapshot, not from Figma: the bridge is for changing, linting and exporting.
- Before changing what exists, and at an approval, save a named version: `await figma.saveVersionHistoryAsync('<title>')` returns its id (`design.md`, steps 3 and 5).
- Bind a paint with the variable's own colour: `figma.variables.setBoundVariableForPaint({type: 'SOLID', color: <the variable's value for the node>}, 'color', variable)`. A placeholder colour (black) is replaced only when the binding is new; rebinding a paint to the variable it already had keeps the placeholder, and the node shows black (`lint-gaps.js` reports it as `stale-paint`).
- Change a variable in place (rename rather than delete and recreate: bindings follow its id). The plugin API cannot reorder variables; values come back as float32 (round them).
- Export through the bridge with the project's exporter (`AGENTS.md`), as `return await <script>` in `figma_execute`. To confirm the repo's snapshot matches the live file without moving it through the conversation, compute a checksum (FNV-1a of the JSON) in Figma and in Node and compare.

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
