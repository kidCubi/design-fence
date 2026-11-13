# r5-opus-5.5: claude-opus-5-5 (Claude Code 2.1.322)

design-fence, "this tree": 56ac855 with 10 uncommitted file(s) (snapshot 78e8059a5b98, 2026-11-13); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $1.45 ($1.22 to $1.60) | $1.09 ($0.99 to $1.32) | −25% (not shown) |
| Tokens | 1.91M (1.51M to 2.62M) | 1.63M (1.37M to 1.99M) | −14% (not shown) |
| Tokens not from cache | 101k (90k to 107k) | 75k (71k to 87k) | −25% |
| Tool calls | 36 (32 to 52) | 30 (26 to 40) | −17% (not shown) |
| Figma calls | 8 (5 to 10) | 0 (0 to 0) | −100% |
| Screenshots taken | 3 (1 to 3) | 0 (0 to 0) | −100% |
| Turns | 37 (33 to 53) | 31 (27 to 41) | −16% (not shown) |
| Seconds | 252 (211 to 279) | 178 (173 to 249) | −29% (not shown) |
| Score (checks passed) | 53 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 5 of 5 | 5 of 5 |
| no token the design does not use | 4 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 4 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.55 ($0.34 to $0.62) | $0.67 ($0.57 to $0.89) | +22% (not shown) |
| Tokens | 741k (379k to 852k) | 663k (464k to 1.08M) | −11% (not shown) |
| Tokens not from cache | 45k (30k to 46k) | 55k (49k to 65k) | +24% |
| Tool calls | 19 (8 to 22) | 25 (18 to 29) | +32% (not shown) |
| Turns | 20 (9 to 23) | 26 (19 to 30) | +30% (not shown) |
| Seconds | 83 (41 to 108) | 98 (79 to 162) | +18% (not shown) |
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
| Cost (USD, list price) | $0.93 ($0.83 to $1.03) | $1.05 ($0.88 to $1.19) | +13% (not shown) |
| Tokens | 1.25M (899k to 1.30M) | 1.08M (969k to 1.48M) | −13% (not shown) |
| Tokens not from cache | 69k (65k to 76k) | 83k (70k to 87k) | +21% (not shown) |
| Tool calls | 20 (16 to 21) | 25 (20 to 28) | +25% (not shown) |
| Figma calls | 17 (13 to 18) | 5 (5 to 7) | −71% |
| Screenshots taken | 4 (3 to 5) | 1 (1 to 1) | −75% |
| Turns | 21 (17 to 22) | 26 (21 to 29) | +24% (not shown) |
| Seconds | 125 (118 to 148) | 166 (121 to 208) | +33% (not shown) |
| Score (checks passed) | 25 of 30 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 5 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.30 ($0.29 to $0.32) | $0.40 ($0.35 to $0.40) | +34% |
| Tokens | 234k (233k to 240k) | 316k (260k to 320k) | +35% |
| Tokens not from cache | 28k (28k to 31k) | 38k (35k to 39k) | +37% |
| Tool calls | 4 (4 to 5) | 6 (4 to 6) | +50% (not shown) |
| Turns | 5 (5 to 6) | 7 (5 to 7) | +40% (not shown) |
| Seconds | 37 (34 to 41) | 44 (38 to 47) | +19% (not shown) |
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
| Cost (USD, list price) | $0.30 ($0.28 to $0.33) | $0.47 ($0.43 to $0.52) | +56% |
| Tokens | 277k (230k to 328k) | 471k (373k to 648k) | +70% |
| Tokens not from cache | 28k (27k to 29k) | 41k (39k to 42k) | +46% |
| Tool calls | 7 (4 to 9) | 15 (10 to 18) | +114% |
| Turns | 8 (5 to 10) | 16 (11 to 19) | +100% |
| Seconds | 31 (27 to 36) | 53 (48 to 60) | +71% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

