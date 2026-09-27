# Example: label interpolation

**Example ID:** `label-interpolation`\
**Demo entry:** **Spec: Label interpolation** (`#spec-label-interpolation`)\
**Domain:** a subscription billing summary\
**Specs covered:**

- [Consolidated spec §9 — Internationalizable text and interpolation](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Consolidated spec §10 — Markdown policy](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Consolidated spec §11.4 — Template grammar](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Adjustments §37 — CEL as the one expression language](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

`options.interpolate: true` evaluates the `{…}` placeholders in a label's
text. `options.markup: "markdown"` parses the result. They are independent,
and the interesting part is what happens when both are on.

## Files

| File | Role |
| --- | --- |
| `schema.json` | A subscription, including two properties with JavaScript-flavoured names. |
| `uischema.json` | A `Categorization`: one tab per feature, then one for incorrect usage. Every tab carries the editors for what it shows. |
| `data.json` | `displayName` contains Markdown, `promoCode` is deliberately **absent**, `constructor` is an ordinary string. |
| `config.json` | `dynamicValues.enabled: true`, without which a parameter cannot read `data.*`. |
| `translations.json` | English and Bulgarian, including `plan.*` keys that `translate()` looks up. |
| `index.ts` | Registers the example with the demo. |

## The tabs

Organised per feature, and **the correct-usage tabs carry no diagnostics at
all** — so "is everything working" is answered by looking rather than by
reading each message to decide whether it was expected. Every failure lives on
the last tab.

Each tab has the editors for the fields it uses, so the text can be watched
changing rather than taken on trust.

| Tab | Shows |
| --- | --- |
| **Interpolation** | static parameters, data through a parameter, a plural, absent data, a literal brace |
| **Markdown** | Markdown with no interpolation |
| **Both together** | a value inside the author's own markup, and a value that *contains* markup |
| **Locale and translation** | `translate()`, `date()`, `currency()`, `number()`, and a value left unformatted |
| **Interpolation off** | what the same text does without the option |
| **JavaScript names** | a property called `constructor`, and one called `toString` |
| **Incorrect usage** | the five things that are reported, and why |

## Two scopes, and why the catalog never names a data path

```json
{
  "type": "Label",
  "text": "You are subscribed to {product}.",
  "options": {
    "interpolate": true,
    "textParams": { "product": "{data.customerName}" }
  }
}
```

The **text** may name only the declared parameters. The **parameter's value**
is where the data is read. So a translator receives
`You are subscribed to {product}.` and never has to know, or preserve, a path
into the schema.

That is the whole reason for the split. A catalog full of
`{data.customerName}` is coupled to the schema: rename the field and every
translation in every language breaks at once.

The **Incorrect usage** tab proves the restriction is real — one label writes
`{data.customerName}` straight into its text and renders nothing there, with a
diagnostic, however open the gate is.

A single `{` opens a placeholder; `{{` is a literal brace — §11.4's grammar,
**inverted from Mustache**.

## `interpolate` governs the whole feature

The **Interpolation off** tab is the control case. The same braces, with no
`interpolate`, are just characters: nothing is resolved, declared parameters
are inert, and — importantly — **nothing is reported**, because nothing was
asked for.

## Expressions stay in the text, so plurals stay in the catalog

```
Your plan includes {seats} {seats == 1 ? "seat" : "seats"}.
```

The text evaluates expressions over the **parameters**. If it were bare
substitution the plural would have to move into the UI schema, where only the
authoring language could reach it. Here each catalog entry writes its own
test, and the Bulgarian one says `{seats == 1 ? "място" : "места"}`.

**This is the cost of an expression language over a message format.** A
ternary suits languages that split at one; a language with more plural
categories needs a branch per category. See Adjustment 37.

## A locale decides more than the words

`{currency(amount, "EUR")}`, `{date(renewal)}` and `{number(price, 2)}` render
per language from the *same* catalog string:

| | English | Bulgarian |
| --- | --- | --- |
| `currency(amount, "EUR")` | `€148.50` | `148,50 €` |
| `date(renewal)` | `Oct 1, 2026` | `1.10.2026 г.` |

Formatting is **functions you call**, not something applied to every number —
an implicit rule cannot tell a price from an order number, which is why
`Reference 2026` stays `2026` rather than becoming `2,026`.

The Bulgarian renewal string is phrased with a colon and no trailing period,
because a Bulgarian medium date already ends in `г.`. Punctuation belongs to
the catalog entry.

## `translate()` turns a value into a word

`data.plan` is `"Team"` in every language — a key, not a word. The parameter
looks it up:

```json
"textParams": { "plan": "{translate(\"plan.\" + data.plan)}" }
```

and the catalog string says only `{plan}`.

**It belongs in the parameter, not in the text**, and that follows from a
general test: *does the expression's shape differ by language?* A plural does,
so it lives in the catalog. A `translate`, `currency` or `date` call does not —
it is identical in every language, so putting it in the text means every
translator must reproduce it, and one who drops the `translate(...)` wrapper
silently renders `Team` instead of `Екип`.

**`translate` is registered into the evaluator, and could not have arrived any
other way.** A function placed in `context` is not callable, not even
readable — measured. That is what stops a host widening what an expression can
do by putting a callback in the data.

## JavaScript names are ordinary JSON keys

`constructor` is a legal property name, and the evaluator cannot read a plain
object that has one: its type check is `switch (v.constructor)`, which a data
key of that name shadows, so it rejects the **whole object** and every sibling
field with it.

The evaluation is retried with the objects rebuilt as maps, whose entries
cannot shadow `.constructor`. The retry runs only after that specific failure,
so ordinary data is never walked or converted. `__proto__`, `toString`,
`valueOf` and `hasOwnProperty` need no repair at all.

## Both together, and the order that matters

The pipeline is **resolve parameters → substitute into the text → escape →
parse**.

The summary label puts a value *inside* the author's markup, so the `**` still
makes bold. The account-holder label is the other half: `displayName` is
`Ana **Petrova**` in the data and renders with its asterisks showing.

**A value cannot become markup.** Substituted values are escaped before
parsing — and only the values, never the surrounding text, or the author's own
`**` would die with them. Edit the field to `# not a heading` and it stays
text.

URLs get a second line of defence: a destination failing the URL policy (§12)
is refused whether or not escaping caught it.

## What is reported, and what is not

**Absent data is not an authoring error.** `promoCode` is not in the record —
the normal state of a form being filled in — so it renders as nothing and says
nothing. Reporting it would put a developer-facing message beside half the
labels of every fresh form, which is how people learn to ignore diagnostics.

What stays an error is anything wrong *however* the form is filled in, and the
**Incorrect usage** tab has one of each:

| Label | Reported |
| --- | --- |
| a data path in the text | `Unknown variable: data` |
| a parameter never declared | `Unknown variable: customer` |
| a function that does not exist | `no matching overload for 'shout'` |
| a namespace that does not exist | `Unknown variable: nowhere` |
| a parameter named `locale` | `textParams.locale is a reserved name` |

Each keeps the rest of its sentence — a label is content, and content is worth
showing even when part of it is missing.

## The gate

`data`, `item`, `config` and `context` are reachable **from a parameter's
value** only when `jsonformsExtended.dynamicValues.enabled` is true — §12's
gate, which defaults **closed**. The text never sees those namespaces, gate or
no gate.
