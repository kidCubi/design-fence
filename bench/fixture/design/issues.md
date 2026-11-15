# Issues

One heading per issue, the newest first. An issue is closed by moving it under "Closed", with the date and what closed it.

## Open

### The outline keeps the copy's markers

`node tools/outline.mjs` lists the page's sections and their anchors from `design/content/landing.md`. A heading the last round marked, like "One source for every decision _(new)_", comes out with its marker: the title reads "One source for every decision _(new)_" and the anchor `one-source-for-every-decision-new`. The markers are notes for the designer (the copy file says so): the outline's title and anchor should be the heading's own words, "One source for every decision" and `one-source-for-every-decision`. Found 2026-11-10 while linking to a section.

### No layer token

The top bar is fixed above the page with a `z-index` written in its CSS: no token holds a layer. To decide with the designer when a second layer appears.

## Closed

### The link's focus ring was the browser's

Closed 2026-11-09: `line/focus` at `line-width/hairline`, in the spec and the CSS.
