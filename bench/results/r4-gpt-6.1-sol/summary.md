# r4-gpt-6.1-sol: gpt-6.1-sol (Codex codex-cli 0.167.0)

design-fence, "this tree": fa89476 with 3 uncommitted file(s) (snapshot a14130a4d842, 2026-11-12); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.29 ($0.23 to $0.36) | $0.34 ($0.25 to $0.36) | +18% (not shown) |
| Tokens | 1.09M (801k to 1.13M) | 1.18M (843k to 1.24M) | +7% (not shown) |
| Tokens not from cache | 55k (44k to 85k) | 66k (56k to 68k) | +20% (not shown) |
| Tool calls | 32 (30 to 39) | 42 (35 to 50) | +31% (not shown) |
| Figma calls | 4 (3 to 8) | 2 (2 to 2) | −50% |
| Screenshots taken | 0 (0 to 1) | 0 (0 to 0) | — |
| Seconds | 279 (213 to 308) | 316 (212 to 353) | +13% (not shown) |
| Score (checks passed) | 55 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 5 of 5 | 5 of 5 |
| no token the design does not use | 5 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 5 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.054 ($0.046 to $0.069) | $0.093 ($0.090 to $0.13) | +72% |
| Tokens | 142k (121k to 164k) | 205k (176k to 254k) | +44% |
| Tokens not from cache | 13k (11k to 23k) | 26k (24k to 46k) | +90% |
| Tool calls | 11 (10 to 13) | 13 (10 to 19) | +18% (not shown) |
| Seconds | 48 (39 to 55) | 90 (71 to 98) | +88% |
| Score (checks passed) | 5 of 15 | 25 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 0 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.31 ($0.24 to $0.33) | $0.29 ($0.26 to $0.32) | −5% (not shown) |
| Tokens | 1.07M (735k to 1.24M) | 867k (673k to 1.06M) | −19% (not shown) |
| Tokens not from cache | 64k (53k to 68k) | 56k (48k to 90k) | −11% (not shown) |
| Tool calls | 25 (22 to 35) | 24 (21 to 36) | −4% (not shown) |
| Figma calls | 20 (16 to 25) | 9 (7 to 11) | −55% |
| Screenshots taken | 5 (4 to 7) | 1 (1 to 1) | −80% |
| Seconds | 270 (159 to 273) | 295 (255 to 337) | +9% (not shown) |
| Score (checks passed) | 21 of 30 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 5 of 5 | 5 of 5 |
| every frame has auto-layout | 1 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.073 ($0.067 to $0.092) | $0.11 ($0.096 to $0.11) | +46% |
| Tokens | 153k (132k to 195k) | 195k (189k to 214k) | +27% (not shown) |
| Tokens not from cache | 21k (18k to 29k) | 38k (32k to 40k) | +80% |
| Tool calls | 13 (12 to 14) | 15 (13 to 20) | +15% (not shown) |
| Seconds | 60 (56 to 64) | 57 (53 to 63) | −5% (not shown) |
| Score (checks passed) | 30 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 0 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 5 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.060 ($0.057 to $0.074) | $0.12 ($0.11 to $0.15) | +94% |
| Tokens | 145k (120k to 187k) | 309k (251k to 347k) | +113% |
| Tokens not from cache | 16k (14k to 24k) | 31k (26k to 49k) | +90% |
| Tool calls | 13 (13 to 16) | 19 (13 to 22) | +46% (not shown) |
| Seconds | 59 (51 to 61) | 99 (84 to 103) | +68% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

