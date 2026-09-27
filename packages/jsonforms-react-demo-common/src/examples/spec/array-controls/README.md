# Example: array controls

**Example ID:** `array-controls`\
**Demo entry:** **Spec: Array controls** (`#spec-array-controls`)\
**Domain:** conference programme\
**Specs covered:**

- [Portable spec §18 — Array tables and detail forms: baseline versus extension](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Shared array action options](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Expandable array-item forms](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — List with detail](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Shared array item labels](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Array Add-item initialization](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Array-level errors and item summaries](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Array matching constraints: contains and matching counts](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §21 — AG Grid array control](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §6.2, §6.3, §6.4](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

One schema, five presentations, one tab each. The example exists to make the
**selection rules** visible rather than described, because that is the part
that surprises people: you do not pick an array renderer by naming it, except
when you do.

| Tab | Array | Chosen because |
| --- | --- | --- |
| **Table** | `sessions` | It nests a `room`, which would normally win the detail renderer — `options.table` overrides that. |
| **Expandable** | `speakers`, `announcements` | The items nest. **No option asks for this**; the shape decides. |
| **List with detail** | `sponsors` | `type: "ListWithDetail"`. An element type, not a Control option. |
| **AG Grid** | `tickets` | `options.variant: "ag-grid"`, naming the renderer outright. |
| **Add, remove and bounds** | `rounds`, `checklist`, `reviewers` | Three different ways of being told what may change. |

## Files

| File | Role |
| --- | --- |
| `schema.json` | Eight arrays: flat rows, nested rows, nested arrays, bounds, and a `contains`. |
| `uischema.json` | The five tabs. Plain JSON throughout — nothing here is composed in TypeScript. |
| `data.json` | Enough to fill every presentation, and one deliberate failure (no lead reviewer). |
| `config.json` | `restrict: true`, which is what turns `minItems`/`maxItems` into prevention. |
| `translations.json` | English and Bulgarian, including the tab labels. |
| `index.ts` | Registers the example. |

## Table: an explicit request beats the ranking

`sessions` items contain a nested `room` object. Ordinary selection prefers the
**expandable** presentation for that shape, so a table has to be asked for:

```json
{ "type": "Control", "scope": "#/properties/sessions",
  "options": { "table": true, "cells": { "room": { "summary": …, "detail": … } } } }
```

The nested property stays a **column**. It is not flattened and it is not
dropped: `cells.room` gives the column a one-line summary and a detail dialog.

`summary` is a **scoped control**, not a format string:

```json
"summary": { "type": "Control", "scope": "#/properties/name" }
```

For an object it resolves that one property; for an array it previews up to two
values and adds "+N more". There is no interpolation syntax — writing
`"{name} · floor {floor}"` produces the literal fallback, which is how this
example's first draft ended up displaying `{}`.

## Expandable: two controls, opposite options

The first `speakers` control takes the defaults. The second, `announcements`,
inverts every one of them, so the options are visible side by side rather than
only described:

| Option | `speakers` | `announcements` |
| --- | --- | --- |
| `initCollapsed` | default — the first item opens | `true` — everything starts closed |
| `collapseNewItems` | default — a new item opens | `true` — a new item stays closed |
| `hideAvatar` | default — the index marker shows | `true` — marker gone, index still readable |
| `hideArraySummaryValidation` | default — child summary shows | `true` — summary hidden, **validation unchanged** |
| `elementLabelProp` | `name` | `text` |
| `showSortButtons` | `true` — Move up/down | default — no reorder |

`elementLabelProp` is an item-relative **data path**, not a JSON pointer.
Headers read "Rosa Iqbal", not "Item 1".

## List with detail

Selected by `type: "ListWithDetail"`. Nothing about `sponsors`' schema asks for
it, and no Control option can produce it — which is the point of including it
beside the other four. Pick an item on the left; the form on the right edits
that item's own data path.

## AG Grid

`tickets` also nests, and the spec is explicit that this must not push an
explicitly selected grid into another presentation:

> Nested item properties must not force this explicitly selected grid into
> ListWithDetail or expandable-item presentation.

Two things about the grid are easy to get wrong when reading its output:

- **A scalar column is a JSON Forms cell, not text.** `code` renders an
  `<input>` bound to the row. Looking for the value in `textContent` finds
  nothing.
- **Sorting and filtering change the view, never the stored array.** While a
  column is sorted, row dragging is *withdrawn* rather than left to mean
  something ambiguous.

## Add, remove and bounds

Three arrays, three different reasons an action may be unavailable — which is
worth separating, because they are unrelated mechanisms.

| Array | Mechanism | Effect |
| --- | --- | --- |
| `rounds` | `minItems: 1`, `maxItems: 3` + `restrict` | Delete refused at one, Add refused at three. |
| `checklist` | `disableAdd`, `disableRemove` | Both actions gone **regardless of size**; fields stay editable. |
| `reviewers` | neither | Both actions available — the contrast that makes the other two mean something. |

In every case the **handler is guarded too**, not just the button. The spec
requires it, and a disabled button is reachable anyway through a keyboard or a
stale DOM node.

### What Add actually creates

`rounds` items are the spec's own worked example: a required `name` and an
`active` with a default. Add produces

```json
{ "active": true }
```

and the missing `name` **stays an error**. Initialization declares defaults; it
does not invent a valid item, and it is not a satisfiability solver.

### `contains`: an error that belongs to no item

`reviewers` must contain a lead:

```json
"contains": {
  "type": "object",
  "required": ["lead"],
  "properties": { "lead": { "const": true } }
}
```

The `required` matters — without it, `{ "name": "Ada" }` would count as a
match. The failure is reported **against the array**, and it is reported for an
empty array too, where there is no item to hang it on.

One thing to expect when reading the raw validator output: Ajv also reports the
`contains` subschema's own failures at **item** paths, so a single reviewer
without `lead` produces three errors, not one:

```
/reviewers/0        required   must have required property 'lead'
/reviewers          contains   must contain at least 1 valid item(s)
```

Those item-path entries are an artefact of how `contains` is evaluated, not a
claim that each reviewer is required to be a lead. Presentation should not
repeat them as if they were.

**`minContains`/`maxContains` are deliberately not used here.** They require
draft 2019-09 or later; this example validates under the demo's default
dialect, where they would be silently inert — which would make the example
teach something false.

## Expected behaviour

| Action | Result |
| --- | --- |
| Open **Table** | Sessions in rows; Room is a column showing "Aurora", not an inline form. |
| Click a Room cell | A detail dialog, not an expanding row. |
| Open **Expandable** | Speakers with the first item open; announcements all closed. |
| Edit a speaker's name | The panel header follows it. |
| Open **AG Grid**, sort a column | The order on screen changes; the stored array does not, and the drag handle withdraws. |
| Press Delete on the only round | Refused — the button is disabled and the handler declines. |
| Press Add on rounds three times | Two items are added as `{"active": true}`, then Add is refused. |
| Look at the opening checklist | No Add, no Delete, every field still editable. |
| Clear the lead reviewer | An array-level error appears on the array, not on a row. |

## Status

**Implemented** for all five presentations. Known divergences, from
[gaps §6.2–6.4](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md):

- **`restrict` is not honoured by the table presentation** — only
  `disableAdd`/`disableRemove` are. `ArrayLayout` does implement it, so the two
  presentations disagree. This example puts its bounds on an expandable array
  for that reason; moving `rounds` to a table would make the demonstration
  false.
- **`hideArraySummaryValidation` is missing from the table** and from
  ListWithDetail; it works on the expandable form, which is where the example
  shows it.
- **Table column headers are not translated** — `title ?? startCase(prop)`,
  with no translator.
- **Expansion is keyed by array index**, so reordering transfers an open panel
  to whatever item now occupies that position.
- **Item labels are not choice-aware** — `elementLabelProp` resolves the raw
  value, so an `eng` would display as `eng` rather than "Engineering". This
  example labels items by `name` and `text`, which are plain strings, so it
  does not depend on the missing behaviour.
- **ListWithDetail** is missing `showSortButtons`, `restrict`,
  `hideArraySummaryValidation` and delete confirmation.

Building this example produced one fix: the array validation icon rendered only
an error **count**, with the messages in a hover-only tooltip and no accessible
name — a screen reader announced "1". The spec asks for an *accessible*
explanation of array-level errors, so the icon is now named with the messages,
the same way the cell feedback icon already was.

Covered by `arrayControlsExample.test.tsx` for this fixture — each tab
selected in turn, and the bounds asserted through the handler rather than the
button alone — and by `arrayLevelErrors.test.tsx` for the `contains` error and
its accessible name.
