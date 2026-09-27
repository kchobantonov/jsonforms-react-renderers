# Example: temporal controls

**Example ID:** `temporal-controls`\
**Demo entry:** **Spec: Temporal controls** (`#spec-temporal-controls`)\
**Domain:** an appointment booking\
**Specs covered:**

- [Portable spec §18 — Date, time and date-time controls](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Temporal controls: schema-driven behavior](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Duration control](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §5 — Schema-driven and UI-driven format selection](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §25 — Temporal serialization and picker bounds](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Gaps §6.5 and §7.4](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

Four controls that all store **strings**, split by *how the control was
chosen*. That split is the whole example, because it decides something people
routinely get wrong: **what validates the value.**

| | Selected by the schema | Selected by the UI schema |
| --- | --- | --- |
| How | `{"type":"string","format":"date"}` | `{"type":"string"}` + `options.format: "date"` |
| Picks the renderer | yes | yes |
| Gives the validator something to check | **yes** | **no** |
| The value must be | RFC 3339 for that keyword | anything; only `pattern` applies |

Both routes reach the same renderer and take the same options. They are not
interchangeable, and the second column is why a form can legitimately store
`YYYY/MM/DD h:mm a` with nothing objecting.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Four groups: `schemaBased` with format keywords, `uiSchemaBased` as plain strings, `bounded` for the range limits, `composed` for `$ref`, tuples and mixed types. |
| `uischema.json` | A `Categorization`, one tab per group. |
| — | The fixture needs `createFormsAjv()`; the plain validator cannot compile its `$data` bound. |
| `data.json` | A filled booking. One value is deliberately out of range — see below. |
| `translations.json` | English and Bulgarian. |
| `index.ts` | Registers the example with the demo. |

## Selected by the schema

```json
{ "time": { "type": "string", "format": "time" } }
```

No options at all, so every default applies:

| Option | Default | Writes |
| --- | --- | --- |
| `dateSaveFormat` | `YYYY-MM-DD` | `2026-10-14` |
| `timeSaveFormat` | `HH:mm:ssZ` | `09:30:00Z` |
| `dateTimeSaveFormat` | `YYYY-MM-DDTHH:mm:ssZ` | `2026-10-13T17:00:00Z` |

Each satisfies the keyword that selected its control. **That is not a
coincidence, and it used to be false** — the defaults were `HH:mm:ss` and
`YYYY-MM-DD HH:mm`, while RFC 3339 requires seconds *and* an offset. A time
control went invalid the moment anyone used the picker, and the picker could
not repair it, because every value it could produce was invalid. See
[adjustments §25.1](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

`duration` is here too: `PT1H30M`, ISO 8601, staged in a picker that Cancel
discards, and `P0D` for zero.

### Seconds are a display decision, not a storage one

The save format always carries seconds — RFC 3339 requires them — but whether
they are **on screen** is the display format's business. §18: "seconds in the
format enable seconds interaction".

| Control | `timeFormat` | Shows | Picker columns |
| --- | --- | --- | --- |
| Start time | default | `09:30` | hour, minute |
| Start time, to the second | `HH:mm:ss` | `09:30:45` | hour, minute, **second** |

Both store a value with seconds. The difference is whether anyone can set
them — and that has a consequence worth knowing:

> **Seconds you cannot see are zeroed by the next edit.** Start from
> `09:30:45Z`, type `11:15` into the two-column control, and the stored value
> becomes `11:15:00…`. The seconds were never on screen to be preserved.

So if seconds carry meaning in your data, put them in the display format. If
they do not, the default is the right one and the trailing `:00` is honest.

### Overriding a save format here is a trap

Setting `timeSaveFormat: "HH:mm"` on a control that carries `format: "time"`
makes it write `23:03`, which that keyword rejects — an unfixable error that
reads like a display setting. The renderer now says so:

```
temporal.saveFormatInvalid: the save format "HH:mm" produces values that
`format: "time"` rejects, so the control cannot be made valid.
```

A console warning rather than a message in the form, because it is an
authoring mistake and the person filling in the form already sees the
validation error. This follows the precedent set for `Categorization`'s
`initial`.

If a house format is what you want, that is what the next tab is for.

## Selected by the UI schema

The schema says only `type: "string"`. `options.format` picks the renderer,
and nothing checks the shape.

| Control | Options | Stores |
| --- | --- | --- |
| Year and month picker | `format: "date"`, `views: ["year","month"]`, `dateFormat: "YYYY.MM"`, `dateSaveFormat: "YYYY-MM"` | `2027-01` |
| Opening time | `format: "time"`, `ampm: true`, `timeSaveFormat: "HH:mm"` | `08:00` |
| Opening time, to the second | the same, with `timeFormat`/`timeSaveFormat` carrying `ss` | `08:00:30` |
| Collection window | the same seconds-bearing formats, plus `views: ["hours","minutes"]` | `09:30:00` |
| Published at | `format: "date-time"`, `dateTimeFormat: "DD-MM-YY hh:mm a"`, `dateTimeSaveFormat: "YYYY/MM/DD h:mm a"` | `2026/11/02 3:05 pm` |
| Published at, to the second | the same, with `ss` in both | `2026/11/02 3:05:30 pm` |
| Published at, chosen to the minute | the same, plus `views: ["year","day","hours","minutes"]` | `2026/11/02 3:05:30 pm` |

Each of `time` and `date-time` appears **twice**, with and without seconds, so
the pair can be compared directly. On this side the save format is free too,
so a with-seconds control can store a bare `HH:mm:ss` — no offset, and nothing
to object.

**`08:00` is the point.** Under `format: "time"` it could never validate;
here there is no keyword to object, and it is exactly what the form wants to
store. The same goes for the third row, whose stored spelling is nobody's
standard but this form's.

`pattern` is the only validation available, and the first control uses it:
`^[0-9]{4}-[0-9]{2}$`. Type a month by hand that does not match and the error
appears — from `pattern`, not from any format.

### `views` names the panels, never the storage

`views` is **not date-only**. A date control takes `year`, `month`, `day`; a
time control takes `hours`, `minutes`, `seconds`; a date-time control takes
both.

| Control here | `views` | What changes |
| --- | --- | --- |
| Year and month picker | `["year","month"]` | The calendar stops at months |
| Collection window | `["hours","minutes"]` | The picker drops its **seconds column** |
| Published at, chosen to the minute | `["year","day","hours","minutes"]` | Only the time half applies |

**Compare "Opening time, to the second" with "Collection window."** The two
carry the *same* `timeFormat` and `timeSaveFormat` — both display and store
`HH:mm:ss` — and differ only by `views`. Open each: the first offers three
columns, the second two, and both still store seconds. That is the whole
point, and it is why the fixture demonstrates the option against a
seconds-bearing format rather than a convenient one.

Before this, granularity was **inferred from the save format** — no `D` meant
a month picker. That is the same coupling backwards: it let the storage decide
the interaction. The inference survives only as a fallback when `views` is
absent.

Two details worth knowing:

- **A date-time control applies only the time half.** Its picker always offers
  a full date, so narrowing the calendar would leave it unable to express a
  value it has to store. The date views in that array are accepted and
  ignored.
- **An array naming no view of a kind leaves that half to the display
  format**, rather than blanking it — so `views: ["year","month"]` on a *time*
  control changes nothing, instead of producing an empty panel.

### `ampm` is presentation

A twelve-hour display over whatever is stored. It changes no save format.

## Restricting the range

`formatMinimum`, `formatMaximum` and their exclusive forms limit **what the
picker offers**. Section 18: "the preventive bound behavior above follows
effective `restrict`".

| Property | Schema | Effect |
| --- | --- | --- |
| Booking date | `formatMinimum`/`formatMaximum` across October | Only October. Both bounds are themselves selectable. |
| Strictly after 19 October | `formatExclusiveMinimum: "2026-10-19"` | The 19th is greyed out; the first selectable day is the 20th. |
| Within office hours | a `time` range | Hours outside 09:00–17:00 are not offered. |
| Appointment slot | a `date-time` range | Days outside are greyed out; hours are narrowed on the **first and last day only**. |

### Exclusivity is resolved at the picker's precision

A calendar offering whole days cannot express "after the 19th but not the 19th
itself" — so an exclusive lower bound starts at the 20th and an exclusive
upper bound ends at the 18th. That is the specification's own worked example,
and the same stepping applies a minute at a time at minute precision.

### A bound never rewrites stored data

The last control has the same October bounds with **`restrict: false`** and a
value of `2026-12-24`. The picker offers every date, the value is left exactly
as it is, and validation still objects — "does not authorize clamping existing
data". This is the one deliberate error the example ships with.

The four keywords come from `ajv-formats`, not JSON Schema, and Ajv compares
them only when the schema carries a `format` it can order — so they belong on
the schema-based side and do nothing for a UI-selected control.

### One divergence, deliberate

`restrict` resolves from element `options.restrict`, then
`config.jsonformsExtended.restrict`, then **`true`** — §15's "shared preferred
default". The flat `config.restrict` is *not* consulted, because JSON Forms
core seeds it to `false` and, once merged, an author's `false` cannot be told
from that seed. Reading it would make the specified default unreachable.

## In other structures

The same controls, reached the way a real schema reaches them.

### A `$ref` shared by two properties

```json
"$defs": { "dateRange": { "type": "object", "properties": {
  "from": { "type": "string", "format": "date" },
  "to":   { "type": "string", "format": "date", "formatMinimum": { "$data": "1/from" } }
} } }
```

`bookingPeriod` and `reportPeriod` both point at it. Each gets its own pickers
and its own data; the definition is shared, the state is not.

### `$data`: one end of a range against the other

`formatMinimum: { "$data": "1/from" }` is why the bound keywords are worth
having in pairs. The pointer is a **JSON Relative Pointer**, relative to the
instance: `1/from` means up one level from `to`, then `from`. Invert a period
and the error appears on `to`.

The picker honours it too — the calendar for `to` greys out everything before
`from`, and follows along as `from` changes.

> **This needs a validator that enables `$data`.** Ajv rejects the schema at
> *compile* time otherwise — `formatMinimum value must be ["string"]` — so the
> form does not degrade, it stops. JSON Forms' plain `createAjv()` does not
> enable it; `createFormsAjv()` does, and the web component uses it by
> default.

### Both tuple spellings

`prefixItems` (2020-12) and the draft-07 `items` array describe the same pair
of positions, and **the renderer handles both**. The validator does not:

| Spelling | Renders | Validates the positions |
| --- | --- | --- |
| `items: [ … ]`, `additionalItems: false` | yes | **yes** |
| `prefixItems: [ … ]` | yes | **no** — the keyword is ignored |
| `prefixItems: [ … ]`, `items: false` | yes | **rejects everything** |

JSON Forms configures a draft-07 Ajv, which has never heard of `prefixItems`.
The last row is the trap: to a draft-07 validator `items: false` reads "no
items at all", so every element is rejected and the form can never be made
valid. The fixture therefore uses `prefixItems` *without* it, and accepts that
its positions go unchecked.

If you need the 2020-12 semantics, supply an Ajv built from `ajv/dist/2020` —
verified to validate positions, reject a bad one and reject an extra item.

This is the same lesson as the tabs above, one level up: **the renderer
understands more of the schema than the validator does.**

### A mixed type

`{"type": ["string", "null"], "format": "date"}` gets a type selector and, on
the string branch, the ordinary date picker.

## Expected behaviour

| Action | Result |
| --- | --- |
| Open a schema-based picker and choose | The field shows the display format; the data takes a value the keyword accepts. |
| Clear a value | Empty, not today's date. |
| Clear **Appointment date** | Required — "Choose an appointment date." |
| Type a bad month in the second tab | A `pattern` error; no format is involved. |
| Compare the two **Opening time** controls | Same data shape, one with a seconds column and one without. |
| Edit the two-column time | The seconds become `00`; they were never on screen. |
| Open **Year and month picker** | Months, not days — and the save format has no bearing on that. |
| Open **Booking date** | September and November are greyed out. |
| Open **Strictly after 19 October** | The 19th is greyed out; the 20th is not. |
| Open **Same bounds, restrict off** | Every date is offered, and the error stays. |
| Invert a booking period | `to` reports `formatMinimum`, and its calendar greys out the earlier days. |
| Change **From** | The bound on **To** follows it. |

## Not implemented

From gaps §6.5 and §7.4:

| Missing | Consequence |
| --- | --- |
| `showActions`, `okLabel`, `cancelLabel` on the pickers | Picker edits commit immediately; nothing to stage or cancel. (The duration control does have this.) |
| `mask` | No format-aware typing mask, and therefore no `mask: false` opt-out. |
| `pickerIcon`, `clearable`, `timezone` / `saveTimezone` | Not read. `allowClear` follows `enabled` unconditionally. |
| Localized `L` / `LT` display defaults | Hard-coded `YYYY-MM-DD` and `HH:mm` instead of the localized token with those as fallbacks. |
| Duration: guided text editing, partial-prefix drafts | Typing commits each partial string directly. (The field labels **are** localized now — see below.) |

There is also a **second, competing renderer**: `NativeControl` matches
`isDateControl` / `isTimeControl` at rank 2 and renders a bare
`<input type="date">`. The pickers win at rank 4 in the default registry, but
a consumer assembling a partial registry can get the native input unexpectedly.

### The duration picker follows the locale

Switch **Locale** to German or Bulgarian with the picker open. Its unit
labels, the years-to-seconds / weeks mode switch, the add and remove actions
and the Apply and Cancel buttons all change language — and this example's
`translations.json` defines none of them.

That is the point of it: a form's catalog is authored for the form's own
labels, so the renderer set's own strings have to come from somewhere else.
They fall back to the **locale bundle** for the current language and only then
to English, which is what antd already does for a calendar's month names. See
[adjustments §6.5](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

Switch to a language no bundle carries — Japanese — and the picker is English
again while the rest of the form is unaffected. A missing bundle degrades to
English rather than to blank labels.

### Timezone display

A valid `time` or `date-time` carries an offset, and the picker shows it in
the **viewer's** timezone — `09:30:00+02:00` reads as `03:30` in a UTC−4
browser, and editing writes the browser's offset. The fixture stores `Z`
values so the data is unambiguous, and the tests assert the *shape* of a
displayed time rather than a wall clock. `timezone` / `saveTimezone` are
PROVISIONAL in the specification and unimplemented, so there is no way to
express a different intent yet.

## Status

**Partial**, as above — but the save formats, the format bounds and `views`
are implemented, and all three were fixed or added for this example. See
[adjustments §25](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

Covered by `temporalControlsExample.test.tsx` for this fixture,
`temporalSaveFormats.test.tsx` for what a picker commits, which days a
calendar disables and the save-format diagnostic, and `temporalBounds.test.ts`
for the bound arithmetic and the picker granularity.
