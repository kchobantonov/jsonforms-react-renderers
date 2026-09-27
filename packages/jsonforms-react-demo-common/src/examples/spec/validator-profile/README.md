# Example: validator profile (Ajv)

**Example ID:** `validator-profile`\
**Demo entry:** **Spec: Validator profile (Ajv)** (`#spec-validator-profile`)\
**Domain:** course enrolment\
**Specs covered:**

- [Portable spec §15 — Extended validator profile](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §9 — Internationalizable text](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §14 — script-evaluation permission](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §30 — The extended validator profile](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

**Nothing in this example is renderer behaviour.** Every tab is something the
validator did before a renderer saw anything: reported a failure, rewrote a
value, filled a field in, or said it in another language. The UI schema is four
tabs of plain `Control`s on purpose.

| Tab | What the validator is doing |
| --- | --- |
| **Errors** | Ordinary keyword failures, worded by Ajv and localized by `ajv-i18n` |
| **transform** | Rewriting the stored value as a side effect of validating |
| **Defaults** | Filling fields in: static, computed, from the page address, and from a function in the schema |
| **Messages in the schema** | `errorMessage`, so the schema says it rather than the validator |

## Files

| File | Role |
| --- | --- |
| `schema.json` | Everything the profile adds, in one schema. |
| `uischema.json` | Four tabs of plain Controls — deliberately dull. |
| `data.json` | Pre-filled with failures and with untidy values to normalise. |
| `config.json` | `allowScriptEvaluation: true`, needed by exactly one field. |
| `translations.json` | The tab text, and the schema's own messages. **No error text.** |

## Errors: the wording is the validator's

`must NOT be shorter than 3 characters` is Ajv's sentence, not ours. Switch the
form to Bulgarian and it changes — and the interesting part is what is **not**
in `translations.json`:

```
error.minLength      ← absent
error.minimum        ← absent
error.format         ← absent
```

There is no validator error text in the catalog at all, in either language, and
a test fails if anyone adds some. The Bulgarian comes from `ajv-i18n`, wired in
through `createFormsAjv`. That is the distinction this tab exists to draw:
**JSON Forms' own `error.*` keys are a different mechanism**, and this form uses
none of them.

Bulgarian is carried by this repository rather than by `ajv-i18n`, which does
not ship it.

### Localized *when*, and why it matters

Ajv's messages can be localized at two moments, and only one of them survives a
language switch:

| | Produced | On a locale change |
| --- | --- | --- |
| `createFormsAjv({ localizers })` | at **validation** | stays in the old language until something revalidates |
| `i18n.translateError` | at **render** | changes immediately |

JSON Forms does **not** revalidate when the locale changes. This example uses
the render-time hook, which is why the switch is visible with the data
untouched. The validation-time option exists because the Vue 2 stack works that
way and it needs no extra wiring.

## transform: validation that edits the data

```json
{ "type": "string", "transform": ["trim", "startCase"] }
```

Type an untidy value and blur: the **stored data** changes, not just the
display. That is unusual for a validator and worth saying out loud.

| Field | Transformations | `"  ab-12  "` becomes |
| --- | --- | --- |
| Code | `trim`, `toUpperCase` | `AB-12` |
| Town | `trim`, `startCase` | `North Harbour` |
| Note | `trim`, `capitalize` | `Please seat us together` |
| Level | `trim`, `toEnumCase` | `Intermediate` — matched to a declared choice |

`capitalize` and `startCase` are **not** in `ajv-keywords`. Its transformation
table is a module constant with no registration hook, so this project replaces
the keyword rather than extending it.

`toEnumCase` needs an `enum` in the same schema and matches case-insensitively:
`intermediate` becomes the declared `Intermediate` rather than being left as a
value that then fails `enum`.

## Defaults

Three kinds, and the difference between them is when the value is decided.

**A plain `default`** is written into the data on first validation — including
`false`, which is why *Confirmed* arrives unticked rather than absent. A
truthiness check loses that case.

**`dynamicDefaults`** computes one:

```json
"dynamicDefaults": {
  "opensOn":  { "func": "date", "args": {} },
  "closesOn": { "func": "date", "args": { "duration": "P14D" } },
  "year":     { "func": "dateUnit", "args": { "unit": "year" } }
}
```

The offset is an ISO 8601 duration, and `op: "subtract"` goes the other way.
These replace `ajv-keywords`' own `date`/`time`/`datetime`, which take no
arguments; with no arguments they behave identically.

### An object field holding the current request parameters

This is what `searchParams` is for:

```json
"request": {
  "type": "object",
  "default": {},
  "properties": { "ref": {…}, "campaign": {…}, "source": {…} },
  "dynamicDefaults": {
    "ref":      { "func": "searchParams", "args": { "param": "ref" } },
    "campaign": { "func": "searchParams", "args": { "param": "campaign" } },
    "source":   { "func": "searchParams", "args": { "param": "source" } }
  }
}
```

Open the demo with `?ref=AB-1234&campaign=spring` and the object arrives
holding them. **The hash query is read too** — `#/form?source=email` — because
that is where a hash-routed application puts its parameters, and an enrolment
link is exactly the case this exists for.

`"default": {}` on the object is what makes the nested defaults reachable: the
generators fill properties of an object that has to exist first.

A parameter that is not present yields nothing rather than an empty string, so
the field stays absent and any `required` on it still fails honestly.

### A default computed by a function in the schema

```json
{ "func": "dynamic", "args": { "who": "student", "func": "(args) => `Welcome, ${args.who}.`" } }
```

**This one needs permission.** `config.json` grants
`jsonformsExtended.security.allowScriptEvaluation`, and without it the field
stays empty and the console says why. A schema is data — it can arrive with the
form — so compiling a string out of it is the same capability the template
engines and `Button.script` are gated on. The Vue 2 original compiles it
unconditionally; this is a deliberate divergence.

## Messages in the schema

```json
"errorMessage": {
  "required":   { "nickname": "nicknameRequired" },
  "properties": { "nickname": "nicknameTooShort", "postcode": "A postcode is four digits, like 1010." }
}
```

A message is looked up as **`error.errorMessage.<message>`** first and used
literally if that resolves to nothing — so *Nickname* and *Age* translate, and
*Postcode* is a sentence that stays as written in both languages. That is the
same key-or-text rule this renderer set applies to labels.

**Each message appears under its own field**, which is the part that is easy to
lose: `ajv-errors` replaces the failures it covers with a *single* error at the
enclosing object's path, and JSON Forms maps errors to controls **by path**.
Left alone, a schema that adds friendly messages makes every field it covers go
silent. See [adjustments §30.5](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

## Expected behaviour

| Action | Result |
| --- | --- |
| Open **Errors** | Four failures, worded by the validator. |
| Switch to Bulgarian | The wording changes, with no error key in the catalog. |
| Open **transform** | The untidy values are already normalised in the data panel. |
| Open **Defaults** | Currency `EUR`, Confirmed unticked, dates filled in. |
| Reload with `?ref=AB-1234` | The request object carries it. |
| Remove `allowScriptEvaluation` | *Greeting* is empty; the console names the permission. |
| Open **Messages in the schema** | Each message under its own field. |
| Switch to Bulgarian there | The two keyed messages follow; the Postcode sentence does not. |

## Status

**Implemented.** The profile is ported from the Vue 2 `common` package; see
[adjustments §30](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
for what was changed on the way, chiefly the permission gate on `dynamic` and
the replacement of Vue `computed()` messages with plain strings.

**Worth knowing:** JSON Forms' factory sets `strictSchema: false`, so a
validator **without** these keywords does not reject a schema that uses them —
it ignores them silently. This form validated by a plain Ajv would compile,
enforce less than it says, and leave every `transform` value untouched, with
nothing thrown and nothing logged.

Covered by `validatorProfileExample.test.tsx` for this fixture,
`extendedAjv.test.ts` for the validator itself, and
`schemaErrorMessages.test.tsx` for messages reaching the right controls.
