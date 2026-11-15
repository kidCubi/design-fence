# Ship: from a request to the default branch

A playbook for any agent or person: take a piece of work from a request to the default branch, through the phases of `PROCESS.md` (ground, ticket, build, validate, visual check, human review, land, close). Use it to do a request or an issue end to end, to turn a request into a ticket only, to land and close finished work, for a quick (prototype) run, or to audit that issues match what is on the default branch.

The project's `AGENTS.md` gives everything specific: the repository, the default branch, the tracker, commands, the design system and how to read it. It is the one file to have read before starting; `PROCESS.md` says why the process is as it is and is not needed to follow this playbook. If unsure `AGENTS.md` was loaded, run `node .agents/design-fence/bin/design-fence.mjs rules`, which also says whether the git hooks are on.

## What to run

The request says which:

- a request or an issue's id: full mode, from wherever the work is to landed and closed;
- "ticket" and a request: phases 1 to 3 only;
- "quick" and a request: quick mode (`ship-more.md`);
- "land": phase 8 (`ship-more.md`) for finished work on the current branch;
- "status": the audit (`ship-more.md`).

Stance: run without stopping for approval between phases. Ask only when a wrong guess is expensive (`PROCESS.md`, non-negotiable 7). Otherwise choose, write the choice where it will be read (the issue's "Open questions"), and go on. One summary at the end.

## Where a piece of work is

| State | Issue | Code |
|---|---|---|
| Ticket | open, marked ready or blocked (as `AGENTS.md` says) | none |
| Being done | open | on a local branch or worktree |
| Landed | closed, with where it landed | on the remote default branch, checked by content |

## 1. Request → 2. Ground

1. `git fetch --prune`. Read the code on the remote default branch that the request touches, not the local checkout's possibly older copy.
2. For anything with a look: read the design system's catalog as `AGENTS.md` says (the component's description and properties, the tokens), never from memory. Something the work needs and the catalog lacks is a **finding**: note it for the ticket's "Open questions" and, if it blocks, as its own issue. With the design module, the catalog is `design/index.md`, the component library and its stories, and the views of `design/flows.yml` the work touches; what they lack goes through `design.md` and `component.md` before the build, never around them (`start.md`, "Which way").
3. Look in the tracker for an open issue that already covers the request; extend it rather than adding a second.

## 3. Ticket

An issue in the project's tracker (as `AGENTS.md` names it; `PROCESS.md`, "The tracker", for when it cannot be reached), title prefixed as `AGENTS.md` says, sections in this order:

- `## Problem`
- `## What the code does today`: from having read it, with file and function names.
- `## To do`: numbered parts, each concrete enough to do without asking.
- `## Out of scope`
- `## Open questions`: for each, the choice taken and the alternative. An open question never blocks the ticket.
- `## Acceptance`: checkable statements, ending with the project's checks.

Plain words, the user's own vocabulary, full sentences. Mark it ready, or blocked (say by what in its first line) when it depends on work not yet landed.

## 4. Build

1. Branch from the remote default branch (`ticket/<id>-<slug>`, the id as `AGENTS.md` writes it, made safe for a branch name). If the user's checkout cannot switch (local changes), work in a `git worktree` and leave their checkout alone.
2. Re-read the issue and the code it names: the default branch moves.
3. Compose from the design system: its components and recipes, its tokens. Nothing hand-rolled that it covers; nothing new in the interface without a design-system counterpart (`AGENTS.md`).
4. Write in the style of the neighbouring code, with tests the way neighbouring logic is tested, and the docs `AGENTS.md` names updated in the same change.
5. Review it as `playbooks/reflect.md` says, and apply what it recommends. Its verdict goes into each commit of the change as a `Reflect:` line (phase 8); review again when the change moves on after it.

## 5. Validate

`node .agents/design-fence/bin/design-fence.mjs check`. The pre-commit hook runs the same checks and refuses the commit while they fail; run it yourself first so the hook has nothing to say. Fix the cause, never the check, and never skip the hooks (`--no-verify`). If a check cannot pass for a reason outside the work, say so plainly; do not report it as passed.

## 6. Visual check (anything users see)

Run the project's `visual` command (`.agents/validate.json`), or check as `AGENTS.md` says when it has none: drive the real app, check each acceptance point that has a look, and that the console shows no new error. One set of screenshots for the human at the end of this phase; within it, check values (computed sizes, colours, the design file's properties), not pictures.

## 7. Human review

Show the human what changed and the screenshots, and wait for their word: good, change, or try again. Land without it only when `AGENTS.md` or the user, for this piece of work, says so.

## 8. Land and close

When the human's word (phase 7) or `AGENTS.md` says to land: `ship-more.md`, "Land and close". Until then the work stops here, with a summary that stands on its own: what changed, what was checked and how (name what ran), what was not, and what is left.
