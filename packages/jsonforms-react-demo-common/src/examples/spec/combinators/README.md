# Example: combinators, and schema conditions

**Example ID:** `combinators`\
**Demo entry:** **Spec: Combinators and schema conditions** (`#spec-combinators`)\
**Domain:** a meeting-room request\
**Specs covered:**

- [Portable spec §18 — Combinator controls: oneOf, anyOf, and allOf](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Conditional validation versus conditional presentation](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Required properties, markers, and clearing](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §14 — Shared destructive-change confirmation](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §23 — When a selection writes, and when it only displays](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

Six categories, each answering one question the combinator section raises.
The last two are the ones worth reading twice: a schema condition and a UI
rule look like the same feature and are not — and the thing a schema *can*
decide on its own is not the thing people expect.

## Files

| File | Role |
| --- | --- |
| `schema.json` | One property per presentation, two scalar compositions, a root-level `if`/`then`, and a discriminated `oneOf`. |
| `uischema.json` | A `Categorization`; the request number stays above it. No `rule` appears in the last tab, deliberately. |
| `data.json` | A valid request, so every failure below has to be produced deliberately. |
| `config.json` | `branchChange: "always"`, so the oneOf switch always asks. |
| `translations.json` | English and Bulgarian, including the composition error messages. |
| `index.ts` | Registers the example with the demo. |

## The three presentations

| Tab | Schema | What you see |
| --- | --- | --- |
| **oneOf** | `contact`, with `name` beside two branches | A dropdown of branch labels, the selected branch's form below it. |
| **anyOf** | `location`, two branches | Tabs. No selector, and nothing to confirm. |
| **allOf** | `equipment`, `name` beside two branches | No selector at all: the enclosing property, then every branch in order. |

### oneOf: switching keeps the enclosing properties

Data starts as:

```json
{ "name": "Alex Moreau", "kind": "email", "email": "alex.moreau@example.com" }
```

Switch to **Phone contact** and accept. The result is

```json
{ "name": "Alex Moreau", "kind": "phone", "phone": "" }
```

**`name` survives** because the enclosing schema declares it. **`email` does
not**, because it belongs to the branch being left. And `kind` — present in
*both* branches — is replaced, not preserved: the specification is explicit
that a shared property name is not a reason to keep a value.

Cancel and nothing moves, neither the data nor the selection.

### anyOf: navigating changes nothing

Move between **On site** and **Online** as often as you like. No prompt, no
write, no data lost — "the active tab is presentation state only". A value
carrying both a room and a platform satisfies `anyOf` perfectly well.

Which tab opens is derived from the data, but only until you pick one.
After that the choice is yours, even if your editing makes a different branch
fit.

### allOf: everything at once

`allOf` is an intersection, so there is nothing to select. **Item** comes
first as the enclosing property, then **Asset tag** and **In working order**
from the two branches, in schema order.

## Composition that describes one editor

The fourth tab holds two properties that are *not* a choice between forms:

```json
{ "type": "integer", "anyOf": [{ "maximum": 12 }, { "minimum": 50 }] }
```

Up to 12 attendees, or 50 and over. That is one number with an unusual rule,
not two things to edit — so it renders as **one input**, labelled by the outer
property, with no tabs and no dropdown.

**Neither bound reaches the input.** Putting both on would make every value
invalid; picking one would forbid values the other branch allows. They are
left to validation, which is why typing `30` produces a message rather than
being prevented.

The second is the exclusive case:

```json
{ "type": "integer", "oneOf": [{ "multipleOf": 3 }, { "multipleOf": 5 }] }
```

`6` and `10` pass. `15` fails *because it matches both* — and no branch
selector could have helped, which is exactly why there is not one.

## A schema condition is not a UI rule

The fifth tab is the point of the example.

```json
"if":   { "properties": { "urgent": { "const": true } }, "required": ["urgent"] },
"then": { "required": ["neededBy"] }
```

`neededBy` is required when the request is urgent. That is **validation**.

The same property appears twice in the tab:

- under **With a UI rule**, carrying `rule: { effect: "SHOW", … }`;
- under **Without a UI rule**, carrying nothing.

Turn **Urgent request** off and only the first disappears. The schema
condition hides nothing — "A schema condition does not itself define a
SHOW/HIDE rule. Do not infer automatic conditional layouts from validator
support for if/then/else."

They are two mechanisms that have to be authored to agree. The `required`
entry inside `if` is part of that: without it, an *absent* `urgent` would
activate `then`.

### The asterisk that is not there

With **Urgent request** on and no date entered, the form is invalid and says
so — but **the field carries no required marker**.

That is a documented limit, not an oversight. The required marker comes from
the parent schema's `required` array, and a conditional requirement never
appears there: "a simple parent-required lookup does not infer that active
requirement for the marker." The specification's instruction is to document
the gap rather than claim uniform support, and "validation errors must remain
available even when a renderer cannot infer the corresponding required
marker" — which is why the message appears regardless.

## Showing and hiding fields from the schema

The previous tab is about **validation**. This one is about **which fields
exist**, and it is the part that surprises people: a schema *can* decide that,
and `if`/`then`/`else` is not how.

```json
"appointment": {
  "type": "object",
  "properties": { "method": { "enum": ["collect", "post", "none"] } },
  "oneOf": [
    { "title": "Collect in person", "properties": { "method": { "const": "collect" }, "collectionPoint": {…} }, "required": ["method"] },
    { "title": "By post",           "properties": { "method": { "const": "post" },    "postcode": {…}, "addressLine": {…} }, "required": ["method"] },
    { "title": "Do not send",       "properties": { "method": { "const": "none" } },  "required": ["method"] }
  ]
}
```

Change **Method** and the fields change with it — a collection point, then a
postcode and an address, then nothing at all. **There is no `rule` anywhere in
that section of the UI schema**, and a test asserts as much, because the
whole claim is that the schema did it.

What does the work is the `const` discriminator: each `method` value matches
exactly one branch, so the branch that fits the value is the branch on screen.

A value left behind by a previous branch is **kept, not deleted**. Switch to
Post while a collection point is stored and the field goes away while the
value stays — only an explicit branch change through the dropdown discards
anything, and that asks first.

### Why `if`/`then`/`else` cannot do this

Three things were tried, and none of them hides a field:

| Attempt | What happens |
| --- | --- |
| A Control scoped at a property declared only inside `then` | Renders **always**, as an unschema'd input. The scope resolves against the static schema, which has no such property, so the control falls back to the scope's last segment for a label. |
| Letting JSON Forms generate the UI schema | Generation reads `properties` only. A property declared under `then` gets no control at any time. |
| `if`/`then` on its own | Changes requiredness and validation. Nothing else. |

That first row is worth remembering, because it looks like it is working: the
field appears, it accepts typing, and it is bound to a path the schema never
described.

So the two mechanisms divide cleanly:

| To change… | Use |
| --- | --- |
| whether a value is **required**, or valid | `if` / `then` / `else` in the schema |
| whether a field is **on screen** | a `oneOf` / `anyOf` branch, or a UI `rule` |

## Expected behaviour

| Action | Result |
| --- | --- |
| Switch the oneOf branch, accept | Branch data replaced, `name` kept. |
| Switch the oneOf branch, decline | Nothing changes, selection included. |
| Switch the anyOf tab | Nothing at all is written; no prompt. |
| Enter 30 attendees | "Enter up to 12 attendees, or 50 and over." |
| Enter 15 seats per table | The exclusive-match message; both multiples are the problem. |
| Turn off Urgent | The ruled control goes; the unruled one stays. |
| Turn on Urgent, clear the date | Invalid, with a message and no asterisk. |
| Change **Method** to By post | The collection point goes, a postcode and address appear. No rule involved. |
| Change **Method** to Do not send | Only the method itself remains. |

## Fallback behaviour

| Situation | Result |
| --- | --- |
| Value matches no oneOf branch | A fallback branch is displayed with the errors, and the data is kept for correction. |
| Value matches several oneOf branches | One is displayed; the error stays, because displaying one does not resolve it. |
| No value at all | The dropdown may open with nothing selected; no defaults are written by mounting. |
| A composition this renderer cannot read as one editor | The branch presentation, unchanged. Nothing is lost by falling back. |
| A value that fits no branch | The displayed branch stays put, with the errors beside it — blanking the form would hide the field the correction needs. |

## Status

**Implemented.** Four things were fixed to make this example behave as the
section describes — oneOf preservation, anyOf navigation, the single scalar
editor, and `allOf`'s enclosing properties. Each is recorded in
[adjustments §23](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

**Known limits**, both recorded in the gaps review:

- Clearing the oneOf selector through its own clear affordance still bypasses
  the preservation rule.
- `composition.multipleMatches` and `composition.noMatch` summary fallbacks
  are not implemented.
- The single input shows the composition failure as a message but does not
  take on the input's own invalid styling, because core withholds combinator
  errors from controls entirely.

Covered by `combinatorsExample.test.tsx` for this fixture and
`combinators.test.tsx` for the preservation rule and the navigation contract.
