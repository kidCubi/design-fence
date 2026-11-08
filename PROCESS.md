# The process

How people and AI agents build software together in a project that has design-fence installed, whatever the agent or the model. This file is generic: the project's own `AGENTS.md` says what is specific to it (its non-negotiables, commands, places), and wins wherever the two differ.

## Who says what, and who wins

| Layer | Where | Holds |
|---|---|---|
| Project | `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`, and with the design module `design/` | What this project is, its non-negotiables, commands, places, its checks; its design philosophy, specs and UX map |
| Process | this file, design-fence's playbooks, git hooks and CI workflow | How work moves from a request to `main` |
| Personal | the agent's own settings and memory (`~/.claude/CLAUDE.md`, …) | One person's preferences (language, tone), nothing about a project |

**The project wins over the process, the process over personal settings.** A personal memory never holds a project fact: what one agent learns about a project must reach every agent and every person on it, so it goes into the repo.

**Feedback loop.** When the human corrects the agent and the correction would apply again, write it down before going on: in `AGENTS.md` when it is about this project, as an issue (or change) on design-fence when it is about how to work anywhere. A correction that stays in the conversation is lost.

## The non-negotiables, in every mode

1. **Ground before writing.** Read what exists (the code on the default branch, the design system's catalog) before writing anything that depends on it. Never from memory, never from an earlier session.
2. **"Not found" is a finding.** When the catalog lacks what the work needs, or says something the code contradicts, file it as an issue and say so. Do not improvise around it silently.
3. **The simplest thing that meets the need.** No tooling, abstraction or option for its own sake or for a future that is not here. Strengthen what exists before adding something new; a new thing says what it replaces or why nothing existing could carry it.
4. **Deviations are written down,** where the next reader will look (the issue, `AGENTS.md`, the code comment).
5. **Name what ran.** A check is reported as passed only if it ran, and the report names it (the command, the screenshot). "Should work" is not a result.
6. **End done or parked.** A session ends with the work done and verified, or with what is left filed as issues and linked. Not with open offers ("I could also…").
7. **Ask only when a wrong guess is expensive** (the interaction model of a feature, what data means, anything hard to undo). Otherwise choose, write the choice down, and go on.
8. **Never skip the hooks** (`--no-verify`, a different `core.hooksPath`). When a hook refuses, fix what it names; when it cannot pass for a reason outside the work, say so to the human.
9. **Nothing is invented downstream.** Code uses only the design system's components and tokens; with the design module, a story only an approved component, and a Figma design only what its spec says. What a layer needs and the one above it lacks goes up as a change there (a finding, then a spec), never around it.

## Where to start

`playbooks/start.md` decides, from the project and the request:

| The project | Without the design module | With it |
|---|---|---|
| New | Full mode | **Foundation** first: philosophy, tokens, flows, the first components; no feature before the first approval |
| Existing, new to design-fence | Full mode | **Adopt** first: an inventory of what exists, described as it is, its gaps filed as issues |
| A request | Full mode | The **design loop** when something users see is new or changes; full mode directly when the snapshot has all it needs |

## Two modes

### Full mode (the default: anything that lands on the default branch)

| # | Phase | Output | Gate |
|---|---|---|---|
| 1 | **Request** | The human's intent: an issue, or a sentence | — |
| 2 | **Ground** | What exists today, read from the code and the catalog, with pointers | — |
| 3 | **Ticket** | An issue in the project's ticket shape, doable as written | — |
| 4 | **Build** | The change, its tests, its docs, composed from the design system; the reflect review (`playbooks/reflect.md`) | **enforced**: its verdict as each commit's `Reflect:` line (commit-msg hook) |
| 5 | **Validate** | `design-fence check` green on what changed | **enforced** (pre-commit hook) |
| 6 | **Visual check** | For a visible change: the project's `visual` command, screenshots | named in the report |
| 7 | **Human review** | Good / change / try again | the human |
| 8 | **Land and close** | On the default branch, checked by content; issue closed with where it landed | **enforced** again on what is pushed (pre-push hook, CI) |

`playbooks/ship.md` runs these phases, for any agent or person.

### Quick mode (prototypes, explorations, teaching)

Phases 1, 4 and 5 only, on a branch or in a worktree. Nothing lands on the default branch from quick mode; "do it for real now" means starting full mode from phase 2 on what exists, not rewriting it.

The non-negotiables above, and the git hooks, stay on in quick mode. With the design module, quick mode may sketch in Figma without a spec, but stops before the design gate: nothing is approved from quick mode.

## The design module (optional)

For a project whose design lives in Figma and whose components live in Storybook. It is on when `.agents/validate.json` has a `design` section (`install.mjs --design` adds it and the `design/` templates); without it, everything above holds as it is.

The work flows down a chain, each layer built only from the one above it, and comes back up when a layer finds something missing:

```
spec (design/) → Figma → snapshot (design/snapshot/) → Storybook → app code
intent, rules    values,   the copy agents read          components   composition
                 the human gate                          from it      (full mode)

flows map (design/flows.yml), beside it: views, actions, paths, the components each view shows
```

| Layer | Where | Holds | Changed by | Gate |
|---|---|---|---|---|
| Spec | `design/`: `PHILOSOPHY.md`, `tokens.md`, `components/*.md`, `flows.yml` | Intent and rules: what each thing is for, its parts, properties, states, layout, tokens | The agent, from the request and the human's answers | Part of the design gate |
| Figma | The file `AGENTS.md` names | The values (variables) and the designs, auto-layout and bound variables throughout | The agent through the bridge (`playbooks/figma.md`), or a designer | **The human approves here** |
| Snapshot | `design/snapshot/`: `tokens.json`, `components.json` | What Figma holds, as files: what every agent reads | The exporter only, after the gate | Its lint |
| Storybook | The component library | The components and their stories, built from the snapshot | The agent (`playbooks/component.md`) | Checked against the snapshot; all stories' visual regression |
| App | The code | Views composed from the library | Full mode | Phases 5 to 8 |

**The spec holds the rules, Figma the values.** When the human approves something in Figma that the spec does not say, the spec is updated to say it before the export; when the two disagree, the spec is fixed first, then Figma. A token's value is changed in Figma, never in the repo.

### The design loop

| # | Phase | Output | Gate |
|---|---|---|---|
| D1 | **Ground** | `design/index.md`, the specs and snapshot entries the request touches, the views of `flows.yml` that use them | — |
| D2 | **Spec** | The component's spec, new or amended (`status: draft`); `flows.yml` if a path changes | — |
| D3 | **Figma** | The design, built from existing components and variables, with no unbound value and no frame without auto-layout | its lint, run through the bridge |
| D4 | **Design gate** | One screenshot and the link: good, change (back to D2, then D3), try again | **the human**; nothing passes it otherwise |
| D5 | **Export** | The snapshot, the spec `approved` with the Figma version | the snapshot matches the file (checksum) |
| D6 | **Storybook** | The component and a story per variant and state, from the snapshot (`status: built`) | stories against the snapshot, visual regression of all stories |
| D7 | **App** | Full mode from phase 2, composing from the library | as in full mode |

`playbooks/design.md` runs D1 to D5, `playbooks/component.md` D6. A change to something that exists starts from its spec, never from a blank page: the spec is reviewed, the change is drafted in Figma, the spec refined from what the human said, and Figma again, until the gate says good.

### The flows map

`design/flows.yml` is the map of the product for agents and people: its views, the actions on them, where each leads, the paths users take, and the components each view shows. It is the source; a diagram (Mermaid, an HTML page, a FigJam board) is generated from it on demand, or proposed by the agent for a change, and never edited. A change that adds or moves a view, a route or a path updates it in the same change (`playbooks/flows.md`).

### Reading, cheaply

Agents read files, not tools: `design/index.md` first, then only the specs, snapshot entries and views the work touches. Figma is reached through its MCP server only to change a design, to lint it and to export it, through one server (figma-console, `playbooks/figma.md`); Storybook's index and the flows are read from files. One screenshot per phase still holds; the design gate's screenshot is its phase's one.

## Enforcement: what actually stops the agent

Rules written as prose are summarised away when a long session is compacted, and every agent reads them differently; a hook runs every time. So what matters most is enforced, at the one step every agent and every person goes through: git. The project keeps an honest ledger of which rules are enforced and which are advice (`.agents/ENFORCEMENT.md`, from design-fence's `ENFORCEMENT.md`).

- **Checks (pre-commit hook).** `design-fence check` runs the project's checks (`.agents/validate.json`) on the files that changed. A failure refuses the commit, and the agent or person reads why.
- **The reflect line (commit-msg hook).** A commit that changes code carries the verdict of the reflect review in its message (`Reflect: <verdict>`). A commit without it is refused.
- **What is pushed (pre-push hook).** Every commit being pushed has its `Reflect:` line, and the checks pass on everything since the base.
- **CI (`.github/workflows/design-fence.yml`).** The same two on what a push or a pull request brings, for commits made where the hooks did not run.

The hooks are on once `node .agents/design-fence/install.mjs` has run in the clone (it sets `core.hooksPath`; git does not share it). The same checks run by hand with `node .agents/design-fence/bin/design-fence.mjs check` (or `--all`), in any tool.

What is not enforced stays advice: the screenshot budget of `playbooks/figma.md` (one design-tool screenshot per phase, for the human), grounding, naming what ran.

With the design module, a git hook cannot see Figma (it needs the bridge), so what it can check is checked on the snapshot and the code: the snapshot's lint (no unbound value, auto-layout, descriptions, token names), the parity of specs, snapshot and stories, and no raw value in the code. design-fence does not ship these checks yet: until it does, a project wires what it can as its own checks (a stylelint rule for raw values, for one), and the rest is advisory in its ledger. The design gate is the human's word, recorded in the spec (`approved_by`), as the `Reflect:` line is the author's.

## Cold start

If you are not sure the project's rules were loaded for you (a tool that does not read `AGENTS.md`, a cloud session, a fresh clone), run `node .agents/design-fence/bin/design-fence.mjs rules`: it prints the non-negotiables, whether the git hooks are on, the project's checks and the enforcement ledger. If the hooks are off, run the installer first. Then read `AGENTS.md` in full.
