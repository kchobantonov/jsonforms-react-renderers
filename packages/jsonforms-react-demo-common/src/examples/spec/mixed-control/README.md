# Example: mixed control

**Example ID:** `mixed-control`\
**Demo entry:** **Spec: Mixed control** (`#spec-mixed-control`)\
**Domain:** product listing attributes\
**Specs covered:**

- [Portable spec §18 — Mixed-value control and deep-structure navigation](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Tuple control](../../../../../../docs/jsonforms-extended-ui-model-spec.md) (the open tail delegates here)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §15 — An array element's type cannot be cleared](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

Eight values whose **type is data**. The point of the example is that a mixed
value carries its own type alongside its contents: the selector says which, the
editor beside it says what, and changing one is not the same as clearing the
other.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Six union-typed properties, one unconstrained schema, and a tuple with an open tail. |
| `uischema.json` | Plain controls — a union type selects this renderer with no variant. |
| `data.json` | A value of each type, an explicit `null`, an absent one, one the schema refuses, and two structured ones. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level per Adjustment 1. |
| `translations.json` | English and Bulgarian for the selector, the tree and the type error. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here registers a detail form.

## What the form contains

```text
Product listing attributes
  Label        [string, number, boolean, null]     -> "Priority handling"
  Quantity     [number, boolean, null]             -> 42          (integer under number)
  ---
  Surcharge    [string, number, boolean, null]     -> null        (explicit)
  Reference    [string, number, null]              -> absent      (no selection)
  Priority     [string, number]                    -> true        (invalid, preserved)
  ---
  Payload      [object, array, string, null]       -> object      (structure workspace)
  Anything     {} (unconstrained)                  -> object      (every type offered)
  ---
  Project phases   tuple, open tail                    -> ["Portland", 2, true]
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly one error:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/priority` | `type` | must be string,number |

Everything else is valid, including the explicit `null` and the absent value —
neither is an error, and the difference between them is not a validation
question at all.

## Expected behaviour

### The type comes from the value

**Every selector starts on the type its value already has**, without replacing
or coercing it. Label reads `string`, Payload reads `object`.

**Quantity holds `42` and reads `number`.** §18: "an integer is also admissible
under number." The selector does not offer `integer` separately here because the
schema does not list it; the value is unchanged either way.

**Choose a different type on Label.** The value is replaced by that type's
normal initial value — `0` for number, `false` for boolean. Choosing the type it
already has does nothing.

### Null, absent, and refused

**Surcharge holds JSON `null`**, and the selector reads `null`. That is a
*value*. **Reference is absent**: no type is selected, and no value editor is
drawn beside the selector — there is nothing to edit yet.

**Clear Surcharge with the × and watch the difference.** The value goes and the
field becomes like Reference. §18 keeps these apart: "selecting null writes JSON
null; clearing removes the selection/value using the shared clear-value
contract. Empty string, null, and absence remain distinct."

**Priority holds `true` where only string and number are allowed.** The value is
kept and reported, not replaced — §19. The selector shows no type, because
`boolean` is not one this field offers.

### Structured values

**Payload opens the structure workspace**: a searchable tree on the left, the
selected node's editor on the right, with a resizable splitter, breadcrumbs, and
a **Show primitives** toggle. Each node carries its own type selector, so a
property can be turned from a string into an array in place.

**Anything has no schema at all.** An unconstrained schema is admitted to this
renderer — otherwise nothing would know what editor to offer — and every JSON
type is on the menu.

### Inside an array

**Project phases is a tuple whose tail is open**, so its trailing values have no
schema of their own and are edited here. Item 2 is a number and Item 3 a
boolean, each with its own selector.

**Those selectors offer no clear.** §18: "for an array item, do not offer a
clear-type action and guard the handler against unsetting the slot." Clearing
would delete the element in place and leave a hole, which serializes to `null`
— and the same section forbids exactly that: "never create undefined values or
sparse array slots". Removing a trailing value is the **Delete** action in the
Additional items section; removing the *type* is not an operation an array
element has. See Adjustment 15.

**Switch the demo to Bulgarian.** The selector's label and placeholder, the tree
label, the rename/delete actions and the type error all translate.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| A union of two or more types | This renderer, with no variant needed. |
| A single-type schema | Its ordinary control; this renderer does not apply. |
| An unconstrained (`{}` or `true`) schema | This renderer, offering every type. |
| A `false` schema | Not admitted — it permits nothing, which is not the same as permitting anything. |
| A value outside every permitted type | Preserved and reported; no type is selected. |
| An absent value | No selection, no value editor. |
| A value at an array index | No clear-type action, in the tree and on the control alike. |

## Status

This is a runnable contract example. Availability of specialized controls and
options depends on the registered renderer set. Check the behaviors above in
the selected demo; schema validation alone does not verify UI interactions.
