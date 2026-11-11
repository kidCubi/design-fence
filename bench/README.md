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
```

- Runs go one at a time, the arms alternating. Without `--tasks`, only the tasks that need no Figma run.
- For the Figma tasks: Figma Desktop open on your copy of "Design fence landing", the Desktop Bridge plugin running, and figma-console as the only Figma server. After each run on Figma its page is audited and deleted, not measured.
- Claude Code runs with no MCP server but figma-console (and none at all for the tasks without Figma), edits accepted, commits refused, capped at the task's budget. Codex runs in its workspace sandbox with the network on. Your own user-level settings take part in every arm alike: say what they hold when you share results.
- Results: `bench/results/<round>/<task>/<arm>-<n>.json` (numbers and score), `.jsonl` (the agent's log) and the copy itself; `summary.md` and `summary.json` beside them. Only the summaries are committed.
- `node bench/where.mjs <run.jsonl>` lists what entered a run's context and what it cost by staying there.
- Prices: `bench/prices.json`, list prices. Check them on the day.

## Reading the summary

Each cell is the median of the runs that finished, with the least and the most. A difference is marked "(not shown)" unless both arms have three runs or more and their runs do not overlap: a difference of medians alone can reverse with one more run. Claims are made only from differences that are shown.

## Results

None committed yet on this harness. The rounds of 2026-11-09 and 2026-11-10 (one task, `figma-badge`, in the landing page's project) are in design-fence's landing repository.
