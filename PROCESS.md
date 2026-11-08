# The process

How people and AI agents build software together in a project that has design-fence installed, whatever the agent or the model. This file is generic: the project's own `AGENTS.md` says what is specific to it (its non-negotiables, commands, places), and wins wherever the two differ.

## Who says what, and who wins

| Layer | Where | Holds |
|---|---|---|
| Project | `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md` | What this project is, its non-negotiables, commands, places, its checks |
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

The non-negotiables above, and the git hooks, stay on in quick mode.

## Enforcement: what actually stops the agent

Rules written as prose are summarised away when a long session is compacted, and every agent reads them differently; a hook runs every time. So what matters most is enforced, at the one step every agent and every person goes through: git. The project keeps an honest ledger of which rules are enforced and which are advice (`.agents/ENFORCEMENT.md`, from design-fence's `ENFORCEMENT.md`).

- **Checks (pre-commit hook).** `design-fence check` runs the project's checks (`.agents/validate.json`) on the files that changed. A failure refuses the commit, and the agent or person reads why.
- **The reflect line (commit-msg hook).** A commit that changes code carries the verdict of the reflect review in its message (`Reflect: <verdict>`). A commit without it is refused.
- **What is pushed (pre-push hook).** Every commit being pushed has its `Reflect:` line, and the checks pass on everything since the base.
- **CI (`.github/workflows/design-fence.yml`).** The same two on what a push or a pull request brings, for commits made where the hooks did not run.

The hooks are on once `node .agents/design-fence/install.mjs` has run in the clone (it sets `core.hooksPath`; git does not share it). The same checks run by hand with `node .agents/design-fence/bin/design-fence.mjs check` (or `--all`), in any tool.

What is not enforced stays advice: the screenshot budget of `playbooks/figma.md` (one design-tool screenshot per phase, for the human), grounding, naming what ran.

## Cold start

If you are not sure the project's rules were loaded for you (a tool that does not read `AGENTS.md`, a cloud session, a fresh clone), run `node .agents/design-fence/bin/design-fence.mjs rules`: it prints the non-negotiables, whether the git hooks are on, the project's checks and the enforcement ledger. If the hooks are off, run the installer first. Then read `AGENTS.md` in full.
