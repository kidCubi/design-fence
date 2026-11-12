# design-fence

A process for building software with AI agents, for any agent, any model and any person, installed into a project as a git submodule: how work moves from a request to `main` (`PROCESS.md`), the playbooks that run it, and the git hooks and CI that enforce what matters. Rules in the repo, grounded in the design system, checked at every commit rather than by asking twice.

Nothing in it belongs to one tool. The rules are Markdown any agent reads (`AGENTS.md`, `PROCESS.md`, the playbooks); the enforcement is git (hooks every commit and push goes through) and CI; the checks are a command line any tool or person runs.

## What is in it

| | |
|---|---|
| `PROCESS.md` | The layers (project > process > personal), the non-negotiables, where to start, full and quick modes and their phases, what the process asks of the tracker, the design module, what is enforced |
| `playbooks/start.md` | Which way in: the foundation of a new project (`foundation.md`), the adoption of an existing one (`adopt.md`), or which playbook a request needs |
| `playbooks/design.md` | Design module: from a spec to a design approved by the human in Figma, exported to the repo |
| `playbooks/component.md` | Design module: from an approved design to the component library and its stories |
| `playbooks/flows.md` | Design module: the UX map (`design/flows.yml`): views, actions, paths, and the diagrams drawn from it |
| `playbooks/ship.md` | Runs the phases: ground, ticket (in the project's tracker), build, validate, visual check, human review; `ship-more.md`: land and close, quick mode, an audit |
| `playbooks/reflect.md` | A review of the work just done against the project's bar; its verdict goes into each commit as a `Reflect:` line |
| `playbooks/figma.md` | Working in Figma through the figma-console Desktop Bridge; `figma-more.md`: fixing a connection, images, capturing HTML |
| `lib/route.mjs` | `design-fence route "<request>"`: which playbook a request needs and the project's files it touches, from the repository's own names, without a model; the agent tools' prompt hook gives it to the agent. It says when it is unsure (`bench/routing*.jsonl` measure it) |
| `hooks/` | The git hooks: `pre-commit` (the checks), `commit-msg` (the `Reflect:` line), `pre-push` (both, on what is pushed) |
| `bin/design-fence.mjs` | `check`, `commits`, `rules`, `doctor`, `update`, `route`, `design` (the design module's check: specs against Storybook, the index, `flows.yml`, raw values, the tokens file), `spec` (one spec's facts), `hash` (a file's FNV-1a, against Figma's), `figma` (the scripts of `figma/` through the Desktop Bridge, their text out of the agent's context), and `hook` for the git hooks |
| `figma/lint-gaps.js` | Design module: the Figma lint `figma_lint_design` does not make (unbound spacing, radius, stroke; default names; invisible borders; stale paints; descriptions; properties against the spec), run through the bridge |
| `figma/tokens.js` | Design module: Figma's variables as the project's tokens file (W3C design tokens or CSS), or only its hash, run through the bridge |
| `figma/sources.js` | Design module: what a Figma file's design system is made of (local components, library components in use with their keys, variables), for `design/index.md`, run once through the bridge |
| `lib/agent-hooks.mjs`, `lib/fence.mjs`, `harness/` | The agent tools' hooks: what the git hooks cannot see between two commits, refused in the session (a hook skipped or turned off, a second design-tool screenshot in a phase, a `figma/` script pasted rather than run); design-fence's own files changed only with the human's word; the rules again after a compaction. `harness/plugin/`: the plugin for Claude Code and Codex; `harness/opencode/`: OpenCode's; both generated with `lib/` inside (`node harness/build.mjs`) |
| `bin/setup.mjs`, `lib/prompt.mjs`, `package.json` | `npx github:kidCubi/design-fence`: the installer for a person (a menu in the terminal) or their agent (flags), from the requirements to the plugin in each tool |
| `skills/` | The playbooks as skills (`design-fence-<playbook>/SKILL.md`: when to use it, and the playbook to read), linked into the project's skills folders by the installer |
| `templates/` | `AGENTS.md`, design-fence's block in it (`agents-block.md`), `validate.json`, the CI workflow `design-fence.yml`; `design/`: the philosophy, the token rules, the index, the flows map and the component spec |
| `ENFORCEMENT.md` | The ledger template: which rules are enforced, by what, and what green does not mean |

## Install in a project

In the project's folder:

```sh
npx github:kidCubi/design-fence
```

It asks which agents you use (those on your machine are ticked) and whether you design in Figma, then does all design-fence needs, and says what it did:

1. checks Node (20 or newer) and git, and that the folder is a git repository (it offers to make it one);
2. adds design-fence as a git submodule at `.agents/design-fence`, or checks it out in a fresh clone of a project that has it;
3. runs that submodule's installer (below): git hooks, `AGENTS.md`, skills, CI, the agent tools' hooks, and with the design module its templates and Figma's server;
4. installs design-fence's plugin in each of your tools, outside the project (below): Claude Code and Codex from this repository's marketplace, OpenCode's file in `~/.config/opencode/plugins/`;
5. with the design module, prepares Figma's Desktop Bridge plugin for Figma Desktop to import.

It never commits: it ends with the commands to commit the install, and what is left for you in your tools (open them again, trust Codex's hooks, import the bridge in Figma). Running it again changes nothing that is there. Each teammate runs it once in their clone: git does not share the hooks' setting, and the plugin goes into each person's tools.

For an agent or a script, the answers are flags: `--yes --agents claude,codex,opencode,other --design` (`--help` lists them all). `--git-init` makes the folder a git repository, `--no-plugin` skips the plugins.

### By hand

```sh
git submodule add https://github.com/kidCubi/design-fence.git .agents/design-fence
node .agents/design-fence/install.mjs [--design] [--agents claude,codex,opencode]
```

The installer only adds what is missing and refreshes what is its own (running it again changes nothing):

- the git hooks: `core.hooksPath` set to `.agents/design-fence/hooks` in this clone. Git does not share that setting: **every clone runs the installer once** (`git submodule update --init && node .agents/design-fence/install.mjs`), people and agents' sandboxes alike. If the clone already has a `core.hooksPath`, it is left alone and the installer says so.
- `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md`, `.github/workflows/design-fence.yml`: templates to fill in, if the project has none.
- design-fence's block in `AGENTS.md`, between its markers: which playbook for which work, and the process's non-negotiables. It is added to an `AGENTS.md` the project already has, and replaced each time the installer runs; edit outside the markers.
- the playbooks as skills: `.agents/skills/design-fence-*` (Codex) and `.claude/skills/design-fence-*` (Claude Code), links into `skills/`, so an agent that loads skills reads the right playbook when the work matches it. Copies instead of links when design-fence is not at `.agents/design-fence`, or where links fail.
- the agent tools' hooks (`design-fence agent-hook`): merged into `.claude/settings.json` (Claude Code, and GitHub Copilot, which runs the same file) and `.codex/hooks.json` (Codex), keeping the project's own hooks, and OpenCode's plugin as `.opencode/plugins/design-fence.js`. They refuse in the session what the git hooks would only catch at the commit, or not at all: `--no-verify`, `-c core.hooksPath=…` and changing `core.hooksPath`; a second design-tool screenshot in a phase (a phase ends when the human writes); one of `figma/*.js` pasted into `figma_execute`. After a compaction they give the agent design-fence's block of `AGENTS.md` again. Codex runs them once someone has trusted them (`/hooks`), and only in a trusted project. They go to the project's agent tools: `"agents"` in `.agents/validate.json`, which `--agents` adds to (`other`: none of the three; where there is no list yet, to the tools wired already); without either, all three.
- no `CLAUDE.md`: Claude Code reads `AGENTS.md` when there is none (2.1.277 or later). In a `CLAUDE.md` the project has, the installer adds `@AGENTS.md` (Claude Code reads `CLAUDE.md` instead of `AGENTS.md`) and removes the import of `PROCESS.md` that earlier versions added.

Nothing to install per agent: every agent loads `AGENTS.md`, which says which playbook to read, and every commit it makes goes through the hooks. Another tool that reads only its own file gets one line in it pointing to `AGENTS.md`.

### The plugin: the fence the agent cannot edit

Everything above lives in the repository, where the agent works: it can edit `.agents/validate.json`, the hooks' settings, or design-fence itself, and a hook whose script is gone lets everything through. The plugin is installed in each person's agent tool, outside the repository, and carries its own copy of the hooks' logic. In a project with design-fence (its folder, or its block in `AGENTS.md`, which stays if the folder goes), it:

- refuses what the project's hooks refuse (the git hooks skipped, a second design-tool screenshot in a phase, a `figma/` script pasted), beside them: a screenshot counts once whichever sees it;
- asks the human's word before the agent changes design-fence's own files: design-fence's folder, `.agents/validate.json`, the hooks' settings in the project (`.claude/settings.json`, `.codex/`, `.opencode/plugins/design-fence.js`, `.git/config`, `.git/hooks/`) and in the person's tools (`~/.claude/settings.json`, `~/.claude/plugins/`, `~/.codex/config.toml`, `~/.codex/plugins/`, `~/.config/opencode/`), or turns the hooks or the plugin off. Claude Code asks; Codex and OpenCode refuse, and the human allows it for one turn by writing `design-fence: allow` in a message (an agent cannot write one);
- does nothing in a project without design-fence.

The project keeps its rules, its git hooks and CI; the plugin keeps the agent from undoing them. Only what is off the machine is out of the agent's reach entirely: CI on a protected `main` (and, for a company, managed settings, below).

`npx github:kidCubi/design-fence` installs it in the tools you pick. By hand:

In Claude Code: `claude plugin install design-fence --marketplace kidCubi/design-fence` (or `/plugin marketplace add kidCubi/design-fence`, then `/plugin install design-fence@design-fence`).

In Codex: `codex plugin marketplace add kidCubi/design-fence`, then install design-fence from `/plugins`, and trust its three hooks in `/hooks`. Codex reads the same marketplace and plugin. After an update, Codex marks the hooks "modified": trust them again.

In OpenCode (1.18.29 or later, and 2.x): copy `harness/opencode/design-fence.js` into `~/.config/opencode/plugins/`. `install.mjs` also puts a copy in the project (`.opencode/plugins/`), for whoever has not got one; the person's copy is the fence.

For a company, managed settings put the plugin out of everyone's reach: Claude Code's `managed-settings.json` can force-enable it with `allowManagedHooksOnly`, and Codex has `requirements.toml`. Not tried here: see their documentation.

### Which agent tools, and what each gets

Every tool gets the rules (`AGENTS.md`), the git hooks on every commit and push, and CI. What differs is what is held in the session, between two commits.

| Tool | In the session | Figma's server | When the fence needs the human's word | Tried live |
|---|---|---|---|---|
| Claude Code | The project's hooks (`.claude/settings.json`) and the plugin, outside the repository | `.mcp.json` | It asks the human in place | 2.1.322, 2026-11-12 |
| Codex | The project's hooks (`.codex/hooks.json`, once trusted in `/hooks`, in a trusted project) and the plugin | `.codex/config.toml` | Refused, with the reason and the way out ("design-fence: allow") | 0.167, 2026-11-11 |
| OpenCode | The project's plugin (`.opencode/plugins/`) and your own copy of it | `opencode.json` | Refused, with the reason and the way out | 2.2.7, 2026-11-11 |
| GitHub Copilot (its CLI) | Claude Code's hooks, which it runs in a folder you trust (`--trust-folder` in prompt mode): the same refusals, with their reason. It does not pass a hook's context to its agent, so no route and no rules again after a compaction; no plugin of design-fence's for it yet | `.mcp.json` (by its own help; not tried) | Refused, with the reason and the way out | 1.0.109, 2026-11-12 |
| Cursor, Gemini CLI, Windsurf, others | Nothing wired by design-fence. Cursor loads Claude Code's hooks by itself: refusals should hold there (exit 2), not tried | By hand | — | Not tried |

`node harness/probe.mjs` (and `--answers`) records what a tool sends to hooks and which of their answers it honours: how Copilot was brought in, and where to start for another tool.

### The design module (optional)

For a project designed in Figma and built from a Storybook component library: specs in the repo, Figma as the human's gate, Storybook built from the approved designs as web components (set up at the first component if the project has none, adopted as it is if it has one), Figma's variables exported to the code's tokens file, and a UX map beside them (`PROCESS.md`, "The design module").

```sh
node .agents/design-fence/install.mjs --design
```

It adds `"design": {"dir": "design"}` to `.agents/validate.json` (rewriting it as two-space JSON) and the templates `design/PHILOSOPHY.md`, `tokens.md`, `index.md` and `flows.yml` the project does not have. It declares Figma's server, figma-console, for each agent tool: `.mcp.json` (Claude Code), `.codex/config.toml` (Codex), `opencode.json` (OpenCode), unless the file declares it already. Over its Desktop Bridge it needs no token, so nothing personal goes into the repository; each person approves the server once (Claude Code asks; Codex, once the project is trusted). A `figma-console` of your own in your user settings, with a token, keeps working beside it. Codex's sandbox keeps the network off, which `design-fence figma` needs: turn it on for yourself (`playbooks/figma.md`), not in the project. Then follow `playbooks/start.md`: the foundation for a new project, the adoption for an existing one. It also adds the check `design-fence design` to the project's checks (specs against Storybook, the index, `flows.yml`, raw values in the library's CSS, the tokens file as exported: `ENFORCEMENT.md` says what each holds and what it cannot see). Once the project has Storybook and a tokens file, name them in the section, with the Figma file's key and the tokens components must not bind (`private`), so the check and the Figma commands need nothing else:

  ```json
  "design": {"dir": "design", "storybookIndex": "storybook-static/index.json", "library": "./src/components/",
             "fileKey": "<the Figma file's key>",
             "tokens": {"file": "src/tokens.css", "format": "css", "px": ["space/", "radius/"], "private": ["--mono-*"]}}
  ```

What happens in Figma stays advisory: see the ledger.

### Install by asking your agent

For someone who would rather not run the command: paste this into the agent, in the project's folder, with the agent's name in place of `{{agent}}`: `claude`, `codex`, `opencode`, or `other` for any other agent. The agent runs the same installer, with its answers as flags.

```text
Install design-fence in this project, with its design module. I'm a designer:
explain each step in one plain sentence, and ask me before anything you can't undo.

1. Run, in this project's folder:
   npx -y github:kidCubi/design-fence --yes --design --agents {{agent}}
   It needs the network, and writes into this project (.agents, .claude, .codex,
   .git…) and into your own settings, to install design-fence's plugin there: if
   your sandbox stops any of that, ask me to approve running it outside.
2. If it stops because something is missing (Node, git), tell me in plain words
   what, and how to get it. If this folder is not a git repository, ask me whether
   to make it one; if I agree, run the command again with --git-init.
3. Tell me, in plain words, what it did: its output lists it.
4. Don't commit. Show me the commit it suggests, and let me decide.
5. Tell me what is left for me to do: its "Left for you" list, in its order, in
   plain words. Its last item is for you: read the playbook it names, and tell me
   the first step it suggests for this project.
```

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
node .agents/design-fence/bin/design-fence.mjs update
```

It brings the submodule to its newest version, runs that version's installer (which refreshes design-fence's block in `AGENTS.md`, the agent hooks, OpenCode's plugin, the Figma server's version, and adds the skills of new playbooks), and prints the commit to make; it does not commit. By hand: `git submodule update --remote .agents/design-fence`, then `node .agents/design-fence/install.mjs`, then commit what changed, with a `Reflect:` line.

## When something does not work

```sh
node .agents/design-fence/bin/design-fence.mjs doctor
```

It says what is in place and, for each thing that is not, the command or the step that puts it right: the git hooks in this clone, the installer's files against this version, the session hooks for the project's tools, the design module's check, the Figma server's version in each tool's settings, the Desktop Bridge plugin on this machine. `--bridge` also asks Figma's bridge for an answer. It changes nothing.

**One version of Figma's server.** design-fence declares figma-console at the version it was tried with (`FIGMA_CONSOLE` in `lib/fence.mjs`), not `@latest`: the package changes several times a week, and design-fence reads its answers. A design-fence release moves it; `design-fence update` then brings the project's declarations along. A declaration of your own, with a token, is left as it is.

Changes to how to work anywhere go here, as a change to this repository; what is specific to one project goes into that project's `AGENTS.md`.

### From 0.1 (a Claude Code plugin)

0.2 drops the plugin: the skills are playbooks, the Stop hook is the pre-commit hook, and the screenshot budget is advice. In the project: delete design-fence's plugin entries from `.claude/settings.json`, run the installer (it turns the git hooks on and adds the CI workflow), and replace `/design-fence:ship` and `/design-fence:reflect` in `AGENTS.md` by the playbooks' paths.

## Develop

`node --test test/*.test.mjs` (Node 20 or newer). `package.json` makes `npx github:kidCubi/design-fence` run `bin/setup.mjs` (and `npx design-fence`, once published to npm); it has no dependencies. After a change to `lib/` or `harness/src/`, `node harness/build.mjs` makes the plugins again (a test fails while they differ).
