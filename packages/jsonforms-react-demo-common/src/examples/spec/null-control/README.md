# Example: null control

**Example ID:** `null-control`\
**Demo entry:** **Spec: Null control** (`#spec-null-control`)\
**Domain:** dispatch declarations\
**Specs covered:**

- [Portable spec §18 — Null control](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Shared clear-control behavior](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §7.x — Null control](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

A `{"type": "null"}` property can hold exactly one value, so the control's only
job is to say whether that value is **there**. The point of the example is that
**absent, `null` and `""` are three different things**, and only the middle one
is what this control writes.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Three `type: "null"` properties, one of them required, plus three contrast properties that are not null controls. |
| `uischema.json` | Plain controls; the null control needs no options. |
| `data.json` | One explicit `null`, one absent required value, one value the type does not admit, and an empty string beside them. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level per Adjustment 1. |
| `translations.json` | English and Bulgarian for the two keyword messages this data produces. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Dispatch declarations
  No surcharge applies            type: null            -> null        (ticked)
  No hazardous materials          type: null, required  -> absent      (invalid)
  Customs clearance not required  type: null            -> "n/a"       (invalid)
  ---
  Handling note                   type: string          -> ""
  Seal number                     type: string          -> absent
  Inspection remark               type: [string, null]  -> null        (mixed control)
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `` (the object) | `required` | must have required property 'hazardsChecked' |
| `/legacyClearance` | `type` | must be null |

The first is attached to the **object**, not to the field: an absent property
has no instance path of its own. The second is the out-of-domain value.

## Expected behaviour

**No surcharge applies is ticked, and the data holds `null`.** Untick it and the
property becomes **absent** — not `false`, and not `""`. Tick it again and
`null` comes back. That is the whole of the control: a two-state switch between
`null` and not-present.

**No hazardous materials is required and absent**, so it is unticked and
reports the missing-property error. Ticking it writes `null`, which satisfies
`required` — because the property then exists. This is the case the control is
for: a declaration that has to be *recorded*, where leaving the box untouched
must not read the same as saying no.

**Customs clearance not required holds `"n/a"`.** The box is drawn
**indeterminate** — neither ticked nor unticked — because the value is neither
`null` nor absent, and §19 forbids showing it as either. The value stays in the
data for the validator to report; the control does not quietly replace it.
Ticking the box overwrites it with `null`, which is an edit, not a normalization.

**Handling note is `""`, and that is a value.** An empty string is a note that
says nothing; it is not the same as Seal number, which nobody has filled in.
Neither is the same as `null`. Read the Data tab: `handlingNote` is present with
an empty string, `sealNumber` is not there at all.

**Inspection remark is not a null control.** Its type is `["string", "null"]`,
a union, which selects the **mixed control** — so it shows a type selector and
writes `null` only when null is the selected type. The null control is for
`type: "null"` alone, which is the distinction the two rows make side by side.

**Switch the demo to Bulgarian.** Both messages translate. The values do not.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| Value is `null` | Ticked. |
| Value is absent | Unticked. |
| Value is anything else | Indeterminate, preserved, and reported by the validator. |
| The control is disabled or read-only | The box is disabled; the value is untouched either way. |
| `type: ["string", "null"]` | Not this control — the mixed control, which offers null as one type among several. |
| A `required` `type: "null"` property | Ticking it satisfies `required`, because the property then exists with the value `null`. |

## Status

**Implemented.** The control is
[`AntdNullControlRenderer`](../../../../../jsonforms-react-antd-extended-renderers/src/renderers/AntdNullControlRenderer.tsx)
at rank 3, selected by `schema.type === 'null'`. Covered by
`test/nullControl.test.tsx` in the antd-extended renderer set.

**Worth knowing:** the control has no options at all — no `clearable`, no
`placeholder`. The spec's entry is a single row ("dedicated null
representation; no additional value-conversion options established here"), and
there is nothing to configure about a value that can only be itself.
