# r1-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": e3cc04d with 10 uncommitted file(s) (snapshot 0821eadf0bf2, 2026-11-11); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.039 ($0.027 to $0.053) | $0.049 ($0.039 to $0.064) | +26% (not shown) |
| Tokens | 1.51M (891k to 2.47M) | 1.61M (1.24M to 2.32M) | +7% (not shown) |
| Tokens not from cache | 90k (75k to 105k) | 118k (104k to 147k) | +31% (not shown) |
| Tool calls | 25 (20 to 35) | 29 (22 to 42) | +16% (not shown) |
| Figma calls | 9 (6 to 10) | 4 (3 to 6) | −56% (not shown) |
| Screenshots taken | 1 (1 to 1) | 0 (0 to 0) | −100% |
| Turns | 26 (21 to 36) | 30 (23 to 43) | +15% (not shown) |
| Seconds | 128 (78 to 180) | 168 (120 to 234) | +31% (not shown) |
| Score (checks passed) | 41 of 50 | 50 of 50 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 1 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 0 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.010 ($0.009 to $0.015) | $0.016 ($0.012 to $0.019) | +53% (not shown) |
| Tokens | 336k (241k to 395k) | 410k (275k to 554k) | +22% (not shown) |
| Tokens not from cache | 32k (30k to 57k) | 50k (42k to 55k) | +59% (not shown) |
| Tool calls | 9 (7 to 10) | 14 (10 to 20) | +56% (not shown) |
| Turns | 10 (8 to 11) | 15 (11 to 21) | +50% (not shown) |
| Seconds | 26 (21 to 31) | 41 (33 to 51) | +58% |
| Score (checks passed) | 10 of 15 | 25 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.035 ($0.027 to $0.053) | $0.040 ($0.034 to $0.055) | +12% (not shown) |
| Tokens | 1.35M (910k to 2.34M) | 1.40M (1.08M to 1.98M) | +4% (not shown) |
| Tokens not from cache | 95k (72k to 113k) | 99k (90k to 130k) | +4% (not shown) |
| Tool calls | 21 (17 to 31) | 20 (16 to 28) | −5% (not shown) |
| Figma calls | 17 (13 to 28) | 9 (6 to 15) | −47% (not shown) |
| Screenshots taken | 3 (2 to 7) | 1 (1 to 1) | −67% |
| Turns | 22 (18 to 32) | 21 (17 to 29) | −5% (not shown) |
| Seconds | 97 (74 to 144) | 121 (107 to 186) | +25% (not shown) |
| Score (checks passed) | 18 of 25 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 3 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.009 to $0.012) | $0.014 ($0.012 to $0.016) | +35% (not shown) |
| Tokens | 247k (200k to 258k) | 335k (267k to 361k) | +35% |
| Tokens not from cache | 35k (31k to 40k) | 46k (40k to 52k) | +33% |
| Tool calls | 4 (4 to 6) | 5 (5 to 10) | +25% (not shown) |
| Turns | 5 (5 to 7) | 6 (6 to 11) | +20% (not shown) |
| Seconds | 35 (29 to 42) | 45 (38 to 54) | +29% (not shown) |
| Score (checks passed) | 32 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 3 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 4 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.011 to $0.012) | $0.015 ($0.013 to $0.017) | +33% |
| Tokens | 392k (342k to 437k) | 488k (415k to 605k) | +25% (not shown) |
| Tokens not from cache | 33k (32k to 34k) | 44k (39k to 48k) | +32% |
| Tool calls | 10 (8 to 11) | 10 (7 to 13) | 0% (not shown) |
| Turns | 11 (9 to 12) | 11 (8 to 14) | 0% (not shown) |
| Seconds | 30 (30 to 31) | 44 (37 to 50) | +47% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

