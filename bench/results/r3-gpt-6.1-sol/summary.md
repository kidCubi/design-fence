# r3-gpt-6.1-sol: gpt-6.1-sol (Codex codex-cli 0.167.0)

design-fence, "this tree": d835e68 with 1 uncommitted file(s) (snapshot d07f6c4e0178, 2026-11-12); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.27 ($0.24 to $0.31) | $0.35 ($0.31 to $0.46) | +30% (not shown) |
| Tokens | 864k (782k to 961k) | 1.16M (972k to 1.79M) | +34% |
| Tokens not from cache | 58k (51k to 69k) | 76k (69k to 94k) | +30% |
| Tool calls | 28 (27 to 31) | 36 (33 to 50) | +29% |
| Figma calls | 5 (4 to 7) | 2 (2 to 2) | −60% |
| Screenshots taken | 0 (0 to 1) | 0 (0 to 0) | — |
| Seconds | 245 (211 to 287) | 304 (270 to 468) | +24% (not shown) |
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
| Cost (USD, list price) | $0.066 ($0.052 to $0.085) | $0.16 ($0.10 to $0.18) | +136% |
| Tokens | 141k (120k to 213k) | 244k (197k to 481k) | +73% (not shown) |
| Tokens not from cache | 21k (16k to 27k) | 47k (30k to 60k) | +117% |
| Tool calls | 12 (11 to 13) | 13 (12 to 20) | +8% (not shown) |
| Seconds | 47 (41 to 61) | 103 (85 to 157) | +119% |
| Score (checks passed) | 6 of 15 | 25 of 25 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 1 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 |
| nothing approved by the agent itself | — | 5 of 5 |

## figma-badge

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.32 ($0.28 to $0.37) | $0.29 ($0.25 to $0.35) | −10% (not shown) |
| Tokens | 1.11M (829k to 1.39M) | 782k (641k to 1.18M) | −30% (not shown) |
| Tokens not from cache | 65k (64k to 104k) | 69k (52k to 111k) | +6% (not shown) |
| Tool calls | 26 (23 to 29) | 26 (21 to 32) | 0% (not shown) |
| Figma calls | 20 (15 to 24) | 7 (6 to 11) | −65% |
| Screenshots taken | 5 (4 to 6) | 1 (1 to 1) | −80% |
| Seconds | 263 (198 to 288) | 256 (250 to 306) | −3% (not shown) |
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

| Median (least to most) | Without, 1 of 2 runs | With design-fence (this tree), 1 of 1 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.079 ($0.079 to $0.079) | $0.11 ($0.11 to $0.11) | +37% (not shown) |
| Tokens | 162k (162k to 162k) | 211k (211k to 211k) | +30% (not shown) |
| Tokens not from cache | 24k (24k to 24k) | 37k (37k to 37k) | +51% (not shown) |
| Tool calls | 13 (13 to 13) | 16 (16 to 16) | +23% (not shown) |
| Seconds | 59 (59 to 59) | 64 (64 to 64) | +8% (not shown) |
| Score (checks passed) | 6 of 7 | 7 of 7 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 1 of 1 | 1 of 1 |
| finds that the kind was never designed (no spec, no approved design) | 1 of 1 | 1 of 1 |
| finds the padding written raw | 1 of 1 | 1 of 1 |
| finds the primitive where a role belongs | 0 of 1 | 1 of 1 |
| finds the motion without reduced motion | 1 of 1 | 1 of 1 |
| finds the label against the voice | 1 of 1 | 1 of 1 |
| changed nothing | 1 of 1 | 1 of 1 |

Not counted (did not finish): without-2 (turn.failed).

