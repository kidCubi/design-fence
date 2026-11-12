# r1-gpt-6-luna: gpt-6-luna (Codex codex-cli 0.167.0)

design-fence, "this tree": e3cc04d with 10 uncommitted file(s) (snapshot 0821eadf0bf2, 2026-11-11); "released": origin/main (9579683).

Codex ran each copy untrusted: design-fence's session hooks did not run.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.014 ($0.012 to $0.019) | $0.020 ($0.015 to $0.027) | +44% (not shown) |
| Tokens | 712k (550k to 1.12M) | 985k (736k to 1.36M) | +38% (not shown) |
| Tokens not from cache | 47k (46k to 57k) | 66k (54k to 99k) | +41% (not shown) |
| Tool calls | 17 (11 to 24) | 30 (19 to 37) | +76% (not shown) |
| Figma calls | 2 (1 to 6) | 2 (2 to 5) | 0% (not shown) |
| Seconds | 142 (114 to 182) | 207 (158 to 242) | +46% (not shown) |
| Score (checks passed) | 43 of 50 | 50 of 50 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 4 of 5 | 5 of 5 |
| the design's tokens, all of them | 3 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 1 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.002 to $0.003) | $0.009 ($0.006 to $0.012) | +180% |
| Tokens | 126k (105k to 146k) | 394k (263k to 541k) | +214% |
| Tokens not from cache | 15k (10k to 18k) | 37k (30k to 69k) | +148% |
| Tool calls | 7 (6 to 9) | 8 (5 to 10) | +14% (not shown) |
| Figma calls | 0 (0 to 0) | 2 (2 to 2) | — |
| Seconds | 36 (32 to 41) | 87 (50 to 109) | +142% |
| Score (checks passed) | 10 of 15 | 22 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 2 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.026 ($0.021 to $0.032) | $0.037 ($0.017 to $0.063) | +46% (not shown) |
| Tokens | 1.05M (816k to 1.65M) | 1.72M (777k to 3.68M) | +64% (not shown) |
| Tokens not from cache | 95k (80k to 97k) | 98k (57k to 137k) | +3% (not shown) |
| Tool calls | 19 (15 to 27) | 28 (17 to 44) | +47% (not shown) |
| Figma calls | 19 (15 to 27) | 19 (11 to 33) | 0% (not shown) |
| Screenshots taken | 4 (3 to 6) | 1 (1 to 1) | −75% |
| Seconds | 329 (220 to 427) | 553 (237 to 700) | +68% (not shown) |
| Score (checks passed) | 12 of 25 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 1 of 5 | 5 of 5 |
| every frame has auto-layout | 1 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.004 ($0.004 to $0.008) | $0.007 ($0.005 to $0.011) | +73% (not shown) |
| Tokens | 133k (112k to 257k) | 149k (135k to 306k) | +12% (not shown) |
| Tokens not from cache | 18k (17k to 45k) | 40k (25k to 68k) | +123% (not shown) |
| Tool calls | 7 (5 to 11) | 15 (5 to 24) | +114% (not shown) |
| Figma calls | 0 (0 to 1) | 0 (0 to 2) | — |
| Seconds | 55 (52 to 73) | 71 (67 to 84) | +29% (not shown) |
| Score (checks passed) | 22 of 35 | 27 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 2 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 0 of 5 | 4 of 5 |
| finds the motion without reduced motion | 5 of 5 | 0 of 5 |
| finds the label against the voice | 0 of 5 | 3 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.004 ($0.003 to $0.004) | $0.007 ($0.006 to $0.011) | +88% |
| Tokens | 106k (86k to 143k) | 269k (197k to 389k) | +153% |
| Tokens not from cache | 18k (15k to 21k) | 26k (24k to 57k) | +44% |
| Tool calls | 7 (4 to 8) | 17 (9 to 18) | +143% |
| Seconds | 37 (35 to 44) | 110 (84 to 125) | +197% |
| Score (checks passed) | 22 of 30 | 26 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 0 of 5 | 3 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 2 of 5 | 3 of 5 |

