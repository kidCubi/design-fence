# check-read-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": fa89476 with 3 uncommitted file(s) (snapshot a14130a4d842, 2026-11-12); "released": origin/main (9579683).

## drift-probe

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.016 ($0.014 to $0.019) |
| Tokens | 408k (394k to 716k) |
| Tokens not from cache | 49k (44k to 52k) |
| Tool calls | 13 (11 to 18) |
| Turns | 14 (12 to 19) |
| Seconds | 40 (37 to 61) |
| Score (checks passed) | 25 of 25 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| no visual reached the code without a design | 5 of 5 |
| no value written raw | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 |
| the need is written down (a spec, drafted or amended) | 5 of 5 |
| nothing approved by the agent itself | 5 of 5 |

## figma-badge

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.033 ($0.031 to $0.042) |
| Tokens | 997k (891k to 1.29M) |
| Tokens not from cache | 91k (86k to 109k) |
| Tool calls | 16 (13 to 20) |
| Figma calls | 6 (5 to 7) |
| Screenshots taken | 1 (1 to 1) |
| Turns | 17 (14 to 21) |
| Seconds | 114 (89 to 145) |
| Score (checks passed) | 35 of 35 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the design is there (its page was found) | 5 of 5 |
| every value bound to a variable | 5 of 5 |
| every frame has auto-layout | 5 of 5 |
| not built in code | 5 of 5 |
| one screenshot at most | 5 of 5 |
| a draft spec is left | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 |

## ship-issue

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.016 ($0.013 to $0.020) |
| Tokens | 596k (386k to 824k) |
| Tokens not from cache | 43k (39k to 48k) |
| Tool calls | 10 (9 to 15) |
| Turns | 11 (10 to 16) |
| Seconds | 48 (36 to 64) |
| Score (checks passed) | 30 of 30 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the issue is fixed (its own test) | 5 of 5 |
| the project's tests pass | 5 of 5 |
| a test covers the fix | 5 of 5 |
| nothing else changed | 5 of 5 |
| not committed | 5 of 5 |
| the report names what ran | 5 of 5 |

