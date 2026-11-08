# The tokens of {{project}}: the rules

The rules the tokens follow. The values live in Figma (variables); the code's tokens file (`AGENTS.md` names it) is their copy, written by the tokens export only (`figma/tokens.js`). This file says how tokens are built and named, so that a new one is placed, not invented.

## Layers

| Layer | Holds | Used by |
|---|---|---|
| Primitive | The raw scales: every colour, size, radius, duration the design allows | Semantic tokens only, never a component |
| Semantic | Roles (`color/text/primary`, `space/inset/md`), each an alias of a primitive | Components and views |
| Component | Only where a component needs a role nothing else shares | That component |

## Names

<!-- The pattern (`<category>/<role>/<variant>/<state>`), the separator, the vocabulary of roles and sizes. -->

## Scales

<!-- Spacing (base unit and steps), type (sizes, line heights, weights), radius, elevation, motion. -->

## Modes

<!-- Light and dark, density, brands: which collections have which modes. -->

## Pairs

Which border, line and text tokens go on which surface, so a spec picks one that shows. Two tokens of the same colour never pair (design-fence's gap lint finds a border the colour of what is behind it).

| Surface | Border, divider | Text | Muted text |
|---|---|---|---|
| | | | |

## Rules every token follows

1. A semantic token aliases a primitive; it never holds a raw value.
2. A component binds semantic (or component) tokens, never primitives and never raw values.
3. A new token is added only when no existing role fits; the spec that needs it says why.
4. A number variable is scoped to what it is for (gap, radius, font size, …), not to all uses: Figma's picker offers it only there, and the tokens export knows it is a size.
