# The measure: does design-fence save tokens, calls and time, and does it hold the design?

The same request is given to an agent in copies of one project that differ by design-fence alone, several times per arm, with no one answering. Each run is measured (tokens, cost at list price, tool calls, turns, seconds) and what it left is scored by a script. A saving with a lower score is not a saving.

## The project

`bench/fixture/` is a small real project, cut from design-fence's landing page: four web components built from their approved designs (Link, Button, Section, Top bar), one approved and not built yet (Command), tokens exported from Figma, a page, Storybook, a small tool with its tests, and an issues file. Text only.

- **Without design-fence:** the project with design-fence's layer removed (`design/` specs, the process, the playbooks, the hooks). It keeps an `AGENTS.md` with the project's facts (`fixture/.bench/AGENTS.without.md`), its code, tokens, copy and issues. Comments in the code still name spec files that are gone.
- **With design-fence, as released** (`with`): design-fence at `--base` (default `origin/main`), installed by its own installer.
- **With design-fence, this working tree** (`next`): what a change to design-fence would ship.

## The tasks

| Task | Needs Figma | What it asks | What is scored |
|---|---|---|---|
| `ship-issue` | no | Fix an open issue that changes nothing users see | The issue's own hidden test, the project's tests, a test added, nothing else touched, the issue closed, not committed, the report names what ran |
| `review` | no | Review a colleague's uncommitted change to the Button | Whether it finds the raw colour, the raw spacing, the kind nobody designed and the motion, says it cannot go in, and changes nothing |
| `drift-probe` | no | "Add a small Beta label next to the wordmark": something users see, with no design | Whether a visual reached the code without a design, raw values, and what the run says is left |
| `component-build` | yes (read) | Build the approved Command component in the library | Against the component the project really built: its tokens, the library's Button reused, its stories, no raw value |
| `figma-badge` | yes (write, on its own page) | Design a Badge in Figma up to the designer's approval | The audit in Figma (`audit.js`): every value bound, auto-layout; one screenshot; a draft spec |

`drift-probe` is not a cost comparison: the two arms do different work on purpose. Its result is how often an undesigned visual reaches the code.

## Run it

```sh
node bench/run.mjs setup                                    # once: the fixture's dependencies (Storybook)
node bench/run.mjs tasks
node bench/run.mjs all --agent claude --model claude-haiku-5-5 --runs 5 --arms without,with,next
node bench/run.mjs all --agent codex --model <model> --effort high --runs 5
node bench/run.mjs all --tasks all --key <your Figma file's key> ...   # with the Figma tasks
node bench/summary.mjs bench/results/<round>
node bench/run.mjs rescore --round <round>                   # after a change to a score.mjs: the stored runs scored again
node bench/report.mjs bench/results/<round> [<round> ...]    # several rounds (models) side by side: report.md, report.json
```

- Runs go one at a time, the arms alternating. Without `--tasks`, only the tasks that need no Figma run.
- For the Figma tasks: Figma Desktop open on your copy of "Design fence landing", the Desktop Bridge plugin running, and figma-console as the only Figma server. After each run on Figma its page is audited and deleted, not measured. The file is then read again: a run that changed anything else in it fails the check "nothing else in the Figma file changed", in both arms, and the round stops there, the file being yours. Put the file right, then go on with `--resume`.
- Claude Code runs with no MCP server but figma-console, at design-fence's version (and none at all for the tasks without Figma), edits accepted, commits refused, capped at the task's budget. Codex runs in its workspace sandbox with the network on, with the same servers as Claude Code (your own are turned off for the run), and with npm's cache and the fixture's Storybook cache opened to the sandbox, as Claude Code, which runs without one here, has them; `.git` stays read-only, as Codex keeps it. The rest of your user-level settings takes part in every arm alike: say what they hold when you share results.
- Codex runs a project's hooks only once a person trusted the project and reviewed each hook, and a run's copy is new. By default the runner has Codex take the copy's hooks as reviewed (`--dangerously-bypass-hook-trust`: the hooks are design-fence's, from the round's copy of it; `exec` trusts the folder itself as it starts), which is design-fence as a team that trusted its project has it. `--hooks off` runs the copy untrusted, as the rounds before 2026-11-12 11:00 did: no route given up front, no gate. The summary says which.
- Codex runs on your plan's allowance: a round on a main model can reach its limit. `all` then stops, and the same command with `--resume` goes on from that run once the allowance is back (it keeps the runs that count, on the round's own copy of design-fence).
- Results: `bench/results/<round>/<task>/<arm>-<n>.json` (numbers and score), `.jsonl` (the agent's log) and the copy itself; `summary.md` and `summary.json` beside them. Only the summaries are committed.
- `node bench/where.mjs <run.jsonl>` lists what entered a run's context and what it cost by staying there.
- Prices: `bench/prices.json`, list prices. Check them on the day.

## Reading the summary

Each cell is the median of the runs that finished, with the least and the most. A difference is marked "(not shown)" unless both arms have three runs or more and their runs do not overlap: a difference of medians alone can reverse with one more run. Claims are made only from differences that are shown.

The report (`bench/report.mjs`) adds two readings across rounds. A run "holds" when it passes every check both arms share, a rule of design-fence's own left out: what a person would not have to send back. And "what a result that holds costs" is an arm's whole spend on a task over its runs that hold, since a run that is sent back was paid for too; "none held" when no run does.

## Results

Each round's `summary.md` is in `bench/results/<round>/`, and says which design-fence it measured. The rounds of 2026-11-12: `r1-*` (four models, design-fence at 8a1b499), `r2-gpt-6.1-sol` (f0e377d, Codex with the project's hooks), `r2-haiku-5.5` (the router's fix), `r3-haiku-5.5` (68f10d6), `r3-gpt-6.1-sol` (2ed3626; 32 of its 50 runs, stopped at the plan's limit and left there: the route's line it measured was replaced), and three checks of one change each, with design-fence only (`check-block-haiku-5.5`, `check-api-haiku-5.5`, `check-read-haiku-5.5`). The night after, three models on one design-fence (65c690e: each round's snapshot has the same id, a14130a4d842), 50 runs each: `r4-haiku-5.5`, `r4-gpt-6.1-sol`, `r4-gpt-6-luna`; `bench/report.mjs` on the three puts them side by side. `r4-gpt-6-luna-nohooks` is the same copy with Codex's hooks off (with design-fence only). Then changes checked one at a time, with design-fence only. The review's point on the project's own rules: its first wording (`check-rules-gpt-6-luna`), and the one kept on three models (`check-rules-b-*`: `review` and `ship-issue`). The build's one read of its design as a command, `design-fence figma read` (`check-figma-read-haiku-5.5`), then its route without `figma.md` (`check-figma-read-b-haiku-5.5`) and the playbook saying so (`check-figma-read-b2-*`, Luna and Sol): `component-build`. A fix left untested by a cheap model: `ship.md` reworded twice and taken back (`check-ship-*`, three models, then `check-ship-b-gpt-6-luna`), then one line in the ship's route, kept (`check-ship-c-gpt-6-luna`): `ship-issue`. The rounds of 2026-11-09 and 2026-11-10 (one task, `figma-badge`, in the landing page's project) are in design-fence's landing repository.
