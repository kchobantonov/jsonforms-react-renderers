# Example: number and integer controls

**Example ID:** `numeric-controls`\
**Demo entry:** **Spec: Number and integer controls** (`#spec-numeric-controls`)\
**Domain:** warehouse stock line\
**Specs covered:**

- [Portable spec §18 — Number and integer controls](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Numeric parsing and representation limits](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Slider control](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §4.3 and §4.4](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

The three go together: they are the same value seen through three editors, and
the parsing rules apply to all of them.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Integer and number properties with bounds, `multipleOf`, an exclusive bound, a negative range and a slider-eligible property. |
| `uischema.json` | The same values through plain entry, `options.step` and `options.slider`. |
| `data.json` | Deliberately invalid in two places, and valid-but-easily-mishandled in several others. |
| `config.json` | `restrict: true` and `showUnfocusedDescription`, both top-level per Adjustment 1. |
| `translations.json` | English and Bulgarian keyword error messages. |
| `index.ts` | Registers the example with the demo. |

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/palletCount` | `multipleOf` | must be multiple of 2 |
| `/weightKg` | `exclusiveMinimum` | must be > 0 |

Everything else is valid, including the values most likely to be mishandled.

## What to try

**Type `1.9` into Quantity.** It must stay `1.9` and report "must be integer".
It must not become `1`. `parseInt('1.9')` is `1`, which silently commits a
different number from the one on screen - the specification names this case,
and it was the behaviour here until recently.

**Type `1e3` into Quantity.** It must become `1000`, not `1`. The spec: an
integer editor may refuse exponent syntax, "but it must not interpret 1e3 as
1".

**Clear a field.** It must become empty, not `0`. `Number('')` is `0`, so a
parser that does not test emptiness first turns clearing into committing a
zero.

**Zero and negative values are real data.** Quantity is `0`, weight is `0`,
discount is `0` and tolerance is `-2.5`. None is an empty field, and none
should be replaced by a default or a placeholder. The slider shows `0` rather
than jumping to its `default` of `10` - the truthiness fallback the spec
forbids, and the bug this example was written to catch.

**Switch the demo to Bulgarian.** The error messages carry `{limit}` and
`{multipleOf}` placeholders filled from `error.params`. Core does no
interpolation of its own - the spec puts that on the translator - so a catalog
message renders literally unless the translator substitutes.

## What this example currently exposes as unimplemented

It is a fixture for work still to do as much as a demonstration:

| Behaviour | Spec | Status |
| --- | --- | --- |
| `options.step` on Pallets and Unit price | `step` → `multipleOf` → `0.1`/`1` | **Ignored.** Number hard-codes `step={0.1}`; integer passes no step at all. |
| `minimum`/`maximum` guarding entry under `restrict` | §15 | **Missing.** No bounds reach `InputNumber`. |
| `exclusiveMinimum` on Weight | §18 | **Missing** from input handling; validation reports it. |
| Slider showing `0` rather than the default | §18 Slider | **Fixed.** A committed `0` keeps the thumb at zero; it used to jump to the default of 10 while the data said 0. |
| Slider marking an unset value as "Not set" | §18 Slider | **Partial.** `aria-valuetext="Not set"` is set, but there is no visible marking. |
| Precision loss on `9007199254740993` | §18 parsing | **Not detectable here.** antd converts the text to a JavaScript number before the renderer sees it; catching this needs `stringMode`. |

The parsing rules above **are** implemented — see
`toCommittableNumber` in the antd renderer set and
`test/numericParsing.test.ts`.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `options.step` | Falls back to the renderer default, not to the schema's `multipleOf` (a known gap). |
| `slider: true` on a property without `minimum`/`maximum`/`default` | The range tester rejects it and ordinary numeric entry is used. |
| Unparseable entry | Nothing is committed; the previous value stands. `NaN` and `±Infinity` are never written to form data. |

## Status

Parsing and the slider's zero handling are fixed and tested. Stepping and
input-time bounds are not, and this example is the fixture to test them
against.
