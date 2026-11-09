# AGENTS.md: {{project}}

The rules of this project for any agent (and any person). The process is design-fence's (`.agents/design-fence/PROCESS.md`, run by the playbooks in `.agents/design-fence/playbooks/`: `ship.md` from a request to `main`, `reflect.md` the review every commit of code carries); this file says what is specific here, and wins where the two differ. Keep it short: point to detail rather than restating it.

After cloning: `git submodule update --init && node .agents/design-fence/install.mjs` (turns on the git hooks, in each clone).

## What this is

<!-- One paragraph: what the project does, its parts, and the map of the code (link the architecture doc). -->

## Non-negotiables

<!-- The few rules every change follows, in every mode. Each one either enforced (name the check) or advisory: see .agents/ENFORCEMENT.md. -->

1. 

## The design system

<!-- Where its source of truth is (a Figma file, a package), how to read its catalog before writing (the library's code and stories, an MCP server), and what "not found" means here. With the design module (PROCESS.md, "The design module"): `design/index.md` first (its "Sources" says where components and icons come from); the Figma file (key, pages, where work in progress goes); the tokens file and its format (`dtcg` for a pipeline such as Style Dictionary, or `css`), and the name prefixes of the number variables that are `px` sizes (`space/`, `radius/`, `size/`); whether type is bound to variables or to text styles (the lint reads `no-text-style` on every text otherwise); the surface components are shown on; the component library and its token-build command. -->

## Storybook

<!-- With the design module: where it is (or "none yet": set up at the first component built, playbooks/component.md, with Web Components and Vite), the elements' prefix (`osfm-`), its version, its run and build commands, where the library's stories go and the title they take (`Components/<Name>`), its decorators, whether stories link their designs (@storybook/addon-designs), its visual testing. When there are several, which one is the design system's. -->

## Commands

<!-- Install, run, test, format: exact commands. The checks of .agents/validate.json run them. -->

## Places

- Repository: <!-- owner/name -->, default branch `main`.
- Tickets: <!-- the tracker and where issues go (GitHub issues of owner/name, a Linear team, a Notion database); how it is reached (`gh`, an MCP server and its tool for find, file, read, mark and comment); how an id is written (`#12`, `ENG-123`); how ready, blocked and done are shown (labels, a status field). PROCESS.md, "The tracker". -->
- Landing: <!-- fast-forward push to main | pull request -->.
- Docs to update with a change: <!-- … -->.

## Code style

<!-- What the neighbouring code does that a newcomer would miss. -->
