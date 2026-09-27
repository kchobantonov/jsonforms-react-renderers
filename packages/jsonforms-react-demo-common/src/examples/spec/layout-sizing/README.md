# Example: layout sizing

**Example ID:** `layout-sizing`\
**Demo entry:** **Spec: Layout sizing** (`#spec-layout-sizing`)\
**Domain:** order intake\
**Specs covered:**

- [Portable spec §6 — Layout types and semantics](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §7 — Wrap, defaults, splitter and Spacer](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §21 — The layout sizing model](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Adjustments §1 — configuration namespacing](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

Sizing lives on **two different elements**, and telling them apart is most of
the model:

| Where | What it configures | Example |
| --- | --- | --- |
| `options.layout` on a **child** | how that child participates in its parent | `{ "layout": { "span": 4 } }` |
| flat `options` on the **layout** | the container itself | `{ "gap": "1rem", "wrap": true }` |

"Flat layout options configure immediate children. `options.layout` configures
child participation."

## Files

| File | Role |
| --- | --- |
| `schema.json` | Thirteen plain properties; the schema is deliberately dull, because the example is about arrangement. |
| `uischema.json` | Eight rows: span, weight, precedence, a hidden child, a Spacer, wrapping, and the same three children sized twice to contrast span with weight. |
| `data.json` | Valid throughout — nothing here is about validation. |
| `config.json` | `jsonformsExtended.layoutDefaults` with `gridColumns`, `gap` and `wrap`. |
| `translations.json` | English and Bulgarian. |
| `index.ts` | Registers the example with the demo. |

## Expected behaviour

### Span, against a grid

The first row is 4 / 8 / 4 of a 16-column grid. Widths follow the formula, with
the gap taken into account:

```text
c = (W - (G - 1) * g) / G
spanWidth(n) = n * c + (n - 1) * g
```

so a span of 4 with a 1rem gap resolves to `calc(25% - 0.75 * 1rem)`.

**Change `gridColumns`.** `config.json` sets 16; an individual layout may
override it. The resolution order is explicit → `layoutDefaults.gridColumns` →
renderer default → 16.

### Weight, of what is left

The second row asks for 2 / 2 / 1, so Origin and Destination each take twice
Priority's share. **Auto is weight 1** in a horizontal layout, which is why a
row of plain controls divides evenly — equal shares are a result, not a rule.

In a vertical layout Auto means natural height instead, and weight only
distributes when the parent's height is definite.

### Precedence, and constraints

**Fixed > Span > Weight > Auto.** The third row pins Priority at 180px and lets
Notes take the rest, up to `maxWidth: "32rem"`. Min and max are constraints on
whichever mode won, never modes themselves — a child with both `weight` and
`maxWidth` still flexes, it just stops growing at the maximum.

`minItemWidth` on the row is a **default** minimum, which a child's own
`minWidth` overrides.

### A hidden child leaves layout

Tick **Hazardous goods**. The UN code control appears — and before it does, it
consumes nothing: no share, and no gap. "Only effective visible UI-schema
children participate. Hidden children leave layout."

This is worth trying with the box unticked and the row inspected: there are two
slots, not three-with-one-empty. The previous implementation divided the row by
`elements.length`, so a hidden child still reserved a column.

### Span is absolute; weight is relative

The clearest way to see the difference is to take one child away. **Booked by /
Lane / Approved by** appear twice — once at `span` 4 / 8 / 4, once at `weight`
1 / 2 / 1 — with **Show lane** hiding the middle of each.

Untick it:

| | Before | After |
| --- | --- | --- |
| `span` 4 / 8 / 4 | 25% · 50% · 25% | 25% · 25%, **and half the row empty** |
| `weight` 1 / 2 / 1 | ¼ · ½ · ¼ | ½ · ½ |

Both are correct, and the reason is in the wording. Span resolves "against the
complete logical grid" — the grid stays sixteen columns wide whoever is in it,
so the survivors keep the four they asked for and the freed eight are simply
not used. Weight is a share of what is actually there, so it redivides.

The hidden child itself leaves entirely either way: no slot, and no gap. What
differs is whether the space it held is reclaimed.

**Which to reach for.** If a row must stay aligned with the rows above and
below it, use span — a control keeps its column whatever else is showing. If it
should always fill the width, use weight.

### Spacer follows the parent's axis

The fifth row separates two controls with `{ "type": "Spacer", "size": 48 }`.
In a row that is 48px of **width**; the same element in a vertical layout is
48px of height. `size` is a top-level field, not an option.

A Spacer may flex instead: `options.layout.weight` makes it the flexible push
that drives its neighbours apart.

### Wrap

The last row sets `wrap: true` with `minItemWidth: "14rem"`. Narrow the window:
children that no longer fit move to the next line rather than shrinking past
their minimum. Without `wrap` they would shrink to the minimum and then
overflow.

`justify` is the main axis, `align` the cross axis.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `options.layout` on a child | Auto — weight 1 horizontally, natural height vertically. |
| `gridColumns` unset | `layoutDefaults.gridColumns`, then 16. |
| `wrap` unset | `layoutDefaults.wrap`, then false. |
| `gap` unset | `layoutDefaults.gap`, then 0. |
| `span` above `gridColumns` | Clamped, with a diagnostic. |
| `span` in a vertical layout | Ignored, with a diagnostic — it does not create a horizontal grid. |
| `span` not a positive integer, `weight` not finite and positive, a negative dimension | Ignored, with a diagnostic. |
| `columns` or `trim` | Diagnosed. Both are outside the portable contract — see below. |

## Two options that are not part of this

**`columns`** is the 2–16 encoding the Svelte and Vuetify renderer families
use. The portable contract replaces it with `options.layout.span` against a
configurable `gridColumns`, so a control carrying `columns` now draws a
diagnostic rather than being silently mis-sized.

**`trim`** narrowed a control by suppressing its full width. The contract
"excludes the trim sizing option" and says to "use the shared layout sizing
options to control width" — `options.layout.width` or `maxWidth`.

Both are recorded in [Adjustment 21](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md),
including what changes for a form that used them.

## Status

**Implemented** for the model above. Covered by `layoutSizing.test.tsx` (the
resolution rules), `layoutSizingExample.test.tsx` (this fixture) and
`layoutPrimitives.test.tsx` (Spacer and splitter initial sizes).

The splitter variant is exercised by the separate
[split-layout](../../split-layout/) example.
