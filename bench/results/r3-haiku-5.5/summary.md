# r3-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": f0e377d with 16 uncommitted file(s) (snapshot a39b71deafd1, 2026-11-12); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.035 ($0.033 to $0.036) | $0.050 ($0.045 to $0.054) | +42% |
| Tokens | 1.24M (1.22M to 1.32M) | 1.96M (1.72M to 2.15M) | +57% |
| Tokens not from cache | 87k (81k to 89k) | 116k (104k to 121k) | +35% |
| Tool calls | 24 (22 to 28) | 28 (26 to 38) | +17% (not shown) |
| Figma calls | 8 (6 to 8) | 5 (3 to 5) | −37% |
| Screenshots taken | 1 (0 to 1) | 0 (0 to 0) | −100% (not shown) |
| Turns | 25 (23 to 29) | 29 (27 to 39) | +16% (not shown) |
| Seconds | 122 (106 to 135) | 197 (143 to 210) | +61% |
| Score (checks passed) | 46 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 4 of 5 | 5 of 5 |
| the design's tokens, all of them | 2 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 0 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.010 ($0.009 to $0.012) | $0.015 ($0.012 to $0.016) | +44% (not shown) |
| Tokens | 335k (239k to 413k) | 401k (273k to 489k) | +20% (not shown) |
| Tokens not from cache | 31k (28k to 36k) | 46k (41k to 52k) | +50% |
| Tool calls | 7 (5 to 10) | 11 (9 to 14) | +57% (not shown) |
| Turns | 8 (6 to 11) | 12 (10 to 15) | +50% (not shown) |
| Seconds | 26 (20 to 30) | 35 (32 to 42) | +35% |
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
| Cost (USD, list price) | $0.036 ($0.030 to $0.045) | $0.041 ($0.035 to $0.050) | +14% (not shown) |
| Tokens | 1.42M (1.05M to 1.84M) | 1.45M (1.29M to 1.87M) | +2% (not shown) |
| Tokens not from cache | 90k (76k to 112k) | 102k (83k to 127k) | +14% (not shown) |
| Tool calls | 24 (17 to 28) | 20 (17 to 24) | −17% (not shown) |
| Figma calls | 20 (13 to 22) | 10 (9 to 13) | −50% (not shown) |
| Screenshots taken | 3 (3 to 5) | 1 (1 to 1) | −67% |
| Turns | 25 (18 to 29) | 21 (18 to 25) | −16% (not shown) |
| Seconds | 108 (85 to 141) | 143 (109 to 192) | +32% (not shown) |
| Score (checks passed) | 25 of 30 | 34 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 5 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 4 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.013 ($0.012 to $0.015) | +23% |
| Tokens | 244k (198k to 251k) | 275k (262k to 331k) | +13% |
| Tokens not from cache | 35k (33k to 37k) | 45k (39k to 49k) | +27% |
| Tool calls | 4 (4 to 6) | 8 (5 to 9) | +100% (not shown) |
| Turns | 5 (5 to 7) | 9 (6 to 10) | +80% (not shown) |
| Seconds | 34 (33 to 44) | 42 (34 to 53) | +24% (not shown) |
| Score (checks passed) | 33 of 35 | 34 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 4 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 4 of 5 |
| finds the label against the voice | 4 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.010 ($0.010 to $0.012) | $0.016 ($0.012 to $0.019) | +50% |
| Tokens | 339k (291k to 444k) | 537k (360k to 720k) | +58% (not shown) |
| Tokens not from cache | 32k (31k to 33k) | 44k (37k to 49k) | +36% |
| Tool calls | 10 (8 to 12) | 13 (8 to 17) | +30% (not shown) |
| Turns | 11 (9 to 13) | 14 (9 to 18) | +27% (not shown) |
| Seconds | 29 (27 to 32) | 44 (33 to 55) | +52% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

