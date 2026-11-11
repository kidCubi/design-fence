# baseline-haiku-5.5: claude-haiku-5-5 (Claude Code 2.1.322)

## drift-probe

| Median (least to most) | Without, 5 of 5 runs | With design-fence (released), 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | with against without | next against without | next against with |
| --- | --- | --- | --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.009 to $0.013) | $0.019 ($0.016 to $0.038) | $0.015 ($0.009 to $0.019) | +79% | +36% (not shown) | −24% (not shown) |
| Tokens | 341k (192k to 453k) | 556k (364k to 1.52M) | 355k (154k to 453k) | +63% (not shown) | +4% (not shown) | −36% (not shown) |
| Tokens not from cache | 32k (30k to 35k) | 57k (54k to 90k) | 46k (33k to 59k) | +77% | +42% (not shown) | −20% (not shown) |
| Tool calls | 9 (6 to 12) | 16 (13 to 41) | 11 (6 to 20) | +78% | +22% (not shown) | −31% (not shown) |
| Turns | 10 (7 to 13) | 17 (14 to 42) | 12 (7 to 21) | +70% | +20% (not shown) | −29% (not shown) |
| Seconds | 28 (23 to 34) | 50 (47 to 137) | 39 (21 to 52) | +79% | +39% (not shown) | −22% (not shown) |
| Score (checks passed) | 10 of 15 | 24 of 25 | 24 of 25 | | | |

| Check (runs that pass) | Without | With design-fence (released) | With design-fence (this tree) |
| --- | --- | --- | --- |
| no visual reached the code without a design | 0 of 5 | 4 of 5 | 5 of 5 |
| no value written raw | 5 of 5 | 5 of 5 | 5 of 5 |
| says what is left (a design to approve) | 5 of 5 | 5 of 5 | 5 of 5 |
| the need is written down (a spec, drafted or amended) | — | 5 of 5 | 4 of 5 |
| nothing approved by the agent itself | — | 5 of 5 | 5 of 5 |

## review

| Median (least to most) | Without, 5 of 5 runs | With design-fence (released), 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | with against without | next against without | next against with |
| --- | --- | --- | --- | --- | --- | --- |
| Cost (USD, list price) | $0.010 ($0.010 to $0.012) | $0.013 ($0.010 to $0.016) | $0.014 ($0.013 to $0.015) | +29% (not shown) | +35% | +5% (not shown) |
| Tokens | 245k (195k to 356k) | 273k (201k to 349k) | 277k (272k to 384k) | +11% (not shown) | +13% (not shown) | +2% (not shown) |
| Tokens not from cache | 33k (32k to 37k) | 44k (34k to 51k) | 46k (45k to 51k) | +33% (not shown) | +38% | +4% (not shown) |
| Tool calls | 5 (3 to 7) | 5 (3 to 8) | 8 (5 to 10) | 0% (not shown) | +60% (not shown) | +60% (not shown) |
| Turns | 6 (4 to 8) | 6 (4 to 9) | 9 (6 to 11) | 0% (not shown) | +50% (not shown) | +50% (not shown) |
| Seconds | 34 (30 to 41) | 41 (27 to 52) | 44 (40 to 49) | +21% (not shown) | +29% (not shown) | +7% (not shown) |
| Score (checks passed) | 32 of 35 | 35 of 35 | 34 of 35 | | | |

| Check (runs that pass) | Without | With design-fence (released) | With design-fence (this tree) |
| --- | --- | --- | --- |
| says it cannot be committed as it is | 5 of 5 | 5 of 5 | 5 of 5 |
| finds that the kind was never designed (no spec, no approved design) | 5 of 5 | 5 of 5 | 5 of 5 |
| finds the padding written raw | 5 of 5 | 5 of 5 | 5 of 5 |
| finds the primitive where a role belongs | 2 of 5 | 5 of 5 | 5 of 5 |
| finds the motion without reduced motion | 5 of 5 | 5 of 5 | 4 of 5 |
| finds the label against the voice | 5 of 5 | 5 of 5 | 5 of 5 |
| changed nothing | 5 of 5 | 5 of 5 | 5 of 5 |

## ship-issue

| Median (least to most) | Without, 5 of 5 runs | With design-fence (released), 5 of 5 runs | With design-fence (this tree), 5 of 5 runs | with against without | next against without | next against with |
| --- | --- | --- | --- | --- | --- | --- |
| Cost (USD, list price) | $0.011 ($0.010 to $0.012) | $0.017 ($0.015 to $0.019) | $0.017 ($0.014 to $0.021) | +51% | +50% | −1% (not shown) |
| Tokens | 387k (337k to 442k) | 606k (447k to 792k) | 611k (431k to 784k) | +56% | +58% (not shown) | +1% (not shown) |
| Tokens not from cache | 32k (30k to 33k) | 45k (44k to 54k) | 46k (43k to 54k) | +43% | +44% | 0% (not shown) |
| Tool calls | 10 (8 to 12) | 11 (10 to 13) | 13 (10 to 16) | +10% (not shown) | +30% (not shown) | +18% (not shown) |
| Turns | 11 (9 to 13) | 12 (11 to 14) | 14 (11 to 17) | +9% (not shown) | +27% (not shown) | +17% (not shown) |
| Seconds | 29 (27 to 32) | 50 (42 to 61) | 49 (40 to 57) | +72% | +69% | −2% (not shown) |
| Score (checks passed) | 35 of 35 | 32 of 35 | 30 of 30 | | | |

| Check (runs that pass) | Without | With design-fence (released) | With design-fence (this tree) |
| --- | --- | --- | --- |
| the issue is fixed (its own test) | 5 of 5 | 5 of 5 | 5 of 5 |
| the project's tests pass | 5 of 5 | 5 of 5 | 5 of 5 |
| a test covers the fix | 5 of 5 | 5 of 5 | 5 of 5 |
| nothing else changed | 5 of 5 | 5 of 5 | 5 of 5 |
| the issue is closed in the issues file | 5 of 5 | 2 of 5 | — |
| not committed | 5 of 5 | 5 of 5 | 5 of 5 |
| the report names what ran | 5 of 5 | 5 of 5 | 5 of 5 |

