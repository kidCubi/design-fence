# r4-gpt-6-luna-nohooks: gpt-6-luna (Codex codex-cli 0.167.0)

design-fence, "this tree": 9273839 (snapshot a14130a4d842, 2026-11-13); "released": origin/main (9579683).

Codex ran each copy untrusted: design-fence's session hooks did not run.

## component-build

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.018 ($0.014 to $0.028) |
| Tokens | 844k (641k to 1.66M) |
| Tokens not from cache | 75k (51k to 91k) |
| Tool calls | 31 (14 to 39) |
| Figma calls | 2 (2 to 4) |
| Seconds | 208 (191 to 274) |
| Score (checks passed) | 55 of 55 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the element df-command is defined | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 |
| a story with the copy button and one without | 5 of 5 |
| no value written raw | 5 of 5 |
| the design's tokens, all of them | 5 of 5 |
| no token the design does not use | 5 of 5 |
| the copy button is the library's Button | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 5 of 5 |
| nothing else in the project changed | 5 of 5 |
| the report names what it checked | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 |

## drift-probe

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.008 ($0.005 to $0.011) |
| Tokens | 243k (178k to 329k) |
| Tokens not from cache | 34k (24k to 63k) |
| Tool calls | 9 (5 to 13) |
| Seconds | 91 (74 to 124) |
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
| Cost (USD, list price) | $0.026 ($0.024 to $0.043) |
| Tokens | 1.17M (1.13M to 2.04M) |
| Tokens not from cache | 73k (67k to 129k) |
| Tool calls | 24 (23 to 35) |
| Figma calls | 18 (13 to 25) |
| Screenshots taken | 1 (1 to 1) |
| Seconds | 402 (330 to 559) |
| Score (checks passed) | 34 of 35 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the design is there (its page was found) | 5 of 5 |
| every value bound to a variable | 4 of 5 |
| every frame has auto-layout | 5 of 5 |
| not built in code | 5 of 5 |
| one screenshot at most | 5 of 5 |
| a draft spec is left | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 |

## review

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.005 ($0.004 to $0.006) |
| Tokens | 118k (116k to 171k) |
| Tokens not from cache | 29k (21k to 37k) |
| Tool calls | 4 (4 to 6) |
| Seconds | 64 (55 to 75) |
| Score (checks passed) | 29 of 35 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| says it cannot be committed as it is | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 |
| finds the padding written raw | 5 of 5 |
| finds the primitive where a role belongs | 5 of 5 |
| finds the motion without reduced motion | 1 of 5 |
| finds the label against the voice | 3 of 5 |
| changed nothing | 5 of 5 |

## ship-issue

| Median (least to most) | With design-fence (this tree), 5 of 5 runs |
| --- | --- |
| Cost (USD, list price) | $0.007 ($0.005 to $0.011) |
| Tokens | 315k (190k to 363k) |
| Tokens not from cache | 30k (24k to 51k) |
| Tool calls | 11 (8 to 13) |
| Seconds | 90 (69 to 132) |
| Score (checks passed) | 29 of 30 |

| Check (runs that pass) | With design-fence (this tree) |
| --- | --- |
| the issue is fixed (its own test) | 5 of 5 |
| the project's tests pass | 5 of 5 |
| a test covers the fix | 4 of 5 |
| nothing else changed | 5 of 5 |
| not committed | 5 of 5 |
| the report names what ran | 5 of 5 |

