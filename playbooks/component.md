# Component: from an approved design to Storybook

A playbook for any agent or person, with the design module on: phase D6 of the design loop (`PROCESS.md`). Build an approved component in the component library, from its spec and its approved Figma node, with a story for each variant and state, and check it against both. Use it after `design.md` has recorded a component as approved, or to bring an `approved` component that has no story into the library. The app work that uses it is `ship.md` after.

`AGENTS.md` names the library, its Storybook (where it is, its commands, where stories go, the title they take), the tokens file and its format, the visual check, and the neighbours' style.

## 0. Storybook, the first time

Once per project, at the first component built.

- **The project has none.** Storybook is the record of every built component (`PROCESS.md`, "The design module"), so it is set up now, not before: propose it to the human (where it goes, the dependency it adds) and wait for their word, then set it up with Storybook's own installer for web components (`npm create storybook@latest`, Web Components with Vite: `@storybook/web-components-vite`) and write its place, commands and the elements' prefix into `AGENTS.md`.
- **The project has one** (adoption, `start.md`): use it as it is; a Storybook of another framework renders the new web components in its stories (React 19, Vue and Angular take custom elements as they are). Its stories, decorators and title hierarchy stay; new stories follow them. `AGENTS.md` says which Storybook is the design system's when there are several, and which folder is the library (its stories have specs; page and app stories belong to the views of `flows.yml`).

Then `.agents/validate.json`'s `design` section names Storybook's index (`storybookIndex`, the `index.json` of a build or of the dev server) and the library's folder (`library`), and its checks run `design-fence specs` on the specs and the stories.

## 1. Ground

1. The spec (`design/components/<name>.md`, `status: approved`): its `figma` node and `figma_version`. Not approved: stop. A component is built only from an approved design (`PROCESS.md`, non-negotiable 9).
2. The approved design, read **once** through the bridge (`figma.md`), in one `figma_execute` on the spec's node: per variant, the layout of each part (direction, sizing, gap and padding), the variables bound to each part by name, the text properties, the instances it composes. That one read is what the build and the check compare against; nothing else comes out of Figma.
3. One or two components of the library that do the same kind of job: the code should read as if the same person wrote both.

## 2. Tokens

The code's tokens come from the tokens file `design.md` writes (step 5), through the project's pipeline when it has one (Style Dictionary, …), never by hand. A variable the design binds and the tokens file lacks means the tokens export is behind: run it (`design.md`, step 5, 3) before building.

## 3. Build

- A web component (`PROCESS.md`, "The design module"): a custom element named with the project's prefix (`<prefix>-text-area`), defined once, its parts in its shadow root, styled with the tokens' custom properties (they inherit through it), its events as `CustomEvent`s.
- Props named and valued as the spec's properties table (its "Code" column, as attributes and properties), parts as its anatomy, layout as its layout section (hug, fill and fixed in CSS terms, gaps and padding from tokens).
- Tokens only: no raw colour, size, radius or duration that a token covers.
- Nothing the spec does not list: no extra prop, variant or state "for later". Something the code needs that the spec lacks goes back to the spec (`design.md`, step 2), and through the gate if it shows.
- Accessibility as the spec's section says, tested the way neighbouring components are.

## 4. Stories

- One story per variant and state the spec lists, with the args Figma's properties have, under the title the library's stories take.
- Each story links its Figma node when the project's Storybook shows designs (`@storybook/addon-designs`, from the spec's `figma`); the spec's `story` field is the stories' title (`Components/Text area`).

## 5. Check

1. Against the Figma read of step 1, by values: the story's computed sizes, spacing, colours and type against each part's layout and bound variables. Not by eye.
2. The visual regression of **all** stories (the project's `visual` command): a change in another component's story is a break, unless that component's spec says it changes.
3. The project's checks (`design-fence check`), `design-fence specs` among them.

## 6. Record

1. The spec: `status: built` and its `story`; `design/index.md`: its row and story.
2. Review (`reflect.md`) and commit, with its `Reflect:` line. The story's screenshots go to the human with the app work's review (`ship.md`, phase 7), beside the gate's screenshot from Figma.
