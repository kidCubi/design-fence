---
name: Top bar
status: built
figma: '4:536'
figma_version: '2419877745300849877'
approved_by: 'Yassine Bakiri'
story: 'Components/Top bar'
---

# Top bar

## Purpose

The page's top: the wordmark, and the link to the process, always one click away (`PHILOSOPHY.md`, principle 5). Fixed at the top of the screen, over everything, as the page scrolls (decided with the designer, 2026-11-09).

## Anatomy

| Part     | Figma layer                                                | Required |
| -------- | ---------------------------------------------------------- | -------- |
| Top bar  | the component's root: its bottom hairline is a raster line | yes      |
| Wordmark | `Wordmark` (text)                                          | yes      |
| Link     | `Link` (an instance of Link)                               | yes      |

## Properties

| Property    | Values | Default              | Figma                       | Code            |
| ----------- | ------ | -------------------- | --------------------------- | --------------- |
| Link label  | text   | Read the process     | the Link instance's `Label` | the link's text |
| Link target | URL    | PROCESS.md on GitHub | —                           | `href`          |
| Viewport | Desktop, Mobile | Desktop | `Viewport` (variant) | none: the CSS, under 768px |

## States

None of its own; the link's are Link's.

## Layout

- Top bar: horizontal, fills the page's width, hug height; its items centred vertically, the wordmark at the start and the link at the end (space between); padding `space/4` top and bottom, `space/16` left and right; its bottom border a hairline.
- Narrow (Figma: the `Mobile` variant; code: under 768px, the tablet-portrait breakpoint): padding `space/6` left and right; the wordmark and the link each on one line, never wrapped (approved 2026-11-09: on a phone the wordmark broke in two).
- In code: fixed at the top of the viewport, above the page and the fencer (layer 3; the hero 0, the sections 1, the fencer 2).

## Tokens

- Top bar: fill `surface/page`; bottom border `line-width/hairline` in `line/raster`.
- Wordmark: `font/family-display`, `font-size/h3`, `font/weight-display`, `text/default`.

## Content

The wordmark: "design-fence", lower case, as the project writes its name. The link: "Read the process" (`content/landing.md`).

## Accessibility

A `header` holding the wordmark (text, not a heading: the hero's sentence is the page's only `h1`) and the link. The link is the first thing the keyboard reaches.

## Do and do not

- Do not add more links: one way out, to the process.

## Used in

`flows.yml`, view `landing`: the top.

## Deviations

- The narrow layout starts under 768px, the tablet-portrait breakpoint (the designer at the gate, 2026-11-09; before, Steps stacked under 600px, `size/content-max` ÷ 2), written in the CSS: no token holds a breakpoint, and a media query could not read one. 768px and wider is `Desktop`.
