# Example: container validation indicator

**Example ID:** `container-validation-indicator`\
**Demo entry:** **Spec: Container validation indicator** (`#spec-container-validation-indicator`)\
**Domain:** employee onboarding\
**Specs covered:**

- [Container validation indicator](../../../../../../docs/jsonforms-container-validation-indicator-spec.md)
- [Adjustments §1 — configuration namespacing](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

One example serves both because they are inseparable in practice: the indicator
is the first option to use the namespaced config tier, so its `config.json` is
also the worked demonstration of where a project-extension key belongs.

## Files

| File | Role |
| --- | --- |
| `schema.json` | JSON Schema. Constraints are chosen so each container has exactly one failing descendant. |
| `uischema.json` | UI Schema: a stepper Categorization containing a collapsible Group and an array control. |
| `data.json` | Realistic data that is deliberately invalid in two places. |
| `config.json` | Global config, showing the flat tier and the `jsonformsExtended` tier side by side. |
| `translations.json` | English and Bulgarian catalogs, as §24 of the specification requires. Switch locale in the demo to see either; the Internationalization tab shows and edits them. |
| `index.ts` | Registers the example with the demo app. |

There is no `uischemas.json`: this example registers no detail UI schemas. Add
one only where an example actually needs ranked detail selection.

## What the form contains

```text
Full name                              <- valid
Categorization (stepper)
  Personal details                     <- indicator: 1 error
    Start date                         <- valid
    Group "Emergency contact"          <- indicator: 1 error, collapsed
      Contact name                     <- valid
      Relationship                     <- valid
      Phone number                     <- minLength 7 fails on "112"
  Compliance                           <- indicator suppressed
    Certifications (array)             <- indicator suppressed by the element
      1. First aid certificate              <- valid
      2. (unnamed)                     <- required "name" fails
```

## Unbound elements carry an explicit `i18n` prefix

The Group and both Categories declare `i18n` — `emergencyContact`,
`personalDetails`, `compliance`. This is not decoration.

A `Control` has a scope, so core derives a translation prefix from its data
path: `#/properties/certifications` gives the prefix `certifications`, and
`certifications.label` resolves with nothing authored. **A Group or Category
has no scope**, so there is nothing to derive from — core calls
`getI18nKeyPrefixBySchema(undefined, uischema)`, which can only return
`uischema.i18n`. Without it the lookup key becomes the *literal label text*:

```ts
const i18nKey = typeof i18nKeyPrefix === 'string'
  ? `${i18nKeyPrefix}.label`
  : stringifiedLabel;          // "Emergency contact"
```

So a catalog entry keyed `emergencyContact.label` would never be consulted, and
the group would stay English in every locale.

There is no correlation to infer, either: a plain Group is free to hold controls
from several different objects, or none at all, so core cannot guess which part
of the schema it corresponds to. The prefix has to be authored.

`test/specExampleLabels.test.ts` pins this, including the negative case —
removing `i18n` makes the Bulgarian label fall back to the English literal.

## Validation state

Validated with Ajv (`allErrors`, `strict: false`, ajv-formats), the supplied
data produces exactly two errors:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/emergencyContact/phone` | `minLength` | must NOT have fewer than 7 characters |
| `/certifications/1` | `required` | must have required property 'name' |

One error per container, which is what makes the indicator behavior legible.

## Expected behavior

With `config.jsonformsExtended.showValidationIndicator` set to `true`:

1. **The Group shows an indicator while collapsed.** This is the case the
   proposal exists for — the phone error is otherwise invisible, because the
   section is `collapsed: true` on load. Opening the group shows the ordinary
   field message as well.
2. **The "Personal details" category header shows an indicator.** The error is
   a descendant of that category, so it aggregates upward. The "Compliance"
   header also aggregates, because §3 propagation is unconditional — see open
   question 4 in the spec, which asks whether it should be.
3. **The certifications array shows no indicator**, because the element sets
   `options.showValidationIndicator: false`. Its array-level presentation is
   unaffected: `minItems: 1` is satisfied here, but were the array emptied, the
   `minItems` message would still appear beneath the toolbar. The option never
   suppresses a container's own errors (§3.1).
4. **The Group's data-presence dot and its error indicator are different
   things.** `showDataIndicator: true` is also set, so the group shows both.
   The dot means "there is data in here"; the error indicator means "there is
   something to fix". The specification is explicit that the data indicator
   "does not imply validity".
5. **The dot carries a tooltip**, on hover and on keyboard focus, sharing one
   translated string with its accessible name. The key is
   `group.dataIndicator`, default **"Section contains data"** — supplied in
   both locales in `translations.json`. The wording deliberately says *data*,
   not *edits*: this group is populated from `data.json`, so the dot appears on
   load without anyone having typed. See
   [Adjustment 4](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

## Fallback behavior

| Situation | Result |
| --- | --- |
| `showValidationIndicator` absent everywhere | Container-type defaults apply: the array keeps its indicator, Group and Category show none. The form looks as it does today. |
| Renderer does not implement the option | Nothing is shown for Group/Category; array behavior is unchanged. No error, no data change. |
| `validationMode: "ValidateAndHide"` | No indicator, because the underlying schema errors are not displayable. Validity is unchanged. |
| Pre-touch filtering enabled for `required` | The certifications error is suppressed until that child is touched; the indicator must reappear once it is. |

## Config tiers demonstrated

```json
{
  "restrict": true,
  "showUnfocusedDescription": true,
  "hideRequiredAsterisk": false,

  "jsonformsExtended": {
    "showValidationIndicator": true
  }
}
```

`restrict`, `showUnfocusedDescription` and `hideRequiredAsterisk` are core or
Material/Vuetify conventions and stay **top level**. `showValidationIndicator`
is a new project extension, so its global default is **namespaced**. The
per-element override in `uischema.json` is flat:
`options.showValidationIndicator`, never
`options.jsonformsExtended.showValidationIndicator`.

## Status

The option is **not implemented** in any renderer set. This example describes
the target behavior and is the fixture to test against once it is built.
