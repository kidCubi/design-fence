## Enforcement ledger

Which rules a command actually enforces, and which depend on an agent or a person choosing to follow them. A project copies this to `.agents/ENFORCEMENT.md` and adds its own rows.

- **enforced**: breaking the rule makes a command fail or a hook refuse. The row names it.
- **advisory**: everything else, including what a tool detects and only warns about.

The last column matters most: a green check is easily read as "this complies" when it only means that the thing it measures passed.

| Rule | Status | By | What a green result does not mean |
|---|---|---|---|
| The project's checks pass on what changed | enforced | pre-commit hook → `design-fence check`; pre-push hook again; CI | That files the checks' `when` patterns do not match were checked. The hook checks the working tree, so what is committed may differ from what passed when only part of it is staged. |
| A commit that changes code carries the reflect review's verdict (`Reflect:` line) | enforced | commit-msg hook; pre-push hook and CI on every pushed commit | That the review ran, or was thorough: the line is the author's word. Merge commits are not checked. |
| The git hooks are on in every clone | advisory | `install.mjs` sets `core.hooksPath`; `design-fence rules` says when they are off; CI catches what they missed | — |
| Never skip the hooks (`--no-verify`) | enforced in Claude Code, Codex and OpenCode; advisory elsewhere | the agent hooks (`design-fence agent-hook`, PreToolUse): `--no-verify`, `commit -n`, `-c core.hooksPath=…`, changing `core.hooksPath`; CI reports what a skipped hook would have refused | That the hooks ran: anyone can turn them off (`disableAllHooks`, Codex's `[features] hooks`), Codex runs them only once trusted (`/hooks`), and a command they cannot read (a script, an alias, `GIT_CONFIG_*` variables) gets through |
| Read the playbook the work goes to, whole, before its first step | advisory | `install.mjs` writes design-fence's block into `AGENTS.md` and links the skills; `design-fence rules` says whether they are there | That an agent read the playbook: the block and the skills only put it in front of the agent |
| One design-tool screenshot per phase | enforced in Claude Code, Codex and OpenCode; advisory elsewhere | the agent hooks: the second screenshot refused until the human writes again (the phase's end) | That the one taken was at the phase's end, or of the right frame. A screenshot that failed still counts. A tool not named for Figma is not counted |
| design-fence's `figma/` scripts run with `design-fence figma`, not pasted into `figma_execute` | enforced in Claude Code, Codex and OpenCode; advisory elsewhere | the agent hooks, on `figma_execute` and `use_figma` | That the command was tried before falling back: a script pasted under another name gets through |
| The rules survive a compaction | enforced in Claude Code, Codex and OpenCode | the agent hooks give design-fence's block of `AGENTS.md` again after a compaction | That the agent follows them |
| Ground before writing (read the code and the catalog, never memory) | advisory | — | — |
| "Not found" is a finding, filed as an issue | advisory | — | — |
| Issues go to the tracker `AGENTS.md` names, or into the summary when it cannot be reached; never into a file or a tool it does not name | advisory | — | — |
| Name what ran in every report | advisory | — | — |
| End done or parked | advisory | — | — |
| Design module: nothing passes the design gate without the human's word | advisory | — (the spec's `approved_by` is the author's word) | — |
| Design module: no unbound value and no frame without auto-layout in Figma | advisory | `figma_lint_design` (design-system, layout, wcag) and `figma/lint-gaps.js`, run through the bridge (`playbooks/design.md`, step 3) | That the nodes not linted follow the rules, or the instances inside a node (linted with their own component); that what the lint does not know (effects, typography values outside a text style) is bound |
| Design module: the tokens file is the tokens export's, and matches Figma | advisory | `figma/tokens.js` with `hashOnly` against `design-fence hash` (`playbooks/design.md`, step 5) | — |
| Design module: each spec's status has what it needs (Figma node and version, approver, story); built specs have their stories; the library's stories have specs | enforced once the project adds `design-fence specs` to its checks | pre-commit hook and CI → `design-fence specs` | That the stories match Figma (checked by values once, when built), that `approved_by` is true (the author's word), or anything about stories when Storybook's index is not built where `storybookIndex` says |
| Design module: no raw value in the code that a token covers | advisory, unless the project wires a check (a stylelint rule) | — | — |
