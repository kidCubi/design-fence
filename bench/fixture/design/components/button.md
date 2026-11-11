---
name: Button
status: built
figma: '2:193'
figma_version: '2419908651878111636'
approved_by: 'Yassine Bakiri'
story: 'Components/Button'
---

# Button

## Purpose

An action on this page: copy the install commands, or the prompt for an agent. Set apart by its hairline frame, never by a colour (`PHILOSOPHY.md`, principle 4). Not for going to another page: use Link; except a Secondary beside a Primary, which may go to another page with a button's size ("See on GitHub" in the hero; the designer, 2026-11-09).

Amended 2026-11-09 (approved at the design gate and built the same day): the `Kind` property, Primary as before, and Secondary.

## Anatomy

| Part  | Figma layer                                    | Required |
| ----- | ---------------------------------------------- | -------- |
| Frame | the component's root: a hairline on every side | yes      |
| Label | `Label` (text)                                 | yes      |

## Properties

| Property    | Values                         | Default           | Figma            | Code                                           |
| ----------- | ------------------------------ | ----------------- | ---------------- | ---------------------------------------------- |
| State       | default, hover, focus, pressed | default           | `State`          | derived: `:hover`, `:focus-visible`, `:active` |
| Label       | text                           | Copy the commands | `Label`          | the element's text                             |
| Kind        | Primary, Secondary             | Primary           | `Kind` (variant) | `secondary` (a boolean attribute)              |
| Destination | a URL (a Secondary only)       | —                 | —                | `href`: the button is then a link (`a`)        |

## States

| State   | Fill             | Frame        |
| ------- | ---------------- | ------------ |
| default | none             | `line/frame` |
| hover   | none             | `line/focus` |
| focus   | `surface/raised` | `line/focus` |
| pressed | `surface/raised` | `line/frame` |

A Secondary: no frame at rest, the label alone, the same size (its hairline is there, unpainted); on hover, `line/frame`; focus and pressed as the Primary's.

After its action, the label says what happened ("Copied") for `duration/slow` × 4 (2.4s), then returns: content, not a state.

## Layout

- Horizontal, hug, centred; padding `space/3` top and bottom, `space/6` left and right; sharp corners (`radius/none`).

## Tokens

- Label: `font/family`, `font-size/body`, `font/weight-text`, `text/default`.
- Frame: `line-width/hairline`, as in "States"; fill as in "States".

## Content

A verb phrase for the action ("Copy the commands"); after it, what happened ("Copied"), in sentence case.

## Accessibility

A `button`, or a link (`a`) when a Secondary has a destination; its label is its name; focus visible (fill and frame); "Copied" is announced (`aria-live="polite"`).

## Do and do not

- Do keep one Primary per section at most: the page is quiet. A Secondary may sit beside it.

## Used in

`flows.yml`, view `landing`: "Get started", "Copy the terminal commands" (action `copy-install`); the hero, "Copy prompt" (action `copy-prompt`).

## Deviations

- In Figma, a Secondary's unpainted frame is its hairline at 0 % opacity (the hairline counts in its size, as the Primary's does; a hidden paint or no stroke made it 2 px shorter). Its instances repeat that 0 % as an override: an instance drew the component's stroke at full opacity after the component's strokes changed (2026-11-09).
