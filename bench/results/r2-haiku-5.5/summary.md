# r2-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": f0e377d with 15 uncommitted file(s) (snapshot 59a48efa63eb, 2026-11-12); "released": origin/main (9579683).

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.037 ($0.033 to $0.042) | $0.052 ($0.041 to $0.073) | +40% (not shown) |
| Tokens | 1.37M (1.25M to 1.54M) | 1.90M (1.62M to 2.88M) | +39% |
| Tokens not from cache | 92k (76k to 105k) | 115k (92k to 155k) | +24% (not shown) |
| Tool calls | 25 (23 to 29) | 27 (21 to 37) | +8% (not shown) |
| Figma calls | 9 (7 to 10) | 5 (4 to 6) | −44% |
| Screenshots taken | 1 (1 to 1) | 0 (0 to 0) | −100% |
| Turns | 26 (24 to 30) | 28 (22 to 38) | +8% (not shown) |
| Seconds | 124 (111 to 149) | 205 (139 to 288) | +65% (not shown) |
| Score (checks passed) | 43 of 50 | 50 of 50 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 2 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 1 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.010 ($0.009 to $0.012) | $0.015 ($0.013 to $0.020) | +46% |
| Tokens | 341k (281k to 440k) | 406k (337k to 673k) | +19% (not shown) |
| Tokens not from cache | 32k (28k to 33k) | 48k (44k to 61k) | +51% |
| Tool calls | 7 (5 to 9) | 14 (12 to 16) | +100% |
| Turns | 8 (6 to 10) | 15 (13 to 17) | +88% |
| Seconds | 25 (23 to 30) | 42 (35 to 58) | +68% |
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
| Cost (USD, list price) | $0.032 ($0.027 to $0.037) | $0.039 ($0.031 to $0.039) | +21% (not shown) |
| Tokens | 1.05M (740k to 1.30M) | 1.29M (806k to 1.43M) | +23% (not shown) |
| Tokens not from cache | 83k (75k to 105k) | 98k (90k to 100k) | +18% (not shown) |
| Tool calls | 19 (15 to 23) | 18 (11 to 22) | −5% (not shown) |
| Figma calls | 15 (11 to 20) | 7 (6 to 8) | −53% |
| Screenshots taken | 3 (1 to 4) | 1 (1 to 1) | −67% (not shown) |
| Turns | 20 (16 to 24) | 19 (12 to 23) | −5% (not shown) |
| Seconds | 86 (81 to 115) | 120 (94 to 134) | +40% (not shown) |
| Score (checks passed) | 20 of 25 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 4 of 5 | 5 of 5 |
| every frame has auto-layout | 5 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 1 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.014 ($0.013 to $0.015) | +27% |
| Tokens | 252k (194k to 355k) | 344k (281k to 379k) | +37% (not shown) |
| Tokens not from cache | 36k (33k to 37k) | 47k (42k to 50k) | +33% |
| Tool calls | 6 (3 to 6) | 7 (5 to 9) | +17% (not shown) |
| Turns | 7 (4 to 7) | 8 (6 to 10) | +14% (not shown) |
| Seconds | 34 (32 to 37) | 42 (38 to 49) | +24% |
| Score (checks passed) | 33 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 4 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 4 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.012 ($0.009 to $0.014) | $0.018 ($0.013 to $0.020) | +52% (not shown) |
| Tokens | 442k (237k to 499k) | 615k (421k to 841k) | +39% (not shown) |
| Tokens not from cache | 33k (30k to 37k) | 48k (39k to 50k) | +44% |
| Tool calls | 10 (8 to 11) | 14 (9 to 16) | +40% (not shown) |
| Turns | 11 (9 to 12) | 15 (10 to 17) | +36% (not shown) |
| Seconds | 31 (23 to 38) | 55 (40 to 62) | +77% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

