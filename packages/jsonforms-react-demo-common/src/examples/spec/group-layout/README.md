# Example: group layout

**Example ID:** `group-layout`\
**Demo entry:** **Spec: Group layout** (`#spec-group-layout`)\
**Domain:** carrier record\
**Specs covered:**

- [Portable spec §8 — Group](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §6 — Layout types and semantics](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §3.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

A Group is the plainest container there is — "an ordinary Group presents
related controls as a labelled section" — and three options make it more than
that. Four groups, one per combination worth seeing.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Nine plain properties; the interest is in the arrangement, not the data. |
| `uischema.json` | Four groups: plain, collapsible, collapsed, and one that asks to be collapsed without being collapsible. |
| `data.json` | Half the properties filled, so the data indicator has something to distinguish. |
| `config.json` | `showUnfocusedDescription`. |
| `translations.json` | English and Bulgarian, including the indicator's accessible label. |
| `index.ts` | Registers the example with the demo. |

## What the form contains

```text
Carrier record
  Identity            plain group              -> a labelled section, always open
  Contact             collapsible              -> open, and marked as holding data
    Additional details  collapsible, collapsed -> nested, closed, also holds data
  Insurance           collapsible, collapsed   -> closed, and holds nothing
  Audit               collapsed, NOT collapsible -> stays open; collapsed is ignored
```

## Expected behaviour

### A plain group is just a section

**Identity** has no options at all. It draws a labelled section with no
disclosure control, and its contents are always present. Its default visual
treatment "belongs to the renderer family and does not require a variant" —
there is no `variant: "card"` to author.

Note it also contains a `HorizontalLayout`, so a group composes with the
sizing model rather than replacing it.

### `collapsible` adds a disclosure control

**Contact** is collapsible and opens by default, because `collapsed` defaults
to false. The header is "an accessible disclosure control", so it can be
reached and operated from the keyboard.

### `collapsed` initializes, and only when collapsible

**Insurance** starts closed. **Audit** asks for `collapsed: true` but never
asks for `collapsible`, so the option is ignored and the group stays an
ordinary open section — "ignored unless collapsible is true".

Note that a closed group's children are still in the document; the disclosure
hides them. Validation and data are unaffected by expansion, which is the point
of "collapsing must not clear data or suppress validation".

### `showDataIndicator` marks the groups holding something

**Contact** and **Additional details** are marked; **Insurance** is not,
because none of its properties has a value. That asymmetry is what makes the
indicator worth anything — an indicator on everything says nothing.

The marker carries a localized accessible label, "Contains data", rather than
relying on the visual dot alone. **Switch the demo to Bulgarian** and it
translates with everything else.

### Groups nest

**Additional details** sits inside **Contact**, collapsible inside
collapsible, and each keeps its own state: opening the outer one does not open
the inner.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No options | A labelled section, always open, with no disclosure control. |
| `collapsible: true`, no `collapsed` | Collapsible, open. |
| `collapsed: true` without `collapsible` | Ignored. |
| `collapsed` set to a non-boolean | Ignored; the static fallback applies. |
| `showDataIndicator: true`, no descendant holds data | No marker. |
| A collapsed group | Children remain in the document, validated as normal. |

## Not covered: `collapsed` driven from data

§8's worked example binds `collapsed` through `$dynamic`:

```json
"$dynamic": { "options": { "collapsed": { "bind": "data.hideDetails" } } }
```

`$dynamic` is **unimplemented** in this renderer set — it is the largest
single gap in the coverage review,
[§3.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md) —
so the fixture uses static `collapsed` only.

Two consequences worth knowing when it is implemented:

- expansion must **synchronize** when the effective boolean changes, while
  leaving local header clicks alone in between;
- `$dynamic` is "one-way resolution, not a writable binding" — reopening a
  group locally must not write back to the bound property.

## Status

**Implemented** for the three static options. The data indicator's tooltip and
accessible label are covered by `groupDataIndicatorTooltip.test.tsx`; this
fixture is covered by `groupLayoutExample.test.tsx`.
