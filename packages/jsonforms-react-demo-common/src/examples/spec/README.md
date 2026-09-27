# Spec examples

Every spec in [`client/docs`](../../../../../docs) has a worked example here.
An example is a folder of authored JSON plus a README, so it reads as
documentation and runs in the demo app without being transcribed first.

They live in this package, rather than beside the specs, so they are **runnable**:
each registers itself with the demo and appears in its example list under a
`Spec: ` label. Open the demo (`pnpm run demo` from `client/`, or the
`jsonforms-react-antd-demo` app) and pick the entry to edit the form live.

## Index

| Example | Demo entry | Specs covered | Domain |
| --- | --- | --- | --- |
| [additional-properties](additional-properties/) | Spec: Additional properties | Portable spec §18 — dynamic properties, empty-name policy, literal-key editing; §19 honest rendering; [Adjustments §14](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Inventory metadata |
| [container-validation-indicator](container-validation-indicator/) | Spec: Container validation indicator | [Container validation indicator](../../../../../docs/jsonforms-container-validation-indicator-spec.md), [Adjustments §1 — configuration namespacing](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Employee onboarding |
| [destructive-confirmation](destructive-confirmation/) | Spec: Destructive-change confirmation | Portable spec §14 — shared destructive-change confirmation; [Adjustments §17](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Dispatch cleanup |
| [group-layout](group-layout/) | Spec: Group layout | Portable spec §8 — Group: collapsible, collapsed, data indicator; §6 layout composition | Carrier record |
| [split-layout](split-layout/) | Spec: Split layout | Portable spec §7 — splitter variant, initial sizes, resizable; [Adjustments §21.7](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Dispatch board |
| [label-interpolation](label-interpolation/) | Spec: Label interpolation | Portable spec §9 — interpolation and internationalizable text; §10 — Markdown; §11.4 — template grammar; [Adjustments §37](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Subscription billing |
| [layout-sizing](layout-sizing/) | Spec: Layout sizing | Portable spec §6 — layout types and semantics; §7 — wrap, defaults and Spacer; [Adjustments §21](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Order intake |
| [markup-label](markup-label/) | Spec: Markup labels | Portable spec §10 — Markdown policy; §12 — URL policy; §9 — text and markup; [Adjustments §35](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Workshop registration |
| [mixed-control](mixed-control/) | Spec: Mixed control | Portable spec §18 — mixed-value control and deep-structure navigation; §19 honest rendering; [Adjustments §15](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Product listing attributes |
| [null-control](null-control/) | Spec: Null control | Portable spec §18 — null control; §19 honest rendering; shared clear-value contract | Dispatch declarations |
| [object-control](object-control/) | Spec: Object control | Portable spec §18 — object controls, detail selection and nesting; object-level errors and errors without rendered targets; §19 honest rendering; [Gaps §6.1](../../../../../docs/jsonforms-react-antd-implementation-gaps.md) | Consignee profile |
| [numeric-controls](numeric-controls/) | Spec: Number and integer controls | Portable spec §18 — number/integer controls, numeric parsing limits, slider | Warehouse stock line |
| [array-choices](array-choices/) | Spec: Array choices and tokens | Portable spec §18 — array choices and tokens, multi-choice identity and safe removal; §19 honest rendering; [Adjustments §16](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Notification preferences |
| [array-controls](array-controls/) | Spec: Array controls | Portable spec §18 — array tables, expandable item forms, ListWithDetail, shared action options, item labels, Add-item initialization, array-level errors, `contains`; §21 AG Grid array control; [Gaps §6.2–6.4](../../../../../docs/jsonforms-react-antd-implementation-gaps.md) | Conference programme |
| [boolean-controls](boolean-controls/) | Spec: Boolean controls | Portable spec §18 — boolean checkbox and switch, table cells; §19 honest rendering | Onboarding consent |
| [categorization](categorization/) | Spec: Categorization: tabs, stepper, accordion | Portable spec §8 — categorization, accordion, container visibility; [Adjustments §10](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Equipment order |
| [additional-errors](additional-errors/) | Spec: Additional errors: server and editor | Portable spec §21 — Monaco `propagateErrors`; §18 additional-error ownership; [Adjustments §31](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Deployment notes |
| [choice-controls](choice-controls/) | Spec: Choice controls | Portable spec §18 — radio layout, choice identity; [Adjustments §7](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Delivery options |
| [color-control](color-control/) | Spec: Color control | Portable spec §18 — color control; [Adjustments §8](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Shipping label theme |
| [cron-control](cron-control/) | Spec: Cron control | [Adjustments §39](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) — cron picker; Portable spec §5 schema vs UI format selection; §18 shared clear-value contract, pending edits and cancellation; [Adjustments §30](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) validator profile | Overnight replenishment job |
| [pre-touch-errors](pre-touch-errors/) | Spec: Pre-touch error filtering | Portable spec — error-message filtering before touch; §19 honest rendering; [Gaps §26](../../../../../docs/jsonforms-react-antd-implementation-gaps.md) | Carrier onboarding |
| [password-control](password-control/) | Spec: Password control | Portable spec §18 — password interaction; §5 schema vs UI format; table cells; [Adjustments §9](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Account credentials |
| [string-controls](string-controls/) | Spec: String controls | Portable spec §18 — masked string control, placeholder hints, Unicode length; §5 `multi`/`mask`; §19 honest rendering; [Adjustments §11](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Customer intake |
| [template-layout](template-layout/) | Spec: Template layout: three engines | Portable spec §13 — TemplateLayout profiles and language resolution; §14 script-evaluation permission; [Adjustments §22](../../../../../docs/jsonforms-extended-ui-model-adjustments.md), [§29](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Event registration |
| [tuple-control](tuple-control/) | Spec: Tuple control | Portable spec §18 — tuple control, Add-item initialization, complex position dialogs; §19 honest rendering; [Adjustments §13](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Work order |
| [validator-profile](validator-profile/) | Spec: Validator profile (Ajv) | Portable spec §15 — extended validator profile; §9 internationalizable text; §14 script-evaluation permission; [Adjustments §30](../../../../../docs/jsonforms-extended-ui-model-adjustments.md) | Course enrolment |

The portable
[UI model specification](../../../../../docs/jsonforms-extended-ui-model-spec.md) carries its own
examples inline and is not covered here; it is a verbatim upstream copy.

## One example per group of specs, not per spec

Specs that are cross-cutting, or that are only meaningful together, **share one
example**. The alternative — one folder per spec — produces a pile of
near-identical forms that nobody reads and that drift apart.

Group when the specs would otherwise repeat the same form, when one spec's
option only appears in the context of another, or when a reader needs to see
them interact. Split when the specs have genuinely different domains, or when a
combined example would need contrived data to exercise both.

The covering README names every spec it serves, and each spec links back to it.
A spec with no example is incomplete.

## Folder layout

```text
<example-id>/
  README.md          required
  index.ts           required - registers the example with the demo
  schema.json        required
  uischema.json      required
  data.json          required
  config.json        when the example depends on global config
  uischemas.json     when the example registers detail UI schemas
                     (or uischemas.ts, when an entry needs a tester function)
  translations.json  when the example shows labels, messages or i18n behavior
```

Include only the JSON files the example actually uses. An empty
`uischemas.json` is noise; its absence is information.

`index.ts` imports the JSON and calls `registerSpecExamples`, which applies the
`spec-` name and `Spec: ` label prefixes and builds the translator:

```ts
registerSpecExamples([
  {
    id: 'container-validation-indicator',
    label: 'Container validation indicator',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
    config,
    translations,
  },
]);
```

Then add `import './<example-id>';` to [`index.ts`](index.ts) in this folder.

`translations.json` holds every locale in one object keyed by locale code.
Section 24 of the portable specification asks for **English and Bulgarian**
dictionaries, so supply both, with the same keys in each:

```json
{
  "en": { "error.required": "This field is required." },
  "bg": { "error.required": "Полето е задължително." }
}
```

`registerSpecExamples` keeps the catalogs on the registered example, beside the
`i18n` state it builds from them. That matters for two reasons:

- **The demo's locale switcher works.** JSON Forms' `Translator` is
  `(id, defaultMessage, values)` and receives no locale, so a translator built
  once cannot follow the switcher. The demo rebuilds it from the catalogs
  whenever the locale changes.
- **The Internationalization tab shows `translations.json` verbatim** — the
  locale codes at the top level, nothing wrapped around them. `i18n.translate`
  is a function, so an example that carries only `i18n` serializes to
  `{"locale":"en"}` there: the messages are invisible and, worse, applying the
  tab would replace `translate` with nothing. Editing a message and pressing
  apply now updates the form; which locale is active comes from the demo's
  locale switcher, not from this document.

Keep the same keys in every locale. The tests assert this, so a locale cannot
silently fall back to English through a missing key.

**Give every unbound element an `i18n` prefix.** A `Control` gets one derived
from its data path, but a `Group`, `Category`, `Link`, `Label` or other
scope-less element does not: core can only use `uischema.i18n`, and without it
the lookup key is the literal label text, so the catalog entry is never
consulted. A plain Group may hold controls from several objects, so there is
nothing for core to correlate it with.

The demo's **Link** example shows both sides: three links carry a prefix and
switch language with the demo's locale, a fourth carries none and stays English
in every locale.

## What a README must contain

1. **Example ID** — stable, matching the folder name — **domain**, and a list of
   the **specs covered**, each as a link.
2. **Files** table, saying what each one is for and why any optional file is
   absent.
3. **What the form contains** — a sketch of the rendered structure. A short
   `text` block beats prose here.
4. **Validation state** — the errors the supplied data actually produces,
   verified against a validator rather than asserted from reading.
5. **Expected behavior** — what a conforming renderer does, pointing at the
   numbered sections of the spec it demonstrates.
6. **Fallback behavior** — what happens when the option is absent, when the
   renderer does not implement it, and under the relevant validation modes.
7. **Status** — implemented, partially implemented, or target only. Say plainly
   when an example describes behavior that does not exist yet.

## Conventions

- **Business-friendly data**, per §24: realistic names, labels and constraints
  from a recognizable domain. No `aProp`, `x`, `foo`.
- **Deliberately invalid data is good** where the example is about validation,
  but the README must say exactly which errors are expected and why.
- **Verify before documenting.** Validate the data against the schema and paste
  the real errors. A README that describes errors the fixture does not produce
  is worse than no README.
- **Keep JSON authored, not generated** — these are read by people.
