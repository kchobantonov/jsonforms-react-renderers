# Example: destructive-change confirmation

**Example ID:** `destructive-confirmation`\
**Demo entry:** **Spec: Destructive-change confirmation** (`#spec-destructive-confirmation`)\
**Domain:** dispatch cleanup\
**Specs covered:**

- [Portable spec §14 — Shared destructive-change confirmation](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §15 — Readonly, restrict and mutation constraints](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §17 — The confirmation policy](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Adjustments §1 — configuration namespacing](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Gaps §3.3](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

**Every** renderer that discards data, under **one** policy. The point of the
example is that confirmation is not a property of a widget: the same `always`
applies to a table row, a grid selection, a tree node and a dynamic property,
and one config entry changes all of them.

## Files

| File | Role |
| --- | --- |
| `schema.json` | A dynamic-property object, four array shapes, two mixed values and a `oneOf`. |
| `uischema.json` | Picks the array renderer per property, and carries one element-level `confirmation` override to show it beating config. |
| `data.json` | Every control holds something, so every prompt is reachable without building a value first. |
| `config.json` | `jsonformsExtended.confirmation` — a global `always` with `complex` restored for mixed type changes, which is §14's own worked example. |
| `translations.json` | English and Bulgarian for all three dialogs. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: the array layout and the list with detail generate their
own detail forms.

## Every covered operation, and where to find it

| Operation | Catalog id | Control | Fallback |
| --- | --- | --- | --- |
| Dynamic property delete | `additionalProperties` | **Dispatch notes** | `always` |
| Array table row delete | `arrayTable` | **Order lines** | `always` |
| Array layout item delete | `arrayLayout` | **Route stops** | `always` |
| List-with-detail item delete | `listWithDetail` | **Drivers** | `always` |
| AG Grid selected-row delete | `agGrid` | **Charges** | `always` |
| Mixed tree node delete | `mixed` | **Payload**, in the structure tree | `always` |
| Mixed type change | `mixed` | **Payload** / **Reference** | `complex` |
| `oneOf` branch change | `oneOf` | **Contact** | `always` |
| `oneOf` clear | `oneOf` | **Contact** | `always` |

**Scratch lines** is the tenth control: the same table as Order lines, with
`options.confirmation: { delete: "never" }` on the element.

That is the whole of §14's list. The only thing deliberately absent is the
`anyOf` tab change, which the gap review says should not mutate data at all;
fixing that is a separate change rather than a confirmation.

## What the form contains

```text
Dispatch cleanup          config: default "always", mixed.typeChange "complex"
  Dispatch notes     additionalProperties   -> delete asks
  Order lines        array table            -> row delete asks
  Scratch lines      array table            -> options.confirmation.delete "never"
  ---
  Route stops        array layout           -> item delete asks
  Drivers            list with detail       -> item delete asks
  Charges            AG Grid                -> removing the selection asks, once
  ---
  Payload            mixed, nested object   -> type change asks (complex)
                                            -> tree Delete asks (always)
  Reference          mixed, holds a string  -> type change does not ask
  ---
  Contact            oneOf, branch chosen   -> branch change asks, clearing asks
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data is
**valid** — no errors.

That is deliberate. This example is about an interaction, not about validation,
and confirmation is "separate from mutation permission and validation". Invalid
data here would suggest the two are connected.

## Expected behaviour

### The policy is shared

**Delete a dispatch note, then a row of Order lines, then a Route stop, then a
Driver.** All four ask, because all four fall under the same `always`. Before
this policy existed only the table asked — not by design, but because each
renderer had decided on its own.

**Cancel one.** Nothing changes: not the data, not the selection, not which
sections are open. Confirming performs the action once.

**Select one Driver, then press Delete on the other.** The detail pane keeps
showing the driver you were reading — pressing a row's action does not select
that row. Cancel, and you are still on the same one. The same applies to Route
stops, where a panel's Delete does not expand or collapse it. This is easy to
get wrong, because the *data* ends up correct either way; only the selection
differs, and only when the row being deleted is not the row being read. See
Adjustment 17.7.

### One operation asks once

**Select two or three rows of Charges and remove them.** One prompt covers the
batch, not one per row. Under `complex` it would appear if *any* selected row
held something complex.

**Delete `route` in the Payload tree** — a node that has children. One prompt.
The tree used to raise its own "and all of its nested content?" modal here *as
well as* the shared one, and that second modal could not be switched off by any
policy. See Adjustment 17.6.

### Config sets it, an element overrides it

**Scratch lines deletes without asking.** Its control carries
`options.confirmation: { delete: "never" }`, which beats the global `always`.
That is the first step of §14's resolution order, and the only way to make one
control quieter than the rest.

**Switch the global default.** In the Config tab, change
`jsonformsExtended.confirmation.default` to `"never"` and every prompt goes —
except that Payload's *type change* keeps its own entry, because
`renderers.mixed.typeChange` is a more specific step. Its tree Delete does go
quiet, since that operation is `delete`, not `typeChange`.

### `complex` asks about the old value

Payload is prepopulated with one of each kind, so this can be tried without
building anything first:

| Child | Value | Type change asks? |
| --- | --- | --- |
| `carrier` | `"Cascade Supplies"` | No — a string is not complex |
| `route` | `{ origin, destination }` | Yes — a nonempty object |
| `legs` | `["PDX-SLE", "SLE-EUG"]` | Yes — a nonempty array |
| `blank` | `{}` | No — an empty container is a value, but not a complex one |

**Change Payload's own type.** It holds an object with properties, so the
prompt appears. **Change Reference's type.** It holds a string, so it does not
— even though the destination might be an object.

That asymmetry is the rule: "inspect the old value, not the destination type".
`complex` is about what would be *lost*.

**Tree Delete does not follow `complex`.** Deleting `blank` asks, even though
`{}` is not complex, because Delete falls back to `always`. `complex` is the
mixed *type change* exception only.

### The mixed payload takes objects and arrays

Payload's `additionalProperties` and `items` are themselves the full type
union, so **Add property** offers every JSON type, not just text. Add an object,
give it a property, then change its type — that is the `complex` path
end-to-end. Add an empty one and change its type and nothing asks.

### Clearing counts

**Clear Contact's branch.** It asks, because "clearing a oneOf selection follows
branchChange". Clearing a mixed type follows `typeChange` the same way.

**Re-select the branch already in use.** Nothing happens and nothing asks:
"selecting the already selected type/branch" is not a change. The same is true
of re-selecting Payload's current type.

### What confirmation is not

**It never grants permission.** Turn on Read-Only in the settings panel and no
delete is offered at all — there is nothing to confirm. `restrict`,
`minItems`, `readonly` and schema constraints all still apply, and a prompt
never appears for an action the form would refuse anyway.

**Ordinary editing never prompts.** Clearing a text field follows the shared
clear-value contract, not this policy.

**Switch the demo to Bulgarian.** All three dialogs and both buttons translate.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| Nothing configured, any delete or branch change | `always`. |
| Nothing configured, a mixed type change | `complex` — the one documented exception. |
| A global `default` is set | It replaces that exception too, unless `renderers.mixed.typeChange` restores it. |
| `options.confirmation[operation]` | Wins over everything. |
| An unrecognized policy value | Ignored, and resolution continues — a typo cannot silently disable confirmation. |
| Nothing to discard (the value is absent) | No prompt, whatever the policy. |
| `false`, `0`, `""`, `{}`, `[]` | Existing values: `always` prompts for them. |
| A batch, such as several selected grid rows | One prompt; under `complex`, shown if any one row qualifies. |

## Status

**Implemented** for every covered operation in this renderer set — the nine in
the table above.

The policy is in
[`confirmation.ts`](../../../../../jsonforms-react-antd-renderers/src/util/confirmation.ts)
with no React in it, and every renderer routes through
[`useConfirmation`](../../../../../jsonforms-react-antd-renderers/src/util/useConfirmation.tsx).

Covered by `confirmation.test.tsx` (the policy and dynamic properties),
`arrayDeleteConfirmation.test.tsx` (the three array renderers),
`confirmationRenderers.test.tsx` (mixed and `oneOf`),
`gridDeleteConfirmation.test.tsx` and `confirmationExampleRenders.test.tsx`
(the grid, and this fixture).

**A note on the AG Grid entry.** That renderer lives in the framework-agnostic
package, which must not depend on the antd set — so it takes a policy-free
`useRemoveConfirmation` seam, and the antd side supplies the dialog and the
`agGrid` catalog id. See Adjustment 17.5.

**A note on which component asks.** The array table keeps the dialog it
inherited from the upstream antd renderers; the rest share one. Only the
*decision* is shared — §14 governs whether to ask, not which component asks.
