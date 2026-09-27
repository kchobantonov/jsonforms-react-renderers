# Example: array choices and tokens

**Example ID:** `array-choices`\
**Demo entry:** **Spec: Array choices and tokens** (`#spec-array-choices`)\
**Domain:** notification preferences\
**Specs covered:**

- [Portable spec §18 — Array choices and tokens](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Multi-choice identity, applicability, and safe removal](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §15 — restrict and mutation constraints](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §16 — Choice searchability and array-choice variants](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Gaps §2.2](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

One array-of-choices shape, three presentations. The point of the example is
that **the variant changes the widget and nothing else**: the same schema, the
same stored values, the same bounds. What genuinely differs is whether the
schema narrows the items — because that, not an option, decides whether entry
is free.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Eight arrays: enum items, constant-based `oneOf` items, free strings, a repeatable array without `uniqueItems`, and one with bounds. |
| `uischema.json` | The same shapes with no variant, `variant: "multi-select"`, and `variant: "chips"`. |
| `data.json` | A repeated token, and a value the schema does not offer. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level per Adjustment 1. |
| `translations.json` | English and Bulgarian, including the branch labels, the empty-search message and the chips hint. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Notification preferences
  Notification channels   enum items, no variant       -> checkbox group
  Alert channels          same shape, multi-select     -> compact selection
  Notified teams          oneOf const items            -> labels from titles
  ---
  Catalog tags            free strings, chips          -> open token entry
  Scan codes              no uniqueItems, chips        -> "A-117" twice
  Printed labels          enum items, chips            -> tokens from a fixed list
  ---
  Bonded warehouses       chips, minItems 2 / max 3    -> one value  (invalid)
  Imported preferences    multi-select                 -> "Carrier pigeon"  (invalid)
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/bonded` | `minItems` | must NOT have fewer than 2 items |
| `/imported/1` | `enum` | must be equal to one of the allowed values |

The first is on the **array**, the second on the **item** — which is where each
belongs, and which is why the bounds error appears under the control while the
enum error points at one token.

**Scan codes is valid.** `["A-117", "A-117", "B-204"]` has no `uniqueItems`, so
the repeat is legal data, not a mistake to be tidied away.

## Expected behaviour

### One shape, three presentations

**Notification channels and Alert channels have identical schemas.** The first
has no variant and gets the automatic checkbox group; the second asks for
`multi-select` and gets a compact selector. §18: "explicit selection takes
precedence over automatic checkboxes", which is why the variant wins over the
automatic match.

**Notified teams stores constants and shows titles.** Select Operations and the
data holds `"ops"`. "Preserve choice value types and constant titles rather than
storing display labels."

### Chips, and what makes entry free

**Catalog tags takes anything.** Its items are plain strings, so the adder is a
text box: type a value and press Enter. Nothing is written while you type — a
partial token "remains a local draft until explicitly committed".

**Printed labels takes only the three it offers**, because its items carry an
`enum`. Same variant, different adder. §18: "the schema determines whether entry
is free or choice-limited; no separate free-entry option is introduced."

**Item constraints still apply to each stored value.** Catalog tags requires
`minLength: 2`, so a one-character token is reported — "item constraints apply
to each stored value, not the joined display text".

### Repeats and removal

**Scan codes holds `A-117` twice, and shows two tokens.** Close the second one
and the first stays. That is the whole reason the tokens are drawn here rather
than by a tag-mode select: a select keys its tags by value, so two equal tokens
are one entry to it and closing either removes both. §18 requires the opposite —
"remove the selected occurrence when duplicates exist".

**Catalog tags has `uniqueItems`, so it refuses a repeat** rather than accepting
one and quietly collapsing it. Neither control ever deduplicates what was
already there.

### Bounds

**Bonded warehouses wants between two and three**, and has one, so it reports
`minItems` and its existing token cannot be removed while `restrict` is on. Add
a third and the adder stops. Switch `restrict` off in the Config tab to compare:
adding and removing are allowed and the validator reports the breach instead.

### Values the schema does not offer

**Imported preferences holds `"Carrier pigeon"`.** It is shown as a selected
entry of its own and kept — §19, and "do not silently deduplicate, coerce, or
discard invalid incoming values". Removing it is an edit; nothing removes it for
you.

**Switch the demo to Bulgarian.** The team labels, the empty-search message and
the chips hint translate. The stored constants and free tokens do not: they are
data.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No variant on a unique enum array | The automatic checkbox group, unchanged. |
| `variant: "multi-select"` | Compact multiple selection. Requires `uniqueItems` and finite string choices. |
| `variant: "chips"` | Tokens. `uniqueItems` is optional; without it, repeats are permitted. |
| Chips over items with an `enum` or constant `oneOf` | A chooser instead of a text box. |
| Either variant over numeric or structured constants | **Not matched** — these renderers compare values and render labels as text, which is honest for strings only, so the shape is left to a renderer that can edit it. |
| `restrict: false` | Bounds are reported rather than enforced while editing. |
| A stored value outside the choices | Kept, shown, and reported. |
| A disabled or read-only control | No additions and no removals. |

## Status

**Implemented.** Both variants are in
[`MultiSelectControl.tsx`](../../../../../jsonforms-react-antd-renderers/src/complex/MultiSelectControl.tsx)
and
[`ChipsControl.tsx`](../../../../../jsonforms-react-antd-renderers/src/complex/ChipsControl.tsx),
with the shared identity and mutation rules in
[`arrayChoices.ts`](../../../../../jsonforms-react-antd-renderers/src/util/arrayChoices.ts).
Both rank 6, above the automatic checkbox group at 5. Covered by
`test/arrayChoices.test.tsx`.

**Deliberately not matched:** numeric enums and structured (`object`/`array`)
constants. §18 requires a tester to "match only choice value types that its
selection, addition, and removal logic supports", and recognizing a `const`
branch "is not by itself evidence of support for object or array constants".
Leaving them unmatched keeps them eligible for a renderer that can edit them
properly.

**Not implemented:** `vertical` on the automatic checkbox group, and delete
confirmation. See gaps
[§2.2](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md).
