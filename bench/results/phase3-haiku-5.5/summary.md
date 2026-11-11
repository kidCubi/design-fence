# phase3-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

## drift-probe

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.014 ($0.013 to $0.015) |
| Tokens | 347k (280k to 462k) |
| Tokens not from cache | 46k (41k to 48k) |
| Tool calls | 15 (6 to 16) |
| Turns | 16 (7 to 17) |
| Seconds | 42 (36 to 166) |
| Score (checks passed) | 24 of 25 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| no visual reached the code without a design | 5 of 5 |
| no value written raw | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 |
| the need is written down (a spec, drafted or amended) | 4 of 5 |
| nothing approved by the agent itself | 5 of 5 |

## review

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.014 ($0.012 to $0.015) |
| Tokens | 274k (218k to 339k) |
| Tokens not from cache | 44k (44k to 47k) |
| Tool calls | 5 (5 to 9) |
| Turns | 6 (6 to 10) |
| Seconds | 44 (38 to 53) |
| Score (checks passed) | 34 of 35 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| says it cannot be committed as it is | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 |
| finds the padding written raw | 5 of 5 |
| finds the primitive where a role belongs | 5 of 5 |
| finds the motion without reduced motion | 4 of 5 |
| finds the label against the voice | 5 of 5 |
| changed nothing | 5 of 5 |

## ship-issue

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.016 ($0.014 to $0.018) |
| Tokens | 575k (430k to 676k) |
| Tokens not from cache | 44k (41k to 48k) |
| Tool calls | 11 (11 to 15) |
| Turns | 12 (12 to 16) |
| Seconds | 44 (43 to 55) |
| Score (checks passed) | 30 of 30 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the issue is fixed (its own test) | 5 of 5 |
| the project's tests pass | 5 of 5 |
| a test covers the fix | 5 of 5 |
| nothing else changed | 5 of 5 |
| not committed | 5 of 5 |
| the report names what ran | 5 of 5 |

