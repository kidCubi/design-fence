# The design philosophy of the design-fence landing page

What every design decision here comes back to. The specs (`components/`, `tokens.md`) apply it; when a request is not covered by them, it is decided from this file or asked, never invented. Written with the human, in their words: each line should settle a real choice.

The page presents design-fence to the people who build software with AI agents: **designers first** (agents inventing interface is their problem), then developers (how it is enforced).

## Principles

1. **Show, don't claim.** Every promise is shown working (a hook refusing a commit, a design gate, a check passing), never only stated. So: a section that makes a claim carries its proof.
2. **Plain words, simple human language.** No jargon, no AI hype; short sentences a designer and a developer read the same way. So: a term design-fence uses (gate, spec, Reflect line) is explained where it first appears.
3. **Honest about limits.** Say what is enforced and what is advice, as the enforcement ledger does. So: no section implies more than the code does.
4. **Quiet, no accent.** Monochrome: one dark, one light, and their steps between. Emphasis comes from size, weight, the raster lines and motion, never from a colour. So: there is no accent colour, and a call to action is set apart by its frame, not by a hue.
5. **The link at the top.** The way to the repository is at the top of the page, before anything else asks for attention.

## Look and feel

- **Colour:** background `#141414`, text `#F2EEE3`; every other tone is a step between them. Monochrome, minimalist-futuristic.
- **Type:** headings in Season Serif Light, large and quiet (the designer, 2026-11-09; before, Public Sans 100); body and small text in Public Sans 300.
- **Lines:** raster lines delimit the sections and frame the buttons: the page's structure is drawn, not filled.
- **Motion:** animations on scroll; a hero made of particles that form a 1-bit image, in three.js.
- **Shape:** sharp, drawn; no shadows (a frame is a line, not a surface).

## Voice

Plain and direct, in the second person ("you"), present tense. Sentences short enough to read at a glance; a command or a file name in full, as it is typed. No exclamation marks, no superlatives.

## References

Given by the human; never one they did not give.

| Reference | Take | Leave |
|---|---|---|
| Zeonite brand design, Second Eight: https://www.secondeight.net/project/zeonite-brand-design | Fine construction lines "for precision"; a mark "drawn with fine guide lines on black"; concentric rings and data-visualisation patterns; the tone, "precision and refinement" | Its colours (scarlet, sage, greys: against "Quiet, no accent"); the security subject (safes, PIN pads, fingerprints) |
| Zeonite brand identity, Behance: https://www.behance.net/gallery/256183689/Zeonite-Brand-Identity | The same project: take and leave as above (the page refuses automated reading, so it was not read) | As above |

## What we do not do

- No accent colour, no gradients of hue.
- No stock illustrations or AI-generated imagery: the hero is the page's own 1-bit image.
- No claims without their proof (principle 1), no marketing superlatives (principle 2).
