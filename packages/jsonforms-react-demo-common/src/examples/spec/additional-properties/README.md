# Example: additional properties

**Example ID:** `additional-properties`\
**Demo entry:** **Spec: Additional properties** (`#spec-additional-properties`)\
**Domain:** inventory metadata\
**Specs covered:**

- [Portable spec §18 — Additional (dynamic) properties](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Empty property name policy](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Empty-name presentation, and empty add-name draft feedback](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Literal-key editing](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — Honest rendering of invalid data](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §14 — Dynamic property names](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Gaps §6.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

Five objects whose keys are data rather than schema. The point of the example is
that **a key is a value too**: what it may be called, whether it can be reached
by a data path, and whether it can be renamed or deleted are all separate
questions, and they have different answers.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Five dynamic-property objects: free-form, `propertyNames`-constrained, `patternProperties` with `additionalProperties: false`, imported keys, and one with `minProperties`. |
| `uischema.json` | `allowEmptyPropertyNames` on one control and explicitly `false` on another, over a global `true`. |
| `data.json` | Keys that used to be impossible: brackets, digits, an empty name, surrounding whitespace, a dot and a slash. One key violates its `propertyNames`. |
| `config.json` | `showUnfocusedDescription`, `restrict`, and a global `allowEmptyPropertyNames: true`, all top level per Adjustment 1. |
| `translations.json` | English and Bulgarian, including the three name-refusal messages. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here needs a registered detail form.

## What the form contains

```text
Inventory metadata
  Inventory labels      allowEmptyPropertyNames: true   -> 5 keys, incl. "" and "  spaced  "
  Telemetry readings   propertyNames: pattern+minLength -> "sensor-x" is too short  (invalid)
  Carrier headers      additionalProperties: false      -> only x-carrier- / x-trace-
  ---
  Imported annotations free-form                        -> "legacy.key", "notes/1"
  ---
  Required quota       minProperties: 2, option false   -> Delete disabled under restrict
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
two errors — **both from one violation**:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/telemetry` | `minLength` | must NOT have fewer than 9 characters |
| `/telemetry` | `propertyNames` | property name must be valid |

`sensor-x` is eight characters and `propertyNames` requires nine. Ajv reports
the inner failure and the wrapping keyword separately, which is why one bad key
produces two entries. The key stays visible and editable — §19 — and renaming it
to something nine characters or longer clears both.

Note that the errors are attached to `/telemetry`, the **object**, not to a path
for the offending key. A key has no data path of its own, so there is nowhere
else to put them.

## Expected behaviour

### What a key may be called

**Inventory labels already holds keys that used to be rejected.** `items[0]` is
one key, not an index into an array. `2024` is an object key, not an array
position. Both work because core 3.9 stopped using lodash's path grammar in the
reducer; before that they were written to the wrong place. See
[Adjustment 14](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

**Type `sdf.sdf` into any Add box.** It is accepted, and it becomes **one key
called `sdf.sdf`** — not a nested `{ "sdf": { "sdf": … } }`. A dot cannot be
addressed by a data path, but that is a reason to edit the property differently,
not a reason to refuse it: the value gets a form of its own, exactly as the
empty-named one does.

**`  spaced  ` keeps its spaces.** Names are stored exactly as typed; trimming
is only used to decide whether a name counts as blank. Add a property called
`  two  ` and read the Data tab.

### Empty names

**Inventory labels permits an empty key**, and one is already there. Its label is
**visually blank** — not the literal `""` — and Rename and Delete still sit
above its value, exactly like every other property.

**Edit the empty-named property's value.** It works, and the object around it is
untouched. This is not an ordinary delegated control: an empty path segment
composes away to the parent's own path, so a control dispatched there would edit
the whole `labels` object. It is edited in an **isolated form** rooted at that
value instead, and written back under its exact key. The same applies to
`legacy.key` in Imported annotations.

That isolated form has its own root schema, so a local `$ref` inside the
property's schema would stop resolving. The schema is **rebundled** for it: the
original document travels along under `definitions.__jsonforms_root` and local
references are rewritten to point into it. Nothing in this example needs it, but
a schema with shared definitions would.

**Clear the Add-property name box and look for an error.** There is none, even
though an empty key already exists and adding a second would collide. §18: an
exactly empty draft "must not show inline name-validation errors on initial load
or after it is cleared or reset". The Add button is still disabled, because
suppressing the message must not suppress the judgement.

**Required quota has the option explicitly off**, over a global `true` in
`config.json`. Its Add button stays disabled on an empty name. §18 requires an
element option to override config "including `false` overriding `true`", which a
truthiness merge would silently get wrong.

**Use the demo's own switch to see both halves.** The settings panel carries
**Allow Empty Property Names**, which writes the global config option. It reads
as *on* when this example loads, because the example's `config.json` sets it;
turn it off and Inventory labels stops accepting an empty name while Required
quota is unaffected either way — the control's own option has the last word.

### What the schema admits

**Telemetry applies the whole of `propertyNames`.** Try `sensor-a`: refused,
because it is eight characters and `minLength` is nine. `sensor-deck-b` is
accepted. A pattern-only check would have taken both.

**Carrier headers admits only what its patterns claim.** `additionalProperties`
is `false`, so a name must match `^x-carrier-` or `^x-trace-`; `x-other-id` is
refused.

**Type `__proto__` into an Add box.** It is accepted and becomes an ordinary
own property; the containing object's prototype is untouched. It is not in the
fixture, and that is itself worth knowing: a quoted `__proto__` survives
`JSON.parse`, but the bundler compiles a JSON module into an **object literal**,
where `{"__proto__": v}` sets the prototype rather than creating a key — so the
property would silently vanish from the example before the form ever saw it.

**Imported annotations holds `notes/1`.** A slash is an ordinary character in a
key; it only needs escaping when a JSON Pointer is built from it, not when the
key is stored.

### Removal

**Required quota has two entries and `minProperties: 2`** with `restrict` on, so
both Delete buttons are disabled. Switch `restrict` off in the Config tab and
they become available, with the validator reporting the shortfall instead.

### Localization

**Switch the demo to Bulgarian.** The section heading, the placeholder, the
Add/Rename/Delete names and all three refusal messages translate. The keys
themselves do not: they are data.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `allowEmptyPropertyNames` anywhere | Empty and whitespace-only names are refused. |
| Config `true`, element absent | Permitted — config supplies the default. |
| Config `true`, element `false` | Refused. The explicit element option wins. |
| A name containing `.` | Accepted, and edited through an isolated form. It is one key, not a nested path. |
| An empty or dotted key, however it arrived | Kept, shown, and editable through an isolated form; renaming and deleting work normally. |
| `propertyNames` present | Applied in full. It does **not** imply `allowEmptyPropertyNames`. |
| No validator available to the control | Only the `pattern` constraints are checked — a documented reduction, not a skip. |
| `additionalProperties: false` with no `patternProperties` | No name is admissible; Add stays disabled. |

## Status

**Implemented.** `allowEmptyPropertyNames` with element-over-config resolution,
exact name preservation, the blank-label presentation, the empty-draft feedback
rule, the isolated editor for unaddressable keys, full `propertyNames`
evaluation and safe own-property writes are in
[`additionalPropertyName.ts`](../../../../../jsonforms-react-antd-renderers/src/util/additionalPropertyName.ts),
[`AdditionalProperties.tsx`](../../../../../jsonforms-react-antd-renderers/src/complex/AdditionalProperties.tsx)
and
[`AntdIsolatedPropertyEditor.tsx`](../../../../../jsonforms-react-antd-renderers/src/complex/additionalProperties/AntdIsolatedPropertyEditor.tsx).
Covered by `test/additionalPropertyNames.test.tsx` and
`test/emptyPropertyNames.test.tsx`.

**A limitation worth knowing.** An isolated editor validates its own value, so
errors on an empty-named or dotted property are shown beside that property but
are **not** counted in the containing form's error list. That is the price of
editing a property that has no data path; see Adjustment 14.

**Not implemented:** delete confirmation for dynamic properties, and
object-level error placement — see gaps
[§6.1](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md).
