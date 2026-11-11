# Reflect on what was just implemented

A playbook for any agent or person: step back from the work just done and judge it as a demanding reviewer of this codebase would: is it structured and written to the same bar as the code around it, with no hacks? Then propose improvements, if there are any. Run it after finishing an implementation or a ticket, before committing it: every commit that changes code carries this review's verdict as a `Reflect:` line, and the commit-msg hook refuses one without it.

This is a review of structure and style, of your own work. It is not a bug hunt (a separate code review does that) and it is not a place to defend earlier choices. If a choice made an hour ago now looks wrong, say so.

## 1. Establish what to review

- When named: review that (a branch, a pull request via `gh pr diff`, or the given paths).
- Otherwise: review what this session implemented. Combine:
  - uncommitted work: `git status --short`, `git diff`, `git diff --staged`;
  - the commits of the current branch that are not on its base: `git log --oneline <base>..HEAD` and `git diff <base>...HEAD`. The base is the remote default branch (`AGENTS.md`). Fetch first (`git fetch --prune`). If the branch is stacked on another ticket branch, review only this ticket's commits. For work already on the default branch, review the commits named (`git show <commit>`).
- If nothing was implemented, say so and stop.

State in one line what is being reviewed (the ticket, the files, the number of lines).

## 2. Re-read it properly

Do not review from memory of having written it.

- Read every changed file in full, not only the hunks.
- For each changed file, read one or two neighbours that do the same kind of job (another control, another tool, another pass, another test file). They are the bar: the change should read as if the same person wrote both.
- Read the project's own statement of its bar: `AGENTS.md` (its non-negotiables, where things go, its docs) and what it points to, and, for UI work, the design system's catalog for the components involved. Keep it clear, simple and maintainable: patterns only when justified now, not for a hypothetical future.

## 3. Check it against the bar

Go through each point and note concrete findings with `file:line`. A point with nothing to report needs no comment.

**Structure**

- Each piece is where the codebase would put it (model, controller, view, pure geometry, control), and does one job. Logic that needs no DOM or GPU is in a module without them, so it can be tested.
- No responsibility leaked into a neighbour that should not know about it (a tool reaching into a controller's privates, a control knowing its caller).
- Nothing duplicated that already existed. Look for a helper, a component or a recipe before keeping a new one.
- No abstraction, option or parameter added for a future that is not here. No dead code, no unused export, no leftover branch.
- State lives in one place. No two fields that must be kept in step by hand.
- Names say what a thing is in the project's vocabulary, and match the names used around it.

**Hacks**

Look for these specifically, and call each one what it is:

- special cases bolted on to make one situation work (`if (kind === …)` in a place that should not know kinds);
- magic numbers without a named constant and a comment saying what they are;
- timing workarounds (`setTimeout`, retries, flags reset "later") standing in for the right event or the right owner of the state;
- reaching into private fields (`_name`) of another object, or patching prototypes;
- swallowed errors, or a guard that hides a problem instead of handling it;
- a behaviour that differs from what the ticket or the design system says, without it being stated;
- comments that explain a workaround where the code could simply be right.

A workaround that is the correct trade-off is fine. It must then be deliberate: named, commented with the reason, and mentioned in the report.

**Style**

- It reads like the surrounding code: same comment density and voice, same idioms, same ordering of members, same file header.
- Comments describe what the code is, not how it came to be or what it used to be.
- The project's checks pass: `node .agents/design-fence/bin/design-fence.mjs check`.
- UI: the design system's components and tokens only (no raw colours or sizes a token covers, nothing hand-rolled a component covers), and what the catalog says still true after the change.
- Design module: the spec says what Figma and the code do, and nothing in either goes beyond it; the tokens file came from the tokens export, not by hand; `design-fence design` holds; `design/index.md` and `flows.yml` say what is now true; the views `flows.yml` lists for a changed component were checked again.

**Tests and docs**

- The logic added is tested the way neighbouring logic is: many small tests on toy cases that check correctness, not only that a call returns.
- Tests still describe the behaviour after later changes in the same work; none left asserting an earlier design.
- The docs `AGENTS.md` names say what the code now does. Class and file comments were updated with the code.

**The whole**

- Would this be simpler if started again knowing what is known now? If a much shorter or clearer shape exists, that is the main finding.
- Anything done differently from what was asked, or left unchecked, is stated plainly.

## 4. Report

Answer in this order:

1. **Verdict**, in one or two sentences: does it hold the bar, and what is the one thing most worth changing, if anything.
2. **Findings**, most important first. For each: where (`file:line`), what is wrong in one sentence, and why it falls short of the bar (the neighbour or the rule it departs from).
3. **Proposed improvements**, each a concrete change: what to do, roughly how large, and what it buys. Mark which ones you recommend doing now and which are optional.
4. **What holds up**, briefly, only where it is worth knowing (a part that was checked hard and is sound).

Rules for the report:

- Be specific and honest. "No issues found" is a valid result when it is true; do not invent findings to look thorough, and do not soften real ones.
- Do not change code in this step. Propose, then let the user choose (`playbooks/ship.md` applies what it recommends on its own). If improvements are applied, re-run the tests and the format check, say what changed, and review the result again: the verdict must be about the code being committed.
- Git: this review reads only. Commits and pushes happen only when the user (or `ship.md`) asks.

## 5. Record the verdict

When the change is committed, its message carries the verdict on a line of its own:

    Reflect: <the verdict, in a sentence: holds the bar, or what was found and done>

The commit-msg hook refuses a commit that changes code without it, and the pre-push hook and CI check every pushed commit for it. The line is the author's word that the review ran on that commit: write what the review said, never a line for its own sake.
