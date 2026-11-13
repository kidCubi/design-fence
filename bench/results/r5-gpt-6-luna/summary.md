# r5-gpt-6-luna: gpt-6-luna (Codex codex-cli 0.167.0)

design-fence, "this tree": 56ac855 with 10 uncommitted file(s) (snapshot 78e8059a5b98, 2026-11-13); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.012 ($0.009 to $0.017) | $0.012 ($0.009 to $0.018) | +2% (not shown) |
| Tokens | 561k (407k to 729k) | 558k (327k to 672k) | −1% (not shown) |
| Tokens not from cache | 50k (39k to 84k) | 42k (31k to 71k) | −17% (not shown) |
| Tool calls | 15 (10 to 18) | 24 (16 to 29) | +60% (not shown) |
| Figma calls | 3 (2 to 5) | 0 (0 to 0) | −100% |
| Seconds | 127 (105 to 148) | 179 (158 to 292) | +41% |
| Score (checks passed) | 47 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 3 of 5 | 5 of 5 |
| the design's tokens, all of them | 2 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 2 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.002 to $0.004) | $0.006 ($0.004 to $0.009) | +86% (not shown) |
| Tokens | 146k (109k to 152k) | 253k (165k to 364k) | +73% |
| Tokens not from cache | 19k (10k to 20k) | 24k (17k to 39k) | +27% (not shown) |
| Tool calls | 9 (7 to 10) | 10 (6 to 13) | +11% (not shown) |
| Seconds | 33 (30 to 37) | 76 (33 to 120) | +130% (not shown) |
| Score (checks passed) | 10 of 15 | 24 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 4 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.023 ($0.021 to $0.038) | $0.032 ($0.028 to $0.041) | +43% (not shown) |
| Tokens | 1.06M (1.01M to 1.78M) | 1.43M (1.31M to 1.74M) | +35% (not shown) |
| Tokens not from cache | 86k (64k to 131k) | 90k (79k to 113k) | +5% (not shown) |
| Tool calls | 21 (20 to 26) | 27 (22 to 30) | +29% (not shown) |
| Figma calls | 19 (18 to 24) | 14 (11 to 20) | −26% (not shown) |
| Screenshots taken | 4 (2 to 6) | 1 (1 to 1) | −75% |
| Seconds | 250 (222 to 410) | 542 (408 to 668) | +117% (not shown) |
| Score (checks passed) | 17 of 30 | 34 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 0 of 5 | 4 of 5 |
| every frame has auto-layout | 2 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.003 to $0.005) | $0.004 ($0.004 to $0.007) | +31% (not shown) |
| Tokens | 120k (76k to 140k) | 125k (115k to 196k) | +5% (not shown) |
| Tokens not from cache | 15k (12k to 23k) | 23k (21k to 39k) | +50% (not shown) |
| Tool calls | 8 (5 to 12) | 6 (6 to 16) | −25% (not shown) |
| Seconds | 47 (42 to 59) | 65 (58 to 69) | +38% (not shown) |
| Score (checks passed) | 21 of 35 | 31 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 4 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 4 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 0 of 5 | 5 of 5 |
| finds the motion without reduced motion | 2 of 5 | 3 of 5 |
| finds the label against the voice | 0 of 5 | 4 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.003 ($0.002 to $0.004) | $0.008 ($0.006 to $0.009) | +142% |
| Tokens | 111k (90k to 192k) | 268k (233k to 342k) | +141% |
| Tokens not from cache | 15k (10k to 19k) | 31k (25k to 48k) | +100% |
| Tool calls | 7 (6 to 12) | 16 (11 to 30) | +129% (not shown) |
| Seconds | 39 (24 to 50) | 88 (73 to 103) | +126% |
| Score (checks passed) | 20 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 0 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 0 of 5 | 5 of 5 |

