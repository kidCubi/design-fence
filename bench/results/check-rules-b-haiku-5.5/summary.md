# check-rules-b-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

design-fence, "this tree": 9273839 with 1 uncommitted file(s) (snapshot 04e747f00208, 2026-11-13); "released": origin/main (9579683).

## review

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.014 ($0.013 to $0.015) |
| Tokens | 286k (280k to 333k) |
| Tokens not from cache | 45k (45k to 51k) |
| Tool calls | 7 (6 to 7) |
| Turns | 8 (7 to 8) |
| Seconds | 46 (37 to 52) |
| Score (checks passed) | 35 of 35 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| says it cannot be committed as it is | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 |
| finds the padding written raw | 5 of 5 |
| finds the primitive where a role belongs | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 |
| finds the label against the voice | 5 of 5 |
| changed nothing | 5 of 5 |

## ship-issue

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.014 ($0.013 to $0.017) |
| Tokens | 431k (378k to 609k) |
| Tokens not from cache | 42k (40k to 46k) |
| Tool calls | 8 (8 to 16) |
| Turns | 9 (9 to 17) |
| Seconds | 42 (33 to 51) |
| Score (checks passed) | 30 of 30 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the issue is fixed (its own test) | 5 of 5 |
| the project's tests pass | 5 of 5 |
| a test covers the fix | 5 of 5 |
| nothing else changed | 5 of 5 |
| not committed | 5 of 5 |
| the report names what ran | 5 of 5 |

