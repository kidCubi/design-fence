# Component: from an approved design to Storybook

A playbook for any agent or person, with the design module on: phase D6 of the design loop (`PROCESS.md`). Build an approved component in the component library, from its spec and its snapshot entry, with a story for each variant and state, and check it against both. Use it after `design.md` has exported a component, or to bring an `approved` component that has no story into the library. The app work that uses it is `ship.md` after.

`AGENTS.md` names the library, its commands (Storybook, the token build, the visual check) and its neighbours' style.

## 1. Ground

1. The spec (`design/components/<name>.md`, `status: approved`) and its entry in `design/snapshot/components.json`. Not Figma: if the snapshot lacks something, the export is incomplete; go back to `design.md`, step 5.
2. One or two components of the library that do the same kind of job: the code should read as if the same person wrote both.
3. Not approved: stop. A component is built only from an approved design (`PROCESS.md`, non-negotiable 9).

## 2. Tokens

The library's tokens are generated from `design/snapshot/tokens.json` by the project's command, never written by hand. If the snapshot changed, run it and commit the result with the snapshot it came from.

## 3. Build

- Props named and valued as the spec's properties table (its "Code" column), parts as its anatomy, layout as its layout section (hug, fill and fixed in CSS terms, gaps and padding from tokens).
- Tokens only: no raw colour, size, radius or duration that a token covers.
- Nothing the spec does not list: no extra prop, variant or state "for later". Something the code needs that the spec lacks goes back to the spec (`design.md`, step 2), and through the gate if it shows.
- Accessibility as the spec's section says, tested the way neighbouring components are.

## 4. Stories

- One story per variant and state the spec lists, with the args Figma's properties have.
- Each story links its Figma node (the design parameter the project uses, from the spec's `figma`), and the spec's `story` field names the story.

## 5. Check

1. Against the snapshot, by values: the story's computed sizes, spacing, colours and type against the component's entry (and its bound tokens). Not by eye.
2. The visual regression of **all** stories (the project's `visual` command): a change in another component's story is a break, unless that component's spec says it changes.
3. The project's checks (`design-fence check`).

## 6. Record

1. The spec: `status: built`; `design/index.md`: its row and story.
2. Review (`reflect.md`) and commit, with its `Reflect:` line. The story's screenshots go to the human with the app work's review (`ship.md`, phase 7), beside the gate's screenshot from Figma.
