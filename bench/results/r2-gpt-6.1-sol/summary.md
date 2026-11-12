# r2-gpt-6.1-sol: gpt-6.1-sol (Codex codex-cli 0.167.0)

design-fence, "this tree": f0e377d (snapshot 4767b6478ee3, 2026-11-12); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.28 ($0.25 to $0.34) | $0.39 ($0.31 to $0.45) | +39% (not shown) |
| Tokens | 894k (725k to 1.18M) | 1.46M (887k to 1.55M) | +64% (not shown) |
| Tokens not from cache | 56k (50k to 70k) | 75k (66k to 80k) | +34% (not shown) |
| Tool calls | 32 (26 to 40) | 53 (37 to 69) | +66% (not shown) |
| Figma calls | 6 (6 to 7) | 4 (2 to 6) | −33% (not shown) |
| Seconds | 289 (237 to 317) | 368 (336 to 540) | +27% |
| Score (checks passed) | 50 of 50 | 50 of 50 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 5 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 5 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.058 ($0.044 to $0.067) | $0.077 ($0.062 to $0.083) | +33% (not shown) |
| Tokens | 144k (138k to 159k) | 126k (124k to 148k) | −12% (not shown) |
| Tokens not from cache | 17k (11k to 22k) | 23k (16k to 28k) | +38% (not shown) |
| Tool calls | 12 (11 to 14) | 10 (9 to 11) | −17% (not shown) |
| Seconds | 46 (41 to 53) | 77 (64 to 86) | +67% |
| Score (checks passed) | 6 of 15 | 25 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 1 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 3 of 4 runs | With design-fence (this tree), 3 of 3 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.28 ($0.25 to $0.32) | $0.29 ($0.19 to $0.31) | +5% (not shown) |
| Tokens | 736k (663k to 985k) | 721k (450k to 881k) | −2% (not shown) |
| Tokens not from cache | 64k (63k to 104k) | 59k (49k to 74k) | −7% (not shown) |
| Tool calls | 22 (21 to 26) | 25 (18 to 27) | +14% (not shown) |
| Figma calls | 15 (14 to 19) | 15 (11 to 18) | 0% (not shown) |
| Screenshots taken | 4 (4 to 8) | 1 (1 to 1) | −75% |
| Seconds | 204 (198 to 211) | 332 (186 to 346) | +63% (not shown) |
| Score (checks passed) | 11 of 15 | 15 of 18 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 3 of 3 | 3 of 3 |
| every value bound to a variable | 3 of 3 | 3 of 3 |
| every frame has auto-layout | 2 of 3 | 3 of 3 |
| not built in code | 3 of 3 | 3 of 3 |
| one screenshot at most | 0 of 3 | 3 of 3 |
| a draft spec is left | — | 0 of 3 |

Not counted (did not finish): without-4 (turn.failed).

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.085 ($0.065 to $0.12) | $0.089 ($0.085 to $0.11) | +5% (not shown) |
| Tokens | 162k (137k to 226k) | 146k (144k to 209k) | −9% (not shown) |
| Tokens not from cache | 29k (18k to 39k) | 31k (30k to 40k) | +5% (not shown) |
| Tool calls | 15 (11 to 19) | 13 (9 to 18) | −13% (not shown) |
| Seconds | 66 (57 to 100) | 60 (56 to 64) | −9% (not shown) |
| Score (checks passed) | 29 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 0 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 4 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.053 ($0.051 to $0.083) | $0.11 ($0.10 to $0.15) | +110% |
| Tokens | 142k (140k to 148k) | 246k (225k to 259k) | +73% |
| Tokens not from cache | 13k (12k to 27k) | 32k (27k to 50k) | +149% (not shown) |
| Tool calls | 14 (12 to 18) | 18 (16 to 21) | +29% (not shown) |
| Seconds | 57 (54 to 67) | 95 (93 to 98) | +67% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

