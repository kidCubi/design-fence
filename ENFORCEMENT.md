## Enforcement ledger

Which rules a command actually enforces, and which depend on an agent or a person choosing to follow them. A project copies this to `.agents/ENFORCEMENT.md` and adds its own rows.

- **enforced**: breaking the rule makes a command fail or a hook refuse. The row names it.
- **advisory**: everything else, including what a tool detects and only warns about.

The last column matters most: a green check is easily read as "this complies" when it only means that the thing it measures passed.

| Rule | Status | By | What a green result does not mean |
|---|---|---|---|
| The project's checks pass on what changed | enforced | Stop hook → `design-fence check` (Claude Code); by hand elsewhere | That files the checks' `when` patterns do not match were checked; that a check passed on code it never ran on. After three failed attempts the hook lets the agent stop: it then says so in its report. |
| One design-tool screenshot per phase | enforced | PreToolUse hook (Claude Code only) | That the result was verified: reading the design file's properties is what verifies it. Other tools have no hook. |
| Ground before writing (read the code and the catalog, never memory) | advisory | — | — |
| "Not found" is a finding, filed as an issue | advisory | — | — |
| Name what ran in every report | advisory | — | — |
| End done or parked | advisory | — | — |
