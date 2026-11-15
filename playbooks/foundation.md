# Foundation: the design of a new project

A playbook for any agent or person, with the design module on: lay the foundation of a project that has no design yet (`start.md`, "Which way"): its philosophy, its tokens, its flows and its first components. Use it once, before any feature.

Each step ends with the human's word, and no feature is built before the first component is approved. This is where a wrong guess is most expensive: ask (`PROCESS.md`, non-negotiable 7), with a proposal to react to rather than an open question.

1. **Philosophy.** Write `design/PHILOSOPHY.md` with the human: principles (each with what it decides), look and feel, voice, references, what the design refuses. References are what the human gives (links, images, products), each with what to take from it; never one they did not give.
2. **Tokens.** Write the rules in `design/tokens.md` (layers, names, scales, modes) from the philosophy. Then build the variables in Figma to match (`figma.md`), primitives first, semantic roles as aliases of them, and lay them out on one page (swatches, the spacing and type scales) for the human: that page is this step's gate (one screenshot). Write the tokens file (`design.md`, step 5, 3).
3. **Flows.** Draft `design/flows.yml` with the human (`flows.md`): the first views, the actions between them, the two or three paths that matter most. A diagram generated from it is how the human reviews it. The views' components are the list for step 4.
4. **The first components.** Those the first views need, smallest first (text, icon, button, field, then what composes them), each through `design.md` and `component.md`; the first one built sets up Storybook if the project has none (`component.md`, step 0).

Then requests go in by `start.md`, "Which way", step 3.
