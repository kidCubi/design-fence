# AGENTS.md: fence-docs

The rules of this project for any agent (and any person). The process is design-fence's (`.agents/design-fence/PROCESS.md`); this file says what is specific here, and wins where the two differ.

After cloning: `git submodule update --init && node .agents/design-fence/install.mjs` (turns on the git hooks, in each clone).

## What this is

The documentation site of design-fence: one page for now, designers first. `design/` holds its philosophy, tokens and specs; the code is web components with Storybook.

## Non-negotiables

1. The design module's rules hold (`PROCESS.md`, "The design module"): nothing is built that the spec and an approved Figma design do not say.
2. No commit or push is made by an agent: it gives the commands, the person runs them.

## The design system

- Read `design/index.md` first; `design/PHILOSOPHY.md` decides what the specs do not.
- Figma: "Design fence landing", file key `RpGPzmuHjXA4umtwY5M2tr`; pages `Tokens` (the token sheet), `Components`, `Landing`.
- Type is bound to variables (`font/family`, `font/weight-*`, `font-size/*`), not text styles: `no-text-style` is expected and left out of the lint.
- Everything is shown on `surface/page`; lines and text follow `design/tokens.md`, "Pairs".
- Tokens file: `src/tokens.css`, format `css`, px prefixes `space/`, `font-size/`, `line-width/`, `radius/`, `size/`.

## Storybook

- Storybook 10, Web Components with Vite; `.storybook/`.
- Run: `npm run storybook` (port 6006). Build: `npm run build-storybook` (`storybook-static/index.json`).
- The page: `npm run dev` (Vite): `index.html`, `src/page.js`, `src/page.css`, its words from `design/content/landing.md`.
- Stories: `src/components/<name>/<name>.stories.js`, titled `Components/<Name>`; elements `df-<name>`. The page: `src/landing.stories.js`, `Pages/Landing`.

## Commands

- Tests: `node --test test/*.test.mjs`.
- Format: `npx --yes prettier@3.3.3 --check <files>`.
- The page's outline (its sections and their anchors, from the copy): `node tools/outline.mjs`.

## Places

- Repository: local only for now, default branch `main`.
- Tickets: `design/issues.md`, one heading per issue.
- Landing: commits on `main`, run by the person.
- Docs to update with a change: `design/index.md`, the component's spec.

## Code style

Web components, no framework: a custom element `df-<name>` per component, its parts in its shadow root, styled with the tokens' custom properties only. Motion with anime.js; every animation off with `prefers-reduced-motion`.
