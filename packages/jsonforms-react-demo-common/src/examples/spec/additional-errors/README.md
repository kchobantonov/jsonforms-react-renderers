# Example: additional errors, from the server and from an editor

**Example ID:** `additional-errors`\
**Demo entry:** **Spec: Additional errors: server and editor** (`#spec-additional-errors`)\
**Domain:** deployment notes\
**Specs covered:**

- [Portable spec §21 — Code editor (Monaco), `propagateErrors`](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Additional-error ownership and changing data paths](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §31 — Renderer-published additional errors](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

Two things know something the schema does not: a **server** that rejected a
submit, and a code editor's **language service**. They look like different
problems and are the same mechanism — `additionalErrors`, published by an
owner, shown under the field they name, cleared on that owner's terms.

| Tab                 | Who publishes                               | Clears when                         |
| ------------------- | ------------------------------------------- | ----------------------------------- |
| **From the server** | the application, after a rejected submit    | that field is edited                |
| **Reported**        | the Monaco control, `propagateErrors: true` | the language service is happy again |
| **Not reported**    | nobody — the default                        | —                                   |
| **Language**        | the editor, language chosen from the form   | —                                   |

## From the server

Press **Submit (rejected)**. Nothing is sent; the two errors are in the
button's `params` and stand in for a response. Everything after that is real:

```ts
store.publish('server', response.validationErrors);
```

They appear under **Email** and **Phone**, because that is what their
`instancePath` says. Now edit one field — **only that field's error goes.** The
other stays until its own field changes.

Comparison is **by value**, not by which path the change named, so rewriting a
field with what it already held clears nothing.

## From an editor

Open **Reported**. The JSON has a syntax error, and a message appears under the
editor — in the same place, in the same style, as the message under the
`Summary` field beside it when you empty it. That is the point: a language
diagnostic arrives as an ordinary error at that field's path, not as a special
editor affordance.

Break the JSON in a second place and there is still **one** message, with a
count. Fix it and the message goes.

## Off by default

```json
{
  "type": "Control",
  "scope": "#/properties/policy",
  "options": { "format": "code", "language": "json", "propagateErrors": true }
}
```

**The default is `false` here, and the portable contract says `true`.** That is
a deliberate divergence, recorded in
[adjustments §31](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).
Publishing lets a language-service diagnostic block a form, and this project's
position is that a host opts into that rather than inheriting it — a form
collecting a snippet of deliberately rough code should not become invalid
because a linter disagrees with it.

A form that wants the portable behaviour sets it once:

```json
{ "jsonformsExtended": { "propagateErrors": true } }
```

Resolution is **element, then namespaced config, then flat config** — the order
every other option in this renderer set uses — so one editor can opt out of a
form-wide setting.

## One error per editor, and it is the editor's to clear

Two rules that sound like details and are not:

- **At most one summary per editor instance**, however many markers there are.
  Twelve syntax errors are one message with a twelve in it, not twelve
  messages.
- **The editor clears its own.** Publishing nothing is how it retracts — which
  is also what happens when the option is switched off, and when the editor
  unmounts. A summary left behind by an editor no longer on the form would
  make the form permanently invalid with nothing on screen explaining why.

The summary carries an **owner** in its `params`, unique per editor instance.
Several things can own errors at one path — two editors, or an editor beside a
server-side error the host published — and §18 requires clearing "only errors
belonging to the affected owner; preserve unrelated renderer and host errors".
Without the owner, one editor going quiet would wipe the others.

## It needs a host

`additionalErrors` is a **prop on `<JsonForms>`**, and core offers no action
for adding one and no hook for withdrawing one. So publication takes two
mechanisms, and neither alone is enough:

|                    | Does                            | Why the other cannot                                                                                        |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `additionalErrors` | Carries published errors in     | Middleware is passive — publishing dispatches nothing, so the form would not re-reduce until somebody typed |
| `middleware`       | Clears on change, merges owners | Only middleware sees the data **before** and after a change                                                 |

The simplest way to get both is to render the form with the wrapper:

```tsx
<ExtendedJsonForms store={store} schema={schema} uischema={uischema} … />
```

or, for a host that assembles `<JsonForms>` itself:

```tsx
<AdditionalErrorStoreProvider store={store}>
  <JsonForms {...useAdditionalErrorProps(store)} … />
</AdditionalErrorStoreProvider>
```

**A form that installs neither publishes into nothing** — and says so, naming
the owner and the way out (`additionalErrors.noStore`), because silence there
is indistinguishable from the option not working.

A host that already passes its own `additionalErrors` keeps them. Published
errors are merged alongside, and neither clears the other.

## Warnings are not errors

Only error-severity markers count. Warnings, hints and informational messages
stay inside Monaco: they do not add to the count and do not block the form.

## The language decides whether there is anything to report

Open **Language**. The summary comes from a language _service_, so it exists
only for a language that has one — JSON and JavaScript here. Choose
**Markdown** and the same broken text reports nothing.

That is worth stating plainly: **no diagnostics is not the same as no errors.**
Syntax highlighting alone does not establish that a language is validated.

## Expected behaviour

| Action                                                               | Result                                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Press **Submit (rejected)**                                          | Errors appear under Email and Phone.                                                 |
| Edit **Email**                                                       | Only that error goes; Phone's stays.                                                 |
| Press **Clear them**                                                 | Both go.                                                                             |
| Open **Reported**                                                    | One message under the editor, beside an ordinary `minLength` message for comparison. |
| Add a second syntax error                                            | Still one message; the count goes up.                                                |
| Fix the JSON                                                         | The message disappears.                                                              |
| Open **Not reported**                                                | Monaco marks the same kind of error; the form says nothing.                          |
| Switch the language to Markdown                                      | The snippet's summary goes, with no edit to the text.                                |
| Empty **Summary**                                                    | A schema error, rendered the same way — which is the point.                          |
| Publish a server error on a field an editor is on, then fix the code | The server's error stays: one owner retracting never removes another's.              |

## Status

The shared editor publishes settled diagnostic summaries. File and duration
error publication require separate adapter verification. Pending language
analysis is not yet integrated into combined command validity, so the summary
must not be treated as proof that all asynchronous validation has settled.

The host must install the additional-error store and its middleware. Schema
validation modes do not install that integration automatically.
