# r4-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": 9273839 (snapshot a14130a4d842, 2026-11-12); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.033 ($0.033 to $0.041) | $0.056 ($0.048 to $0.060) | +67% |
| Tokens | 1.19M (1.14M to 1.35M) | 2.18M (1.53M to 2.58M) | +83% |
| Tokens not from cache | 85k (82k to 101k) | 124k (117k to 128k) | +46% |
| Tool calls | 23 (21 to 28) | 32 (27 to 38) | +39% (not shown) |
| Figma calls | 7 (6 to 8) | 4 (3 to 6) | −43% (not shown) |
| Screenshots taken | 1 (0 to 1) | 0 (0 to 0) | −100% (not shown) |
| Turns | 24 (22 to 29) | 33 (28 to 39) | +38% (not shown) |
| Seconds | 111 (105 to 174) | 204 (166 to 232) | +84% (not shown) |
| Score (checks passed) | 46 of 55 | 55 of 55 |  |

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
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.009 to $0.012) | $0.014 ($0.012 to $0.015) | +27% |
| Tokens | 346k (238k to 448k) | 345k (271k to 397k) | 0% (not shown) |
| Tokens not from cache | 33k (29k to 35k) | 44k (39k to 48k) | +33% |
| Tool calls | 7 (6 to 10) | 10 (6 to 13) | +43% (not shown) |
| Turns | 8 (7 to 11) | 11 (7 to 14) | +38% (not shown) |
| Seconds | 27 (21 to 29) | 36 (33 to 38) | +33% |
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
| Cost (USD, list price) | $0.032 ($0.026 to $0.038) | $0.037 ($0.035 to $0.048) | +18% (not shown) |
| Tokens | 1.15M (686k to 1.52M) | 1.28M (1.16M to 1.86M) | +11% (not shown) |
| Tokens not from cache | 86k (75k to 92k) | 96k (87k to 110k) | +12% (not shown) |
| Tool calls | 18 (10 to 22) | 17 (15 to 23) | −6% (not shown) |
| Figma calls | 14 (9 to 19) | 9 (6 to 11) | −36% (not shown) |
| Screenshots taken | 2 (1 to 3) | 1 (1 to 1) | −50% (not shown) |
| Turns | 19 (11 to 23) | 18 (16 to 24) | −5% (not shown) |
| Seconds | 86 (79 to 117) | 131 (110 to 158) | +52% (not shown) |
| Score (checks passed) | 25 of 30 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 4 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 1 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.008 to $0.012) | $0.015 ($0.014 to $0.015) | +42% |
| Tokens | 249k (146k to 299k) | 338k (285k to 385k) | +35% (not shown) |
| Tokens not from cache | 33k (30k to 35k) | 47k (46k to 51k) | +41% |
| Tool calls | 5 (3 to 6) | 7 (6 to 8) | +40% (not shown) |
| Turns | 6 (4 to 7) | 8 (7 to 9) | +33% (not shown) |
| Seconds | 32 (24 to 39) | 48 (45 to 52) | +50% |
| Score (checks passed) | 34 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 4 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 5 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.016 ($0.011 to $0.017) | +42% (not shown) |
| Tokens | 343k (289k to 397k) | 545k (306k to 596k) | +59% (not shown) |
| Tokens not from cache | 33k (31k to 35k) | 43k (35k to 45k) | +30% (not shown) |
| Tool calls | 10 (9 to 10) | 9 (6 to 13) | −10% (not shown) |
| Turns | 11 (10 to 11) | 10 (7 to 14) | −9% (not shown) |
| Seconds | 30 (25 to 34) | 46 (28 to 49) | +53% (not shown) |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

