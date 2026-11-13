# r5-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": 56ac855 with 10 uncommitted file(s) (snapshot 78e8059a5b98, 2026-11-13); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.039 ($0.036 to $0.042) | $0.051 ($0.032 to $0.055) | +30% (not shown) |
| Tokens | 1.52M (1.22M to 1.54M) | 1.87M (1.03M to 2.26M) | +24% (not shown) |
| Tokens not from cache | 91k (88k to 110k) | 114k (85k to 123k) | +25% (not shown) |
| Tool calls | 26 (22 to 28) | 32 (19 to 38) | +23% (not shown) |
| Figma calls | 8 (6 to 11) | 0 (0 to 0) | −100% |
| Screenshots taken | 1 (1 to 1) | 0 (0 to 0) | −100% |
| Turns | 27 (23 to 29) | 33 (20 to 39) | +22% (not shown) |
| Seconds | 125 (123 to 151) | 209 (132 to 248) | +67% (not shown) |
| Score (checks passed) | 44 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 4 of 5 | 5 of 5 |
| the design's tokens, all of them | 0 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 0 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.014 ($0.013 to $0.019) | +36% |
| Tokens | 339k (298k to 443k) | 347k (331k to 606k) | +3% (not shown) |
| Tokens not from cache | 33k (31k to 34k) | 47k (42k to 54k) | +44% |
| Tool calls | 8 (7 to 10) | 15 (12 to 17) | +88% |
| Turns | 9 (8 to 11) | 16 (13 to 18) | +78% |
| Seconds | 28 (27 to 31) | 39 (35 to 58) | +39% |
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
| Cost (USD, list price) | $0.034 ($0.029 to $0.041) | $0.032 ($0.031 to $0.040) | −5% (not shown) |
| Tokens | 1.13M (944k to 1.55M) | 949k (876k to 1.39M) | −16% (not shown) |
| Tokens not from cache | 86k (78k to 126k) | 90k (87k to 99k) | +5% (not shown) |
| Tool calls | 17 (15 to 21) | 14 (12 to 19) | −18% (not shown) |
| Figma calls | 14 (13 to 17) | 6 (5 to 8) | −57% |
| Screenshots taken | 2 (1 to 4) | 1 (1 to 1) | −50% (not shown) |
| Turns | 18 (16 to 22) | 15 (13 to 20) | −17% (not shown) |
| Seconds | 98 (73 to 131) | 99 (97 to 139) | +1% (not shown) |
| Score (checks passed) | 24 of 30 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 3 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 1 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.013 ($0.013 to $0.015) | +22% |
| Tokens | 244k (198k to 257k) | 289k (221k to 335k) | +18% (not shown) |
| Tokens not from cache | 35k (34k to 38k) | 45k (42k to 50k) | +28% |
| Tool calls | 5 (4 to 5) | 6 (5 to 10) | +20% (not shown) |
| Turns | 6 (5 to 6) | 7 (6 to 11) | +17% (not shown) |
| Seconds | 36 (30 to 45) | 45 (41 to 63) | +25% (not shown) |
| Score (checks passed) | 32 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 4 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 3 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.009 to $0.013) | $0.017 ($0.013 to $0.025) | +51% |
| Tokens | 344k (236k to 488k) | 612k (428k to 993k) | +78% (not shown) |
| Tokens not from cache | 34k (29k to 34k) | 45k (40k to 59k) | +33% |
| Tool calls | 11 (9 to 12) | 11 (8 to 20) | 0% (not shown) |
| Turns | 12 (10 to 13) | 12 (9 to 21) | 0% (not shown) |
| Seconds | 30 (23 to 38) | 48 (36 to 77) | +60% (not shown) |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

