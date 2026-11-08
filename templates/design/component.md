---
name: <Name, as in Figma and the code>
status: draft            # draft | approved | built | as-is (design/index.md)
figma: ""                # the component (set) node id
figma_version: ""        # the Figma version the human approved
approved_by: ""          # who said "good" at the gate
story: ""                # the Storybook story id
---

# <Name>

<!-- Copied by playbooks/design.md to design/components/<name>.md. Every section concrete enough to build in Figma, then in code, without asking. Delete a section only when it has nothing to say. -->

## Purpose

<!-- What it is for, in one or two sentences. When not to use it, and what to use instead. -->

## Anatomy

<!-- Its parts, each with the layer name it has in Figma and the element it is in code. -->

| Part | Figma layer | Required |
|---|---|---|
| | | |

## Properties

<!-- Every variant and property; Figma's name and the code's name for each. Nothing here for later. -->

| Property | Values | Default | Figma | Code |
|---|---|---|---|---|
| | | | | |

## States

<!-- Rest, hover, focus, pressed, disabled, loading, error, empty: those that apply, and what changes in each. -->

## Layout

<!-- Per part: direction, sizing (hug, fill, fixed), gap and padding (token names), alignment, min and max sizes, how it wraps or truncates, how it behaves in a narrow and a wide container. This is the auto-layout in Figma and the CSS in code. -->

## Tokens

<!-- The semantic tokens it binds, by part. A token that does not exist yet is a finding: tokens.md, rule 3. -->

## Content

<!-- Copy rules: lengths, case, what a label or a message says. -->

## Accessibility

<!-- Role, keyboard, focus order and visibility, the contrast pairs it relies on, what a screen reader says. -->

## Do and do not

## Used in

<!-- The views of flows.yml that show it: what to check again when it changes. -->

## Deviations

<!-- Anything Figma or the code does differently from this spec, and why. Empty is the goal. -->
