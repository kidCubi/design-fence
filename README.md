# design-fence

A process for building software with AI agents, for any agent, any model and any person, installed into a project as a git submodule: how work moves from a request to `main` (`PROCESS.md`), the playbooks that run it, and the git hooks and CI that enforce what matters. Rules in the repo, grounded in the design system, checked at every commit rather than by asking twice.

Nothing in it belongs to one tool. The rules are Markdown any agent reads (`AGENTS.md`, `PROCESS.md`, the playbooks); the enforcement is git (hooks every commit and push goes through) and CI; the checks are a command line any tool or person runs.

## What is in it

| | |
|---|---|
| `PROCESS.md` | The layers (project > process > personal), the non-negotiables, where to start, full and quick modes and their phases, the design module, what is enforced |
| `playbooks/start.md` | Which way in: the foundation of a new project, the adoption of an existing one, or which playbook a request needs |
| `playbooks/design.md` | Design module: from a spec to a design approved by the human in Figma, exported to the repo |
| `playbooks/component.md` | Design module: from an approved design to the component library and its stories |
| `playbooks/flows.md` | Design module: the UX map (`design/flows.yml`): views, actions, paths, and the diagrams drawn from it |
| `playbooks/ship.md` | Runs the phases: ground, ticket (GitHub issue), build, validate, visual check, human review, land, close; quick mode; an audit |
| `playbooks/reflect.md` | A review of the work just done against the project's bar; its verdict goes into each commit as a `Reflect:` line |
| `playbooks/figma.md` | Working in Figma through the figma-console Desktop Bridge |
| `hooks/` | The git hooks: `pre-commit` (the checks), `commit-msg` (the `Reflect:` line), `pre-push` (both, on what is pushed) |
| `bin/design-fence.mjs` | `check`, `commits`, `rules`, `specs` (the design specs against Storybook), `hash` (a file's FNV-1a, against Figma's), and `hook` for the git hooks |
| `figma/lint-gaps.js` | Design module: the Figma lint `figma_lint_design` does not make (unbound spacing, radius, stroke; default names; invisible borders; stale paints; descriptions; properties against the spec), run through the bridge |
| `figma/tokens.js` | Design module: Figma's variables as the project's tokens file (W3C design tokens or CSS), or only its hash, run through the bridge |
| `figma/sources.js` | Design module: what a Figma file's design system is made of (local components, library components in use with their keys, variables), for `design/index.md`, run once through the bridge |
| `templates/` | `AGENTS.md`, `CLAUDE.md` (a pointer), `validate.json`, the CI workflow `design-fence.yml`; `design/`: the philosophy, the token rules, the index, the flows map and the component spec |
| `ENFORCEMENT.md` | The ledger template: which rules are enforced, by what, and what green does not mean |

## Install in a project

```sh
git submodule add https://github.com/kidCubi/design-fence.git .agents/design-fence
node .agents/design-fence/install.mjs
```

The installer only adds what is missing (running it again changes nothing):

- the git hooks: `core.hooksPath` set to `.agents/design-fence/hooks` in this clone. Git does not share that setting: **every clone runs the installer once** (`git submodule update --init && node .agents/design-fence/install.mjs`), people and agents' sandboxes alike. If the clone already has a `core.hooksPath`, it is left alone and the installer says so.
- `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`, `.github/workflows/design-fence.yml`: templates to fill in, if the project has none.
- `CLAUDE.md`: a pointer to `AGENTS.md` and `PROCESS.md`, for Claude Code, which reads its own file. Another tool that does not read `AGENTS.md` gets the same two-line pointer in the file it reads.

Nothing to install per agent: any agent that reads `AGENTS.md` (or a pointer to it) has the rules, and every commit it makes goes through the hooks.

### The design module (optional)

For a project designed in Figma and built from a Storybook component library: specs in the repo, Figma as the human's gate, Storybook built from the approved designs (set up at the first component if the project has none, adopted as it is if it has one), Figma's variables exported to the code's tokens file, and a UX map beside them (`PROCESS.md`, "The design module").

```sh
node .agents/design-fence/install.mjs --design
```

It adds `"design": {"dir": "design"}` to `.agents/validate.json` (rewriting it as two-space JSON) and the templates `design/PHILOSOPHY.md`, `tokens.md`, `index.md` and `flows.yml` the project does not have. Then follow `playbooks/start.md`: the foundation for a new project, the adoption for an existing one. Once the project has Storybook, name its index and the library's folder in the section (`"storybookIndex": "storybook-static/index.json", "library": "./src/components/"`) and add `design-fence specs` to the checks:

  ```json
  {"name": "design specs", "when": ["design/components/**", "**/*.stories.*"], "run": "node .agents/design-fence/bin/design-fence.mjs specs"}
  ```

What happens in Figma stays advisory: see the ledger.

## What the project provides

- **`AGENTS.md`**: what the project is, its non-negotiables, its design system and how to read it, commands, places (repository, labels, how work lands), code style. Short: it points to detail rather than restating it.
- **`.agents/validate.json`**: the checks, each run when a changed file matches its `when`:

  ```json
  {
    "node": 22,
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

- With the design module, start from `.agents/design-fence/playbooks/start.md`: it says which playbook a request needs.
- Ask the agent to follow `.agents/design-fence/playbooks/ship.md` for a request or an issue ("quick" for a prototype, "status" for the audit), or `reflect.md` to review the work just done.
- Commit as usual: the hooks run the checks and ask for the `Reflect:` line.
- `node .agents/design-fence/bin/design-fence.mjs check` (`--all`, `--no-cache`, `--base <ref>`): the checks, by hand.
- `node .agents/design-fence/bin/design-fence.mjs commits origin/main..HEAD`: the commits that change code without a `Reflect:` line.
- `node .agents/design-fence/bin/design-fence.mjs rules`: the rules, and whether the hooks are on, for an agent that did not load `AGENTS.md`.

## Update

```sh
git submodule update --remote .agents/design-fence
node .agents/design-fence/install.mjs
git commit -am "chore: design-fence <version>"
```

Changes to how to work anywhere go here, as a change to this repository; what is specific to one project goes into that project's `AGENTS.md`.

### From 0.1 (a Claude Code plugin)

0.2 drops the plugin: the skills are playbooks, the Stop hook is the pre-commit hook, and the screenshot budget is advice. In the project: delete design-fence's plugin entries from `.claude/settings.json`, run the installer (it turns the git hooks on and adds the CI workflow), and replace `/design-fence:ship` and `/design-fence:reflect` in `AGENTS.md` by the playbooks' paths.

## Develop

`node --test test/*.test.mjs` (Node 20 or newer).
