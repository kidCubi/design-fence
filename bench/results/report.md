# design-fence, measured

Made 2026-11-13 by `bench/report.mjs` from the rounds below. Each cell is the median of the runs that finished, without design-fence → with it. A difference is marked * when it is shown: three runs or more an arm, and no run of one arm inside the other's range. The others are differences of medians, which one more run could reverse: no claim rests on them.

| Model | Agent | Round | design-fence | Codex hooks |
| --- | --- | --- | --- | --- |
| claude-haiku-5-5 | Claude Code 2.1.322 | `r5-haiku-5.5` | 56ac855 + 10 uncommitted file(s) (snapshot 78e8059a5b98) | — |
| gpt-6.1-sol | Codex codex-cli 0.167.0 | `r5-gpt-6.1-sol` | 56ac855 + 10 uncommitted file(s) (snapshot 78e8059a5b98) | on |
| gpt-6-luna | Codex codex-cli 0.167.0 | `r5-gpt-6-luna` | 56ac855 + 10 uncommitted file(s) (snapshot 78e8059a5b98) | on |

## Does the result hold

Runs that pass every check both arms share, of the runs that finished (a rule of design-fence's own is left out: "one screenshot at most").

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 3 of 5 → 5 of 5 | 1 of 5 → 5 of 5 | 0 of 5 → 4 of 5 |
| component-build | 0 of 5 → 5 of 5 | 4 of 5 → 5 of 5 | 1 of 5 → 5 of 5 |
| drift-probe | 0 of 5 → 5 of 5 | 0 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| review | 2 of 5 → 5 of 5 | 1 of 5 → 5 of 5 | 0 of 5 → 3 of 5 |
| ship-issue | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |

## What a result that holds costs

The arm's whole spend on the task, over its runs that hold (the table above): a run that has to be sent back was paid for too.

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | $0.058 → $0.034 | $1.31 → $0.25 | none of 5 held → $0.042 |
| component-build | none of 5 held → $0.046 | $0.32 → $0.29 | $0.063 → $0.013 |
| drift-probe | none of 5 held → $0.015 | none of 5 held → $0.11 | none of 5 held → $0.006 |
| review | $0.027 → $0.014 | $0.45 → $0.12 | none of 5 held → $0.008 |
| ship-issue | $0.011 → $0.017 | $0.077 → $0.14 | none of 5 held → $0.008 |

## Cost

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | $0.034 → $0.032 (−5%) | $0.25 → $0.24 (−4%) | $0.023 → $0.032 (+43%) |
| component-build | $0.039 → $0.051 (+30%) | $0.26 → $0.27 (+7%) | $0.012 → $0.012 (+2%) |
| drift-probe | $0.011 → $0.014 (+36%*) | $0.071 → $0.10 (+47%) | $0.003 → $0.006 (+86%) |
| review | $0.011 → $0.013 (+22%*) | $0.097 → $0.11 (+12%) | $0.003 → $0.004 (+31%) |
| ship-issue | $0.011 → $0.017 (+51%*) | $0.079 → $0.14 (+71%*) | $0.003 → $0.008 (+142%*) |

## Seconds

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 98 → 99 (+1%) | 240 → 263 (+10%) | 250 → 542 (+117%) |
| component-build | 125 → 209 (+67%) | 252 → 308 (+22%) | 127 → 179 (+41%*) |
| drift-probe | 28 → 39 (+39%*) | 52 → 88 (+69%*) | 33 → 76 (+130%) |
| review | 36 → 45 (+25%) | 60 → 68 (+13%) | 47 → 65 (+38%) |
| ship-issue | 30 → 48 (+60%) | 60 → 118 (+97%*) | 39 → 88 (+126%*) |

## Tokens

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 1.13M → 949k (−16%) | 852k → 651k (−24%) | 1.06M → 1.43M (+35%) |
| component-build | 1.52M → 1.87M (+24%) | 782k → 879k (+12%) | 561k → 558k (−1%) |
| drift-probe | 339k → 347k (+3%) | 142k → 174k (+22%*) | 146k → 253k (+73%*) |
| review | 244k → 289k (+18%) | 160k → 197k (+23%*) | 120k → 125k (+5%) |
| ship-issue | 344k → 612k (+78%) | 168k → 320k (+91%*) | 111k → 268k (+141%*) |

## Tool calls

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 17 → 14 (−18%) | 25 → 24 (−4%) | 21 → 27 (+29%) |
| component-build | 26 → 32 (+23%) | 26 → 44 (+69%*) | 15 → 24 (+60%) |
| drift-probe | 8 → 15 (+88%*) | 11 → 12 (+9%) | 9 → 10 (+11%) |
| review | 5 → 6 (+20%) | 12 → 14 (+17%) | 8 → 6 (−25%) |
| ship-issue | 11 → 11 (0%) | 13 → 17 (+31%*) | 7 → 16 (+129%) |

## Figma calls

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 14 → 6 (−57%*) | 18 → 7 (−61%*) | 19 → 14 (−26%) |
| component-build | 8 → 0 (−100%*) | 6 → 0 (−100%*) | 3 → 0 (−100%*) |

## Screenshots

| Task | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| figma-badge | 2 → 1 (−50%) | 4 → 1 (−75%*) | 4 → 1 (−75%*) |
| component-build | 1 → 0 (−100%*) | — | — |

## What is shown

- **figma-badge**: figma calls −57% (claude-haiku-5-5); figma calls −61% (gpt-6.1-sol); screenshots −75% (gpt-6.1-sol); screenshots −75% (gpt-6-luna).
- **component-build**: figma calls −100% (claude-haiku-5-5); screenshots −100% (claude-haiku-5-5); tool calls +69% (gpt-6.1-sol); figma calls −100% (gpt-6.1-sol); seconds +41% (gpt-6-luna); figma calls −100% (gpt-6-luna).
- **drift-probe**: cost +36% (claude-haiku-5-5); seconds +39% (claude-haiku-5-5); tool calls +88% (claude-haiku-5-5); seconds +69% (gpt-6.1-sol); tokens +22% (gpt-6.1-sol); tokens +73% (gpt-6-luna).
- **review**: cost +22% (claude-haiku-5-5); tokens +23% (gpt-6.1-sol).
- **ship-issue**: cost +51% (claude-haiku-5-5); cost +71% (gpt-6.1-sol); seconds +97% (gpt-6.1-sol); tokens +91% (gpt-6.1-sol); tool calls +31% (gpt-6.1-sol); cost +142% (gpt-6-luna); seconds +126% (gpt-6-luna); tokens +141% (gpt-6-luna).

## The checks

### figma-badge

| Check (runs that pass) | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| the design is there (its page was found) | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| every value bound to a variable | 3 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 0 of 5 → 4 of 5 |
| every frame has auto-layout | 5 of 5 → 5 of 5 | 1 of 5 → 5 of 5 | 2 of 5 → 5 of 5 |
| not built in code | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| one screenshot at most (design-fence's own rule) | 1 of 5 → 5 of 5 | 0 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| Runs counted | 5, 5 | 5, 5 | 5, 5 |

### component-build

| Check (runs that pass) | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| the element df-command is defined | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| its stories are titled Components/Command | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| a story with the copy button and one without | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| no value written raw | 4 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 3 of 5 → 5 of 5 |
| the design's tokens, all of them | 0 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 2 of 5 → 5 of 5 |
| no token the design does not use | 5 of 5 → 5 of 5 | 4 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| the copy button is the library's Button | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| a pre holding a code (the spec's accessibility) | 0 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 2 of 5 → 5 of 5 |
| nothing else in the project changed | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| the report names what it checked | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| Runs counted | 5, 5 | 5, 5 | 5, 5 |

### drift-probe

| Check (runs that pass) | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| no visual reached the code without a design | 0 of 5 → 5 of 5 | 0 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| no value written raw | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| says what is left (a design to approve) | 5 of 5 → 5 of 5 | 0 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| Runs counted | 5, 5 | 5, 5 | 5, 5 |

### review

| Check (runs that pass) | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 4 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 4 of 5 → 5 of 5 |
| finds the padding written raw | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| finds the primitive where a role belongs | 4 of 5 → 5 of 5 | 1 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| finds the motion without reduced motion | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 2 of 5 → 3 of 5 |
| finds the label against the voice | 3 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 0 of 5 → 4 of 5 |
| changed nothing | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| Runs counted | 5, 5 | 5, 5 | 5, 5 |

### ship-issue

| Check (runs that pass) | claude-haiku-5-5 | gpt-6.1-sol | gpt-6-luna |
| --- | --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| the project's tests pass | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| a test covers the fix | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| nothing else changed | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| not committed | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 |
| the report names what ran | 5 of 5 → 5 of 5 | 5 of 5 → 5 of 5 | 0 of 5 → 5 of 5 |
| Runs counted | 5, 5 | 5, 5 | 5, 5 |

## To run it again

```sh
node bench/run.mjs setup
node bench/run.mjs all --agent <claude|codex> --model <model> --runs 5 --arms without,next --tasks all --key <your Figma file's key> --round <name>
node bench/report.mjs bench/results/r5-haiku-5.5 bench/results/r5-gpt-6.1-sol bench/results/r5-gpt-6-luna
```

The tasks, the fixture and what each check reads: `bench/README.md`. Prices are list prices (`bench/prices.json`).
