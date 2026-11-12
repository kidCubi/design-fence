# Working in Figma

A playbook for any agent with the figma-console MCP server: connect, read and change nodes and variables, verify without screenshot loops, export the tokens. Use it before any Figma read or write, or when exporting variables or components to the repo. What is rarely needed is in `figma-more.md`: fixing a connection, importing images, capturing HTML into Figma.

The project's `AGENTS.md` names the file (file key, pages), the tokens file and its format. This playbook is how to work in it. `design-fence …` below is `node .agents/design-fence/bin/design-fence.mjs …`, run from the project.

## Connect first, over the bridge only

The server is figma-console, at the version design-fence was tried with, which `install.mjs --design` declares for Claude Code (`.mcp.json`), Codex (`.codex/config.toml`) and OpenCode (`opencode.json`); its Desktop Bridge needs no token. Not among the agent's tools: the human approves it (Claude Code asks at the start of a session; Codex once the project is trusted) and starts a new session.

1. Call `figma_get_status` with `probe: true` before the first Figma call of the session, and again only when a call fails.
2. Healthy: `setup.valid: true`, `transport.active: "websocket"`, the probe succeeds, and the connected file is the one `AGENTS.md` names. Check the file name before writing: several files may have the plugin open.
   - The plugin is current: the connected file's `pluginVersion` equals the server's `bundledPluginVersion` (`pluginUpdateAvailable` is not true). An older plugin answers the commands it does not know with "Unknown method" (creating a slot needs 1.41 or later): before any new kind of call, ask the human to re-import the manifest (`figma-more.md`, "Not connected", step 3) and run the plugin again.
3. Not connected (`transport.active: "none"`): **stop and tell the human**, with the fix (`figma-more.md`, "Not connected"). Do not fall back to REST tools or another server.
4. The connection can drop between two calls. When a call fails with "Cannot connect", check the status again rather than retrying blindly.

## Calls, cheaply

Every response stays in the conversation and is paid again on each later turn, and every script sent is written out by the agent. One run (a new component, from grounding to the gate, the file's components read through Figma) took 12 calls and about 24k tokens, counted from the characters sent and returned; the same result fits in about 4 calls and 8k when what follows and `design.md`, step 3, are kept to.

- Read the repo, not Figma, for what it holds: specs, built components and their stories, the tokens file. Grounding through Figma was more than half of that run.
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

At most **one** screenshot (`figma_take_screenshot`, `figma_capture_screenshot`, `figma_get_component_image`, `get_screenshot`) per phase of the work, at its end, to show the human. Take it of the section (or frame) around the work: a component set exported alone comes out on white, and light-on-dark components disappear. Within a phase, verify by reading properties as above, never by a loop of screenshots. This overrides the figma-console server's own advice to screenshot after every change. In Claude Code, Codex and OpenCode, design-fence's agent hooks refuse a second one until the human writes again; elsewhere nothing enforces it: hold to it.

## Plugin API: what surprises

The first three made most of the scripts that failed in design-fence's own measure, on every model.

- The file loads page by page (`documentAccess: dynamic-page`), so what reaches across it has only an async form, and the other throws: `await figma.getNodeByIdAsync(id)`, `await figma.setCurrentPageAsync(page)` (never `figma.currentPage = page`), `await instance.getMainComponentAsync()`, `await figma.variables.getVariableByIdAsync(id)` and `getVariableCollectionByIdAsync`, `await figma.getLocalTextStylesAsync()`.
- A variant has no `componentPropertyDefinitions`, and reading it throws: read them on its set (`node.parent`), or on a component that is in no set.
- A property that can be mixed (`fontName`, `fontSize`, `cornerRadius`) may hold the symbol `figma.mixed`, which a script can neither return nor join into a string: return `v === figma.mixed ? 'mixed' : v`.
- A section is sized with `resizeWithoutConstraints(w, h)`. Nothing is created to try a method out: `typeof figma.createSection().resize` leaves a section on the current page.
- `clone()` puts the copy on the page, not in the component set: append it to the set before binding the set's properties to it.
- `resize()` makes an auto-layout frame fixed: set the sizing modes (`layoutSizingHorizontal`, `primaryAxisSizingMode`) after it, not before.
- A size read in the call that changed the node can be stale: verify sizes in the next call.
- On a text layer, `boundVariables.fontSize` (and the other text bindings) is a list: read `Array.isArray(v) ? v[0] : v`.
- A `/` in a frame's name reads as a component's path, and the linter calls it detached: name frames without it.
- Auto layout has no negative margin. To move one child out of line with tokens (the hero's image a step left of its sentence), change the parent's padding on that side and give the other children a wrapper frame whose padding takes them back; the code does the same (the padding, then a margin), so the two match.
- A script that throws halfway leaves what it built so far, frames created before their parent included: build inside `try`, and remove the section (and any orphan at the page's root) in `catch`.

## Variables and the tokens file

- What the repo already holds is read from the repo, not from Figma: the bridge is for changing, linting, reading an approved design once when it is built, and exporting the tokens.
- Before changing what exists, and at an approval, save a named version: `await figma.saveVersionHistoryAsync('<title>')` returns its id (`design.md`, steps 3 and 5).
- Bind a paint with the variable's own colour: `figma.variables.setBoundVariableForPaint({type: 'SOLID', color: <the variable's value for the node>}, 'color', variable)`. A placeholder colour (black) is replaced only when the binding is new; rebinding a paint to the variable it already had keeps the placeholder, and the node shows black (`lint-gaps.js` reports it as `stale-paint`).
- Change a variable in place (rename rather than delete and recreate: bindings follow its id). The plugin API cannot reorder variables; values come back as float32 (round them).
- design-fence's scripts (`figma/lint-gaps.js`, `tokens.js`, `sources.js`, `bound.js`) run from the command line, `design-fence figma <script>`: it starts its own figma-console server, which the plugin finds within seconds, so the scripts' text and the tokens file stay out of the conversation. Export the tokens with `design-fence figma tokens … --out <tokens file>`, in the format `AGENTS.md` names; `--hash-only` against `design-fence hash <tokens file>` says whether it is current. In a sandbox the server needs the network (it listens on a local port): Codex's `workspace-write` has it with `sandbox_workspace_write.network_access = true`. Through `figma_execute` (the file's text, then its call) only where the command cannot reach the bridge.
