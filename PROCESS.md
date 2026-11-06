# The process

How a human and an AI agent build software together in a project that has design-fence installed. This file is generic: the project's own `AGENTS.md` says what is specific to it (its non-negotiables, commands, places), and wins wherever the two differ.

## Who says what, and who wins

| Layer | Where | Holds |
|---|---|---|
| Project | `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md` | What this project is, its non-negotiables, commands, places, its checks |
| Process | this file and design-fence's skills and hooks | How work moves from a request to `main` |
| Personal | `~/.claude/CLAUDE.md`, the agent's memory | One person's preferences (language, tone), nothing about a project |

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

## Two modes

### Full mode (the default: anything that lands on the default branch)

| # | Phase | Output | Gate |
|---|---|---|---|
| 1 | **Request** | The human's intent: an issue, or a sentence | — |
| 2 | **Ground** | What exists today, read from the code and the catalog, with pointers | — |
| 3 | **Ticket** | An issue in the project's ticket shape, doable as written | — |
| 4 | **Build** | The change, its tests, its docs, composed from the design system | — |
| 5 | **Validate** | `design-fence check` green on what changed | **enforced** (Stop hook) |
| 6 | **Visual check** | For a visible change: the project's `visual` command, screenshots | named in the report |
| 7 | **Human review** | Good / change / try again | the human |
| 8 | **Land and close** | On the default branch, checked by content; issue closed with where it landed | — |

The `ship` skill runs these phases. Each phase it enters is recorded (`design-fence phase <name>`), which is what the per-phase budgets (below) count against.

### Quick mode (prototypes, explorations, teaching)

Phases 1, 4 and 5 only, on a branch or in a worktree. Nothing lands on the default branch from quick mode; "do it for real now" means starting full mode from phase 2 on what exists, not rewriting it.

The non-negotiables above stay on in quick mode.

## Enforcement: what actually stops the agent

Rules written as prose are summarised away when a long session is compacted; a hook runs every time. So what matters most is enforced, and the project keeps an honest ledger of which rules are enforced and which are advice (`.agents/ENFORCEMENT.md`, from design-fence's `ENFORCEMENT.md`).

- **Validate (Stop hook).** When the agent stops, `design-fence check` runs the project's checks (`.agents/validate.json`) on the files that changed. A failure sends the agent back to fix it. After three failed attempts in a row it lets the agent stop, and the agent must tell the human what still fails.
- **Screenshot budget (PreToolUse hook).** At most one design-tool screenshot per phase. Within a phase, check the result by reading the design file's properties (sizes, positions, layout, bound variables). A screenshot is for the human, at the end of a phase, not a loop of the agent's own.

The same checks run by hand with `node .agents/design-fence/bin/design-fence.mjs check` (or `--all`), in any tool, by any agent or person.

## Cold start

If you are not sure the project's rules were loaded for you (a tool that does not read `AGENTS.md`, a cloud session), run `node .agents/design-fence/bin/design-fence.mjs rules`: it prints the non-negotiables, the project's checks and the enforcement ledger. Then read `AGENTS.md` in full.
