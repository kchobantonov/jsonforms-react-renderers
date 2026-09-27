# Example: tuple control

**Example ID:** `tuple-control`\
**Demo entry:** **Spec: Tuple control** (`#spec-tuple-control`)\
**Domain:** work order\
**Specs covered:**

- [Portable spec §18 — Tuple control: positional array fields](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Array Add-item initialization](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Complex position summaries and dialog details](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §13 — The tuple control](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

Eight positional arrays from one project record. The point of the example is
that **a tuple is one value with several editors, not several values** — which
is why no declared position can be added, removed or reordered, and why an edit
at one position can change another.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Eight positional (`items: [...]`) arrays, one uniform fixed-length array, and one array that asks for a tuple it cannot be. |
| `uischema.json` | `variant`, `vertical`, `showBorder`, `detail`, the dialog action labels, and the deliberate misconfiguration. |
| `data.json` | One empty tuple, one with a trailing value its schema forbids, one invalid position, and two complex positions. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level per Adjustment 1. |
| `translations.json` | English and Bulgarian, including the two per-position label keys and the `{position}` fallback. |
| `uischemas.ts` | Registry entries for the complex positions, one per entry shape. **`.ts`, not `.json`** — see below. |
| `index.ts` | Registers the example with the demo. |

### Why `uischemas.ts` and not `uischemas.json`

A registry entry carries a **tester function**, and the UI-schema registry is
host code rather than part of the serialized UI model: §18 says to "use the
existing ranked UI-schema registry to select a position-specific Control", which
is a host mechanism. A UI schema is JSON; a registry is not.

One consequence is visible in the demo: the **UI Schemas** tab shows these
entries without their testers, because `JSON.stringify` cannot carry a function.
Applying that tab leaves entries that match nothing, and the two complex
positions fall back to a generated form — the summaries stay, the tailored
dialog does not. The renderer ignores entries with no callable tester rather
than crashing on one.

## What the form contains

```text
Project record
  Drop-off coordinates   positional, showBorder: false   -> [45.52, -122.68]
  Crate dimensions       uniform + variant, vertical     -> [120, 80, -5]   (invalid)
  Survey point           positional, options.detail      -> Group, Longitude before Latitude
  ---
  Order line             positional, empty               -> []
  Inspection record      typed tail, min 2 / max 4       -> [..., ..., "Call the yard..."]
  Supplier reference      open tail, max 3                -> ["Cascade Supplies", 42]
  ---
  Pickup contact         object + array positions        -> dialogs
  Handoff contacts       four complex positions          -> one per registry-entry shape
  Imported assignment     closed tail, three values       -> [..., ..., "Imported..."]  (invalid)
  Asked for a tuple      uniform, no equal bounds        -> configuration diagnostic
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors — deliberately one of each placement §18 distinguishes:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/dimensions/2` | `minimum` | must be >= 0 |
| `/legacyAssignment` | `additionalItems` | must NOT have more than 2 items |

**Crate dimensions is a position error.** It appears beside Item 3 and nowhere
else; Items 1 and 2 are valid and are not marked.

**Imported assignment is an array error.** It appears beneath the tuple as a
whole. §18: "an array-level error must not automatically mark every positional
field invalid" — Leg code and Sequence both hold valid values and are shown as
such.

## Expected behaviour

**Order line is empty. Type a quantity without touching the product code.** The
data becomes `["", 4]` in a single update — not `[undefined, 4]`, not a sparse
array, and not two separate writes. This is the shared Array Add-item
initialization contract, and §18 gives this exact case as its example.

**Drop-off coordinates does the same with numbers.** Clear both, then type the
second one: the first becomes `0`, because a number's initial value is zero.
Zero is a real value here, not a placeholder.

**Clear the product code once the order line exists.** It becomes `""` and
stays at position 0. Clearing "must never splice the array, shift later
positions, or write undefined into it".

**Now clear a quantity.** Nothing is committed and a message appears beside the
field. A number has no natural empty value, and §18 forbids quietly
substituting one: "do not silently replace it with zero or null". The edit is
held as a draft until a number is entered.

**No declared position has an Add, Delete or Reorder action.** Only the
Additional items section has them, and only past the prefix.

**Inspection record has a typed tail.** Add appends an empty `Note` string.
`maxItems` is 4 and `restrict` is on, so Add stops at four values. Switch
`restrict` off in the Config tab to compare: adding is allowed and the
validator reports the excess instead.

**Supplier reference has an open tail.** Its trailing values are edited through
the mixed control, so a value's type can be changed from the editor — the data
already holds a string and a number.

**Pickup contact opens dialogs.** The closed positions show summaries: the
street for the address, the phone numbers for the list. Only the Edit icon
opens the dialog; the summary text is selectable. Opening one and cancelling
writes nothing. **Clear** empties Address to `{}` and Phone numbers to `[]`,
keeping both positions — it never produces a one-element array.

**Imported assignment keeps its extra value.** The schema forbids a third
position, and the value is preserved with a Delete beside it rather than
truncated on load. Add stays disabled: the schema still permits no tail.

**The last control reports instead of guessing.** It asks for
`variant: "tuple"` on a uniform array with no equal bounds, which §18 calls an
unsupported configuration requiring "a configuration diagnostic rather than
guessing a positional count".

**Switch the demo to Bulgarian.** Coordinates are labelled Easting/Northing in
English and their Bulgarian equivalents; Crate dimensions falls back to
"Item 1..3" / "Елемент 1..3". Both come from the same mechanism, which is the
next point.

### Placing the positions yourself

A tuple's children come from the schema, not from UI-schema elements — which is
why there is no Add or Reorder for the declared positions. But *where* those
positions appear is presentation, and `options.detail` decides it.

**Survey point** carries one. Its three positions — Latitude, Longitude,
Elevation — are placed by:

```json
{
  "detail": {
    "type": "VerticalLayout",
    "elements": [
      {
        "type": "Group",
        "label": "Ground position",
        "elements": [
          {
            "type": "HorizontalLayout",
            "elements": [
              { "type": "Control", "scope": "#/items/1" },
              { "type": "Control", "scope": "#/items/0" }
            ]
          }
        ]
      },
      { "type": "Control", "scope": "#/items/2" }
    ]
  }
}
```

Longitude appears **before** Latitude, inside a real Group, with Elevation
below. The reversal is the point: the order on screen is the layout's, and the
order in the data is unchanged — editing the first field on screen still writes
to index 1.

**A position is addressed by index**, with `#/items/N` or the draft 2020-12
spelling `#/prefixItems/N`. Both work, because `toDataPath` already resolves
them.

**A scope may also reach inside a position.** Everything in the layout resolves
against the tuple, so one layout can mix the two freely:

| Scope | Renders |
| --- | --- |
| `#/items/1` | the whole position — with its label, summary and Edit dialog |
| `#/items/0/properties/city` | just that field, from inside position 0 |

That is one scope base, however deep you go — the same relationship
`#/properties/city` has to an object control.

**Positions stay positions.** They are still rendered by the tuple's own field
component wherever the layout puts them, so a position keeps its label, its
complex-value summary and its Edit dialog. A layout changes the arrangement,
not what a position is.

### What a registry entry may look like

A **complex** position - an object or array - shows a compact summary with an
Edit action rather than an inline form. What that summary and that dialog
contain comes from the UI-schema registry, and there are four shapes an entry
can take. `Handoff contacts` has one position for each.

| Entry | Preview | Dialog |
| --- | --- | --- |
| Control with `summary` **and** `detail` | the summary scope, resolved against the position | the `detail` |
| Control with `detail` only | localized **View details** | the `detail` |
| A layout, with no wrapping Control | localized **View details** | the layout itself |
| No matching entry | localized **View details** | a generated form |

The third is the specification's "a registry entry that is already a layout
remains usable directly as the dialog detail" — no `Control` wrapper and no
`detail` key needed.

A missing value shows the localized **Not set**, and neither previewing nor
opening a dialog creates or normalizes data.

> **A combination used to be missing here.** A Control entry carrying
> `summary` but **no** `detail` froze the browser, so it was kept out of the
> fixture. That is fixed: the cause was never tuple-specific — any registry
> entry that is a Control matching an object's schema made the object renderer
> dispatch it back to itself. Such an entry now falls back to the generated
> layout and reports `uischema.registryCycle`. See
> [Adjustment 20.7](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).
>
> The fixture still shows `summary` **with** `detail`, because that is what an
> author should write: the fallback is a recovery, not a feature.

### Leaving a position out

A layout may name only some positions; the rest are not drawn. That is useful —
and it is the one thing about `layout` that needs care, because **the data
behind a hidden position is still there and still validated.**

Left alone, that would produce a form that is invalid with nothing on screen
saying why: the position that failed is precisely the one nobody drew. The
specification rules it out — "hiding a control does not discard its underlying
errors or exempt its data from validation. Ensure eligible errors remain
discoverable without forcing hidden controls visible merely to show them."

So the tuple reports an omitted position's errors **itself**, in its own error
area, prefixed with the position's name:

```text
Longitude: must be >= 0
```

The prefix is there because the field that would have identified the message is
not on screen. A position that *is* drawn keeps reporting beside itself,
unprefixed and once — the tuple does not repeat it.

What a layout still cannot do is change the data. Hiding a position does not
remove its value, relax its constraints, or exempt it from the array's own
bounds.

**The Group is a real Group.** The layout is dispatched through the renderer
registry rather than interpreted, so it gets the ordinary Group renderer with
its collapse state and indicators — and any layout type the form already
supports works here, not a fixed list of three.

### Two `detail`s, on two different elements

`detail` here means what it means everywhere else: **a UI schema whose scopes
resolve against this control's own schema.** For an object that is
`#/properties/city`; for a tuple it is `#/items/0`.

What can confuse is that a tuple has *two* levels, and both use the name — but
they sit on different elements and never meet:

| Where | What it lays out | Scopes resolve against |
| --- | --- | --- |
| the **tuple's** Control | the positions | the tuple — `#/items/N` |
| a **position's** Control, from the registry | that position's dialog | the position's value — `#/properties/city` |

So a form can carry both at once, as the tuple test does: the tuple's `detail`
puts Rank before Address, and the registry's `detail` decides what the Address
dialog contains. Your summary/detail pair on a position is untouched — summary
inline, Edit opens the detail, no summary means "View details".

A tuple-wide `detail` is **not** forwarded into positions. It used to be, which
applied one dialog layout to every complex position whatever its schema, and
crashed outright on an array-typed one. Leaving position dialogs to the
registry is what the specification recommends anyway: "omit it when selecting
individual registry entries".

**Not `options.layout`.** The specification reserves that for how a control
participates in **its parent's** layout — `span`, `weight`, `width` and the
rest. A tuple sitting in a HorizontalLayout may carry it, and it has nothing to
do with the tuple's positions.

`vertical` describes the default row or column, so a `detail` supersedes it.

## Labels and internationalization

**Coordinates carry per-position `i18n` prefixes** (`coordinates.x`,
`coordinates.y`) so the two positions can have different labels. This is not
decoration. Core's path-derived translation prefix **strips array indices**, so
`coordinates.0` and `coordinates.1` resolve to the *same* key — §18 warns about
exactly this, and an explicit schema `i18n` is the remedy it prescribes.

**Crate dimensions shows the other half of that rule.** It is a uniform array:
all three positions share one schema and therefore one set of metadata, so they
cannot have distinct titles and fall back to the localized position label.
`tuple.position` takes `{position}` as a parameter rather than gluing a number
onto a translated word. Displayed numbering is one-based; the data path stays
zero-based.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| `options.detail` absent | The default row, or a column under `vertical`. |
| `options.detail` is an object with a `type` | It places the positions; `vertical` no longer applies. |
| `options.detail` is an object with no `type` | Ignored; the default arrangement is used. |
| A layout naming only some positions | Only those render. The rest are absent, not blank — and their errors are reported by the tuple, named. |
| A layout naming an index the schema does not declare | Nothing is rendered for it, and no position is invented. |
| A positional schema with no `title` and no `i18n` | The localized position label, `Item {position}`. |
| No `vertical` | A row that wraps. `true` stacks into a column. |
| No `showBorder` | Bordered. Only an explicit `false` removes it. |
| Equal `minItems`/`maxItems` and **no** `variant` | An ordinary array control. Equal bounds alone change nothing. |
| `variant: "tuple"` without equal bounds | The configuration diagnostic, not a guessed count. |
| No `additionalItems` / `items` tail | Open: trailing values are permitted and edited through the mixed control. |
| A tail of `false` with trailing data present | Preserved, with Delete offered and Add disabled. |
| A missing complex position | "Not set", and opening it creates nothing. |
| `restrict: false` | Bounds are reported by the validator instead of preventing the edit. |
| `disableAdd` / `disableRemove` | The corresponding action is disabled; the declared positions are unaffected either way. |

## Status

This is a runnable contract example. Availability of specialized controls and
options depends on the registered renderer set. Check the behaviors above in
the selected demo; schema validation alone does not verify UI interactions.
