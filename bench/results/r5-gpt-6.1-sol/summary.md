# r5-gpt-6.1-sol: gpt-6.1-sol (Codex codex-cli 0.167.0)

design-fence, "this tree": 56ac855 with 10 uncommitted file(s) (snapshot 78e8059a5b98, 2026-11-13); "released": origin/main (9579683).

Codex ran each copy as a trusted project: design-fence's session hooks on.

## component-build

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.26 ($0.24 to $0.26) | $0.27 ($0.26 to $0.32) | +7% (not shown) |
| Tokens | 782k (759k to 922k) | 879k (720k to 941k) | +12% (not shown) |
| Tokens not from cache | 55k (52k to 57k) | 58k (51k to 91k) | +4% (not shown) |
| Tool calls | 26 (24 to 32) | 44 (38 to 46) | +69% |
| Figma calls | 6 (2 to 7) | 0 (0 to 0) | −100% |
| Seconds | 252 (241 to 294) | 308 (288 to 455) | +22% (not shown) |
| Score (checks passed) | 54 of 55 | 55 of 55 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the element df-command is defined | 5 of 5 | 5 of 5 |
| its stories are titled Components/Command | 5 of 5 | 5 of 5 |
| a story with the copy button and one without | 5 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 |
| the design's tokens, all of them | 5 of 5 | 5 of 5 |
| no token the design does not use | 4 of 5 | 5 of 5 |
| the copy button is the library's Button | 5 of 5 | 5 of 5 |
| a pre holding a code (the spec's accessibility) | 5 of 5 | 5 of 5 |
| nothing else in the project changed | 5 of 5 | 5 of 5 |
| the report names what it checked | 5 of 5 | 5 of 5 |
| nothing else in the Figma file changed | 5 of 5 | 5 of 5 |

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.071 ($0.041 to $0.091) | $0.10 ($0.089 to $0.13) | +47% (not shown) |
| Tokens | 142k (121k to 163k) | 174k (172k to 228k) | +22% |
| Tokens not from cache | 24k (11k to 33k) | 34k (25k to 45k) | +41% (not shown) |
| Tool calls | 11 (10 to 13) | 12 (11 to 16) | +9% (not shown) |
| Seconds | 52 (47 to 53) | 88 (78 to 106) | +69% |
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
| Cost (USD, list price) | $0.25 ($0.24 to $0.31) | $0.24 ($0.21 to $0.33) | −4% (not shown) |
| Tokens | 852k (792k to 1.09M) | 651k (567k to 851k) | −24% (not shown) |
| Tokens not from cache | 57k (52k to 60k) | 53k (50k to 84k) | −7% (not shown) |
| Tool calls | 25 (20 to 30) | 24 (19 to 28) | −4% (not shown) |
| Figma calls | 18 (15 to 24) | 7 (6 to 9) | −61% |
| Screenshots taken | 4 (3 to 8) | 1 (1 to 1) | −75% |
| Seconds | 240 (210 to 311) | 263 (212 to 314) | +10% (not shown) |
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
| Cost (USD, list price) | $0.097 ($0.064 to $0.097) | $0.11 ($0.096 to $0.15) | +12% (not shown) |
| Tokens | 160k (143k to 173k) | 197k (193k to 214k) | +23% |
| Tokens not from cache | 34k (18k to 36k) | 39k (32k to 58k) | +14% (not shown) |
| Tool calls | 12 (10 to 13) | 14 (13 to 21) | +17% (not shown) |
| Seconds | 60 (55 to 77) | 68 (53 to 78) | +13% (not shown) |
| Score (checks passed) | 31 of 35 | 35 of 35 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 1 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 |
| finds the label against the voice | 5 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | next against without |
| --- | --- | --- | --- |
| Cost (USD, list price) | $0.079 ($0.055 to $0.098) | $0.14 ($0.12 to $0.16) | +71% |
| Tokens | 168k (101k to 181k) | 320k (303k to 345k) | +91% |
| Tokens not from cache | 25k (17k to 32k) | 37k (31k to 48k) | +49% (not shown) |
| Tool calls | 13 (11 to 16) | 17 (17 to 33) | +31% |
| Seconds | 60 (48 to 71) | 118 (110 to 124) | +97% |
| Score (checks passed) | 30 of 30 | 30 of 30 |  |

| Check (runs that pass) | Without | With design-fence (this tree) |
| --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 |
| not committed | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 |

