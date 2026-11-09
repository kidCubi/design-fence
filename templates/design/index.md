# The design of {{project}}: index

The first file to read for anything users see: one line per piece, with where its spec, its Figma node and its story are. Read the specs and the stories the work touches from here, not the whole folder, and not Figma.

Statuses: `draft` (spec written, not approved), `approved` (the human approved it in Figma; its spec and Figma node are its record until it is built), `built` (in the component library, with its stories), `as-is` (adopted from what existed, not yet reviewed).

## Foundations

- Philosophy: `PHILOSOPHY.md`
- Tokens: rules `tokens.md`, values in Figma, exported to <!-- the code's tokens file --> (`figma/tokens.js`)
- Flows: `flows.yml`
- Copy: <!-- the views' words, `content/<view>.md`, and whether each is approved -->
- Figma file: <!-- name and file key, pages -->

## Sources

What the Figma file's design system is made of, from design-fence's `figma/sources.js` (run once, then with every export). A library's other components cannot be listed from the file: one the work needs and this list lacks is imported first.

- Local: <!-- n component sets, n components -->
- Libraries in use: <!-- by library: its name or file key if known; the sets in use, with their keys (icons: Check, CaretRight, …) -->
- Variables: <!-- local collections; library collections -->
- Icons in code: <!-- the icon package and where Storybook shows them; the names specs use -->

## Components

| Component | Status | Spec | Figma node | Story (Storybook title) |
|---|---|---|---|---|
| | | `components/<name>.md` | | |
