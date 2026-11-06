# design-fence

A process for building software with an AI agent, installed into a project as a git submodule: how work moves from a request to `main` (`PROCESS.md`), the hooks that enforce what matters, and the skills that run it. Rules in the repo, grounded in the design system, checked by hooks rather than by asking twice.

It is a [Claude Code plugin](https://code.claude.com/docs/en/plugins) loaded from the submodule's directory, plus files any agent can read (`AGENTS.md`, `PROCESS.md`) and a command line any tool or person can run.

## What is in it

| | |
|---|---|
| `PROCESS.md` | The layers (project > process > personal), the non-negotiables, full and quick modes and their phases, what is enforced |
| `skills/ship` | Runs the phases: ground, ticket (GitHub issue), build, validate, visual check, human review, land, close; quick mode; an audit |
| `skills/reflect` | A review of the work just done against the project's bar |
| `skills/figma` | Working in Figma through the figma-console Desktop Bridge |
| `hooks/validate.mjs` | Stop hook: the project's checks on what changed; sends the agent back while they fail (three attempts) |
| `hooks/screenshot-budget.mjs` | One design-tool screenshot per phase; verify by reading properties instead |
| `bin/design-fence.mjs` | `check`, `rules`, `phase`: the same checks and rules, outside Claude Code |
| `ENFORCEMENT.md` | The ledger template: which rules are enforced, by what, and what green does not mean |
| `templates/` | `AGENTS.md`, `CLAUDE.md`, `validate.json` for a new project |

## Install in a project

```sh
git submodule add https://github.com/kidCubi/design-fence.git .agents/design-fence
node .agents/design-fence/install.mjs
```

The installer only adds what is missing (running it again changes nothing):

- `.claude/settings.json`: design-fence as the project's plugin, from `./.agents/design-fence`. Each person trusts the folder once in Claude Code; then the skills (`/design-fence:ship`, …) and hooks load. Commit this file: check it is not ignored.
- `CLAUDE.md`: imports `AGENTS.md` and `PROCESS.md`.
- `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`: templates to fill in, if the project has none.

A clone needs `git submodule update --init` (or `git clone --recurse-submodules`) for the plugin to be there.

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
    "visual": {"run": "node e2e/visualCheck.mjs"}
  }
  ```

  `node` is the major version the checks need: they run with the first Node found that has it (the running one, `DESIGN_FENCE_NODE`, nvm's, the usual places), whatever `node` the hook was started with. `base`: commits since it count as changed too. `{files}`: the matched files that exist, relative to the check's `cwd`. `visual` is run by `ship` in phase 6, not by the hook. A check that passed on the same contents is not run again.
- **`.agents/ENFORCEMENT.md`**: the ledger, with the project's own rows.

## Use

- `/design-fence:ship <request or #issue>`, `/design-fence:ship quick <request>`, `/design-fence:ship status`.
- `node .agents/design-fence/bin/design-fence.mjs check` (`--all`, `--no-cache`): the checks, by hand or from another tool.
- `node .agents/design-fence/bin/design-fence.mjs rules`: the rules for an agent that did not load `AGENTS.md`.

## Update

```sh
git submodule update --remote .agents/design-fence
git commit -am "chore: design-fence <version>"
```

Changes to how to work anywhere go here, as a change to this repository; what is specific to one project goes into that project's `AGENTS.md`.

## Develop

`node --test test/*.test.mjs` (Node 20 or newer). To try the plugin without installing: `claude --plugin-dir path/to/design-fence`.
