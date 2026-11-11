---
name: Command
status: approved
figma: '4:568'
figma_version: '2419994066997753519'
approved_by: 'Yassine Bakiri'
---

# Command

## Purpose

A command or a program's output, as typed or as printed, in the monospace font: the page's proof ("Shown working") and its install commands ("Get started"). With the copy button, a command to copy; without it, an output to read.

## Anatomy

| Part    | Figma layer                              | Required          |
| ------- | ---------------------------------------- | ----------------- |
| Command | the component's root: a hairline frame   | yes               |
| Code    | `Code` (text, monospace)                 | yes               |
| Button  | `Button` (an instance of Button, "Copy") | when `Copy` is on |

## Properties

| Property | Values                  | Default                                 | Figma                              | Code                         |
| -------- | ----------------------- | --------------------------------------- | ---------------------------------- | ---------------------------- |
| Text     | text, one or more lines | `node .agents/design-fence/install.mjs` | `Text`                             | the element's text           |
| Copy     | on, off                 | off                                     | `Copy` (boolean: shows the Button) | `copy` (an attribute)        |
| Label    | the Button's label      | Copy                                    | the Button instance's `Label`      | the `copy` attribute's value |
| Viewport | Desktop, Mobile         | Desktop                                 | `Viewport` (variant)               | none: the CSS, under 768px   |

## States

None of its own; the button's are Button's, and after a copy its label says "Copied" (Button's content rule).

## Layout

- Command: horizontal, fills its container's width, hug height; padding `space/4` top and bottom, `space/6` left and right; gap `space/6`; the text and the button centred vertically (the designer, at the gate, 2026-11-09).
- Narrow (Figma: the `Mobile` variant; code: under 768px, the tablet-portrait breakpoint): vertical, the text then the button under it, both at the start; gap `space/4` (approved 2026-11-09: on a phone, beside the button, the text was a column a dozen characters wide).
- Code: fills the width; long lines wrap (`pre-wrap` in code), never scroll sideways.

## Tokens

- Command: no fill; border `line-width/hairline` in `line/frame` on every side, radius `radius/none`.
- Code: `font/family-mono`, `font-size/small`, `font/weight-text`, `text/muted` (the designer at the gate, 2026-11-09: "change the color of the command to muted"; before, `text/default`).

## Content

Exactly as typed or printed: no line rewritten, no prompt sign. Quoted output keeps its own words (`content/landing.md`).

## Accessibility

A `pre` holding a `code`; the copy button is a Button labelled "Copy", or what the page names it (then "Copied", announced politely).

## Do and do not

- Do not shorten a command: someone will paste it.
- Do not colour the output (no syntax highlighting): principle 4.

## Used in

`flows.yml`, view `landing`: "Shown working", "Get started" (the terminal's commands, labelled "Copy the terminal commands", action `copy-install`; the designer, 2026-11-09, approved at the gate).

## Deviations

- The narrow layout starts under 768px, the tablet-portrait breakpoint (the designer at the gate, 2026-11-09; before, Steps stacked under 600px, `size/content-max` ÷ 2), written in the CSS: no token holds a breakpoint, and a media query could not read one. 768px and wider is `Desktop`.
