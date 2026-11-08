# Start: which way in

A playbook for any agent or person: decide which way a project or a request goes in (`PROCESS.md`, "Where to start"), and run the foundation of a new project or the adoption of an existing one when that is the way. Use it at the start of a project, when design-fence is added to one, and whenever it is unclear which playbook a request needs.

## Which way

1. Read `.agents/validate.json`. No `design` section: the design module is off, and every request goes to `ship.md`. Stop here.
2. Read `design/index.md` (the folder is the section's `dir`).
   - It lists nothing, and there is no design anywhere yet (no Figma file in `AGENTS.md`, no component library, no views in the code): **foundation**, below.
   - It lists nothing, but a design exists (a Figma file, components, stories, views): **adopt**, below.
3. A request, once the index lists what exists:
   - something users see is new, or changes something the snapshot has: `design.md`, then `component.md`, then `ship.md`;
   - a view, a route or a path is new or moves: `flows.md` first, then as above;
   - everything it needs is in the snapshot and the library: `ship.md`.

Say in one line which way was taken and why.

## Foundation (a new project)

Each step ends with the human's word, and no feature is built before the first component is approved. This is where a wrong guess is most expensive: ask (`PROCESS.md`, non-negotiable 7), with a proposal to react to rather than an open question.

1. **Philosophy.** Write `design/PHILOSOPHY.md` with the human: principles (each with what it decides), look and feel, voice, references, what the design refuses. References are what the human gives (links, images, products), each with what to take from it; never one they did not give.
2. **Tokens.** Write the rules in `design/tokens.md` (layers, names, scales, modes) from the philosophy. Then build the variables in Figma to match (`figma.md`), primitives first, semantic roles as aliases of them, and lay them out on one page (swatches, the spacing and type scales) for the human: that page is this step's gate (one screenshot). Export the snapshot (`design.md`, step 5).
3. **Flows.** Draft `design/flows.yml` with the human (`flows.md`): the first views, the actions between them, the two or three paths that matter most. A diagram generated from it is how the human reviews it. The views' components are the list for step 4.
4. **The first components.** Those the first views need, smallest first (text, icon, button, field, then what composes them), each through `design.md` and `component.md`.

Then requests go in by "Which way", step 3.

## Adopt (an existing project)

Describe what exists; do not redesign it. Nothing is changed (in Figma or the code) until step 5.

1. **Inventory.** Run `figma/sources.js` (in design-fence) through `figma_execute` and write its result into `design/index.md`, "Sources": the local components, the library components in use with their keys, the variable collections. Export the snapshot from Figma (`design.md`, step 5) without approving anything. List Storybook's stories (from its `index.json`, built with the project's command), the component library's exports, and the app's routes.
2. **Specs as they are.** For each component, a spec from the template (`templates/design/component.md`) describing what is, from the Figma component and the code, with `status: as-is`. Write `design/tokens.md` from the variables' actual structure, and list everything in `design/index.md`.
3. **Flows.** `design/flows.yml` from the routes and the navigation in the code (`flows.md`, "From the code"), with `unsure: true` where the code does not say.
4. **Gaps, filed.** Each kind of gap is one issue (`ship.md`, phase 3), listing its instances: the snapshot's lint failures (unbound values, frames without auto-layout, missing descriptions, token names outside the rules), Figma components without a story, stories without a Figma component, components in the code outside the library, views the map cannot place, Figma and the code disagreeing.
5. **Human review, once.** Show the index, the flows diagram and the issues. A component becomes `approved` only by the human's word (one by one, or all at once); the gaps are then worked through as requests.
