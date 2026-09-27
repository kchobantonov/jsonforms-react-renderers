# Example: pre-touch error filtering

**Example ID:** `pre-touch-errors`\
**Demo entry:** **Spec: Pre-touch error filtering** (`#spec-pre-touch-errors`)\
**Domain:** carrier onboarding\
**Specs covered:**

- [Portable spec — Error-message filtering before touch](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §19 — honest rendering](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Gaps §26](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

A form where **nothing has been filled in yet**, so every required field is
already complaining. That is the situation the option exists for: a form that
greets a user with seven errors they have not had a chance to cause.

Turning on **Enable Filter Errors Before Touch** in the settings panel hides the
*required* messages until the user has actually visited each field — and leaves
every other error alone, because those describe something the user did.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Four required properties, plus errors of three other kinds so filtering can be seen to be selective. |
| `uischema.json` | One control opts out with `options.enableFilterErrorsBeforeTouch: false`. |
| `data.json` | Deliberately incomplete: three required properties absent, one malformed value, one short string, one short array. |
| `config.json` | `filterErrorKeywordsBeforeTouch: ["required"]` — the keyword list, with filtering itself left **off** so the errors show first. |
| `translations.json` | English and Bulgarian for every message involved. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: the array's items use the generated form.

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data is
**invalid**, with exactly seven errors:

| Keyword | Path | Message |
| --- | --- | --- |
| `required` | `/` | must have required property 'legalName' |
| `required` | `/` | must have required property 'contactEmail' |
| `required` | `/` | must have required property 'internalCode' |
| `required` | `/terminals/0` | must have required property 'city' |
| `pattern` | `/dotNumber` | must match pattern "^[0-9]{7}$" |
| `minLength` | `/notes` | must NOT have fewer than 10 characters |
| `minItems` | `/terminals` | must NOT have fewer than 2 items |

Four `required` and three that are not. That split is the whole point of the
fixture: a filter that hid all seven would be indistinguishable from one that
hid the right four.

`insuranceExpiry` is absent and **not** required, so it contributes nothing —
the control that should be quiet throughout.

## Expected behaviour

### With filtering off, which is the default

Everything above is on screen from the first render. **Legal name**, **Contact
email** and **Internal code** each say they are required; **DOT number** says
its format is wrong; **Notes** asks for ten characters; **Terminals** asks for
two entries and its one item asks for a city.

`filterErrorKeywordsBeforeTouch` is set in `config.json` and does nothing,
because it is "ignored when filtering is disabled".

### Turn on Enable Filter Errors Before Touch

The three top-level **required** messages disappear. Still on screen:

- **DOT number** — a `pattern` error. The user typed `12ab`; that is not a
  message about something they have yet to do.
- **Notes** — a `minLength` error, for the same reason.
- **Terminals** — a `minItems` error on the array itself.
- **Internal code** — its control sets
  `options.enableFilterErrorsBeforeTouch: false`, and a per-control option
  overrides the global config.

### Touch is blur, not focus

**Click into Legal name and click out again without typing.** The required
message comes back. "The control becomes touched on blur: receiving focus alone
is insufficient, and leaving the control counts even if the user did not change
its data."

**Click into Contact email and stop there.** Nothing reappears while the cursor
is still in the field — focus alone is not touch.

Once touched, a control shows whatever the active `validationMode` permits,
with no further keyword filtering. Touching is one-way: it is not undone by
typing, clearing the field, or the value becoming valid and invalid again.

### Clear the keyword list

Empty **Filter Error Keywords Before Touch** while filtering stays on. Now
*every* untouched control's error text is suppressed — **DOT number**'s
`pattern` and **Notes**'s `minLength` go too — because "an absent or empty
array suppresses all otherwise displayable control error text before touch".

**Terminals** keeps its `minItems` error: that one belongs to the array, and
arrays are not part of this feature (see below).

Put `required` back and only the required messages hide again.

### The form is still invalid

This is presentation only. While the required messages are hidden:

- the form's validity is unchanged — it is invalid, and anything reading
  validity sees that;
- the structured errors are unchanged, so a host collecting them gets all seven;
- no data is modified and no validation is suspended.

**Check it:** the container validation indicators and any validity readout stay
in their error state while the individual messages are hidden. A filter that
made the form look valid would be a different and much worse feature.

### It does not make hidden errors appear

Switch **Validation mode** to `ValidateAndHide` and turn filtering **off**.
Nothing appears: disabling the filter "restores ordinary presentation subject to
validationMode; it does not force core errors to appear under ValidateAndHide or
NoValidation." The filter can only ever subtract.

### Arrays: the item's fields filter, the summary does not

**Terminals** carries a `minItems` error of its own and a child `required`
error underneath.

**The child `city` field filters like any other control** — its required
message is hidden until you blur it, because it is an ordinary control inside
the item form.

**The array's own `minItems` error is not filtered**, and neither is the
child-error summary in the array header. The specification treats summary
participation as a separate, per-renderer question — "document supported
summary behavior and runtime touch-state lifecycle rather than assuming every
array renderer shares an implementation" — and this renderer set does not claim
it. Neither does the Svelte family these options come from.

So the honest statement is: filtering here is a **control-level** feature. An
array header keeps saying what is wrong beneath it, which is arguably what a
summary is for.

### Localization

**Switch the demo to Bulgarian.** Every message that appears — and every one
that reappears after touch — is translated. Filtering decides *whether* a
message is shown, never which language it is in.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| `enableFilterErrorsBeforeTouch` absent | False. Ordinary presentation. |
| Filtering on, `filterErrorKeywordsBeforeTouch` absent or `[]` | All pre-touch control error text is suppressed. |
| Filtering off, keywords set | Keywords ignored. |
| A control sets the option | It overrides the global config, in either direction. |
| A control touched, filtering still on | That control filters nothing any more. |
| An error whose keyword is not listed | Displayed, even before touch. |
| A host-supplied `additionalError` | Filtered by the same keyword rules; a nonmatching one is not lost because a matching core error was suppressed. |
| Any of the above | Validity, structured errors and data are untouched. |

## Status

**Implemented** for controls, in
[`preTouchErrors.ts`](../../../../../jsonforms-react-antd-renderers/src/util/preTouchErrors.ts).

The algorithm is deliberately the one the Vuetify
(`vue-vuetify/src/util/composition.ts`) and Svelte renderer families already
use, down to the branch order: these are *their* option names, so a form
authored against them has to behave the same here. See
[Adjustment 19](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

**Covered:** every control that prints its own errors — the scalar inputs via
`InputControl` and `NativeControl`, multi-select, chips, and the extended
colour, duration and null controls.

**Not covered:** array and tuple summaries, as above. Recorded rather than
silently skipped, because the specification asks for it to be documented either
way.

`test/preTouchErrors.test.tsx` renders this fixture and pins the behaviour,
alongside unit tests for the branches a rendered form does not reach — a
host-published `additionalError` surviving a suppressed core error beside it,
an error with no keyword, and a keyword list that matches nothing.
