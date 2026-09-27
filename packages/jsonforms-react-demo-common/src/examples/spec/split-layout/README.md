# Example: split layout

**Example ID:** `split-layout`\
**Demo entry:** **Spec: Split layout** (`#spec-split-layout`)\
**Domain:** project board\
**Specs covered:**

- [Portable spec §7 — Wrap, defaults, splitter and Spacer](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §6 — Layout types and semantics](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §21.7 — Splitter](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

`options.variant: "splitter"` turns either layout into draggable panes. It is a
project extension, reusing the shared `variant` convention rather than adding a
layout type — so **the layout type is the direction**.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Eleven plain properties, two of them toggles that hide a pane. |
| `uischema.json` | Five splitters: horizontal, vertical, non-resizable, one with a conditional pane, and one of three weighted panes whose middle is conditional. |
| `data.json` | Every pane has something to show. |
| `config.json` | `showUnfocusedDescription`. |
| `translations.json` | English and Bulgarian. |
| `index.ts` | Registers the example with the demo. |

## What the form contains

```text
Project board
  HorizontalLayout + splitter   -> panes side by side, weights 2 : auto
  VerticalLayout   + splitter   -> panes stacked, definite height
  HorizontalLayout + resizable:false -> boundary stays, dragging does not
  HorizontalLayout + splitter   -> second pane behind a SHOW rule
  HorizontalLayout + splitter   -> three panes 1:2:1, middle behind a rule
```

## Expected behaviour

### The layout type is the direction

The first splitter is a `HorizontalLayout`, so its panes sit side by side and
the separator is vertical. The second is a `VerticalLayout` and stacks them.
There is no direction option — "layout type determines direction".

### Initial sizes come from ordinary sizing

The first splitter's panes ask for `weight: 2` and nothing, so they start at
two thirds and one third. "Initial sizes use normal sizing" — equal shares are
what Auto produces, not a rule of their own.

**`span` is not used here.** The specification says it "SHOULD NOT be used"
with a splitter, and a pane asking for one falls back to Auto: a draggable pane
has no fixed grid to be a share of.

### Dragging is runtime state

Drag a separator, then change something elsewhere in the form. The pane sizes
stay where you put them, and the UI schema is unchanged — "dragged sizes are
runtime state, not UI schema".

### A vertical splitter needs a definite height

The second splitter sets `height: "16rem"`. Without a definite height there is
nothing for the panes to divide; the renderer falls back to `20rem` rather
than collapsing.

### `resizable: false` keeps the boundary

The third splitter is not resizable. The separator is still drawn — it is a
real boundary between panes — but it is no longer focusable or draggable.
`resizable` defaults to true.

### A hidden pane leaves layout

Tick **Show audit pane**. The fourth splitter gains a pane *and* a separator;
before that it has neither. A hidden child does not hold a share open.

### Three panes, and one of them goes

The last splitter holds **Booked by / Team / Approved by** at `weight`
1 : 2 : 1, so they start at 25 / 50 / 25. **Show team pane** removes the middle
one, and the two that remain divide the space again at 50 / 50.

Panes are weighted rather than spanned on purpose: "span SHOULD NOT be used"
with a splitter, and a pane asking for one falls back to Auto. The contrast is
worth seeing against the
[layout-sizing](../layout-sizing/README.md) example, where the *same* three
children sized by `span` leave a hole when the middle disappears — span is a
share of a fixed grid, weight is a share of what is present.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `resizable` | True: panes drag. |
| `resizable: false` | The separator remains as a boundary, inert. |
| No `height` on a vertical splitter | `20rem`. |
| A pane with `options.layout.weight` | Its share of the initial sizes. |
| A pane with `options.layout.span` | Ignored; treated as Auto. |
| `wrap` together with the variant | Unsupported, and diagnosed. |
| A hidden pane | Leaves layout, separator included. |

## Accessibility

A resizable boundary should expose separator semantics, its orientation and
current position, and support keyboard resizing. The registered adapter chooses
the component; the authored layout and its sizing contract stay the same.

## Status

This is a runnable contract example. Availability of specialized controls and
options depends on the registered renderer set. Check the behaviors above in
the selected demo; schema validation alone does not verify UI interactions.
