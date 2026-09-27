# Container validation indicator

**Status:** Accepted. Implemented for Group and Category in the React + antd
renderer set; arrays, tuples and accordion categorization are outstanding.\
**Scope:** A shared contract for the error indicator shown on the header of a
panel-like container (Group, Category, array toolbar, array item header, tuple),
and the option that controls it globally and per element.\
**Relationship to the portable model:** an extension proposal against
[the JSON Forms Extended UI Model Specification](jsonforms-extended-ui-model-spec.md).
Nothing here changes an existing encoding; §6 records the one interaction with
the established `hideArraySummaryValidation` option.

**Origin:** project extension / proposal, in the sense of §5 of the portable
spec. The array-specific `hideArraySummaryValidation` option it generalizes is
an existing renderer convention inherited from the Vuetify family.

---

## 1. Why this document exists

The portable specification defines an aggregated-error indicator for **arrays
only**. It says nothing about Group or Categorization headers. The question
this document answers — *should a panel-like container show an error indicator
on its header, and can that be turned off globally as well as per container?* —
therefore has no portable answer today.

### 1.1 What the portable specification currently says

| Container | Indicator defined? | Option |
| --- | --- | --- |
| Array (expandable item forms) | Yes — a "child-validation summary indicator" in the toolbar | `hideArraySummaryValidation` |
| Array (ListWithDetail) | Yes | `hideArraySummaryValidation` |
| Array (AG Grid) | Yes | `hideArraySummaryValidation` |
| Array (table) | Not stated | none |
| Array **item** header | **Required**, with no opt-out — the suggested layout lists "an indication of item errors" | none |
| Tuple complex position | **Required**, with no opt-out — "Keep an accessible error indicator beside the closed summary" | none |
| **Group** | **No** | none |
| **Category / tab / step / accordion header** | **No** | none |

The array option's meaning is narrow, and deliberately so:

> `hideArraySummaryValidation` suppresses the optional **child-error summary**,
> not the array's own error explanation. If the implementation uses a combined
> summary, retain an appropriate array-level presentation when that summary is
> hidden.

So it is not a blanket "hide the header error icon" switch. An array's own
failures — `minItems` on an empty array, `maxItems`, `uniqueItems`, `contains`
— must stay visible whatever the option says.

Group's only indicator is `showDataIndicator`, which the specification is
explicit is **not** a validity signal:

> The indicator means only that data is present; it does not imply validity,
> completion, required-field satisfaction, or unsaved changes.

### 1.2 Global versus per-element resolution today

The array entries state only "Default false". They never name a config
location, unlike `disableAdd`/`disableRemove`, which the specification pins
explicitly to `config.disableAdd`/`config.disableRemove`. Global defaulting
therefore rests on the general rule in §5:

> For supported renderer options, global config supplies defaults and local
> UI-schema options override them.

That is sufficient, but it is worth stating explicitly for a new option, since
§5 also warns that "Listing an option in global config does not establish
support in every renderer".

### 1.3 What the implementations do

**Legacy Vue 2 (`@chobantonov/vue2-vuetify`)** — partially implemented:

| Renderer | Gates on the option? |
| --- | --- |
| `layouts/ArrayLayoutRenderer.vue` | Yes (`!appliedOptions.hideArraySummaryValidation`) |
| `complex/ArrayControlRenderer.vue` | No — renders `control.childErrors` unconditionally |
| `additional/ListWithDetailRenderer.vue` | No — renders `control.childErrors` unconditionally |

`useControlAppliedOptions` merges `config` then `uischema.options`, so where the
option *is* honored it already supports a global default with a per-element
override.

**React + antd** — not implemented at all. `hideArraySummaryValidation` has zero
occurrences, and `ValidationIcon` renders unconditionally in both
`layouts/ArrayToolbar.tsx` and `complex/TableToolbar.tsx`.

One trap for the React implementation: those toolbars are passed `errors`,
which in core's array mapping is the **array's own** combined message, not
`childErrors`. Gating that icon on the option would hide precisely what §1.1
says must remain. Implementing this contract in React requires surfacing
descendant errors as a separate summary first.

---

## 2. The proposed option

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `showValidationIndicator` | boolean | per container type, see §2.2 | True shows an aggregated descendant-error indicator on the container's header. False hides it. |
| `showValidationIndicatorCount` | boolean | `true` | False shows the marker without a number, and skips computing one. Presence is an index lookup; the count needs a pass over the errors. |

A positive boolean name, following the specification's stated preference —
"The positive `resizable` name follows the common option vocabulary, with
behavior defined by element context". The option selects no presentation mode,
so it is a boolean rather than a `variant` (§5).

### 2.1 Resolution order

1. The element's own `options.showValidationIndicator`.
2. Global `config.jsonformsExtended.showValidationIndicator`.
3. The container type's documented default (§2.2).

Explicit `false` at a more specific level overrides `true` at a less specific
one. Truthiness-based fallback must not replace an explicit `false`, per §5.

**The global config key is namespaced; the per-element option is flat.** This
is a new project extension, not an existing core, Material or Vuetify
convention, so Adjustment 1 of
[the adjustments register](jsonforms-extended-ui-model-adjustments.md) places
its config default under `jsonformsExtended` to avoid colliding with any option
upstream may later introduce under the same name. Per-element `options` stay
flat, matching the specification's `confirmation` precedent — the one project
extension that already has both forms.

So the shape is:

```json
{
  "config": {
    "jsonformsExtended": {
      "showValidationIndicator": true
    }
  }
}
```

```json
{
  "type": "Group",
  "label": "Emergency contact",
  "options": { "showValidationIndicator": false }
}
```

and **not** `config.showValidationIndicator`, nor
`options.jsonformsExtended.showValidationIndicator`.

Implementations read the namespace through the exported
`JSONFORMS_EXTENDED_CONFIG_KEY` constant rather than a string literal. Authored
JSON spells it literally, since JSON cannot reference a constant.

### 2.2 Defaults preserve current presentation

| Container | Default | Rationale |
| --- | --- | --- |
| Array toolbar (expandable, ListWithDetail, AG Grid, table) | `true` | Matches `hideArraySummaryValidation`'s existing "default false = show". |
| Array item header | `true` | The portable spec already requires item error indication. |
| Tuple complex position summary | `true` | The portable spec already requires it. |
| Group | `false` | No indicator existed; a `true` default would change every existing form's appearance. **Implemented.** |
| Category / tab / step header | `false` | As above. **Implemented** for tabs and stepper; accordion does not exist yet. |

Differing defaults per container type are deliberate. The alternative — one
uniform default — either removes an indicator the portable spec requires, or
adds indicators to every Group and tab in every existing form. Authors who want
uniformity set the option once in global config, which is the case this
proposal exists to serve.

### 2.3 Applicability

Applies to a container that renders a header, label row, or navigation entry
capable of carrying an indicator:

- `Group`
- `Category` headers in tabs, stepper and accordion presentations
- Array toolbars: array table, expandable array-item forms, ListWithDetail,
  AG Grid
- Array item disclosure headers and ListWithDetail list rows
- Tuple heading, and tuple complex-position summaries

It does not apply to ordinary Controls, which follow the shared control error
presentation, nor to layouts without a header (`HorizontalLayout`,
`VerticalLayout`), which have nowhere to put it and must not grow one.

---

## 3. What the indicator reflects

**The indicator aggregates errors of the container's descendants.** It is a
navigation aid — "there is something to fix in here" — not a replacement for
the messages themselves.

An error belongs to a container when its normalized instance path identifies a
descendant of that container's data scope, using the path-segment rules the
portable spec already sets out for array item association:

> An error belongs to an item when its normalized control path identifies that
> item itself or a descendant, not merely a textual prefix. For example,
> `employees.10.name` must not count as an error for `employees.1`.

For a structural container with no data scope of its own — Group, Category —
resolve each descendant Control's scope in the current data context, including
the current item path when the container occurs inside an array. This is the
same resolution `showDataIndicator` uses, and unrelated form data does not
count.

Mapped `additionalErrors` participate on the same terms as schema errors.

### 3.1 What it must not suppress

Setting the option to `false` hides **only** the aggregated descendant
indicator. It must not:

- remove or hide the container's **own** errors. An array's `minItems`
  violation, an object's `minProperties` violation, and any other error whose
  target is the container itself retain their accessible explanation near the
  container, exactly as §18 "Array-level errors and item summaries" and
  "Object-level errors and errors without rendered targets" require.
- hide field-level error text on descendant controls.
- change validation execution, structured errors, or the form's validity.
- affect array restrictions, mutation guards, or any data.

### 3.2 Hidden descendants count

A descendant hidden by a rule still contributes its errors to the indicator.
Hiding an element preserves its data and does not exempt it from validation,
and the portable spec requires that eligible errors "remain discoverable
without forcing hidden controls visible merely to show them". An indicator on
the enclosing container is one of the few places such an error can surface.

This matches `showDataIndicator`, where "Hidden descendant Controls participate
in this check".

### 3.3 Interaction with validation display policies

- **`validationMode`.** Under `ValidateAndHide`, schema errors are hidden from
  ordinary control error presentation; the indicator follows, and does not
  reveal them. Under `NoValidation` there are no automatically computed schema
  errors to aggregate. Host `additionalErrors` remain available in all three
  modes and continue to feed the indicator.
- **Pre-touch filtering.** Where `enableFilterErrorsBeforeTouch` suppresses a
  keyword before touch, the indicator suppresses the same errors. The portable
  spec's warning applies directly:

  > Array/detail summary presentation must account for child touch state when
  > it claims the same pre-touch behavior: it must not permanently suppress a
  > matching error simply because filtering remains enabled after the child is
  > touched.

  A container must therefore recompute its indicator as descendants become
  touched, not latch its initial state.
- **Locale changes** refresh the indicator's accessible name and any count
  without a data edit.

---

### 3.4 Computing it

Do not have each container scan the error list: that is O(containers x errors)
on every render, and it is where the segment-boundary rule gets broken with a
`startsWith`. Build an ancestor-path index once per validation and look each
container up in O(1).

The algorithm, the sharing strategy, and measurements for both this indicator
and `showDataIndicator` are in
[Adjustment 5](jsonforms-extended-ui-model-adjustments.md).

---

## 4. Presentation and accessibility

The visual treatment belongs to the renderer family; this contract fixes only
the observable behavior.

- The indicator has a **localized accessible name**. Color or an icon glyph
  alone is insufficient.
- Where a count is shown, it counts the errors the indicator is permitted to
  represent after §3.3 filtering — not the raw validator error count.
- Placement must not displace the container's own error explanation, its
  disclosure control, or its action buttons, and must not make a header row
  grow a second line.
- An indicator is not itself an interactive control. If a renderer makes it
  activatable (for example, to expand a collapsed Group containing the error),
  it must be a real focusable button with its own accessible name, and
  activating it must not modify data.
- A collapsed or closed container still shows its indicator. That is the
  principal reason the indicator exists.

### 4.1 Translation keys

| Key | Default | Used when |
| --- | --- | --- |
| `validation.containerError` | `{count} error in this section` | exactly one error |
| `validation.containerErrors` | `{count} errors in this section` | several |
| `validation.containerHasErrors` | `This section contains errors` | `showValidationIndicatorCount` is false |

Two keys with a `{count}` placeholder rather than one ICU pattern, matching the
existing `composite.summary.item` / `composite.summary.items` convention. A
single ICU pattern renders its own syntax under a plain translator, and the
React stack has no ICU pipeline (see §3.7 of the implementation-gaps document).
`count` is also passed in the translation context, so a host with ICU can
override either key with a pattern.

---

## 5. Examples

An employee onboarding form whose optional sections are collapsed by default.
Without an indicator, a validation failure inside a closed section is
invisible:

```json
{
  "schema": {
    "type": "object",
    "required": ["emergencyContact"],
    "properties": {
      "fullName": { "type": "string", "minLength": 1 },
      "emergencyContact": {
        "type": "object",
        "required": ["phone"],
        "properties": {
          "name": { "type": "string" },
          "phone": { "type": "string", "minLength": 7 }
        }
      }
    }
  },
  "uischema": {
    "type": "VerticalLayout",
    "elements": [
      { "type": "Control", "scope": "#/properties/fullName" },
      {
        "type": "Group",
        "label": "Emergency contact",
        "options": {
          "collapsible": true,
          "collapsed": true,
          "showValidationIndicator": true
        },
        "elements": [
          { "type": "Control", "scope": "#/properties/emergencyContact/properties/name" },
          { "type": "Control", "scope": "#/properties/emergencyContact/properties/phone" }
        ]
      }
    ]
  },
  "data": { "fullName": "Alex Petrov", "emergencyContact": { "phone": "12" } }
}
```

The group header carries the indicator for the `minLength` failure on `phone`
while the section stays closed. Opening it shows the field message as usual.

Turning the behavior on for every container in an application:

```json
{
  "config": {
    "jsonformsExtended": { "showValidationIndicator": true }
  }
}
```

Turning it off for one noisy container while the global default is on:

```json
{
  "type": "Control",
  "scope": "#/properties/lineItems",
  "options": { "showValidationIndicator": false }
}
```

The array's own `minItems` message remains visible beneath the toolbar; only
the aggregated per-item indicator is suppressed.

An invoice review screen that suppresses indicators globally, because a
server-side review step reports problems instead:

```json
{
  "config": {
    "jsonformsExtended": { "showValidationIndicator": false }
  }
}
```

---

## 6. Relationship to `hideArraySummaryValidation`

`hideArraySummaryValidation` is retained. It is an existing renderer convention
with shipped consumers, and the portable spec documents it in three renderer
entries.

| Situation | Result |
| --- | --- |
| Neither option supplied | Container type default (§2.2). |
| `hideArraySummaryValidation: true` | The array's child-error summary is hidden, as today. |
| `showValidationIndicator: false` | The indicator is hidden on every applicable container, arrays included. |
| Both supplied on the same array element | Either one being set to hide wins; they are two ways to request the same suppression, not opposing switches. |
| `hideArraySummaryValidation: true` with `showValidationIndicator: true` on the same element | The array-specific option wins for the array's child-error summary. Recorded so the combination is not implementation-defined; authors should not write it. |

Editors should emit `showValidationIndicator` for new documents and continue to
read `hideArraySummaryValidation`. No alias is introduced in the other
direction: `showValidationIndicator` is not a renaming of the array option, it
has a wider applicability set.

---

## 6a. Worked example

[`../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/`](../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/)
— an employee-onboarding form with a collapsed Group, a stepper Categorization
and an array, carrying exactly one validation error per container. It also
serves Adjustment 1, since its `config.json` is the worked demonstration of the
namespaced config tier.

It is registered with the demo app as **Spec: Container validation indicator**,
so it can be opened and edited rather than only read.

---

## 7. Conformance checklist

An implementation claiming this contract should cover:

1. Resolution: element over config over container-type default, with explicit
   `false` beating an inherited `true`.
2. Per container type: Group, Category in each of tabs, stepper and accordion,
   array toolbar for each array presentation, array item header, ListWithDetail
   row, tuple heading and complex-position summary.
3. A collapsed container shows its indicator.
4. The container's own errors remain visible with the option `false` —
   specifically `minItems` on an empty array and `minProperties` on an object.
5. Descendant path association, including the `employees.10.name` versus
   `employees.1` case, and correctness after reorder and deletion.
6. Hidden descendants contribute.
7. `ValidateAndHide` and `NoValidation` behavior.
8. Pre-touch filtering, including that the indicator reappears once a child is
   touched while filtering stays enabled.
9. Mapped `additionalErrors` contribute.
10. Accessible name present and localized; locale change refreshes it without a
    data edit.
11. No data mutation, no change to validity, no change to array restrictions.
12. `hideArraySummaryValidation` interaction per §6.

---

## 8. Open questions

**Resolved.** Open question 4, on nesting, is settled: **suppression is local
only.** `showValidationIndicator: false` hides the indicator on the element
that carries it and does not stop those errors counting toward an ancestor.
This keeps the option purely presentational and matches §3 as written, where
propagation is unconditional. A suppressed container's errors therefore still
surface one level up - in the worked example, `certifications` shows no marker
of its own while the Compliance category still does.

1. ~~**Count or presence?**~~ Resolved: both, selected by
   `showValidationIndicatorCount`, defaulting to a count.

   **What the count counts is validator errors, not controls.** Two Controls
   bound to the same property share one error object, so an invalid value there
   counts once - fixing either control fixes both, so reporting two would be
   misleading. This needs no extra work: counting error objects is the cheap
   direction, and counting per control would be both wrong and more expensive.
2. **Should the indicator be activatable** — expanding the relevant collapsed
   container or focusing the first failing control? Useful, and the portable
   spec's "errors must remain discoverable" requirement points that way, but it
   introduces focus-management obligations that belong in their own contract.
3. **Category headers in a stepper.** A step that has been visited and one that
   has not are different situations for a user. Does pre-touch filtering
   adequately cover that, or does stepper navigation need its own rule?
4. ~~**Nesting.**~~ Resolved above: suppression is local only. A Group inside a
   Group inside an array item can still show three indicators for one failing
   field; if that proves noisy in practice, revisit as a separate presentation
   rule rather than by changing what the option means.
5. **Should `hideArraySummaryValidation` be deprecated** on a defined timeline
   rather than retained indefinitely?
6. **Array table.** The portable spec does not list the option for the array
   table renderer. Is that an omission to fix in the portable spec, or
   intentional?
