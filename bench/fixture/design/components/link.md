---
name: Link
status: built
figma: '2:184'
figma_version: '2419555566914753744'
approved_by: 'Yassine Bakiri'
story: 'Components/Link'
---

# Link

## Purpose

A text link to another page: the link to the process at the top, and in "How it works". Not for an action on this page: use Button.

## Anatomy

| Part      | Figma layer                                       | Required |
| --------- | ------------------------------------------------- | -------- |
| Link      | the component's root                              | yes      |
| Underline | `Underline`: its bottom hairline is the underline | yes      |
| Label     | `Label` (text), in the underline                  | yes      |

## Properties

| Property    | Values                | Default          | Figma   | Code                                |
| ----------- | --------------------- | ---------------- | ------- | ----------------------------------- |
| State       | default, hover, focus | default          | `State` | derived: `:hover`, `:focus-visible` |
| Label       | text                  | Read the process | `Label` | the element's text                  |
| Destination | a URL                 | —                | —       | `href`                              |

## States

- **default**: label `text/default`; underline `line/frame`.
- **hover**: underline `line/focus`.
- **focus**: the underline dotted in place of the solid one, in `line/focus`; no frame around the link (changed at the design gate, 2026-11-08).

## Layout

- Root: horizontal, hug, no padding.
- Underline: horizontal, hug, bottom padding `space/1`, its bottom border the underline.

## Tokens

- Label: `font/family`, `font-size/body`, `font/weight-text`, `text/default`.
- Underline: `line-width/hairline`, `line/frame` or `line/focus`; dotted in focus: 1px dots, 1px apart (CSS `dotted`; in Figma a dash pattern of 1 and 1, which no variable can hold).

## Content

A verb phrase saying where it goes ("Read the process"), in sentence case. No arrow: an external destination opens in the same tab.

## Accessibility

An `a` with its `href`; its label is its name; focus visible (the dotted underline, a change of shape, not only of colour).

## Do and do not

- Do not use it for an action on the page: Button does that.

## Used in

`flows.yml`, view `landing`: the top bar, "How it works" (action `read-process`).

## Deviations
