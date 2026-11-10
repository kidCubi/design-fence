# design-fence

A process for building software with AI agents, for any agent, any model and any person, installed into a project as a git submodule: how work moves from a request to `main` (`PROCESS.md`), the playbooks that run it, and the git hooks and CI that enforce what matters. Rules in the repo, grounded in the design system, checked at every commit rather than by asking twice.

Nothing in it belongs to one tool. The rules are Markdown any agent reads (`AGENTS.md`, `PROCESS.md`, the playbooks); the enforcement is git (hooks every commit and push goes through) and CI; the checks are a command line any tool or person runs.

## What is in it

| | |
|---|---|
| `PROCESS.md` | The layers (project > process > personal), the non-negotiables, where to start, full and quick modes and their phases, what the process asks of the tracker, the design module, what is enforced |
| `playbooks/start.md` | Which way in: the foundation of a new project, the adoption of an existing one, or which playbook a request needs |
| `playbooks/design.md` | Design module: from a spec to a design approved by the human in Figma, exported to the repo |
| `playbooks/component.md` | Design module: from an approved design to the component library and its stories |
| `playbooks/flows.md` | Design module: the UX map (`design/flows.yml`): views, actions, paths, and the diagrams drawn from it |
| `playbooks/ship.md` | Runs the phases: ground, ticket (in the project's tracker), build, validate, visual check, human review, land, close; quick mode; an audit |
| `playbooks/reflect.md` | A review of the work just done against the project's bar; its verdict goes into each commit as a `Reflect:` line |
| `playbooks/figma.md` | Working in Figma through the figma-console Desktop Bridge |
| `hooks/` | The git hooks: `pre-commit` (the checks), `commit-msg` (the `Reflect:` line), `pre-push` (both, on what is pushed) |
| `bin/design-fence.mjs` | `check`, `commits`, `rules`, `specs` (the design specs against Storybook), `hash` (a file's FNV-1a, against Figma's), `figma` (the scripts of `figma/` through the Desktop Bridge, their text out of the agent's context), and `hook` for the git hooks |
| `figma/lint-gaps.js` | Design module: the Figma lint `figma_lint_design` does not make (unbound spacing, radius, stroke; default names; invisible borders; stale paints; descriptions; properties against the spec), run through the bridge |
| `figma/tokens.js` | Design module: Figma's variables as the project's tokens file (W3C design tokens or CSS), or only its hash, run through the bridge |
| `figma/sources.js` | Design module: what a Figma file's design system is made of (local components, library components in use with their keys, variables), for `design/index.md`, run once through the bridge |
| `lib/agent-hooks.mjs`, `harness/` | The agent tools' hooks: what the git hooks cannot see between two commits (a hook skipped, a second design-tool screenshot in a phase, a `figma/` script pasted rather than run), refused in the session; the rules again after a compaction. `harness/plugin/`: Claude Code's plugin; `harness/opencode/`: OpenCode's |
| `skills/` | The playbooks as skills (`design-fence-<playbook>/SKILL.md`: when to use it, and the playbook to read), linked into the project's skills folders by the installer |
| `templates/` | `AGENTS.md`, design-fence's block in it (`agents-block.md`), `validate.json`, the CI workflow `design-fence.yml`; `design/`: the philosophy, the token rules, the index, the flows map and the component spec |
| `ENFORCEMENT.md` | The ledger template: which rules are enforced, by what, and what green does not mean |

## Install in a project

```sh
git submodule add https://github.com/kidCubi/design-fence.git .agents/design-fence
node .agents/design-fence/install.mjs
```

The installer only adds what is missing and refreshes what is its own (running it again changes nothing):

- the git hooks: `core.hooksPath` set to `.agents/design-fence/hooks` in this clone. Git does not share that setting: **every clone runs the installer once** (`git submodule update --init && node .agents/design-fence/install.mjs`), people and agents' sandboxes alike. If the clone already has a `core.hooksPath`, it is left alone and the installer says so.
- `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`, `.github/workflows/design-fence.yml`: templates to fill in, if the project has none.
- design-fence's block in `AGENTS.md`, between its markers: which playbook for which work, and the process's non-negotiables. It is added to an `AGENTS.md` the project already has, and replaced each time the installer runs; edit outside the markers.
- the playbooks as skills: `.agents/skills/design-fence-*` (Codex) and `.claude/skills/design-fence-*` (Claude Code), links into `skills/`, so an agent that loads skills reads the right playbook when the work matches it. Copies instead of links when design-fence is not at `.agents/design-fence`, or where links fail.
- the agent tools' hooks (`design-fence agent-hook`): merged into `.claude/settings.json` (Claude Code) and `.codex/hooks.json` (Codex), keeping the project's own hooks, and OpenCode's plugin as `.opencode/plugins/design-fence.js`. They refuse in the session what the git hooks would only catch at the commit, or not at all: `--no-verify`, `-c core.hooksPath=…` and changing `core.hooksPath`; a second design-tool screenshot in a phase (a phase ends when the human writes); one of `figma/*.js` pasted into `figma_execute`. After a compaction they give the agent design-fence's block of `AGENTS.md` again. Codex runs them once someone has trusted them (`/hooks`), and only in a trusted project.
- no `CLAUDE.md`: Claude Code reads `AGENTS.md` when there is none (2.1.277 or later). In a `CLAUDE.md` the project has, the installer adds `@AGENTS.md` (Claude Code reads `CLAUDE.md` instead of `AGENTS.md`) and removes the import of `PROCESS.md` that earlier versions added.

Nothing to install per agent: every agent loads `AGENTS.md`, which says which playbook to read, and every commit it makes goes through the hooks. Another tool that reads only its own file gets one line in it pointing to `AGENTS.md`.

### Claude Code's plugin (optional)

The same hooks for a person's every project, without the installer writing them into each: the plugin runs the project's own design-fence (`.agents/design-fence`, or the submodule holding it), so the rules are the version the project pins, and does nothing in a project without one, or with its own hooks (no hook runs twice).

```
/plugin marketplace add kidCubi/design-fence
/plugin install design-fence@design-fence
```

For OpenCode, copy `harness/opencode/design-fence.js` into `~/.config/opencode/plugins/`: it behaves the same way. Codex (0.167) has no hooks in plugins, only the project's `.codex/hooks.json`.

### The design module (optional)

For a project designed in Figma and built from a Storybook component library: specs in the repo, Figma as the human's gate, Storybook built from the approved designs as web components (set up at the first component if the project has none, adopted as it is if it has one), Figma's variables exported to the code's tokens file, and a UX map beside them (`PROCESS.md`, "The design module").

```sh
node .agents/design-fence/install.mjs --design
```

It adds `"design": {"dir": "design"}` to `.agents/validate.json` (rewriting it as two-space JSON) and the templates `design/PHILOSOPHY.md`, `tokens.md`, `index.md` and `flows.yml` the project does not have. Then follow `playbooks/start.md`: the foundation for a new project, the adoption for an existing one. Once the project has Storybook, name its index and the library's folder in the section (`"storybookIndex": "storybook-static/index.json", "library": "./src/components/"`) and add `design-fence specs` to the checks:

  ```json
  {"name": "design specs", "when": ["design/components/**", "**/*.stories.*"], "run": "node .agents/design-fence/bin/design-fence.mjs specs"}
  ```

What happens in Figma stays advisory: see the ledger.

## What the project provides

- **`AGENTS.md`**: what the project is, its non-negotiables, its design system and how to read it, commands, places (repository, the tracker and how to reach it, how work lands), code style. Short: it points to detail rather than restating it.
- **`.agents/validate.json`**: the checks, each run when a changed file matches its `when`:

  ```json
  {
    "node": 20,
    "base": "origin/main",
    "checks": [
      {"name": "format", "when": ["src/**/*.{js,css}"], "run": "npx --yes prettier@3.3.3 --check {files}"},
      {"name": "tests", "when": "src/**", "run": "node --test test/*.test.js"}
    ],
    "reflect": {"when": ["src/**", "test/**"]},
    "visual": {"run": "node e2e/visualCheck.mjs"}
  }
  ```

  `node` is the major version the checks need: they run with the first Node found that has it (the running one, `DESIGN_FENCE_NODE`, nvm's, the usual places). `base`: commits since it count as changed too. `{files}`: the matched files that exist, relative to the check's `cwd`. `reflect.when`: the files a commit must carry a `Reflect:` line for (by default every file but Markdown and plain text). `visual` is run by `ship.md` in phase 6, not by a hook. A check that passed on the same contents is not run again.
- **`.agents/ENFORCEMENT.md`**: the ledger, with the project's own rows.
- **The CI workflow**: the project's own setup steps (dependencies) for its checks.

## Use

- With the design module, a request for something users see goes to `.agents/design-fence/playbooks/design.md`; `start.md` lays the foundation or adopts the project first, and says which playbook a request needs when it is unclear.
- Ask the agent to follow `.agents/design-fence/playbooks/ship.md` for a request or an issue ("quick" for a prototype, "status" for the audit), or `reflect.md` to review the work just done.
- Commit as usual: the hooks run the checks and ask for the `Reflect:` line.
- `node .agents/design-fence/bin/design-fence.mjs check` (`--all`, `--no-cache`, `--base <ref>`): the checks, by hand.
- `node .agents/design-fence/bin/design-fence.mjs commits origin/main..HEAD`: the commits that change code without a `Reflect:` line.
- `node .agents/design-fence/bin/design-fence.mjs rules`: the rules, and whether the git hooks and the agent hooks are on, for an agent that did not load `AGENTS.md`.
- `node .agents/design-fence/bin/design-fence.mjs figma lint-gaps <node id>` (or `sources`, or `tokens --format css --out <file>`): design-fence's Figma scripts, run through figma-console's Desktop Bridge from the command line.

## Update

```sh
git submodule update --remote .agents/design-fence
node .agents/design-fence/install.mjs
git add .agents AGENTS.md .claude/skills .claude/settings.json .codex/hooks.json .opencode/plugins $(test -f CLAUDE.md && echo CLAUDE.md)
git commit -m "chore: design-fence <version>"
```

The installer refreshes design-fence's block in `AGENTS.md`, the agent hooks and OpenCode's plugin, and adds the skills of new playbooks; `git add` takes the new links, which `commit -a` would leave out.

Changes to how to work anywhere go here, as a change to this repository; what is specific to one project goes into that project's `AGENTS.md`.

### From 0.1 (a Claude Code plugin)

0.2 drops the plugin: the skills are playbooks, the Stop hook is the pre-commit hook, and the screenshot budget is advice. In the project: delete design-fence's plugin entries from `.claude/settings.json`, run the installer (it turns the git hooks on and adds the CI workflow), and replace `/design-fence:ship` and `/design-fence:reflect` in `AGENTS.md` by the playbooks' paths.

## Develop

`node --test test/*.test.mjs` (Node 20 or newer).
