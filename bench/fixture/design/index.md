# The design of fence-docs: index

The first file to read for anything users see: one line per piece, with where its spec, its Figma node and its story are. Read the specs and the stories the work touches from here, not the whole folder, and not Figma.

Statuses: `draft` (spec written, not approved), `approved` (the human approved it in Figma; its spec and Figma node are its record until it is built), `built` (in the component library, with its stories), `as-is` (adopted from what existed, not yet reviewed).

## Foundations

- Philosophy: `PHILOSOPHY.md` (approved 2026-11-08)
- Tokens: rules `tokens.md`, values in Figma (Primitives, Semantic, Scale; the sheet on page Tokens), exported to `src/tokens.css` (`figma/tokens.js`, css)
- Flows: `flows.yml` (one view, `landing`; path `read-process`)
- Copy: `content/landing.md` (approved 2026-11-09)
- The page in code: `index.html`, `src/page.js`, `src/page.css` (`npm run dev`); in Storybook: `Pages/Landing` (`src/landing.stories.js`)
- Figma file: "Design fence landing", `RpGPzmuHjXA4umtwY5M2tr`; pages Tokens, Components, Landing (the whole page: frame 4:266)

## Sources

- Local: Link, Button, Section, Top bar, Command.
- Libraries in use: none.
- Variables: local only, Primitives, Semantic, Scale.
- Icons in code: none yet.

## Components

| Component | Status | Spec | Figma node | Story (Storybook title) |
|---|---|---|---|---|
| Link | built | `components/link.md` | 2:184 | Components/Link |
| Button | built | `components/button.md` | 2:193 | Components/Button |
| Section | built | `components/section.md` | 4:547 | Components/Section |
| Top bar | built | `components/top-bar.md` | 4:536 | Components/Top bar |
| Command | approved (to build) | `components/command.md` | 4:568 | |
