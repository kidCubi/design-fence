# r1-opus-5.5: claude-opus-5-5 (Claude Code 2.1.322)

design-fence, "this tree": e3cc04d with 10 uncommitted file(s) (snapshot 0821eadf0bf2, 2026-11-11); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $1.37 ($1.27 to $1.59) | $1.49 ($1.32 to $1.64) | +9% (not shown) |
| Tokens | 1.99M (1.87M to 2.42M) | 1.95M (1.68M to 2.69M) | −2% (not shown) |
| Tokens not from cache | 94k (85k to 105k) | 101k (91k to 104k) | +7% (not shown) |
| Tool calls | 39 (34 to 45) | 33 (27 to 38) | −15% (not shown) |
| Figma calls | 8 (6 to 9) | 2 (2 to 3) | −75% |
| Screenshots taken | 2 (2 to 3) | 0 (0 to 0) | −100% |
| Turns | 40 (35 to 46) | 34 (28 to 39) | −15% (not shown) |
| Seconds | 275 (227 to 325) | 299 (259 to 329) | +9% (not shown) |
| Score (checks passed) | 48 of 50 | 50 of 50 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 5 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 3 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.45 ($0.35 to $0.60) | $0.75 ($0.62 to $0.85) | +65% |
| Tokens | 509k (341k to 827k) | 754k (594k to 895k) | +48% (not shown) |
| Tokens not from cache | 37k (32k to 43k) | 59k (52k to 65k) | +57% |
| Tool calls | 13 (7 to 24) | 24 (21 to 34) | +85% (not shown) |
| Turns | 14 (8 to 25) | 25 (22 to 35) | +79% (not shown) |
| Seconds | 50 (37 to 99) | 116 (83 to 143) | +132% (not shown) |
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
| Cost (USD, list price) | $0.95 ($0.85 to $1.02) | $0.92 ($0.87 to $1.07) | −4% (not shown) |
| Tokens | 1.12M (935k to 1.53M) | 1.01M (919k to 1.29M) | −10% (not shown) |
| Tokens not from cache | 70k (66k to 74k) | 73k (70k to 81k) | +5% (not shown) |
| Tool calls | 19 (16 to 26) | 18 (17 to 21) | −5% (not shown) |
| Figma calls | 16 (13 to 23) | 6 (5 to 7) | −62% |
| Screenshots taken | 4 (2 to 6) | 1 (1 to 1) | −75% |
| Turns | 20 (17 to 27) | 19 (18 to 22) | −5% (not shown) |
| Seconds | 151 (133 to 160) | 168 (153 to 192) | +11% (not shown) |
| Score (checks passed) | 20 of 25 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 5 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.30 ($0.29 to $0.35) | $0.40 ($0.37 to $0.46) | +34% |
| Tokens | 236k (187k to 294k) | 318k (261k to 388k) | +35% (not shown) |
| Tokens not from cache | 29k (28k to 33k) | 38k (37k to 41k) | +32% |
| Tool calls | 4 (3 to 5) | 6 (5 to 7) | +50% (not shown) |
| Turns | 5 (4 to 6) | 7 (6 to 8) | +40% (not shown) |
| Seconds | 37 (32 to 38) | 43 (41 to 62) | +16% |
| Score (checks passed) | 35 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 5 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 5 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.31 ($0.26 to $0.33) | $0.43 ($0.41 to $0.56) | +35% |
| Tokens | 279k (227k to 327k) | 464k (416k to 596k) | +66% |
| Tokens not from cache | 29k (25k to 29k) | 38k (36k to 46k) | +31% |
| Tool calls | 9 (4 to 11) | 13 (11 to 19) | +44% (not shown) |
| Turns | 10 (5 to 12) | 14 (12 to 20) | +40% (not shown) |
| Seconds | 36 (26 to 56) | 57 (42 to 72) | +58% (not shown) |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

