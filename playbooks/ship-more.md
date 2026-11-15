# Ship: landing, quick mode, the audit

The parts of `ship.md` a piece of work needs only at its end, or not at all: read the section the work needs.

## Land and close (phase 8)

1. Commit on the ticket branch: conventional prefix, the issue's id in brackets (`(#12)`, `(ENG-123)`), a body saying what changed and why, the `Reflect:` line with the review's verdict, and the session's attribution line if the tool adds one. One ticket may be several commits; never mix tickets in one. The commit-msg hook refuses a commit that changes code without its `Reflect:` line.
2. `git fetch --prune`. If the default branch moved, rebase the ticket's own unpushed commits on it and validate again.
3. Land as `AGENTS.md` says (a fast-forward push, or a pull request). The pre-push hook checks every pushed commit for its `Reflect:` line and runs the checks again. **Never force-push or rewrite the default branch.** If the push is refused, fetch and re-apply on top; if the branch was rewritten (the old tip is no longer an ancestor), stop and tell the user. If the tool's permissions refuse the push, tell the user what to allow; do not look for another way in.
4. **Verify by content** on the remote default branch (`git cat-file -e origin/<branch>:<path>`, `git grep` for a function or a string). A hash or a "merged" label is not proof.
5. **Close the issue** in the tracker with a comment: the commit, and anything done differently from the ticket (on GitHub, `gh issue close <n> --comment "…"`).
6. **Summary**, standing on its own: what landed and where, what was checked and how (name what ran), what was not, what differs from the ticket, and the issues filed for what is left. No open offers.

## Quick mode

For a prototype, an exploration, a demonstration: phases 1, 4 and 5, on a `quick/<slug>` branch or a worktree, no issue unless asked, nothing landed on the default branch. The non-negotiables of `PROCESS.md` and the git hooks still hold. "Do it for real now" means full mode from phase 2 on what exists: a ticket that describes it, then build as refinement, not a rewrite.

## Audit (status)

1. `git fetch --prune`. List the tracker's open and recently closed issues, and what is on the remote default branch.
2. For each issue, find the truth by content: work there → should be closed; not there → should be open.
3. Report as a table (issue, where the work is, state before → after). Close or reopen only what is plainly wrong; list judgement calls. List closed issues whose work is **not** on the default branch first: that work was lost.
