# r4-gpt-6-luna: gpt-6-luna (Codex codex-cli 0.167.0)

design-fence, "this tree": 9273839 (snapshot a14130a4d842, 2026-11-13); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.012 ($0.010 to $0.014) | $0.018 ($0.012 to $0.019) | +48% (not shown) |
| Tokens | 547k (360k to 693k) | 837k (423k to 876k) | +53% (not shown) |
| Tokens not from cache | 46k (41k to 52k) | 57k (47k to 60k) | +22% (not shown) |
| Tool calls | 15 (11 to 21) | 21 (15 to 34) | +40% (not shown) |
| Figma calls | 1 (1 to 4) | 3 (2 to 5) | +200% (not shown) |
| Screenshots taken | 0 (0 to 1) | 0 (0 to 0) | — |
| Seconds | 130 (103 to 148) | 222 (160 to 271) | +71% |
| Score (checks passed) | 44 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 2 of 5 | 5 of 5 |
| the design's tokens, all of them | 4 of 5 | 5 of 5 |
| no token the design does not use | 3 of 5 | 5 of 5 |
| the copy button is the library's Button | 4 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 1 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.002 to $0.003) | $0.006 ($0.005 to $0.007) | +127% |
| Tokens | 124k (89k to 127k) | 223k (147k to 278k) | +80% |
| Tokens not from cache | 10k (10k to 11k) | 27k (21k to 34k) | +183% |
| Tool calls | 8 (7 to 9) | 8 (7 to 10) | 0% (not shown) |
| Seconds | 31 (29 to 35) | 71 (52 to 76) | +129% |
| Score (checks passed) | 9 of 15 | 25 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 4 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.031 ($0.017 to $0.042) | $0.041 ($0.028 to $0.042) | +31% (not shown) |
| Tokens | 1.60M (716k to 2.03M) | 1.76M (1.07M to 2.04M) | +10% (not shown) |
| Tokens not from cache | 94k (59k to 130k) | 109k (82k to 118k) | +16% (not shown) |
| Tool calls | 25 (19 to 34) | 29 (23 to 37) | +16% (not shown) |
| Figma calls | 23 (17 to 31) | 19 (17 to 21) | −17% (not shown) |
| Screenshots taken | 4 (1 to 5) | 1 (1 to 1) | −75% (not shown) |
| Seconds | 334 (214 to 494) | 596 (475 to 649) | +78% (not shown) |
| Score (checks passed) | 20 of 30 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 2 of 5 | 5 of 5 |
| every frame has auto-layout | 2 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 1 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.003 to $0.004) | $0.005 ($0.005 to $0.006) | +50% |
| Tokens | 119k (98k to 140k) | 144k (115k to 172k) | +21% (not shown) |
| Tokens not from cache | 14k (14k to 16k) | 31k (23k to 34k) | +112% |
| Tool calls | 11 (8 to 14) | 7 (6 to 12) | −36% (not shown) |
| Seconds | 45 (39 to 62) | 62 (44 to 80) | +38% (not shown) |
| Score (checks passed) | 24 of 35 | 27 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 4 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 0 of 5 | 3 of 5 |
| finds the motion without reduced motion | 4 of 5 | 0 of 5 |
| finds the label against the voice | 1 of 5 | 4 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.002 ($0.002 to $0.003) | $0.007 ($0.005 to $0.008) | +208% |
| Tokens | 88k (87k to 107k) | 239k (190k to 362k) | +170% |
| Tokens not from cache | 10k (9k to 10k) | 28k (21k to 39k) | +188% |
| Tool calls | 7 (6 to 8) | 15 (10 to 31) | +114% |
| Seconds | 32 (30 to 38) | 88 (68 to 100) | +175% |
| Score (checks passed) | 21 of 30 | 24 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 0 of 5 | 2 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 1 of 5 | 2 of 5 |

