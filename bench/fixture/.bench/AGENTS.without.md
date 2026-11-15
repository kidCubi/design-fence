# AGENTS.md: fence-docs

The rules of this project for any agent (and any person).

## What this is

The documentation site of design-fence: one page for now, designers first. The code is web components with Storybook.

## The design system

- Figma: "Design fence landing", file key `RpGPzmuHjXA4umtwY5M2tr`; pages `Tokens` (the token sheet), `Components`, `Landing`.
- Type is bound to variables (`font/family`, `font/weight-*`, `font-size/*`), not text styles.
- Everything is shown on `surface/page`.
- Tokens file: `src/tokens.css`, exported from Figma's variables.

## Storybook

- Storybook 10, Web Components with Vite; `.storybook/`.
- Run: `npm run storybook` (port 6006). Build: `npm run build-storybook` (`storybook-static/index.json`).
- The page: `npm run dev` (Vite): `index.html`, `src/page.js`, `src/page.css`.
- Stories: `src/components/<name>/<name>.stories.js`, titled `Components/<Name>`; elements `df-<name>`. The page: `src/landing.stories.js`, `Pages/Landing`.

## Commands

- Tests: `node --test test/*.test.mjs`.
- Format: `npx --yes prettier@3.3.3 --check <files>`.
- The page's outline (its sections and their anchors, from the copy): `node tools/outline.mjs`.

## Places

- Repository: local only for now, default branch `main`.
- Tickets: `issues.md`, one heading per issue.
- No commit or push is made by an agent: it gives the commands, the person runs them.

## Code style

Web components, no framework: a custom element `df-<name>` per component, its parts in its shadow root, styled with the tokens' custom properties only. Motion with anime.js; every animation off with `prefers-reduced-motion`.
