# Start: which way in

A playbook for any agent or person: decide which way a project or a request goes in (`PROCESS.md`, "Where to start"): the foundation of a new project (`foundation.md`), the adoption of an existing one (`adopt.md`), or the playbook a request needs. Use it at the start of a project, when design-fence is added to one, and whenever it is unclear which playbook a request needs.

## Which way

1. Read `.agents/validate.json`. No `design` section: the design module is off, and every request goes to `ship.md`. Stop here.
2. Read `design/index.md` (the folder is the section's `dir`).
   - It lists nothing, and there is no design anywhere yet (no Figma file in `AGENTS.md`, no component library, no views in the code): **foundation**, `foundation.md`.
   - It lists nothing, but a design exists (a Figma file, components, stories, views): **adopt**, `adopt.md`.
3. A request, once the index lists what exists:
   - something users see is new, or changes a component the library or the specs have: `design.md`, then `component.md`, then `ship.md`;
   - a view, a route or a path is new or moves: `flows.md` first, then as above;
   - everything it needs is built, in the library and its stories: `ship.md`.

Say in one line which way was taken and why.

`node .agents/design-fence/bin/design-fence.mjs route "<the request>"` answers the same from the repository, with the project's files the request touches; where it says it is unsure, the rules above decide.
