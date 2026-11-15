# Design: from a spec to an approved design in Figma

A playbook for any agent or person, with the design module on: phases D1 to D5 of the design loop (`PROCESS.md`). Take a request for something users see, write or amend its spec, build it in Figma, bring it to the human's gate, and record it in the repo once approved (the spec, and the tokens file when a variable changed). Use it for a new component, a change to one (a variant, a state, its layout), a new or changed token, or a view's design. `component.md` takes it to Storybook after.

`AGENTS.md` names the Figma file, its pages (where work in progress goes), the tokens file and its format; `playbooks/figma.md` is how to work in Figma. `design-fence …` below is `node .agents/design-fence/bin/design-fence.mjs …`, run from the project.

## 1. Ground

1. Read `design/index.md`, then only what the request touches: the specs, the built components' code and stories (props, variants, the tokens their CSS uses), the tokens file, and the views of `design/flows.yml` that show them (what else changes when this changes). Read the repo, not Figma, for what it holds.
2. If it exists, start from its spec: the change is an amendment, not a new page. Prefer, in order: what exists as it is, a new variant or property of something that exists, a new component that composes existing ones, then something new; a new thing says why the ones before it could not do.
3. What the request needs and the philosophy or the token rules do not allow is a **finding**: ask the human, with a proposal. Do not decide it in Figma.
4. Where the parts come from: `design/index.md`, "Sources". If it has none yet, run `design-fence figma sources` once (design-fence's `figma/sources.js`, through the bridge) and write its result there: the file's local components, the library components it uses (icons among them) with their keys, its variable collections. A library's other components cannot be listed from the file, so a part the spec needs and "Sources" lacks is a finding: name it from the code's set (an icon by the name the code's icon package and Storybook use), and have it imported (in Figma: Assets, the library, the component), or import it by key when "Sources" has the key.
5. What the repo does not hold (an approved component not built yet, a component only Figma has, as before adoption): ground in **one** `figma_execute` that returns only what the request touches: the components it names or would compose (properties, variant options, the default variant two levels deep with its bound variables by name) and the variables by name. Compute in the plugin what only needs an answer: where to place the work is one free `{x, y}`, never the page's list of nodes (on a busy page, thousands of tokens).

## 2. Spec

1. Copy `templates/design/component.md` (in design-fence) to `design/components/<name>.md`, or amend the existing one. `status: draft`.
2. Every section concrete enough to build without asking: parts with their layer names (never a name Figma gives: Frame, Text, Line, Rectangle), the properties table (Figma's name and the code's), states, the layout of each part (direction, hug, fill or fixed, gap and padding as token names, min and max, wrap and truncation, and what it does narrower than Figma shows it: a phone, a small window), the semantic tokens by part, and "Used in" from `flows.yml`.
   - Motion (an entrance, an animation bound to scroll): what moves, how long (duration tokens) and what nothing moving looks like (`prefers-reduced-motion`). Figma cannot show it: its gate is in Storybook (`component.md`, step 5).
3. Amending an approved spec: say what changes and what stays, and set it back to `draft`. Its `figma_version` still names the last approved design until the gate says good.
4. A token that does not exist yet: add its rule to `tokens.md` (rule 3: why no existing role fits) and the variable in step 3.
5. A view's words (a page's sections, its headings and paragraphs) are not a component's: they go in `design/content/<view>.md` (copy `templates/design/content.md`), written to the philosophy's voice, with the facts they state checked against the repo. The human approves them (its status line) before the view is built in Figma; the view's Figma frame is built from them, never with placeholder text left in.

## 3. Figma

Four calls, from the connection to the gate: the build, one lint, the fixes if any, the screenshot (`figma.md`, "Calls, cheaply").

1. Through the bridge (`figma.md`: connect first).
2. **Build in one `figma_execute`** that:
   - saves a version first: `await figma.saveVersionHistoryAsync('before <name>')` ("try again" returns to it);
   - builds to these rules:
     - auto-layout on every frame that has children, with the sizing the spec's layout says;
     - every fill, stroke, radius, gap, padding and text property bound to a semantic variable (or a text style made of them); no raw value; a border or a line in the token `tokens.md` pairs with the surface it sits on;
     - composed of instances of existing components, none detached, and every instance property the spec names set explicitly: a variant has its own defaults (an input's focus variant may come filled);
     - layers named as the spec's anatomy, never a name Figma gives (Frame, Text, Rectangle), component properties named and valued as its table;
     - the component's description: the spec's purpose in one sentence, and its path;
   - places it in a section filled with the surface the product shows it on (its semantic background token), so contrast is measured against what users see, not the canvas's grey;
   - returns what verifies it: ids, sizes, the values of the properties it set, written out in full (not abbreviated: "default" and "disabled" share a letter);
   - removes what it created if anything throws.
3. **Lint**, the gaps first, from the command line: `design-fence figma lint-gaps <node id> --properties <the spec's Figma property names, comma-separated>` for each component set built. It runs design-fence's `figma/lint-gaps.js` through the bridge, so its text never passes through the conversation: unbound padding, gap, radius and stroke weight, default names on its own layers, borders and lines the colour of what is behind them, bound paints that show another colour than their variable, an empty description, properties not in the spec or missing from it. Where the command cannot reach the bridge, the build call ends with the file's text instead, then `return await lintGaps('<node id>', {properties: [...]})`.

   Then in one call `figma_lint_design` on the section, with these rule ids (never its defaults, which have included the best-practice hints, and never the groups, whose noise fills `maxFindings` and hides the rest):

   ```
   hardcoded-color, token-misuse, detached-component, no-autolayout, empty-container,
   wcag-contrast, wcag-non-text-contrast, wcag-color-only, wcag-focus-indicator, wcag-target-size,
   wcag-image-alt, wcag-heading-hierarchy, wcag-reflow, wcag-reading-order, wcag-disabled-no-context
   ```

   and `no-text-style` only where `AGENTS.md` says type uses text styles (where it is bound to variables, every text is a finding). `default-name` is left out: it walks into instances, where a library icon's "Vector" layers fill it; the gap lint checks names on the component's own layers. Read the result knowing that it walks into instances, so one problem repeats per instance, and that a finding about an existing component the new one uses (its contrast, its target) is filed as an issue against that component, not fixed here.

   For a component with states, add `figma_audit_component_accessibility` on its set.
4. **Fix in one call**, then lint again with only the rules that found something. A finding kept on purpose is written in the spec's "Deviations". Report what ran and what it found, not "looks right".

## 4. Design gate

1. Take the phase's one screenshot (`figma_capture_screenshot` on the section): the component with its variants and states (or the view), and give the link to its node. Look at it before showing it: a problem it shows is fixed and checked by values, not by a second screenshot.
2. Ask: good, change, or try again.
   - **Good**: step 5.
   - **Change**: write the change into the spec first, then Figma, then lint, and come back here with a new screenshot.
   - **Try again**: restore the version saved in step 3, then step 2 with what was learnt.
3. Nothing passes this gate without the human's word, whatever the request said. Quick mode stops before it.
4. Motion is not approved here: say so at the gate, and bring it to the human in Storybook when it runs (`component.md`, step 5).

## 5. Record

1. Save the approved version: `await figma.saveVersionHistoryAsync('approved <name>')`, and note its id.
2. The spec: `status: approved`, `figma` (the node id), `figma_version`, `approved_by`, and anything decided at the gate that it does not say yet. The spec and the Figma node are now the component's record until it is built; nothing else is copied out of Figma.
3. The tokens file, when the work added or changed a variable: `design-fence figma tokens --format <format> --px <prefixes> [--ms <prefixes>] --out <tokens file>`, which runs design-fence's `figma/tokens.js` through the bridge and writes the file as it comes, never edited by hand, its text never through the conversation. The format is the one `AGENTS.md` names (`dtcg` for a project whose pipeline builds its code tokens from W3C design tokens, `css` for one whose tokens file is CSS custom properties), with the `px` prefixes it lists (`space/`, `radius/`, …: a number variable scoped to all uses says nothing about its unit), and its `ms` prefixes (`duration/`) when its durations are written with their unit. To only learn whether the file is current: `--hash-only`, against `design-fence hash <tokens file>`.
4. `design/index.md`: the row's status and its Figma node; "Sources" again from `design-fence figma sources` when the work imported something.
5. `design-fence design` holds (`PROCESS.md`, "Enforcement"). Marking the spec approved is the human's word: the agent tools' hooks ask them for it. Commit the spec (and the tokens file) with their `Reflect:` line (`reflect.md`). Then `component.md`.
