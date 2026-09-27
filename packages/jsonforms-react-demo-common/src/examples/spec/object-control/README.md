# Example: object control

**Example ID:** `object-control`\
**Demo entry:** **Spec: Object control** (`#spec-object-control`)\
**Domain:** consignee profile\
**Specs covered:**

- [Portable spec §18 — Object controls and additional-property editing](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Object-level errors and errors without rendered targets](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §6.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

An object control's whole job is to produce **other** controls, so there are
only two questions worth asking of it: where the nested form came from, and
what happens to an error that belongs to the object rather than to any field
inside it.

Neither has a single answer. The first has three sources and a precedence
order with one rule that surprises people; the second has three outcomes
depending on where core maps the error.

> **Dynamic properties are a separate example.** Keys that are data rather than
> schema — `additionalProperties`, `patternProperties`, `propertyNames`,
> renaming, the empty-name policy — are covered in
> [additional-properties](../additional-properties/README.md). This example is
> about objects whose properties the schema declares.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Ten objects: seven that differ in where their layout comes from, three that fail in ways no single field can explain. |
| `uischema.json` | Five controls carry `options.detail`, in four different forms; the rest take what they are given. |
| `uischemas.ts` | Registry entries for `address` and `handover`. A **`.ts` file**, because a registry entry carries a tester function and a function is not JSON. The `handover` entry is never used, on purpose. |
| `data.json` | Two required properties missing, one empty object, one undeclared key, one unmet dependency. The objects that demonstrate layout are all valid, so the error table stays about errors. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level per Adjustment 1. |
| `translations.json` | English and Bulgarian, including messages for the three object-level failures. |
| `index.ts` | Registers the example with the demo. |

## What the form contains

```text
Consignee profile
  Identity      generated layout        -> legalName required and missing
  Contact       options.detail          -> Phone before Email, reversing the schema
  Address       registered UI schema    -> Street/Postcode, City, then...
    Coordinates   nested object         -> ...an object inside the nested form
  Handover      detail: "GENERATE"      -> beats its own registry entry
  ---
  Schedule      detail: Categorization  -> a detail is any layout
  Notes         detail with no "type"   -> silently ignored
  ---
  Compliance    detail: Group(Group)    -> outer label dropped, inner kept
  ---
  Preferences   minProperties: 1, {}    -> fails on the object
  Routing       additionalProperties: false, holds "legacyZone"
  Billing       dependencies, PO without a cost centre
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data is
**invalid**, with five errors:

| Keyword | Path | Belongs to |
| --- | --- | --- |
| `required` | `/identity` | the missing `legalName` |
| `required` | `/address` | the missing `city` |
| `minProperties` | `/preferences` | **the object** |
| `additionalProperties` | `/routing` | **the object** |
| `dependencies` | `/billing` | **the object** |

Two field errors and three object errors. The split is the point.

## Expected behaviour

### Where the layout comes from

**Identity** has neither `options.detail` nor a registry entry, so the layout is
**generated** from the schema — which means schema property order: Legal name,
then Trading name.

**Contact** carries `options.detail` on its control, and that detail puts
**Phone before Email** — the reverse of the schema's order. The reversal is
what proves the detail was used, and that its scopes (`#/properties/phone`)
resolved against *the object*, not the root.

**Address** carries no detail. Its layout comes from the **UI-schema registry**,
whose tester matches on the schema's title, and puts Street and Postcode on one
row above City. The practical difference from `options.detail` is reach:
`options.detail` is part of the serialized UI model and travels with the form,
while a registry entry is host code that applies to every matching object
wherever it appears.

**Coordinates** is an object inside Address, dispatched at its own data path
from the registered layout — nesting is just dispatch, all the way down.

**Handover** has a registry entry *and* `detail: "GENERATE"` on its control.
GENERATE wins, so the layout is generated in schema order — Contact name,
Window, Gate code. The registry entry reverses that order precisely so the
difference is visible: had it been used, Gate code would come first.

This is the precedence rule that catches people out. `"GENERATE"` is not the
same as having no detail — it is an instruction, and it **outranks the
registry**. Resolution runs:

1. `options.detail` — `"GENERATE"`, or an object with a `type`
2. a matching registry entry
3. a layout generated from the schema

### A detail is any layout, and need not be complete

**Schedule**'s detail is a `Categorization`, and renders as tabs. Anything that
dispatches works; a detail is not restricted to rows of controls.

A detail also need not name every property. One naming a single control renders
that control and nothing else — the rest are simply not shown, with no error
and no leftover.

### A detail object with no `type` is not a detail

**Notes** carries this, and it does nothing at all:

```json
{ "options": { "detail": { "elements": [ … ] } } }
```

`findUISchema` accepts a detail object only when its `type` is a string, so
this one is skipped in silence and the generated layout is used instead —
which is why **both** of Notes's properties appear, though the detail names
one.

Nothing warns you. The form renders, and it ignores what you wrote. If a detail
appears to have no effect, this is the first thing to check.

### The outermost element of a detail is the object's own frame

**Compliance**'s detail is a `Group` labelled *"Dropped, because it is
outermost"*, wrapping a second `Group` labelled *"Kept, because it is inside"*.
Only the second label appears.

The object renderer unwraps the outermost element, because that position is the
frame **it** contributes: the control is already placed by whatever parent
layout holds it, and a Group there would nest a box inside a box — at every
level of nesting. Everything inside is yours and is untouched.

The rule applies the same way whichever of the three sources supplied the
detail, so the outer frame is the renderer's call regardless of authorship.

### So a nested object shows no title

That unwrapping has a consequence worth stating plainly: the generated fallback
for a nested object *is* a labelled `Group`, so removing the outer frame
removes the only place the object's own title would have appeared. **Identity**,
**Contact** and **Address** label their fields and not themselves.

That is presentation, not a rule — the specification says to "dispatch a nested
form at the object's data path" and leaves framing alone, explicitly declining
to "require a particular card library". Upstream's material renderers keep the
Group; this set does not, and gets flat nested objects instead of boxes within
boxes.

It is not a dead end either. **Compliance** shows the way to a titled section:
put the `Group` one level in, where it is content rather than frame.

### Errors that have a control to land on

**Legal name** and **City** are both marked and both explain themselves. City's
is two levels down, inside a registered layout, which changes nothing: the
error is mapped to `address.city` and that control displays it.

### Errors that belong to the object

Here the answer depends on **where core maps the error**, and the three cases
diverge:

| Error | Mapped to | Shown? |
| --- | --- | --- |
| `dependencies` on Billing | `billing.costCentre` | **Yes** — on Cost centre |
| `additionalProperties` on Routing | `routing.legacyZone` | No |
| `minProperties` on Preferences | `preferences` | No |

**Billing works, and not by design.** Core maps a `dependencies` failure onto
the property that is *missing*, and that property has a control, so the message
lands on Cost centre — not on Purchase order, which is what triggered it. The
object renderer did nothing; the mapping happened to be lucky.

**Routing is the specification's own illustration of the gap.** The error is
mapped to `routing.legacyZone`, and that key is even rendered — the
dynamic-property editor shows it, because the data has it. But that editor does
not display errors, so the message has a path and still no home. In the
specification's words: "Core's web error-path mapping associates that failure
with the offending property, but that association alone does not create a place
to display it."

**Preferences has nowhere at all.** `minProperties` fails on the object, where
no control exists. `ObjectRenderer` dispatches a nested form and the
dynamic-property editor and renders no errors of its own, so nothing is shown.

### What is *not* done wrong

The specification is more concerned with the damage than with the message:

> Provide an object-level explanation instead of mislabeling `name` as required
> or automatically creating a value.

Both halves of that are honoured. **Language** and **Timezone** are not marked
as required, and no value is invented to satisfy `minProperties` — Preferences
stays `{}`. **`legacyZone` keeps its value** rather than being quietly deleted
to make the error go away: "do not silently delete, rename, or rewrite invalid
data merely to remove an error without a rendered target."

So the failure mode here is a missing message, not corrupted data, which is the
better of the two ways to fall short.

### Validity is unaffected

All five errors count. The form is invalid, and a host reading the error
collection gets all five whether or not any of them is on screen.

### Localization

**Switch the demo to Bulgarian.** Every message that *is* shown translates —
including the dependency message on Cost centre. The two that are not shown
have translations waiting in `translations.json` for when they have somewhere
to go.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `detail`, nothing registered | A layout generated from the schema, in property order. |
| `options.detail` is an object with a `type` | It wins; scopes are relative to the object. |
| `options.detail` is `"GENERATE"` | A generated layout, **outranking** a matching registry entry. |
| `options.detail` is an object with no `type` | Ignored in silence; resolution continues to the registry, then to generation. |
| `options.detail` names only some properties | Only those render. The rest are absent, not empty. |
| A registry entry matches | Used when the control has no usable `detail` of its own. |
| The detail's outermost element is a `Group` | Unwrapped — that position is the object control's own frame. |
| A `Group` deeper inside the detail | Kept, with its label. |
| Object nested in object | Dispatched at its own data path, with no frame of its own. |
| An error core maps onto a property with a control | Displayed there. |
| An error core maps onto a property with no control | Not displayed. |
| An error at the object's own path | Not displayed. |
| Any of the above | Counts towards validity, and the data is left exactly as it is. |

## Status

**Partial**, and the shortfall is one specific thing.

**Implemented:** object dispatch, `options.detail` in both its forms with the
documented precedence, registered detail UI schemas, arbitrary nesting, and
required-property errors on the controls that carry them.

**Missing:** an object-level explanation near the object editor, for errors
core cannot map onto a control that displays them. Recorded in
[§6.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md);
`ObjectRenderer` renders no `errors` prop at all, which is where the work would
start.

Covered by `test/objectControl.test.tsx`, which pins both halves — the three
layout sources and the nesting, and the exact set of errors that reach the
screen today. When the gap is closed, the last group is the one to change.
