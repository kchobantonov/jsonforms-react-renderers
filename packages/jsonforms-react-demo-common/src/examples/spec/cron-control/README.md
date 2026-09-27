# Example: cron control

**Example ID:** `cron-control`\
**Demo entry:** **Spec: Cron control** (`#spec-cron-control`)\
**Domain:** an overnight replenishment job\
**Specs covered:**

- [Adjustments §39 — The cron picker asks how often first](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Portable spec §5 — Schema-driven and UI-driven format selection](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — the shared clear-value contract](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — pending edits, commit timing and cancellation](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §30 — The extended validator profile](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

A cron expression is a string, and this is the control that stops it being
edited as one. Six values are hidden in six fields of punctuation, and the
question a reader actually has — *when does this run?* — is not answerable by
looking at `0 0/15 * * * *` unless they already know the dialect.

**Which dialect matters more than anything else here.** These six fields are
`second minute hour day-of-month month day-of-week`. Unix cron has **five** and
no seconds; Quartz has **seven** and adds a year. The same text means different
things in each, and the mistake does not announce itself — a five-field
expression ported from a crontab is a valid string that schedules nothing.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Three groups: `selectedBySchema` uses the `format` keyword, `selectedByUiSchema` holds plain strings, `rejected` holds two expressions from the wrong dialects. |
| `uischema.json` | A `VerticalLayout` of three `Group`s. The UI-schema group passes `options.format: "cron"`; the others carry no options at all. |
| `data.json` | A configured job. Two values are deliberately invalid — see below. |
| `translations.json` | English and Bulgarian. |
| `index.ts` | Registers the example with the demo. |
| — | No `config.json`: nothing here is global. No `uischemas.json`: there is no detail form. |

## What the form contains

```text
Job name                                    (string, required, minLength 3)

Selected by the schema
  Stock sync          0 0/15 * * * *        format: cron, required
  Supplier feed       0 30 6 ? * MON-FRI    format: cron
  Month-end report    0 0 23 L * ?          format: cron

Selected by the UI schema
  Cache warm-up       10 * * * * *          options.format, pattern only
  Archive sweep       (empty)               options.format, placeholder only

Not this dialect
  Ported from crontab */15 * * * *          five fields
  Ported from Quartz  0 0 12 ? * MON 2027   seven fields
```

## The two routes, and what each one validates

| | Selected by the schema | Selected by the UI schema |
| --- | --- | --- |
| How | `{"type":"string","format":"cron"}` | `{"type":"string"}` + `options.format: "cron"` |
| Picks the renderer | yes | yes |
| Gives the validator something to check | **yes** | **no** |

`cron` is **not** a JSON Schema format keyword. The extended validator profile
registers it (`createFormsAjv`, beside `color`), which is what makes the first
column true: without that registration Ajv ignores the keyword with a warning,
the control still appears, and a five-field expression is reported by the
renderer alone. The second column is the plain-string route, where only
`pattern` applies — and the pattern here counts fields and nothing else, which
is as much as a regular expression can usefully say about cron.

## Validation state

Validated with `createFormsAjv()`. The supplied data produces **exactly two**
errors, both in the third group:

| Path | Keyword | Message |
| --- | --- | --- |
| `/rejected/unixFiveField` | `format` | `must match format "cron"` |
| `/rejected/quartzSevenField` | `format` | `must match format "cron"` |

`*/15 * * * *` is a perfectly good Unix cron expression and has five fields.
`0 0 12 ? * MON 2027` is a perfectly good Quartz expression and has seven. Both
are rejected here, which is the point of the group: the control reports the
field that is wrong rather than reinterpreting the expression into whatever the
nearest six-field reading would be.

Everything else is valid. `10 * * * * *` — second 10 of every minute — is the
one shape a five-field dialect cannot express at all, and it is a real schedule.

## Expected behavior

**The period is asked first, and it is a lens.** Opening the picker on Stock
sync shows `Repeats: Hourly`, because minutes and seconds are the coarsest
things that expression restricts. The period decides which of the six rows are
worth showing — a schedule that runs every hour has nothing to say about which
day it is, and five rows reading "Every" is a form that hides its own answer.

**A period selects nothing.** Archive sweep has no value. Its picker opens with
no period chosen, no rows, and an empty expression box; choosing "Yearly" makes
the rows appear, all reading "Every", and writes nothing. Pressing Apply without
an edit leaves the property empty.

**Choosing a value pins the time below it.** In cron, a field left alone means
*every* value, so "nine o'clock" with nothing else said is 3600 executions an
hour. Picking Hours = 9 therefore writes `0 0 9 * * *`. Never a day or a month:
that is the question being asked, and filling in a weekday beside a day of the
month would mean "the 1st, and only when it is a Monday" — these fields are
ANDed, not ORed.

**A field that is not a list is edited as text.** Month-end report uses `L`,
"the last day of the month". That is not a set of days, so the row shows the
text rather than a dropdown, with a note saying why. It is never reinterpreted
and never widened into a list that would mean something else.

**Applying an untouched picker writes nothing.** Every value in the first group
has a canonical spelling the picker could write back — `0 0/15` and its
asterisk form select the same minutes — and it does not, per §18: *existing data
must not be silently normalized solely because the renderer is mounted.*

**Clearing follows the shared contract.** The clear button carries
`control.clearValue`, appears on hover or focus, and returns the property to a
missing state — not an empty string, and not a schema default.

## Fallback behavior

- **Without the renderer**, `format: "cron"` falls through to the string control
  and the expression is editable as text. Nothing is lost but the picker; the
  validator still rejects the wrong dialect, because the format is registered in
  the profile rather than in the renderer.
- **Without the registered format** — a host that builds its own Ajv — the
  schema route still selects the control, Ajv warns `unknown format "cron"`, and
  the two invalid values are reported by the control instead of by the form.
- **`options.clearable: false`** removes the clear action; required validation is
  unaffected.
- **`options.showActions: false`** commits each selection immediately instead of
  staging it until Apply, and the picker then has no buttons.

## Status

**Implemented.** `AntdCronControlRenderer` in the antd extended set, over
`util/cron.ts` in the renderer-agnostic package; covered by `cronValues.test.ts`
for the reading and `cronPicker.test.tsx` for the panel.
