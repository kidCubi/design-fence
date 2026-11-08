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
| Never skip the hooks (`--no-verify`) | advisory | — (CI reports what a skipped hook would have refused) | — |
| One design-tool screenshot per phase | advisory | — | — |
| Ground before writing (read the code and the catalog, never memory) | advisory | — | — |
| "Not found" is a finding, filed as an issue | advisory | — | — |
| Name what ran in every report | advisory | — | — |
| End done or parked | advisory | — | — |
