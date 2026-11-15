# The tokens of the design-fence landing page: the rules

The rules the tokens follow. The values live in Figma (variables); the code's tokens file (`AGENTS.md` names it) is their copy, written by the tokens export only (`figma/tokens.js`). This file says how tokens are built and named, so that a new one is placed, not invented. From `PHILOSOPHY.md`: monochrome between `#141414` and `#F2EEE3`, Public Sans 100, raster lines, sharp, no accent.

## Layers

| Layer     | Collection   | Holds                                                               | Used by              |
| --------- | ------------ | ------------------------------------------------------------------- | -------------------- |
| Primitive | `Primitives` | The monochrome ramp; nothing else is a colour                       | Semantic tokens only |
| Semantic  | `Semantic`   | Colour roles (`surface/*`, `text/*`, `line/*`), aliases of the ramp | Components and views |
| Scale     | `Scale`      | Space, type, line widths, radius, sizes, motion                     | Components and views |

## Names

`<category>/<role>`, lowercase, `/` between levels; a number names a step of a scale (`space/4` is 4 steps of 4px, `mono/40` is 40% of the way from dark to light).

## Scales

- **Monochrome ramp** (`mono/<t>`): `#141414` mixed toward `#F2EEE3` by t%: 0, 5, 10, 20, 40, 60, 80, 100. No other hue, ever.
- **Space** (`space/<n>`, n × 4px): 1, 2, 3, 4, 6, 8, 12, 16, 24, 32 (4 to 128).
- **Type** (`font-size/*`, px): `display` 96, `h1` 64, `h2` 40, `h3` 24, `body` 18, `small` 14. Three families: `font/family-display` Season Serif for `display` to `h3` and the wordmark (the designer, 2026-11-09: "lock-in this new font"; rule 3, the headings' voice is not the text's); `font/family` Public Sans for everything else; its monospace companion `font/family-mono` JetBrains Mono, for commands and program output only (added 2026-11-09: rule 3, no family showed code as typed). Two weights: `font/weight-display` 300 for the headings (Season Serif Light, its lightest: renamed from `font/weight-thin`, which held Public Sans 100); `font/weight-text` 300 for `body` and `small` (added at the token gate, 2026-11-08: rule 3, no existing weight fits small text). Season Serif is a trial font: its file is git-ignored (`src/assets/fonts/season-serif-trial/`) and the page is not published with it until it is licensed.
- **Caption** (`font-size/caption`, 11 px, added 2026-11-10 at the designer's word, "smaller tags"): the footer tracker's tags, coordinates in `font/family-mono`; rule 3: `small` (14) was the smallest size, and the tags, like the reference's, sit inside boxes some 50 px wide. Not for reading text.
- **Line height** (`line-height/*`, px): `body` 25.2, 140% of `font-size/body`, for every body text (the sections' text and the hero's line, `text/muted`; the designer, 2026-11-09). In pixels because Figma binds a line height in pixels: a new body size needs its own value here. The headings, the small text and the code keep their font's own line height.
- **Lines** (`line-width/*`): `hairline` 1. Raster lines and button frames are hairlines.
- **Radius**: `radius/none` 0. Corners are sharp.
- **Sizes**: `size/content-max` 1200, the content's widest (the top bar's and the footer's rows); `size/column` 976, the text column's widest (the sections' content, the hero's column). Added 2026-11-09, the designer: the sections' content at 976 (rule 3: `content-max` also holds the footer at 1200, and the hero's 976 had no token). `size/field` 360, the footer's field's height at every width (added 2026-11-10, the footer's field: rule 3, no size held a band's height; the hero's field has none either, `issues.md`, "Sizes without tokens").
- **Motion** (`duration/*`, ms): `fast` 150, `base` 300, `slow` 600.

## Modes

One mode: the page is dark only.


## Pairs

Which line and text tokens go on which surface, so a spec picks one that shows. Two tokens of the same colour never pair.

| Surface                     | Raster line, divider      | Frame (button, field)                                        | Text                        | Muted text               |
| --------------------------- | ------------------------- | ------------------------------------------------------------ | --------------------------- | ------------------------ |
| `surface/page` (`mono/0`)   | `line/raster` (`mono/20`) | `line/frame` (`mono/40`), `line/focus` (`mono/100`) on focus | `text/default` (`mono/100`) | `text/muted` (`mono/60`) |
| `surface/raised` (`mono/5`) | `line/raster` (`mono/20`) | `line/frame` (`mono/40`)                                     | `text/default` (`mono/100`) | `text/muted` (`mono/60`) |

`mono/40` (`line/frame`, 3.4:1 on the page) is for lines only, never for text.

## Rules every token follows

1. A semantic token aliases a primitive; it never holds a raw value.
2. A component binds semantic (or scale) tokens, never primitives and never raw values.
3. A new token is added only when no existing role fits; the spec that needs it says why.
4. A number variable is scoped to what it is for (gap, radius, font size, …), not to all uses: Figma's picker offers it only there, and the tokens export knows it is a size. Primitives are scoped to nothing: they are picked through the semantic layer.
