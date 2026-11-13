# check-rules-b-gpt-6-luna: gpt-6-luna (Codex codex-cli 0.167.0)

design-fence, "this tree": 9273839 with 1 uncommitted file(s) (snapshot 04e747f00208, 2026-11-13); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## review

| Median (least to most) | With design-fence (this tree), 10 of 10 runs |
| --- | --- |
| Cost (USD, list price) | $0.005 ($0.003 to $0.006) |
| Tokens | 146k (94k to 203k) |
| Tokens not from cache | 25k (19k to 35k) |
| Tool calls | 8 (5 to 26) |
| Seconds | 63 (39 to 88) |
| Score (checks passed) | 62 of 70 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| says it cannot be committed as it is | 10 of 10 |
| finds that the kind was never designed (no spec, no approved design) | 10 of 10 |
| finds the padding written raw | 10 of 10 |
| finds the primitive where a role belongs | 9 of 10 |
| finds the motion without reduced motion | 7 of 10 |
| finds the label against the voice | 6 of 10 |
| changed nothing | 10 of 10 |

## ship-issue

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.006 ($0.006 to $0.009) |
| Tokens | 234k (187k to 305k) |
| Tokens not from cache | 33k (25k to 47k) |
| Tool calls | 9 (9 to 12) |
| Seconds | 88 (53 to 96) |
| Score (checks passed) | 28 of 30 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the issue is fixed (its own test) | 5 of 5 |
| the project's tests pass | 5 of 5 |
| a test covers the fix | 4 of 5 |
| nothing else changed | 5 of 5 |
| not committed | 5 of 5 |
| the report names what ran | 4 of 5 |

