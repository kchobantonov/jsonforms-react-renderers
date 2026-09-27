# Example: categorization — tabs, stepper and accordion

**Example ID:** `categorization`\
**Demo entry:** **Spec: Categorization: tabs, stepper, accordion** (`#spec-categorization`)\
**Domain:** equipment order\
**Specs covered:**

- [Portable spec §8 — Categorization](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §8 — Accordion categorization](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §8 — Container visibility and hidden children](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §10 — The Categorization navigation contract](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Container validation indicator](../../../../../../docs/jsonforms-container-validation-indicator-spec.md)

**The same four categories, rendered three ways, bound to the same data.** Type
in one and the other two follow. That is the point: which of tabs, stepper and
accordion is drawn is a presentation choice, and nothing else about the form —
navigation, visibility, validation or the section indicators — is allowed to
depend on it.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Eight properties across four subjects, with the constraints that produce the errors below. |
| `uischema.json` | One `isBusiness` control, then the same four categories as tabs, as a stepper, and as an accordion. |
| `data.json` | Deliberately invalid in two places, in two different categories. |
| `config.json` | `showUnfocusedDescription` flat; both indicators under `jsonformsExtended`, per Adjustment 1. |
| `translations.json` | English and Bulgarian, including the category labels and both indicator messages. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Business account            [ ]          <- toggles the Business category

Tabs — no variant
  Contact | Planning | Notes

Stepper — variant: "stepper", showNavButtons
  (1) Contact -> (2) Planning -> (3) Notes

Accordion — variant: "accordion", initial: "planning"
  > Contact
  v Planning        <- open, because options.initial names it
  > Notes
```

`Business` is absent from all three until the toggle is on.

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors — deliberately one in each of two different categories:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/contactName` | `minLength` | must NOT have fewer than 3 characters |
| `/itemCount` | `maximum` | must be <= 8 |

## Expected behaviour

**Both section indicators appear on every presentation.** Contact and Planning
carry an error marker, and every category holding data carries the dot. A
Category has no data scope of its own, so both are aggregated from the Controls
below it — through the one traversal shared with the Group's indicators.

Where they sit follows the **shape of the header**: at the end of the bar on an
accordion, matching a collapsible Group, and beside the label on a tab or a
step, which is just text with no trailing edge.

**The error marker survives being out of view.** The stepper shows one step at
a time and the accordion one panel; the marker on a step or header you are not
looking at is the whole reason the indicator exists.

**Toggle `Business account` on, then off.** The category appears in all three,
then disappears. If you select it and then toggle it off, the presentation falls
back to another visible category rather than leaving a stale panel — §8:
"when the selected category becomes hidden, select an available visible
category". Note also that the category is *hidden by its own rule*: a category
whose children are all hidden would still be shown, and there is no
`hideWhenEmpty`.

**The accordion opens on Planning.** `options.initial` names a direct Category
`name` — not its label, and not its index. Rename it to something that matches
nothing and the first category opens instead, with a console warning; the form
still works.

**Click the open accordion header.** It closes, and the accordion is left with
nothing open — collapse all three and you are looking at the form's outline.
This is a deliberate divergence from §8, which fixes the accordion at *exactly*
one open category; see [Adjustments §10.2](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).
Two open at once is still impossible.

**Close the accordion, then toggle `Business account`.** It stays closed.
Closing is a state you chose, so the "selected category became hidden, open
another" rule must not quietly undo it.

**Type into a category, then open another.** The first keeps its value: closed
panels stay mounted, so "closing a category preserves its data and validation".

**Switch the demo to Bulgarian.** Category labels translate, because each
carries an explicit `i18n` prefix. A Category has no scope, so without one the
lookup key would be the literal English label and the catalog entry would never
be consulted.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `variant` | Tabs. |
| `variant` the renderer set does not know | Tabs, at rank 1. An unknown variant is not an error. |
| `initial` naming no visible category | First visible category, plus a console warning. Nothing is rendered about it — it is an authoring mistake, not something the person filling in the form can act on. |
| A category with no `name` | Selection follows its position; there is no identity to preserve across a reorder. |
| Every category hidden | No open panel and no active step, rather than a stale one. |
| Accordion closed by the reader | Stays closed until they open something, through visibility changes and data edits. |
| `showNavButtons` or `vertical` on the accordion | Ignored. §8: they "do not alter this presentation". |

## Status

This is a runnable contract example. Availability of specialized controls and
options depends on the registered renderer set. Check the behaviors above in
the selected demo; schema validation alone does not verify UI interactions.
