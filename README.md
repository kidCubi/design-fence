# design-fence

design-fence keeps your components from drifting away from your design system's rules, and updates them consistently only after you have reviewed the changes. It is both a workflow and a harness, installed in your project as a git submodule.

1. Define: set a direction (or start from your existing project) and provide visual references.
2. Refine: create a component or a page, either manually or with the assistance of your model.
3. Update: once your design decision is locked, all the subsequent changes are updated consistently: the copy, tone of voice, user flows, tokens, components, their variants and documentation, and your web components in Storybook.

design-fence has been benchmarked on four models from Anthropic and OpenAI, to check how well it keeps a model from drifting, see [our benchmark](#benchmark).

## Benefits

- Fewer Figma calls: on design work, ~4 a run with design-fence, against ~12 without.
- Your direction holds: across four models, 97 runs of 100 pass every check, against 40 without.
- Nothing undesigned slips in: in our benchmark, agents built an undesigned label without asking first 20 times out of 20, against 0 times with design-fence installed.
- As an output, you only get web components in their purest form, inside Storybook: no third-party UI kit, no front-end library.

## Quick install

Requirements:

- Node 20 or newer
- git
- Figma Desktop

Run once, in the project's folder:

```sh
npx github:kidCubi/design-fence
```

1. Answer two questions: which agent tools you use, and whether you design in Figma.
2. (Codex only) Trust the hooks (`/hooks`).
3. (Figma Desktop only) Import the Desktop Bridge plugin.

`node .agents/design-fence/bin/design-fence.mjs doctor` lists what is still missing, each with the step that puts it right. [Install](#install) has the details.

## How it reaches Figma

Your agent works in your open Figma file through [figma-console](https://github.com/southleft/figma-console-mcp) and its Desktop Bridge plugin, both by TJ Pitre (Southleft). The installer adds figma-console to your agent tools, and you import the plugin once (step 3 above).

You need no Figma token. Keep Figma Desktop open with the plugin running.

## Running it for the first time

1. Establish with your model the purpose of your project: its principles, look and feel, voice, your references, and what the design refuses.
2. Set the ground rules. `design/tokens.md` holds the rules for colours, type and spacing, and Figma's variables hold their values.
3. Validate the rules on a page in Figma that lays the variables out.
4. A design is generated in Figma based on those rules, by you on the canvas or by the agent through the Desktop Bridge. You approve it there.
5. The agent builds your approved design as a web component with Storybook, and the checks hold the code to the design at every commit.

## Benchmark

design-fence was benchmarked on 200 runs, on four models: Opus 5.5, Haiku 5.5, GPT 6.1 Sol and GPT 6 Luna. With it, 97/100 hold, against 40/100 without.

Runs that hold, of 5 (before → after)

| Task | Opus 5.5 | Haiku 5.5 | GPT 6.1 Sol | GPT 6 Luna |
|---|---|---|---|---|
| Design a badge in Figma | 5 → 5 | 3 → 5 | 1 → 5 | 0 → 4 |
| Build an approved component | 3 → 5 | 0 → 5 | 4 → 5 | 1 → 5 |
| Add a label that has no design | 0 → 5 | 0 → 5 | 0 → 5 | 0 → 5 |
| Review a colleague's change | 5 → 5 | 2 → 5 | 1 → 5 | 0 → 3 |
| Fix a bug users do not see | 5 → 5 | 5 → 5 | 5 → 5 | 0 → 5 |

## Install via command line

In the project's folder:

```sh
npx github:kidCubi/design-fence
```

It asks which agents you use and whether you design in Figma. Then it:

1. checks Node (20 or newer) and git;
2. adds design-fence as a git submodule at `.agents/design-fence`;
3. runs the submodule's installer, `install.mjs`: git hooks, `AGENTS.md`, skills, CI and the agent tools' hooks;
4. installs design-fence's plugin in each of your tools (below);
5. prepares the Desktop Bridge plugin for Figma Desktop to import, if you design in Figma.

Each teammate runs it once in their clone.

For an agent or a script, the answers are flags: `--yes --agents claude,codex,opencode,other --design`. `--help` lists them all.

## Install via prompting

Paste this prompt into your agent, in the project's folder. Put the agent's name in place of `{{agent}}`: `claude`, `codex`, `opencode`, or `other` for any other agent.

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
4. Tell me what is left for me to do: its "Left for you" list, in its order, in
   plain words. Its last item is for you: read the playbook it names, and tell me
   the first step it suggests for this project.
```

### Install via agent plugin (Claude Code, Codex, OpenCode)

The plugin keeps its own copy of the hooks in your agent tool, outside the project. The fence holds even if the agent edits the project's hooks.

The installer adds the plugin to the tools you pick. By hand:

- Claude Code: `claude plugin install design-fence --marketplace kidCubi/design-fence`
- Codex: `codex plugin marketplace add kidCubi/design-fence`, then install design-fence from `/plugins` and trust its three hooks in `/hooks`. After an update, trust them again.
- OpenCode (1.18.29 or later, and 2.x): copy `harness/opencode/design-fence.js` into `~/.config/opencode/plugins/`.

## Update

```sh
node .agents/design-fence/bin/design-fence.mjs update
```

It brings the submodule to its newest version, runs that version's installer and prints the commit to make. It does not commit.

By hand: `git submodule update --remote .agents/design-fence`, then `node .agents/design-fence/install.mjs`, then commit what changed, with a `Reflect:` line.

## Troubleshoot

```sh
node .agents/design-fence/bin/design-fence.mjs doctor
```

It says what is in place and, for each thing that is not, the command or the step that puts it right. It changes nothing. `--bridge` also asks the Desktop Bridge for an answer.

A commit that changes code needs a `Reflect:` line in its message: the verdict of the agent's review of that change. The git hook asks for it when it is missing.

design-fence declares figma-console at the version it was tried with, not `@latest`: the package changes several times a week. A design-fence release moves it, and `design-fence update` brings your project along.

A change to how to work anywhere goes here, as a change to this repository. What is specific to one project goes into that project's `AGENTS.md`.
