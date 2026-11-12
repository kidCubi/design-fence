# r1-gpt-6.1-sol: gpt-6.1-sol (Codex codex-cli 0.167.0)

design-fence, "this tree": e3cc04d with 10 uncommitted file(s) (snapshot 0821eadf0bf2, 2026-11-11); "released": origin/main (9579683).

Codex ran each copy untrusted: design-fence's session hooks did not run.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.32 ($0.29 to $0.39) | $0.47 ($0.41 to $0.53) | +44% |
| Tokens | 1.04M (864k to 1.25M) | 1.67M (1.43M to 2.24M) | +61% |
| Tokens not from cache | 60k (57k to 104k) | 92k (82k to 121k) | +53% (not shown) |
| Tool calls | 32 (28 to 34) | 40 (33 to 52) | +25% (not shown) |
| Figma calls | 5 (2 to 7) | 3 (2 to 4) | −40% (not shown) |
| Seconds | 290 (217 to 374) | 362 (357 to 421) | +25% (not shown) |
| Score (checks passed) | 50 of 50 | 50 of 50 |  |

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

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.10 ($0.057 to $0.10) | $0.16 ($0.13 to $0.17) | +64% |
| Tokens | 233k (142k to 246k) | 451k (330k to 497k) | +94% |
| Tokens not from cache | 31k (16k to 35k) | 44k (35k to 45k) | +42% (not shown) |
| Tool calls | 16 (10 to 16) | 18 (15 to 22) | +13% (not shown) |
| Figma calls | 0 (0 to 0) | 2 (2 to 2) | — |
| Seconds | 70 (54 to 83) | 154 (128 to 175) | +120% |
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
| Cost (USD, list price) | $0.29 ($0.26 to $0.35) | $0.31 ($0.29 to $0.33) | +7% (not shown) |
| Tokens | 920k (806k to 1.17M) | 915k (880k to 1.04M) | −1% (not shown) |
| Tokens not from cache | 64k (59k to 71k) | 70k (59k to 74k) | +10% (not shown) |
| Tool calls | 25 (21 to 26) | 28 (23 to 32) | +12% (not shown) |
| Figma calls | 20 (15 to 23) | 11 (8 to 13) | −45% |
| Screenshots taken | 4 (4 to 6) | 1 (1 to 1) | −75% |
| Seconds | 237 (226 to 366) | 320 (281 to 347) | +35% (not shown) |
| Score (checks passed) | 15 of 25 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the design is there (its page was found) | 5 of 5 | 5 of 5 |
| every value bound to a variable | 5 of 5 | 5 of 5 |
| every frame has auto-layout | 0 of 5 | 5 of 5 |
| not built in code | 5 of 5 | 5 of 5 |
| one screenshot at most | 0 of 5 | 5 of 5 |
| a draft spec is left | — | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.11 ($0.096 to $0.16) | $0.11 ($0.100 to $0.17) | +7% (not shown) |
| Tokens | 299k (197k to 345k) | 242k (190k to 305k) | −19% (not shown) |
| Tokens not from cache | 30k (29k to 58k) | 40k (32k to 65k) | +31% (not shown) |
| Tool calls | 13 (13 to 21) | 13 (10 to 20) | 0% (not shown) |
| Figma calls | 1 (1 to 4) | 0 (0 to 0) | −100% |
| Seconds | 81 (70 to 110) | 74 (62 to 93) | −9% (not shown) |
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

| Median (least to most) | Without, 3 of 5 runs | With design-fence (this tree), 2 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.074 ($0.074 to $0.084) | $0.14 ($0.13 to $0.15) | +89% (not shown) |
| Tokens | 188k (163k to 188k) | 409k (391k to 426k) | +118% (not shown) |
| Tokens not from cache | 21k (20k to 26k) | 35k (33k to 37k) | +64% (not shown) |
| Tool calls | 14 (11 to 18) | 21 (19 to 22) | +46% (not shown) |
| Seconds | 64 (64 to 68) | 138 (134 to 141) | +115% (not shown) |
| Score (checks passed) | 18 of 18 | 12 of 12 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 3 of 3 | 2 of 2 |
| the project's tests pass | 3 of 3 | 2 of 2 |
| a test covers the fix | 3 of 3 | 2 of 2 |
| nothing else changed | 3 of 3 | 2 of 2 |
| not committed | 3 of 3 | 2 of 2 |
| the report names what ran | 3 of 3 | 2 of 2 |

Not counted (did not finish): without-4 (turn.failed), without-5 (turn.failed), next-3 (turn.failed), next-4 (turn.failed), next-5 (turn.failed).

