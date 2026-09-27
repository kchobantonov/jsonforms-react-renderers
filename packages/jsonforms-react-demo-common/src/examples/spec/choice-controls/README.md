# Example: choice controls

**Example ID:** `choice-controls`\
**Demo entry:** **Spec: Choice controls** (`#spec-choice-controls`)\
**Domain:** delivery options\
**Specs covered:**

- [Portable spec §18 — Radio-choice layout and interaction](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Choice identity and existing values](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Choice and suggested-string controls](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §16 — Choice searchability](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Adjustments §7 — `vertical` orientation](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly one error:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/carrier` | `enum` | must be equal to one of the allowed values |

## Orientation

`options.vertical` is the single orientation encoding, and it means the same
thing here as on a checkbox group — see
[Adjustments §7](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

| Control | Orientation |
| --- | --- |
| Shipping speed | Absent, so horizontal, wrapping when the row runs out of space. |
| Packaging | `vertical: true`, stacked — the labels are long enough that a row reads poorly. |
| Billing department | `vertical: true` on constant-based `oneOf` choices. |

The orientation is announced with `aria-orientation`, so assistive technology
describes the arrangement actually on screen rather than a default.

## What to try

**Nothing is preselected.** `region` has no value, and mounting must not choose
the first option. Check the Data tab: the property is still absent.

**Value identity survives.** `priority` is an integer enum holding `2`. It must
stay the number `2`, never the string `"2"` — labels and widget identifiers are
presentation, not the identity of the stored value.

**Labels translate, values do not.** `department` has `i18n: "department"`, so
core looks up `department.fin`. Switch the demo to Bulgarian: the label becomes
"Финанси" while the stored value stays `"fin"`.

**An out-of-domain value is preserved.** `carrier` holds `"Rail"`, which is not
in its enum. No radio is selected, the value stays in the data, and validation
reports it. A renderer must not select the nearest option or clear the field to
make the widget look valid.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `format: "radio"` | Ordinary enum selection — a dropdown — not radios. |
| `vertical` absent | Horizontal. Only an explicit `true` stacks. |
| Two choices with the same translated label | Both still render. They are keyed by value, so distinct values stay distinct choices. |

## Status

Orientation, keying by value, and disabled handling are implemented and
covered by `test/choiceOrientation.test.tsx`.

Still missing, per §18: radio groups have **no clear affordance**, so a
selection cannot be returned to unselected through the UI; and `autocomplete`
is unimplemented, so there is no searchable presentation of these same choices.

## Searchable choices

**Origin depot and Handling team ask for `options.autocomplete: true`**, so
their dropdowns take a query. The same Origin depot appears again below without
the option, which is **this family's default**: not searchable.

That default is a choice, and section 18 allows it — "preserves the renderer
family's documented default. No universal default is imposed" — but it differs
from Material, where searching is on unless `autocomplete: false`. A document
that relies on Material's default will render a plain dropdown here. See
[Adjustments §16](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

**Search Handling team for `Oper`.** It matches **Operations**, the visible
label, not the stored constant `ops` — searching for `ops` finds nothing. The
labels come from the branch titles and go through the translator, so the same
search works in Bulgarian against the Bulgarian labels.

**Type something no choice matches.** A localized "No matching choices" appears,
and pressing Enter stores nothing: "search text is not itself a new allowed
value." For a field that *should* accept other values, the encoding is
`options.suggestion` on a plain string, not this.
