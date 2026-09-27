# Adjustments to the portable UI model specification

> **Open items** raised by these adjustments - including the two TODOs in
> Adjustment 20 - are collected in [TODO.md](TODO.md).

**Status:** house rules, applied on top of the portable specification.\
**Scope:** amendments, additional constraints and interpretations this project
applies to
[the JSON Forms Extended UI Model Specification](jsonforms-extended-ui-model-spec.md).

[jsonforms-extended-ui-model-spec.md](jsonforms-extended-ui-model-spec.md) is a
**verbatim copy** of the upstream document and is never edited here. Every
adjustment, clarification or additional rule goes in this file instead, so the
copy can be refreshed from upstream with a plain overwrite and the deltas stay
visible.

Each adjustment states whether it **adds** a rule the specification leaves open,
**narrows** something the specification permits, or **differs** from it. A
differing adjustment must say so plainly; it is a divergence we are choosing,
not a reading of the text.

---

## Adjustment 1 — Configuration namespacing

**Type:** adds. The specification fixes the namespace for a handful of named
blocks and for five individual options. It states no general rule for where a
*new* option belongs. This adjustment supplies that rule.

### 1.1 The rule

Placement of a **global JSON Forms `config`** key is decided by where the option
comes from:

| Origin | Config placement |
| --- | --- |
| JSON Forms core, or an established renderer convention of official Material, Vuetify, or the inspected Vuetify/Svelte families | **Top level**, under its established name |
| A portable project extension — defined in the specification but not upstream | Under the **`jsonformsExtended`** namespace |
| JSON Forms React Renderers-specific, not in the portable specification at all | Under the **`jsonforms-react-renderers`** namespace |

The reason for the middle tier is collision avoidance: an option we invent today
must not clash with an option upstream invents tomorrow under the same name. The
specification already applies this reasoning to its own blocks —

> Global JSON Forms config supplies confirmation policy under the project-owned
> `jsonformsExtended` namespace **to avoid collisions with other
> implementations**

— and this adjustment simply makes it the default for every project extension
rather than a case-by-case choice.

The third tier keeps portable extensions separable from things that exist only
because of JSON Forms React Renderers's product. Anything under `jsonforms-react-renderers` is by definition
outside the portable model and carries no expectation that another
implementation reproduces it.

### 1.2 Per-element `options` stay flat

**Per-element `uischema.options` are not namespaced.** Only the global `config`
bag is.

This follows the specification's own worked example, which is the one project
extension that has both a global and a per-element form:

```json
{ "jsonformsExtended": { "confirmation": { "default": "always" } } }
```

```json
{
  "type": "Control",
  "scope": "#",
  "options": { "confirmation": { "typeChange": "never" } }
}
```

with the documented resolution order:

> 1. Element `options.confirmation[operation]`.
> 2. Config `jsonformsExtended.confirmation.renderers[catalogId][operation]`.
> 3. Config `jsonformsExtended.confirmation.default`.
> 4. Documented fallback.

Three reasons this is right, beyond the precedent:

1. **Some names cannot move.** `variant` is a reserved portable name and a
   dispatch input; `type`, `scope`, `elements`, `rule`, `label`, `src`, `alt`
   and `href` are element fields, not options. A blanket "namespace everything
   ours" rule is not expressible for them.
2. **The collision risk is already managed for options.** §23 reserves the
   portable option names, and §1 requires that "Unknown renderer namespaces MUST
   be preserved and ignored by non-matching renderers." The global `config` bag
   has no equivalent protection, which is why it is the one that needs the
   namespace.
3. **Tester inputs read `uischema.options` directly.** Core's `optionIs` tester
   reads a flat option; moving selection-bearing options into a nested object
   would break renderer selection.

Where a project extension needs both forms, mirror the confirmation shape:
element `options.<name>` flat, global `config.jsonformsExtended.<name>`.

### 1.3 The namespaces are constants in code

`jsonformsExtended` and `jsonforms-react-renderers` are referred to through exported constants,
never as inline string literals, so either can be renamed in one place:

```ts
import {
  JSONFORMS_EXTENDED_CONFIG_KEY,
  JSONFORMS_CONFIG_KEY,
} from '@chobantonov/jsonforms-react-extended-renderers';
```

JSON cannot reference a constant, so **authored UI schemas, config documents,
examples and test fixtures spell the key literally**. The constants exist for
the code that reads them; the wire format is the literal string. Any rename is
therefore a breaking change to authored documents and needs a migration, not
just a constant edit — the constant limits the blast radius in code, it does not
remove the compatibility question.

### 1.4 Options the specification already places explicitly

These are fixed by the specification text and are **not** subject to the rule
above, whatever their origin looks like:

| Option | Placement | Specification wording |
| --- | --- | --- |
| `showUnfocusedDescription`, `hideRequiredAsterisk` | Top level | "these established names do not belong under jsonformsExtended" |
| `disableAdd`, `disableRemove` | Top level | "retain the established config.disableAdd/config.disableRemove locations rather than introducing names under jsonformsExtended" |
| `restrict` | Top level | "The option is not duplicated under `jsonformsExtended`" |
| `layoutDefaults`, `dynamicValues`, `security`, `markup`, `confirmation` | `jsonformsExtended` | §12, §14 |

### 1.5 Worked shape

```json
{
  "config": {
    "restrict": true,
    "disableAdd": false,
    "showUnfocusedDescription": true,
    "hideRequiredAsterisk": false,
    "dateSaveFormat": "YYYY-MM-DD",

    "jsonformsExtended": {
      "layoutDefaults": { "gridColumns": 16, "gap": 16, "wrap": false },
      "dynamicValues": { "enabled": false },
      "security": { "allowScriptEvaluation": false },
      "markup": { "markdown": { "enabled": true, "profile": "basic" } },
      "confirmation": { "default": "always" },
      "showValidationIndicator": true
    },

    "jsonforms-react-renderers": {}
  }
}
```

### 1.6 Classification of the options this project reads

Provenance decides the tier. Where the specification's own origin note is
ambiguous the entry is marked **unresolved** rather than guessed.

**Top level — core or an established renderer convention**

`multi`, `toggle`, `slider`, `format` (password / date / time / date-time /
color / radio / table), `autocomplete`, `dateFormat`, `dateSaveFormat`,
`timeFormat`, `timeSaveFormat`, `dateTimeFormat`, `dateTimeSaveFormat`, `ampm`,
`showActions`, `okLabel`, `cancelLabel`, `views`, `pickerIcon`, `mask` and its
token options, `placeholder`, `focus`, `clearable`, `detail`,
`elementLabelProp`, `showSortButtons`, `initCollapsed`, `collapseNewItems`,
`hideAvatar`, `hideArraySummaryValidation`, `disableAdd`, `disableRemove`,
`restrict`, `showUnfocusedDescription`, `hideRequiredAsterisk`,
`enableFilterErrorsBeforeTouch`, `filterErrorKeywordsBeforeTouch`,
`showNavButtons`, `vertical`, `variant: "stepper"`.

**`jsonformsExtended` — portable project extension**

Config blocks `layoutDefaults`, `dynamicValues`, `security`, `markup`,
`confirmation`; and the config defaults for `collapsible`, `collapsed`,
`showDataIndicator`, `initial`, `rows`, `resizable`, `showBorder`,
`allowAdditionalPropertiesIfMissing`, `allowEmptyPropertyNames`,
`agGridOptions`, `gridHeight`, `gridWidth`, `language`, `convertJson`,
`propagateErrors`, `monaco`, `colorSaveFormat`, `accept`, `table`, `cells`,
`showEmptyButton`, `showRemoveButton`, `emptyLabel`, `removeLabel`,
`showValidationIndicator`.

Variant values that are project extensions — `accordion`, `splitter`, `chips`,
`multi-select`, `tuple`, `ag-grid` — remain values of the reserved `variant`
option and are not relocated.

**`jsonforms-react-renderers` — not in the portable specification**

`columns` (the React horizontal-sizing encoding), `trim` (which the
specification explicitly excludes), `:language` (the Monaco dynamic-language
compatibility encoding), Monaco `theme` / `mode`, the TemplateLayout JSX
profile, the file control's `format: "uri"` storage branch, and the legacy
aliases `showArrayTableSortButtons`, `showArrayLayoutSortButtons`,
`childLabelProp`.

Each of these is a candidate for removal rather than relocation; see §8 of the
[implementation-gaps document](jsonforms-react-antd-implementation-gaps.md).

**Unresolved**

`step` and `suggestion`. The specification describes both inside sections whose
origin note mixes "existing JSON Forms control conventions" with "this project's
target contract", and does not attribute the individual option. Resolve before
either is given a config default.

### 1.7 Migration

No option is relocated by this adjustment on its own. Nothing in the React
renderer set currently reads a config key under `jsonformsExtended`, so there is
no live behavior to preserve — but authored documents and the demo examples do
use flat keys today, and moving a key is a breaking change to them.

Sequence, when a key is relocated:

1. Read the namespaced location first, fall back to the flat one.
2. Emit a deprecation diagnostic when only the flat location resolves.
3. Update the demo examples and fixtures to the namespaced spelling.
4. Drop the fallback in a release that says so.

New options adopt the correct tier immediately and need no fallback.

---

## Adjustment 2 — Container validation indicator

**Type:** adds. The specification defines an aggregated-error indicator for
arrays only and says nothing about Group or Categorization headers.

Specified separately in
[jsonforms-container-validation-indicator-spec.md](jsonforms-container-validation-indicator-spec.md).
Its `showValidationIndicator` option follows Adjustment 1: element
`options.showValidationIndicator` flat, global
`config.jsonformsExtended.showValidationIndicator`.

**Implemented for Group, and for Category in the tabs and stepper
presentations**, both defaulting to off so no existing form changes appearance.
Outstanding: array toolbars and item headers, ListWithDetail rows, tuples, and
accordion categorization - the last two because those renderers do not exist.

Two constraints are **not** met and must not be claimed:

- **Pre-touch filtering is ignored.** The specification requires the indicator
  to respect `enableFilterErrorsBeforeTouch` and to reappear once a child is
  touched. No touch state exists anywhere in the React renderer set, so this
  cannot be honoured until that is built.
- **Array containers keep their existing behaviour.** Array toolbars are passed
  the array's *own* combined error message rather than descendant errors, so
  adding an indicator there means separating the two first and implementing
  `hideArraySummaryValidation` with the precedence in §6 of the spec.

Errors are attributed through core's `getControlPath`, not the raw
`instancePath`. ajv reports `required` on the *containing object* -
`/contact` with `params.missingProperty: 'phone'` - and core relocates it to
`contact.phone`, which is where the message appears. Matching raw instance
paths made a required error invisible to every container bound below that
object, so clearing a field made its indicator vanish rather than update.
`dependencies` and `additionalProperties` relocate the same way.

The count is of **validator errors, not controls**: two Controls bound to one
property share a single error object and count once. `showValidationIndicatorCount`
turns the number off, which also skips the pass over the errors that computes it.

Nesting is settled: **suppression is local only.** `showValidationIndicator:
false` hides the marker on the element carrying it and does not stop those
errors counting toward an ancestor, keeping the option purely presentational.

**Example:** [`../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/`](../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/),
which serves this adjustment too — its `config.json` is the worked
demonstration of §1.5.

---

## Adjustment 3 — Every spec carries a worked example

**Type:** adds. The specification requires a business-friendly example catalogue
(§24) but does not say where examples live or what shape they take.

Every document in `client/docs` ships a worked example under
[`../packages/jsonforms-react-demo-common/src/examples/spec/`](../packages/jsonforms-react-demo-common/src/examples/spec/): a folder of authored JSON — schema, uischema, data, and
`config` / `uischemas` / `translations` where the example needs them — beside a
README that describes it and links to the spec it serves. A spec without an
example is incomplete.

The examples live in the demo package rather than beside the specs so that they
**run**. Each registers itself with the demo app under a `Spec: ` label, so a
reviewer can open the form, edit it and see the behavior instead of reading
JSON. Keeping them in `docs/` would have meant maintaining a second copy or
transcribing them by hand.

Specs that are cross-cutting, or only meaningful together, **share one example**
rather than each getting a near-identical form. The covering README names every
spec it serves; each spec links back to it.

The conventions, required README sections and folder layout are in
[`../packages/jsonforms-react-demo-common/src/examples/spec/README.md`](../packages/jsonforms-react-demo-common/src/examples/spec/README.md). Two that matter most:

- Data is business-friendly per §24, with English and Bulgarian catalogs.
- A README's stated validation errors are **verified against a validator**, not
  asserted from reading the schema.

---

## Adjustment 4 — The data-presence indicator carries a tooltip

**Type:** narrows. The specification requires an accessible label; this adds a
visible tooltip and fixes the default wording and key.

### 4.1 The requirement

Where a Group renders the `showDataIndicator` marker, that marker carries a
**tooltip** explaining what it means. A bare dot is not self-describing: a
reader cannot tell whether it signals data, validity, completion or unsaved
work — three of which the specification explicitly says it does *not* mean.

The specification asks only for an accessible label:

> Provide a localized accessible label such as "Contains data" rather than
> relying solely on the visual marker.

This adjustment keeps that requirement and adds a visible tooltip alongside it,
so sighted pointer and keyboard users get the same explanation a screen-reader
user already gets.

| Requirement | Detail |
| --- | --- |
| Tooltip | Shown on hover **and** on keyboard focus. A hover-only tooltip is unreachable by keyboard and absent on touch. |
| Accessible name | Retained on the marker, carrying the same text. The tooltip supplements it; it does not replace it. |
| Localization | Through the ordinary translator, like every other renderer string. No hard-coded English. |
| Marker alone | Never the only signal. Color and shape do not communicate meaning on their own. |
| Drawing | **SVG**, in antd's icon box: `1em` square, `currentColor`, `viewBox="64 64 896 896"`. See §4.5. |
| Header height | The marker must not stretch the header it sits in. See §4.5. |

### 4.2 Translation key

| Key | Default (en) | Default (bg) |
| --- | --- | --- |
| `group.dataIndicator` | `Section contains data` | `Секцията съдържа данни` |

The Bulgarian column is the **shipped bundle** (§6.5), not an example's
catalog: a form that defines nothing still gets it. A catalog that does define
the key wins — the worked example below says `Съдържа данни`, because the word
"section" is redundant inside a section header it is already attached to.

One key serves both the tooltip text and the accessible name, so the two cannot
drift apart. It resolves through the form's translator with the default as
fallback, following the shared translation conventions.

### 4.3 The wording says "data", never "edits"

The indicator answers one question: **does anything in this section hold a
value?** It is computed from the current data, so it appears for values that
arrived from the server and were never touched.

The established precedent is Camunda's BPMN properties panel, which marks
collapsed sections — General, Implementation, Asynchronous continuations — with
exactly this dot. There it means the section has values configured, and it shows
on load whoever set them.

**"Section contains edits" was considered and rejected.** It claims something
the indicator does not check. The specification is explicit that the marker

> means only that data is present; it does not imply validity, completion,
> required-field satisfaction, or **unsaved changes**.

A form loaded with prefilled data would have announced "Section contains edits"
before the user typed anything — in the worked example, the Emergency contact
group is populated from `data.json` and shows the dot immediately.

If an "edited since load" indicator is ever wanted, it is a **different
indicator** with a different rule: it needs a baseline to compare against, which
`showDataIndicator` has no concept of. It must not be built by relabelling this
one.

### 4.4 Implementation status

**Implemented** in the React + antd renderer set.
[`GroupLayout.tsx`](../packages/jsonforms-react-antd-renderers/src/layouts/GroupLayout.tsx)
wraps the marker in an antd `Tooltip` with `trigger={['hover', 'focus']}`, gives
the span `tabIndex={0}` so the explanation is reachable by keyboard, and reads
`group.dataIndicator` through `useI18n`. One string feeds both the tooltip and
the `aria-label`.

`useI18n`, and not the raw translator, is load-bearing here. It used to call
`translate?.('group.dataIndicator', i18nDefaults['group.dataIndicator'])`,
which supplies the English string as the **default message** — and that is
precisely where the locale bundle is delivered (§6.5). The indicator therefore
stayed English under any locale whose catalog did not define the key, which is
the usual case. `useI18n` still resolves the translator from context rather
than through `withTranslateProps`, so the named `GroupLayoutRenderer` export
stays usable on its own — several tests mount it directly.

Covered by `test/groupDataIndicatorTooltip.test.tsx`. An antd `Tooltip` cannot
be opened in jsdom, so those tests replace it with a stub that renders its title
and trigger list, checking the wiring rather than the hover.

Not yet implemented for other renderer sets.

**Example:** the data indicator is enabled on the Emergency contact group in
[`../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/`](../packages/jsonforms-react-demo-common/src/examples/spec/container-validation-indicator/),
whose `translations.json` carries `group.dataIndicator` in both locales.

### 4.5 One drawing mechanism, and no extra header height

**Every container marker is an SVG in antd's icon box.** Not a text glyph, not
a CSS shape. The data indicator and the error indicator sit side by side, so a
mismatch is immediately visible:

| Mechanism | Why not |
| --- | --- |
| Text glyph (`●`) | Rendered by whatever font the platform picks, so its optical size and baseline differ from an icon beside it. It cannot be aligned reliably. |
| CSS shape (`border-radius`) | Crisp, but a third mechanism to keep in sync, sized in pixels rather than from `fontSize`, and aligned by hand. |
| **SVG in the icon box** | Resolution independent, takes its size from `fontSize` and its color from `color`, identical metrics to every antd icon. |

`@ant-design/icons` has no plain filled circle - every `*CircleFilled` carries
a symbol - so the data dot is drawn as a circle in the same box and with the
same attributes as the icons beside it. Both markers go through one shell,
`ContainerIndicator`, which owns the tooltip, the accessible name, the focus
target and the box.

**The markers must not make the header taller.** They use the body font size,
which is smaller than a header's line box, and both the marker and the row that
holds them set `lineHeight: 0` so their inline boxes contribute no leading. A
16px icon in a 14px-based header, or a marker with default line height, grows
the row by a few pixels and the whole form shifts.

---

## Adjustment 5 — Container indicators are computed from an index

**Type:** adds. The specification defines what an indicator means; it says
nothing about how to compute one. This fixes the shape, because the obvious
implementation does not scale and the correct one is also the fastest.

### 5.1 Never scan the error list per container

The naive implementation asks each container "are any of these errors mine?",
which is O(containers x errors) and reruns on every render. Measured over 242
containers in an 880-field form:

| Errors | Per container scan | Ancestor index | |
| --- | --- | --- | --- |
| 10 | 0.275 ms | 0.007 ms | 39x |
| 50 | 1.137 ms | 0.019 ms | 60x |
| 200 | 3.692 ms | 0.067 ms | 55x |
| 1000 | 9.005 ms | 0.334 ms | 27x |

At 1000 errors the scan consumes over half a 16 ms frame. The index stays at a
third of a millisecond.

**Build the index once per validation.** Walk each error's `instancePath` and
add every ancestor prefix to a `Set`:

```text
error at /emergencyContact/phone
  ->  add ''  ,  'emergencyContact'  ,  'emergencyContact.phone'
```

A container's check is then `index.has(path)` - O(1). Building costs
O(errors x depth), and depth is three to five in practice.

**Share it.** A `useMemo` per container rebuilds the index per container and is
worse than the scan. Key a module-level `WeakMap<ErrorObject[], Set<string>>`
on the errors array: core replaces that array on each validation, so identity
works as the cache key, stale entries are collected, and no provider has to be
wired into a tree we do not always control.

**Correctness falls out.** The specification requires that `employees.10.name`
must not count as an error for `employees.1`. An ancestor set gives that for
free: `employees.10.name` inserts `employees`, `employees.10` and
`employees.10.name`, never `employees.1`. A `startsWith` test is where that bug
would otherwise live, and there is no `startsWith` here.

### 5.2 Scope-less containers collect their descendants once, for both indicators

A Group or Category has no data path - the same reason it needs an explicit
`i18n` prefix - so there is no single key to look up. Its descendants are
whatever its child Controls' scopes resolve to.

Collect those paths **once per UI-schema element**, cached by element identity.
The collection depends only on the UI schema, so it does not belong in a
per-render code path at all. Arrays, array items and object controls do have a
path of their own and need a single lookup instead.

**One traversal serves both indicators.** They ask different questions of the
same set of bound paths, so walking the subtree twice would be waste:

| Indicator | Question | Uses |
| --- | --- | --- |
| Data presence | does any bound value exist? | the scope segments, resolved against the container's data context |
| Errors | is any bound path in the error index? | the same paths, dotted and prefixed with the container's data path |

`collectBoundPaths` in
[`util/groupState.ts`](../packages/jsonforms-react-antd-renderers/src/util/groupState.ts)
returns both forms from one cached walk, and `boundDataPaths` applies the
container path for the error side. Run the traversal when **either** indicator
is enabled, not once per indicator.

The boundary rule survives the combination: an index built from `/items/10/a`
holds `items`, `items.10` and `items.10.a`, so a Group inside `items.1` finds
no match. `test/groupState.test.tsx` pins that case.

Nothing consumes the error side yet - that indicator is still the proposal in
Adjustment 2 - but the traversal it needs is in place and shared.

### 5.3 Applied to `showDataIndicator`

The data-presence indicator had the same defect and was already shipping. Per
render, for every group, `groupHasData` re-resolved `Resolve.data(data, path)`
for **each** Control - the same answer every time - and re-split every scope
string that had not changed since the form was authored.

Fixed in
[`util/groupState.ts`](../packages/jsonforms-react-antd-renderers/src/util/groupState.ts):

- `collectBoundPaths` walks the subtree once per element, cached in a
  `WeakMap`, so scope strings are split once rather than per render.
- The item context is resolved once for the whole subtree instead of per
  Control.
- `useGroupState` wraps the result in `useMemo` keyed on the data, so
  collapsing a panel, switching locale or any unrelated parent render no longer
  walks the group at all.

Identical results, measured over one render pass:

| Case | Before | After | |
| --- | --- | --- | --- |
| 40 groups x 12 fields | 0.0207 ms | 0.0028 ms | 7.3x |
| 200 array items under an item path | 0.1461 ms | 0.0352 ms | 4.2x |

Covered by `test/groupState.test.tsx`, which pins the collection through nested
layouts, the identity of the cached result, and the item-path case.

### 5.4 What actually needs watching

The arithmetic is not the risk. Three other things are:

1. **Re-render breadth.** If every container subscribes to the whole errors
   array, a keystroke re-renders all of them. An index makes each render cheap;
   it does not reduce their number.
2. **Validation modes.** Under `ValidateAndHide` and `NoValidation` there is
   nothing displayable, so skip building the index entirely.
3. **Pre-touch filtering.** The specification requires the indicator to respect
   `enableFilterErrorsBeforeTouch` *and* to reappear once a child is touched.
   That needs per-control touch state feeding the aggregate, which a single
   index keyed on errors alone cannot provide. This is a correctness and
   complexity problem rather than a speed one, and pre-touch filtering is
   unimplemented today - see section 3.4 of the
   [implementation-gaps document](jsonforms-react-antd-implementation-gaps.md).

---

## Adjustment 6 — Renderer strings go through the translator

**Type:** narrows. The specification requires localized accessible names and
tooltips in several individual renderer entries; this applies the rule to
everything a renderer draws.

### 6.1 The rule

**No renderer renders a user-visible English literal.** Every string a renderer
produces itself - tooltips, dialog buttons, accessible names, placeholders,
empty-state text, index markers - resolves through the form's translator with a
documented default as its fallback.

This covers only strings the *renderer* owns. Labels, descriptions and titles
authored in the UI schema or JSON Schema already have their own precedence
(`uischema.i18n`, then schema `i18n`, then the path-derived prefix), and an
unbound element needs an explicit `i18n` prefix because core can derive none.

### 6.2 Keys, not English text, are the lookup

A key is a dotted identifier in an existing namespace - `mixed.rename`,
`additionalProperties.deleteNamed`, `categorization.next`. Looking a string up
by its own English text, as `t('Select File', 'Select File')` did, makes the
catalog key change whenever the wording does and gives translators nothing
stable to key against.

Defaults live in one place per package (`util/i18nDefaults.ts`), so the
complete set is greppable and a missing translation degrades to a sensible
English string rather than an empty element.

### 6.3 Interpolation belongs to the translator

Core performs none: a default like `Delete {name}` renders literally unless the
translator substitutes. `useI18n` fills `{name}` placeholders from the values
passed with the key, and the demo's catalog translator additionally fills them
from `error.params`, which is where ajv puts `limit`, `multipleOf` and the
rest. A message showing a raw `{limit}` to the user is the symptom of missing
this.

### 6.4 Use the right translator

`TranslateProps.t` is core's `Translator`: `(id, defaultMessage, values)`. It
returns **undefined** when the key is absent and no default was supplied, so
`t('categorization.next')` renders an empty button. `useI18n` always supplies
the default from `i18nDefaults`, which is why renderer strings should go
through it rather than calling `t` directly with a bare key.

### 6.5 A missing translation falls back to the **locale**, then to English

Routing every string through the translator is only half of it. The fallback
was a single English table per package, so a form switched to another language
kept English wherever its own catalog did not happen to carry the key — which
is most keys, since a catalog is authored for the form's own labels, not for
the renderer set's hundred-odd internal strings. antd has the same problem for
its own chrome and answers it with per-locale bundles; this is that answer for
our keys.

Three sources, in order:

| Source | Where it lives | When it answers |
| --- | --- | --- |
| The form's catalog | `i18n.translate` | Whenever it carries the key |
| The locale bundle | `defaultRendererLocales` / `defaultExtendedLocales` | The form's catalog does not, and the language is carried |
| English | `util/i18nDefaults.ts` | Neither of the above |

The ordering is not re-implemented: the bundle's string is handed to the
translator as its **default message**, so JSON Forms' own contract puts the
form's catalog first. A bundle is `Partial`, so a key it omits falls straight
through to English and adding a key never breaks a translated form.

A locale falls back to its language — `de-AT` uses the `de` bundle — because
reverting to English over a region tag nobody translated separately is worse
than showing the language.

**Registered by default, unlike the antd chrome.** `defaultAntdLocaleLoaders`
fetches through `import()` because antd ships 75 locales and dayjs 143; here
the whole bundle is under a hundred short strings, and they are on screen the
moment a control mounts rather than when a calendar is opened, so an async
load would show English and swap it out in front of the user. The lookup is
synchronous and the shipped languages are in the bundle. A build that wants
fewer or more replaces the map with `setRendererLocales` /
`setExtendedLocales`, or adds one language with `registerRendererLocale` /
`registerExtendedLocale`.

The two packages carry separate registries over separate key spaces, because
neither depends on the other and each owns the strings it draws.

**The default message is the delivery mechanism, so nothing may supply its
own.** Twenty-two call sites across eight files translated as

```ts
translate(key, i18nDefaults[key])   // wrong
```

because they receive a `Translator` rather than using {@link useI18n} — the
cells, the composite dialog and summary, the container indicators, the select
and the file control. Handing in the **English** string as the default message
is handing it in where the bundle belongs, so every one of those strings
stayed English in every language whose catalog did not define that key. The
group data indicator in the Collapsible Groups example is what surfaced it:
the example has no catalog at all, so under a Bulgarian locale the tooltip
still read "Section contains data".

`useI18nDefault()` is the replacement — `d(key)` in place of
`i18nDefaults[key]`, resolving through the bundle for the current locale. It
is a hook, so the one consumer that is a plain function (`compositeSummary`)
takes it as a parameter.

**A marking translator cannot detect this.** `rendererI18n.test.tsx` supplies
a translator that answers every known key, so `translate(key, English)`
returns the marker and the site looks translated. The guard for *this* class
renders with a locale and **no translator at all** — which is what a form with
no catalog actually looks like — and asserts the bundled language reaches the
screen.

### 6.6 Status

Implemented across the antd renderer set: the clear button, branch-switch
confirmation, additional-properties editor and its row actions and rename
dialog, the mixed-value tree and type selector, array and list index markers,
stepper navigation, the file control, and the duration picker's component
labels and confirmation buttons.

`test/rendererI18n.test.tsx` renders each of these with a translator that
replaces every known key with a marker, and asserts no English default
survives — so a newly hardcoded string fails the suite rather than being found
in a screenshot. `test/extendedI18n.test.tsx` is its counterpart for the
renderer-agnostic package.

English (`en` / `bg` / `de`) bundles ship for both packages;
`test/rendererLocale.test.tsx` and `test/extendedLocale.test.tsx` assert the
three-source order, the regional fallback and runtime registration. The former
also carries the no-catalog guard described in §6.5, over a group indicator, a
container validation marker, a composite cell summary and the file control —
one per way a renderer can reach a translator.

**A guard that only visits the default state does not find this class of bug.**
Every gap below had been there while `rendererI18n.test.tsx` passed, because
each one lives in a state the test never entered:

| Where | What was English | State the guard never reached |
| --- | --- | --- |
| `MixedRenderer` rename validation | Five messages, three of them duplicating keys that already existed | Only appears once a typed name is wrong |
| `AntdAdditionalPropertyRenameDialog` | Title, field label, accessible name | The dialog has to be opened |
| `AntdSlider` | The not-set announcement | Only set while the value is missing |
| `GenericAdditionalProperties` | All of it — six buttons, the placeholder, two accessible names, three messages | The package had no i18n guard at all |
| `MonacoControlRenderer` | The editor's accessible name when the control has no label | Needs an unlabelled control |
| `lazyTemplate` | Loading, load-failure and render-failure text | Needs a pending or failing chunk |
| 22 sites across 8 files | Nothing — they *were* translated, but pinned to English by their own default message (§6.5) | Only visible with a locale and **no** catalog; a marking translator hides it |

The template labels were fixed at **module scope**, where no hook can run, so
`createLazyTemplate` now takes translation **keys** rather than text and
translates them inside the component.

The slider was a second bug wearing the first one's clothes: `aria-valuetext`
was set as an attribute on the control, and antd does not forward it to the
handle that carries `aria-valuenow`, so it never reached the DOM at all and
the position was announced as a committed number. It goes through antd's
`ariaValueTextFormatterForHandle`.

Not covered: the demo application's own chrome (toolbar, tabs, settings), which
is not a renderer, and `DynamicJSXRenderer`'s template-error panel, which is
developer-facing diagnostic output.

**Deliberately English:** author-facing diagnostics — the template engine's
`allowScriptEvaluation` refusal, `horizontalLayout`'s column-range message,
the UI-schema cycle and URL-refusal warnings. They name a mistake in the UI
schema or the configuration, are read by whoever wrote it, and several are
console output rather than form content.

---

## Adjustment 7 — `vertical` is the one orientation encoding for choice groups

**Type:** narrows. The specification states this fully for radio groups and
only loosely for checkbox groups; this commits to one contract for both.

### 7.1 What the specification says

For radio groups it is explicit:

> `options.vertical` defaults to false: arrange choices horizontally and allow
> wrapping. True stacks choices vertically. [...] Provide keyboard navigation
> and **accessible orientation consistent with the displayed arrangement**.

For the checkbox group it is an observation rather than a commitment —
"`vertical` arranges choices in inspected Svelte/Vuetify", and "vertical
arranges checkboxes in **supporting families**". Section 8 also reserves
`vertical` as Categorization's single orientation encoding, and notes that
using it there "does not change orientation options on other element types".

### 7.2 The rule

`options.vertical` is the **only** orientation encoding on a choice group, and
it behaves identically on both:

| | Behaviour |
| --- | --- |
| Absent or `false` | Choices in a row, wrapping when the row runs out of space. |
| `true` | Choices stacked in a column. |
| Announced | `aria-orientation` matches what is drawn, so assistive technology describes the arrangement on screen rather than a default. |
| Not introduced | No `horizontal` alias, no `variant` for orientation, no per-family divergence. |

Only an explicit `true` stacks. A missing option is horizontal, not
indeterminate.

### 7.3 Implementation

Both are implemented in the antd renderer set:

- `AntdRadioGroup` lays its choices out in a `Flex` and sets `aria-orientation`
  on the `Radio.Group`, which already carries the `radiogroup` role.
- `EnumArrayRenderer` renders individual checkboxes rather than an antd
  `Checkbox.Group`, so there was no grouping element to describe; it now
  declares `role="group"` alongside the orientation.

Covered by `test/choiceOrientation.test.tsx`, which runs the same expectations
against both renderers.

While implementing this, the radio group's choices were keyed by their
**label**, so two distinct values whose titles translate to the same string
collapsed into one rendered radio. They are keyed by value now — the
specification requires that "distinct values remain distinct choices even when
their translated labels are identical".

---

## Adjustment 8 — Color encodings, text entry and clearing

**Type:** **differs** on which save formats exist, **adds** two options and the
picker's panel selection, and **narrows** the input profile to something a
parser can actually decide. Section 18 fixes four save formats and says the
picker and the text entry share one storage contract; it says nothing about
whether text entry may be removed, nothing about how a value is cleared from
inside the picker, and nothing about the cylindrical model the implementing
picker actually offers.

### 8.1 The save formats are the ones the picker can edit

**Differs.** The specification fixes four save formats — `hex`, `hex3`, `rgb`
and `hsl`. This project implements `hex`, `hex3`, `rgb` and **`hsb`**: it adds
one the specification does not list and does not implement one it does.

The rule behind both halves is the same: **a save format must be a model the
editor can display.** antd's `ColorPicker`, and `@ant-design/fast-color` beneath
it, works in HSB, and HSB is the panel the user is actually dragging. An
HSL-saving control would mean the user manipulates one cylindrical model while
the data records a different one, with a double rounding in between and no way
to see the stored numbers. Offering `hsb` instead lets a receiving system store
what was manipulated.

| colorSaveFormat | Opaque output | Output with transparency |
| --- | --- | --- |
| `hex` (default) | `#RRGGBB` | `#RRGGBBAA` |
| `hex3` | `#RGB` | Refused; alpha is never discarded |
| `rgb` | `rgb(r, g, b)` | `rgba(r, g, b, a)` |
| **`hsb`** | **`hsb(h, s%, b%)`** | **`hsba(h, s%, b%, a)`** |
| ~~`hsl`~~ | Not written | Not written |

`hsb` follows the same conventions as the three kept from the specification:
hue in whole degrees, saturation and brightness as whole percentages, alpha in
`[0, 1]`, alpha omitted when fully opaque, and a space after each comma.

**`hsl` remains accepted input.** Dropping it as an *output* does not strand
data that already holds it: `hsl()` and `hsla()` parse, render and convert like
any other supported representation, and are rewritten into the configured
format when the value is next edited. What is gone is the ability to *write*
HSL. An authored `colorSaveFormat: "hsl"` falls back to `hex`, like any other
unrecognized value — previously `"rgb"` produced hex by accident, because no
branch matched it.

`hsb()` is **not CSS**: a browser handed it paints nothing, so a stored color
can never be written straight into a `background` declaration once this format
is in use. Every swatch converts through hex first.

**Revisit this if the picker gains an HSL panel.** The reason is the editor's
capability, not a dislike of HSL.

### 8.2 The picker opens on the format the value is stored in

**Adds.** The panel's format selector is **controlled and reset on every
opening** to the format matching `colorSaveFormat` — `hex` for `hex` and
`hex3`, `rgb` for `rgb`, `hsb` for `hsb`. Because every save format now has a
panel, this mapping is total.

antd's `defaultFormat` only seeds the first render, so a field the user left on
another tab reopened on that tab and showed its channels in a model the field
does not store. Switching tabs while the panel is open still works: it changes
what is being edited, never what is written.

### 8.3 The accepted input profile is decidable

Section 18 requires that "invalid or unsupported incoming values remain visible
with errors rather than being replaced by the picker's fallback color". The
picker's own color object cannot support that: it has no failure mode, and
answers opaque black for anything it does not recognize, including `not a
color`. So the profile is parsed by this project rather than delegated:

| Accepted | Rejected |
| --- | --- |
| `#RGB`, `#RRGGBB`, `#RRGGBBAA`, either letter case | `#RGBA` — four-digit hex is not in the specification's list |
| `rgb()` / `rgba()`, channels **integers** in `0..255` | percentage channels, out-of-range or fractional channels |
| `hsl()` / `hsla()` (input only), `hsb()` / `hsba()` | space-separated CSS Color 4 syntax, `color()`, `lab()` |
| `%` optional on saturation/lightness/brightness | named colors (`rebeccapurple`) |
| three or four arguments under either spelling, as CSS Color 4 allows | any other argument count |

Anything outside it is **kept verbatim in the data, shown verbatim, and left for
validation to report**. The swatch draws empty and the picker opens unset rather
than claiming a color the value does not name.

**Hue normalization policy**, which section 18 asks each implementation to
document: hue is reduced into `[0, 360)` and rounded to a whole degree, so
`hsb(-240, …)` and `hsb(120, …)` serialize identically. Achromatic colors report
hue `0`. Saturation, lightness and brightness round to whole percentages, alpha
to two decimals, and eight-digit hex quantizes alpha to 1/255 — so `hsb` output
is quantized twice, once into 8-bit channels and once into whole percentages.
Re-saving an unchanged value is stable.

### 8.4 Text is committed as typed and normalized on blur

The specification says successful text edits serialize to `colorSaveFormat`. It
does not say when. Serializing per keystroke rewrites `#0f0` into
`rgb(0, 255, 0)` between two characters and moves the caret, so:

| Moment | Behavior |
| --- | --- |
| While typing | The text is committed exactly as typed. Section 19: the UI represents actual form data. |
| On blur | A value that parses is rewritten into `colorSaveFormat`. One that does not parse is left alone. |
| On mount, or when the option changes | Nothing is rewritten — the specification is explicit about this. |
| Picker edit | Serialized immediately; there is no partial state to protect. |

### 8.5 `colorTextEntry` — the picker without the text field

**Adds.** An element option, flat, resolving over
`config.jsonformsExtended.colorTextEntry`, defaulting to `true`. Only an
explicit `false` removes text entry.

| | Behavior |
| --- | --- |
| Absent or `true` | Text field with the swatch as its prefix; both paths write the same representation. |
| `false` | The picker alone: a swatch and the stored text, and no editable field. |

Two constraints on the `false` case:

- **It removes typing, not keyboard access.** The trigger is a real `button`
  with an accessible name, so the picker stays reachable and operable from the
  keyboard. Section 22's keyboard requirements are not an option an author can
  switch off.
- **It shows the stored text, not the picker's reading of it.** Rendering the
  value through the picker would display `#000000` for anything it failed to
  parse, which is the substitution §18 forbids.

### 8.6 Clearing is available from inside the picker

**Adds.** Section 18 puts the color control under the shared `clearable`
contract but does not say where the affordance lives. When text entry is off
there is no input to carry one, so the picker panel itself must offer it —
antd's `allowClear` does, and clearing removes the property rather than writing
an empty string or a fallback color.

The control therefore has two clear affordances when text entry is on (the
input's and the panel's) and exactly one when it is off. That is deliberate:
the panel's is the invariant one.

### 8.7 `hex3` refuses transparency rather than flattening it

The specification already requires this; it is recorded here because the
implementation did the opposite. `toHex3` matched an alpha pair and dropped it,
so a transparent color silently became opaque.

Now an edit whose result carries alpha is **refused** under `hex3`: nothing is
committed, the previous value stands, and the localized `color.hex3Transparency`
guidance is shown. This covers both routes the specification names — the picker
edit and the transparent text edit — and applies the same `round(channel / 17)`
quantization to fully opaque eight-digit input as to six-digit input.

### 8.8 Selection

Also corrected while here: the registered tester matched schema `format:
"color"` only, so `options.format: "color"` on a plain string — which section 18
allows as an equal selection path — rendered a text box. The registered tester
is now the shared one that carries both. **The same defect remains for the
duration and null controls**; see the gaps document.

### 8.9 Implementation

Encoding lives in `util/colorFormat.ts` in the antd-extended renderer set, with
no React and no antd in it, so the storage contract is testable on its own.
`AntdColorControlRenderer` wires widgets to it.

Covered by `test/colorFormat.test.ts` and `test/colorControl.test.tsx`, and
demonstrated by the
[color-control example](../packages/jsonforms-react-demo-common/src/examples/spec/color-control/README.md).

**Not implemented:** the registered `color` format on the validator, so a value
outside the profile is refused by the control but reported by nothing.

---

## Adjustment 9 — `variant: "otp"`, a fixed-length code editor

**Type:** adds. Section 18's password control interaction fixes one
presentation — obscured text with a reveal action — and says nothing about the
segmented, one-character-per-box editor that verification and backup codes are
normally entered in. This adjustment adds it as a variant of the password
control rather than as a control of its own.

### 9.1 It is a password, not a new kind of value

The value is a string, the schema is unchanged, and it is selected by the same
predicate as the plain password control: schema `format: "password"` **or** UI
`options.format: "password"`. Masking, reveal, clear and the "toggling writes
nothing" rule all carry over unchanged. Only the editor differs.

That is why it is `variant` and not a new `format`. In this project `variant` is
the reserved dispatch input that chooses **which renderer draws a value** —
`variant: "ag-grid"` for the array control, `variant: "splitter"` for the split
layout — while `format` describes **what the value is**. A code entered in boxes
is still a password; a `format: "otp"` would claim it is a different kind of
data, and would have to be added to the format table in section 5 and to the
validator profile for no gain.

### 9.2 `otp`, not `pin`

Of the two names in circulation for this widget, `otp` is the more general. A
PIN is by definition a numeric personal identification number; a one-time
password may be alphanumeric, so `otp` constrains the alphabet less and does not
misdescribe a code like `ZX7Q`.

**A PIN is this variant plus a schema constraint**, not a second variant name:

``` json
{
  "schema": {
    "type": "string",
    "format": "password",
    "minLength": 4,
    "maxLength": 4,
    "pattern": "^[0-9]*$"
  },
  "uischema": { "type": "Control", "scope": "#", "options": { "variant": "otp" } }
}
```

Adding `pin` as an alias would give two names for one renderer and put the
numeric rule in the UI schema, where validation cannot see it.

### 9.3 The schema must bound the length

**The variant is selected only when both `minLength` and `maxLength` are
present.** A box-per-character editor has to know how many boxes to draw, and
there is no honest default: six boxes for a property that accepts any string
would be the widget asserting a constraint the schema does not carry, which
section 19 forbids in the same terms it forbids inventing data.

| Schema | Result |
| --- | --- |
| `minLength` and `maxLength` both set | Segmented editor, `maxLength` boxes |
| Either missing | **Falls back to the ordinary password field.** Not an error, not an empty control |

`maxLength` is the box count, because a box the user cannot fill would misstate
what the field accepts. `minLength` has to be present as well, but it governs
validity rather than layout: with the two equal — the intended authoring — the
boxes and the schema agree exactly; with `minLength` lower, the trailing boxes
are optional and the floor is reported by ordinary `minLength` validation.

This is the same shape as the slider's selection rule, where a property without
`minimum`/`maximum` is rejected by the tester and gets ordinary numeric entry.

### 9.4 A partial code is real data

The editor commits **what is on screen, as it is typed**, including an
incomplete code.

antd's `Input.OTP` fires `onChange` only once every box is filled, which is the
wrong contract here twice over: a half-typed code would leave the form data
holding the previous value while the screen showed something else, and deleting
a character would write nothing at all. The renderer uses `onInput` instead, so
the stored string always matches the boxes and a `minLength` error can be
reported against a value that was actually stored — section 19's requirement
that the UI represent the actual form data, not a tidied version of it.

### 9.5 Reveal and the accessible name

Reveal is the `mask` lever, since antd's OTP has no toggle of its own, and it
uses the same button and the same `password.show` / `password.hide` keys as the
password field. Section 18's "do not introduce another portable option solely to
disable the reveal action" is respected: the variant changes the editor, not
whether the value can be revealed.

**Masking the boxes takes a character, not `true`.** antd draws a masked cell
as an overlay showing `typeof mask === 'string' ? mask : value`, positioned over
an input whose own text is `color: transparent` - so `mask={true}`, the obvious
spelling, renders the real character and hides nothing. The renderer passes a
bullet. It also passes `type` explicitly: `OTPInput` asks for
`type: mask === true ? 'password' : 'text'` and then spreads its shared props,
which carry `type: undefined`, over the top, so the cells come out as plain text
boxes unless the type is supplied. Both together make each box a real password
input that shows a bullet.

The shared toggle **carries a tooltip** with the same wording as its accessible
name. antd renders none on its own reveal icon — it sets an `aria-label` on the
wrapper and stops — so this is a gap to fill rather than a library limitation,
and the clear button beside it has had one all along. Naming one icon and not
its neighbour is the inconsistency worth fixing.

It reports **no `aria-pressed`**. A toggle button either names its state and
reports pressed, or names the action it will perform; doing both describes the
control twice and contradicts itself, since "Show password" is not a thing that
can be pressed or unpressed. Section 18 asks for the action wording, so that is
what it reports. antd's own icon does both.

**The password field renders a plain `Input`, not `Input.Password`.** In antd 6
the `Input.Password` wrapper around `iconRender`'s output is *itself*
`role="button"`, focusable, and labelled from antd's locale, so putting a real
button inside it — which is where the accessible name has to live — nested one
interactive element in another: two tab stops for one action, and two different
names for it, "Show" from antd and "Show password" from the form's translator.
Owning the toggle keeps one control, one name, and that name coming from the
JSON Forms translator like every other rendered string (Adjustment 6). Nothing
else in `Input.Password` is needed: swapping the input type is one line.

The boxes are separate inputs, so the `Form.Item` label has no single control to
point `htmlFor` at. The group therefore carries `role="group"` and an
`aria-label` taken from the control's label, so the field is announced once
rather than as *n* unlabelled text boxes.

### 9.6 Not offered in a table cell

A row of boxes does not fit a table column, and the cell contract only requires
that **masking** survive delegation. A `variant: "otp"` inside a cell renders the
ordinary masked password cell.

### 9.7 Implementation

`PasswordOtpControl` (rank 5, above the plain password control at 4) and
`AntdOtp` in the antd renderer set; the reveal button is shared with the
password field as `AntdRevealButton`.

One thing worth recording, because it cost time: **a tester is handed the root
schema**, not the property's own subschema, so reading `schema.minLength`
directly always produced `undefined` and the variant was never selected. The
length check goes through core's `schemaMatches`, which resolves the control's
scope first.

Covered by `test/passwordOtpControl.test.tsx`, and demonstrated by the
[password-control example](../packages/jsonforms-react-demo-common/src/examples/spec/password-control/README.md).

---

## Adjustment 10 — The Categorization navigation contract

**Type:** one **divergence** (§10.2 — an accordion may be closed entirely),
one **narrowing** (§10.5), one **stated omission** (§10.3), and otherwise
**implementation notes** on section 8. Section 8 specifies tabs, stepper and
accordion together and then describes the accordion separately; this records
how that came out as code, the one rule this project deliberately does not
follow, and the places where antd's component does not do what the
specification asks.

### 10.1 `variant`, not `collapsible`

The question comes up because the accordion is the one presentation with a
disclosure in it. It is still `variant`.

Tabs, stepper and accordion are **mutually exclusive presentations of the same
thing**, and a variant is an enumeration, which is exactly that shape. A
boolean cannot express three-way exclusivity: `collapsible: true` says nothing
about *which* presentation it belongs to, and `collapsible: true` beside
`variant: "stepper"` has no defined meaning. It would also collide with the flag of the
same name on a **Group**, where it means something of a different *kind*: a
Group's `collapsible` turns one presentation into a disclosure, a behaviour
flag on a container that has only ever had one shape. A Categorization's
accordion is one of three mutually exclusive presentations. Spelling both
`collapsible` would suggest the two are the same sort of switch.

(The two do now agree on what a disclosure *does* — both can be closed
entirely; see §10.2. That makes them consistent to use, not the same option.)

`variant` is also what the specification names, and what this project already
uses as the reserved dispatch input elsewhere — `variant: "ag-grid"`,
`variant: "splitter"`, `variant: "otp"`.

### 10.2 An accordion may be closed entirely

**Differs.** Section 8 fixes the accordion at *exactly* one open category:

> Exactly one visible category is open whenever any categories are visible. […]
> Activating the already-open header leaves it open; no multiple-open or
> all-closed mode is defined.

This project allows **at most one**. Activating the open header closes it, and
an accordion with nothing open is a legal state.

The reason is the thing an accordion is for. A Categorization drawn as tabs or
as a stepper always shows one category because the control has no other state
to be in — a tab strip with no current tab is meaningless. An accordion is
different: it is a stack of sections a reader collapses to get a long form out
of the way, and refusing to collapse the last one means the form can never be
reduced to its outline. A reader who has finished with a section and wants to
see the whole structure has to leave one section open for no reason they can
see. Every other disclosure on the page — a collapsible Group, an array item —
closes when clicked, so the accordion refusing to was also the odd one out.

| | Section 8 | Here |
| --- | --- | --- |
| Two categories open at once | Not defined | **Still impossible.** Exclusivity is kept |
| Activating the open header | Leaves it open | **Closes it** |
| Nothing open | Only when no category is visible | Also after an explicit close |
| `options.initial` | Opens that category | Unchanged — it still opens one at first render |
| Selected category becomes hidden | Open the first remaining visible one | Unchanged |

**Closing is remembered, and the fallback does not undo it.** "When the selected
category becomes hidden, select an available visible category" still applies to
a category that *disappears*, but a reader who deliberately closed the
accordion must not have it spring open because an unrelated rule fired. So an
explicit close is a distinct state, not the absence of a selection.

**Portability.** A conforming renderer of the portable model will simply never
be all-closed; a form authored against this behaviour still works there, with
one section open where we would show none. The divergence degrades, it does not
break.

`options.initial` is unaffected: it sets *initial* selection, and the
specification already says expansion is runtime UI state that modifies neither
data nor the UI schema.

#### Why antd's `accordion` prop is still not used

Its at-most-one-open behaviour is now exactly what this calls for, so the
obvious move would be to adopt the prop and delete the hand-rolled exclusivity.
It is still declined, for a reason that has nothing to do with opening and
closing: the prop switches the whole control to a **tabs pattern** —
`role="tablist"` on the root, `role="tab"` on each header, `role="tabpanel"` on
each panel — and then does not implement one. A `tab` reports `aria-expanded`
where the pattern calls for `aria-selected`; the panel gets no accessible name;
and only Enter is handled, with none of the arrow-key navigation a `tablist`
promises. A tablist also cannot express "no tab selected", which is now a legal
state here.

Without the prop the same component is a **disclosure** — `role="button"` plus
`aria-expanded` — which is what rc-collapse actually implements, and the only
one of the two patterns that can describe an all-closed accordion. So
`activeKey` stays controlled and never holds more than one key: opening a panel
adds its key, so the newly opened category is whichever key was not already
active, and clicking the open header leaves none.

### 10.3 The panel relationship is wired by hand

Section 8 asks for "accessible accordion headings and controls with
expanded-state and panel relationships". rc-collapse supplies `role="button"`,
`aria-expanded` and keyboard activation, but **never ties a header to its
panel**: no `aria-controls`, and the panel has no role or accessible name. A
screen reader is told a header can be expanded without being told what it
expands.

There is no prop for it — extra item props land on the item wrapper, not on the
header — so the renderer sets `aria-controls`, the panel's `id`, `role="region"`
and `aria-labelledby` in an effect after render. This depends on antd's panel
structure, and the accessibility test asserts the result so a version bump
fails loudly rather than quietly dropping the relationship. The panel class is
`-panel` in antd 6 and `-content` in 5; both are accepted, so an upgrade
degrades to "no relationship" rather than to a crash.

### 10.4 One contract, three presentations

Visibility, `options.initial`, and what happens when the current category
disappears are specified once for all three presentations, so they are
implemented once, in `util/categoryState.ts`, and used by all three.

| Rule | Behaviour |
| --- | --- |
| Visibility | The category's own rule. A visible category with no visible children stays selectable; there is no `hideWhenEmpty`. |
| Selection identity | The category's `name`, so a reorder keeps the selection on the same category. Without a name, position is all it has. |
| Selected category hidden | Falls back to the initial category rather than leaving an index pointing at different content. |
| Accordion closed by the reader | Remembered as its own state, so the fallback above does not reopen it (§10.2). Tabs and steppers are not closable and never reach it. |
| No visible categories | "No active category or stale active panel". |
| Stepper Previous/Next | Operate on visible categories and stop at the first and last. |

Two defects fell out of sharing it: the tabs renderer was **uncontrolled**
(`defaultActiveKey`), so when the selected category was hidden by a rule the
tab strip went on pointing at that slot and showed a different category's
panel; and the stepper indexed `categories[active]` unguarded, so a
Categorization whose categories were all hidden threw instead of rendering
nothing.

### 10.5 `initial` failing is a console warning, not a rendered message

**Narrows.** The specification says a missing `initial` target "falls back to
first visible category with diagnostic", and lists a
`categorization.initialNotFound` key among its i18n keys.

The fallback is implemented. The diagnostic is a **console warning**, once per
element, and nothing is rendered. A `name` that matches no category is a
mistake in the UI schema: the author can fix it and the person filling in the
form can do nothing about it, so putting it on screen spends the user's
attention on someone else's problem. That is why
`categorization.initialNotFound` has no entry in our catalogue — nothing
user-facing uses it. If a reason to surface it appears, the key goes in then.

### 10.6 Both container indicators, on every presentation

A category's tab, step or accordion header is one component, `CategoryHeader`,
carrying the error marker **and** the data-presence dot, aggregated through the
traversal shared with the Group's indicators (Adjustment 5).

The same markers on all three are deliberate. Whether a section holds data, and
whether something inside it fails validation, are facts about the form; a form
that switched from tabs to an accordion should not lose a marker because of it.
Both still default to off, since no indicator existed on categories before.

**Where they sit follows the shape of the header, not the presentation.** An
accordion header is a full-width bar with a trailing edge, exactly like a
collapsible Group's, so the markers go in the same place a Group puts them —
antd's `extra` slot, at the end of the bar. A tab or a step label is just text,
sized to its content with no trailing edge, so there the markers can only
follow the words. Deciding this per presentation rather than once for all three
is what keeps two collapsible sections in the same form from marking themselves
in two different places.

While wiring this up, `useGroupState` turned out to read its options **only**
from the flat config key, while the validation indicator reads the
`jsonformsExtended` namespace — so `showDataIndicator` and
`showValidationIndicator` were configured differently for no reason. Group
options now resolve element → namespace → flat, with the flat lookup kept as a
fallback because the demo and the existing examples were written against it.

### 10.7 A tab panel renders its own category, not the selected one

antd's `Tabs` creates a panel the first time its tab is opened and then keeps
it mounted, hidden, so the category can hold state across navigation — a
half-filled array, a scroll position, an open dialog. That only works if each
panel renders **its own** category.

The tabs presentation originally built one `childProps` from
`categories[active]` and handed the same object to every panel. With one tab
ever visited that is indistinguishable from correct, which is why it survived:
only one panel existed. From the second tab onwards every panel left behind
rendered the *selected* category as well, so the selected category was mounted
once per visited tab — duplicated controls bound to the same data path,
duplicated rule evaluation, and for the template example two copies of a
template engine.

The accordion never had this, because it already builds `childProps(category)`
per panel; the stepper never had it, because it renders only the active step.

The fix is the accordion's shape, and the reason it is recorded here rather
than passed over as a typo is the failure mode: a duplicate that is hidden
costs work and can write through a second control, and nothing on screen says
so. Guarded by `test/categorizationTabs.test.tsx`, which visits three tabs and
asserts the inputs across all mounted panels are the three distinct values.

### 10.8 Implementation

`CategorizationAccordionLayout` at rank 3, above the stepper at 2 and tabs at
1, as section 8 requires of an explicit match. Covered by
`test/categorizationAccordion.test.tsx` and `test/categorizationTabs.test.tsx`,
and demonstrated by the
[categorization example](../packages/jsonforms-react-demo-common/src/examples/spec/categorization/README.md),
which renders the same four categories three ways against one data object.

---

## Adjustment 11 — The masked string control

**Type:** **adds** the engine and its regex compatibility, plus the five
behaviours the specification explicitly delegates ("renderer-family
specifications must state commit timing, paste and deletion behavior,
empty-value handling, and treatment of existing values that do not fit");
**narrows** selection so a boolean `mask` cannot request this renderer;
**differs** from the neighbouring Vuetify and Svelte families on three points,
each of which those families' own gap review already records as a defect; and
carries one **stated omission** (§11.10, no masked table cell).

Nothing here changes the portable encoding. `options.mask` carrying a pattern
is the whole of it, and the option table in section 18 is implemented as
written.

### 11.1 The engine is [maska](https://github.com/beholdr/maska), deliberately

**Adds.** The specification requires that "cross-platform implementations must
document their mask/token grammar and regex compatibility", and antd has no
masked input of its own, so the engine is a real decision rather than a detail.

It is maska because **the specification's option table is maska's API**. `#`,
`@` and `*`; `tokens` with `multiple`, `optional` and `repeated`; `tokensReplace`;
`eager`; `reversed`; array masks resolved by length — every row of that table is
a maska concept, because the table was written by inspecting families that use
maska. Sharing the engine makes the grammars identical by construction instead
of by two teams reading the same paragraph and hoping. It is 9.5 KB, has no
dependencies of its own, and its core `Mask` class is framework-neutral.

`antd-mask-input` was considered and rejected: it was last published in March
2022, declares `antd >= 4.19`, pins `imask 6.4.2`, and — decisively — exposes
imask's grammar (`0` for a digit, `a` for a letter, `definitions`, `lazy`,
`blocks`), which is a different language from the one the specification
normatively states. Adopting it would mean translating every authored mask at
the boundary and having no answer for `tokensReplace`, `eager` or `reversed`.

**Only `Mask` is used; the binding is ours.** maska also ships a `MaskInput`
class that attaches to a DOM node, and it cannot be used here:

- It assigns `input.value` directly. React tracks a controlled input through a
  patched `value` setter, so the assignment updates React's tracker and the
  synthetic `change` that should follow is suppressed. It then announces the
  result with a `CustomEvent('input')`, which does not bubble, so React's root
  listener never sees that either. The field would silently stop reporting
  edits.
- It normalizes the field in a microtask after attaching, which is exactly the
  mount-time rewrite section 18 forbids.

`fixCursor` is reimplemented as a pure function for the same reason, and gains
by being testable without a DOM.

**Regex compatibility, as the specification asks it to be stated.** An authored
token pattern is a regex *source string*. It is compiled with the `u` flag
first, so `\p{L}` and other Unicode property escapes work, and without the flag
if that fails, because `u` rejects escapes that are legal in an ordinary regex —
`\-` among them — and an author should not have to know which mode they are in.
A source that compiles under neither is reported on the console and the token is
dropped; an invalid regex in one token must not take down the form it appears
in. The neighbouring families compile without the flag and do not guard the
compile at all.

### 11.2 Selection needs a pattern, not the option

**Narrows.** The specification says plainly that "a boolean temporal option must
not by itself request a generic masked field". The inspected families select
with `hasOption('mask')`, which tests presence — so a date control writing
`"mask": false` to turn *its own* format-derived mask off became eligible for
the generic masked renderer instead. Their gap review calls this "overbroad
selection" and leaves it open.

Selection here requires `options.mask` to be a non-empty string, or a non-empty
array of them. That one predicate excludes `false`, `true`, `""`, `[]` and a
function together.

**A string that names its own editor keeps it.** `format` says what a value
*is*; a mask only says how it is typed. So a schema or UI format of `date`,
`date-time`, `time`, `duration`, `color` or `password` wins and the mask is
ignored, rather than a date being edited through a generic text mask that knows
nothing about calendars. The specification leaves this to us — "handling of
competing specialized string presentations belong in renderer-family
specifications" — and settling it in the tester is what lets this renderer sit
at rank 4 beside the temporal controls without a registration-order tie-break.

### 11.3 The mask decides what is typed; the schema decides what is stored

**Narrows**, on one point the specification raises and the families get wrong.

`returnMaskedValue` is the whole storage decision, and the specification is
already firm about its consequence: choosing `true` means "the schema must
instead describe the stored representation containing the separator", and the
renderer "must not rewrite the schema when this option changes". Nothing here
touches the schema.

What follows from that, and what the families miss: **`restrict` and `maxLength`
apply to the stored string, never the displayed one.** The specification asks
for exactly this distinction — "for masked or formatted inputs, distinguish
display characters from the stored representation to which the schema
constraint applies" — and the families forward `schema.maxLength` straight to
the input's `maxlength` attribute. With `maxLength: 6` and `###-###`, the field
displays seven characters for six stored digits, so the browser blocks the
seventh keystroke and **the sixth digit cannot be typed at all**.

So no DOM `maxlength` is ever set. An edit is checked after masking, against
the value that would be stored, and refused if it would exceed the limit.

Length is counted in **Unicode code points**, not UTF-16 code units, per the
same section: `"😀"` is one character to a `maxLength: 1` schema and two to
`String.prototype.length`.

### 11.4 A value the mask cannot carry is shown verbatim

**Adds** — this is the "treatment of existing values that do not fit" the
specification hands to renderer families, and it is not a free choice. Section
19 requires out-of-domain data to be rendered honestly, and the shared editing
contract says in as many words to "preserve invalid incoming data for
correction; do not truncate it automatically on rendering."

The test is a round trip, not a syntax check: a stored value fits when
displaying it and reading it back returns the same string. `"1234567890"` under
`###-###` does not, because six digits would survive and four would not.
`"PENDING-REVIEW"` does not, because nothing would.

A value that fits is displayed masked. **A value that does not is displayed
exactly as stored**, and nothing is written until the field is edited — at which
point the mask takes over and the value becomes ordinary. Showing the masked
remnant instead would put `123-456` on screen while the data still held ten
digits, so the field would disagree with the form around it and a validation
error would point at something invisible.

A partial value always fits. A mask guides structure; the specification is
explicit that "a generic mask does not imply that partial input is withheld
until the mask is complete", so `"123"` under `###-###` is ordinary data and not
a draft.

### 11.5 Commit timing, paste, deletion, emptiness and composition

**Adds** — the four the specification delegates, plus composition.

**Commit timing: immediately, with no debounce.** The plain text control
debounces by 300ms; this one does not, and the reason is structural rather than
a preference. The displayed text and the stored value are two different
strings, so a third, in-flight one would leave the field unable to tell its own
pending draft from data the host had replaced underneath it. Committing in step
keeps that decidable, and leaves nothing for a detail dialog's Apply to flush.

**The draft is trusted only while it still means the stored value.** There is no
effect synchronizing state to props. The typed text is used when it still
round-trips to what is in the data, and otherwise the display is derived from
the data — so an external replacement wins automatically, which is what the
pending-edit contract asks for: "data replacement policy must not silently let
an outdated draft overwrite the replacement."

**Paste and deletion go through the same path as typing**, because both arrive
as ordinary input events carrying the whole field value; a paste is masked in
full, and characters no token accepts are dropped. One special case is the
engine's: deleting the last token character of an *eager* mask would otherwise
leave its literals stranded and unremovable, so an eager deletion that empties
the value empties the field.

**Empty is `undefined`, not `""`**, following the shared clearing contract used
by every other control here.

**Composition is left alone.** The specification requires that masks "must not
overwrite the active draft or prematurely treat it as a finalized value", and
neither maska's own binding nor the neighbouring families handle this. Nothing
is masked between `compositionstart` and `compositionend` — otherwise the
intermediate romaji of a Japanese entry would be filtered away character by
character and the word could never be typed — and the completed text is masked
once, when the session ends.

**The caret is restored after the commit, not during the edit**, and it also has
to survive the field turning invalid on that same keystroke — a separate hazard
in the shared frame, which this control is what exposed; see Adjustment 12.

Two things make the restoration itself subtler than it looks, and both were
found by a failing test rather than by reading. React assigns `value` to the
input during its own commit, and assigning `value` moves the text entry cursor
to the end whatever it held before; and
antd's `rc-input` hands `onChange` a **clone** of the input node — its
`resolveOnChange` rebuilds the event with `target.cloneNode(true)` whenever it
has a value to force — so `event.currentTarget` is a detached element that
nothing on screen is affected by. The control therefore holds a ref to the real
input and sets the caret in a layout effect after React has written. The clone
forwards `setSelectionRange` to the original, which is what made the symptom
look intermittent: a caret set before React's write survived only when it
happened to already be at the end.

### 11.6 The mask is the fallback entry hint

**Adds**, resolving a difference the specification asks to be settled: it
requires a renderer to "document whether the mask itself is the fallback
placeholder", and notes that Vuetify uses `placeholder ?? mask` while the Svelte
controls use the explicit placeholder only.

This follows Vuetify. With no authored `placeholder`, a single-string mask is
the hint — `###-###` shows the shape of the field without claiming to be a real
value. A set of alternative masks has no single shape, so it supplies no hint.
An explicit empty placeholder suppresses the fallback, which section 18 requires
of every control with a hint.

### 11.7 Where this differs from the neighbouring families

All three are behaviours their own gap review records as defects, so these are
corrections rather than divergences of taste — but they are differences, and a
document written against those families will behave differently here.

| Behaviour | Vuetify / Svelte | Here |
| --- | --- | --- |
| Selection | `hasOption('mask')`, so `"mask": false` selects the generic mask | A pattern is required (§11.2) |
| `eager`, `reversed` | Computed as `option === false`, so an explicit `true` produces false and only `false` turns them on | Mean what they say; see below |
| `restrict` + `maxLength` | `schema.maxLength` forwarded to the input's `maxlength`, counting display characters | Counted on the stored string, in code points (§11.3) |
| Placeholder | Vuetify `placeholder ?? mask`; Svelte explicit only | `placeholder ?? mask` (§11.6) |

The `eager`/`reversed` inversion is worth spelling out because it is silent:
omission produces false, an explicit `true` *also* produces false, and only an
explicit `false` turns the behaviour on. Here `"eager": true` is eager.

### 11.8 What does not cross the wire

**Narrows.** maska accepts a function as a mask, and a token may carry a
`transform` function. Neither is part of the portable model — "function-valued
masking-library options are not portable serialized UI-model features" — and a
UI schema is JSON, so neither is accepted. A token object keeps `pattern`,
`multiple`, `optional` and `repeated`; any other field an author writes is
dropped rather than passed through, so a document cannot come to depend on an
engine detail another family has no way to honor.

`maskReplacers` is supported as the older spelling of `tokens`. When both are
present `tokens` wins outright rather than the two merging, which is what the
specification states and what the families do.

`tokens` are applied **over** the default table, so `{"#": "[0-1]"}` changes one
token rather than replacing three. A falsy entry removes a token; that removal
holds while `tokensReplace` is on — its documented default — and is undone when
it is off, because the engine then merges its own defaults back underneath. That
last behaviour reads oddly and is kept only for parity.

### 11.9 Configuration placement

These options are **not** namespaced under `jsonformsExtended`. Adjustment 1
places a config key by where it comes from, and `returnMaskedValue`, `tokens`,
`tokensReplace`, `maskReplacers`, `eager` and `reversed` are all established
conventions of the inspected Vuetify and Svelte families, so they sit at the top
level of `config` under the names those families already use — alongside
`clearable`, `restrict` and `placeholder`, which this control also reads flat.

`mask` is the exception: it is read from the element only. A form-wide default
mask would claim every string field in the form, and the tester inspects
`uischema.options.mask` too, so a config-level one could never have selected the
renderer in the first place.

### 11.10 Implementation

[`maskFormat.ts`](../packages/jsonforms-react-antd-extended-renderers/src/util/maskFormat.ts)
holds the whole storage contract with no React and no antd in it — what is
displayed, what is stored, what fits, what a length limit means, and where the
caret goes are all decidable from strings — and
[`AntdMaskInput.tsx`](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdMaskInput.tsx)
is only the binding. Selection lives in
[`maskControls.ts`](../packages/jsonforms-react-extended-renderers/src/util/maskControls.ts)
in the framework-neutral package, so another renderer set can reuse the tester
without taking the engine.

It is written in the shape of a cell and wrapped by the shared `InputControl`
frame, like every other antd input, so it carries the same label, description,
required marker and error presentation.

**Not offered in a table cell.** It is registered as a renderer only, which is
where the color and duration controls already stand — the extended package
registers no cells at all. A masked column therefore falls through to the plain
text cell and shows the stored value unformatted. That is a loss of formatting
and not of meaning, unlike a password in a cell, which is why it is a stated
omission rather than a defect.

Covered by `test/maskFormat.test.ts` and `test/maskControl.test.tsx`, and
demonstrated by the
[string-controls example](../packages/jsonforms-react-demo-common/src/examples/spec/string-controls/README.md).

---

## Adjustment 12 — Showing validation must not change the element tree

**Type:** **adds** a rule the specification leaves open. Section 18 requires
validation state to be presented and section 15 governs when errors become
visible, but neither says anything about what presenting them is allowed to
cost. This adjustment says: nothing.

### 12.1 The rule

**A control's rendered element tree must have the same shape whether or not the
value is valid.** Attributes, classes, text and the contents of an existing slot
may all change. What may not change is which elements exist and where they sit,
because React reconciles by position: an element that moves to a different
position in the tree is not updated, it is destroyed and replaced.

A replaced `<input>` takes with it everything the browser was holding about it —
focus, the caret, the selection, an in-progress IME composition, and the undo
stack. The person typing is simply put out of the field.

### 12.2 The trap, which is antd's and which antd names

antd composes the `Form.Item` feedback icon into the input's `suffix`. rc-input
then decides the field's structure from whether it has any affix at all:

```js
const hasAffix = !!(props.prefix || props.suffix || props.allowClear);
```

With no affix the component renders a bare `<input>`. With one, it renders
`<span class="ant-input-affix-wrapper"><input/>…</span>`. So switching
`hasFeedback` on at the moment a field becomes invalid moves the input one level
deeper, and React remounts it.

antd knows. Its `Input` carries a development warning for precisely this:

> When Input is focused, dynamic add or remove prefix / suffix will make it lose
> focus caused by dom structure change.

`ControlFormItem` was doing exactly that — `hasFeedback={isValid ? false : …}` —
so **every** field in this renderer set that had no affix of its own threw the
user out of it on the first keystroke that failed validation.

### 12.3 How we comply

`hasFeedback` is now on at all times, and the *icon* is suppressed instead:
returning `false` for a status is antd's own way to say that status draws no
icon, while the slot, and so the element tree, stays put.

The whole trace of this on a valid field is an empty suffix span holding four
pixels open. That is not a cost so much as a correction: the error icon used to
have to widen the affix and push the field's text aside as it appeared, and now
the gutter is already there.

### 12.4 Why it surfaced on the masked control

It did not start there. The plain text control had the identical defect and had
had it all along; its 300ms debounce merely meant the error arrived a third of a
second after the keystroke, so it read as "the field dropped a character"
rather than as losing focus. The masked control commits on every keystroke, so
the error lands on the same keystroke that caused it and the cause is legible.

Every other control was immune by accident rather than by design: the color
picker always has its swatch prefix, the password field always has its reveal
button, the numeric controls always have their stepper. Only the two fields that
render a bare `<input>` were exposed.

### 12.5 What to watch

The failure is silent. Nothing throws, nothing is logged in a production build,
and the DOM afterwards looks entirely correct — the only evidence is a person
saying they had to click back into the field. So it has to be guarded
deliberately:

- **Any control that renders a prefix, suffix or `allowClear` conditionally**,
  on validity, on focus, on whether the value is empty, or on anything else that
  can change while the field is being used. `AntdClearableInput` overlays its
  clear button rather than passing `allowClear` for this reason among others;
  the controls that do pass a suffix pass one unconditionally.
- **Anything that wraps a control conditionally** — adding a `Tooltip`, a
  `Badge` or even a plain `span` around it only when invalid — has the same
  effect for the same reason, without any antd code being involved.
- **`OneOfRenderer` and `EnumArrayRenderer`** still compute
  `hasFeedback={!isValid}`. They are safe today because neither wraps an antd
  `Input` — one holds tabs, the other a checkbox group — so there is no affix
  structure to toggle. If either ever comes to contain a text field, it acquires
  this defect.
- **A new renderer set, or an antd major version.** The rule is ours; the
  mechanism is antd's, and the class names and the `hasAffix` condition above
  are internal to it.

### 12.6 Implementation

`ControlFormItem` in
[`cellMode.tsx`](../packages/jsonforms-react-antd-renderers/src/util/cellMode.tsx),
which is the single `Form.Item` every antd control in this set renders through,
so the rule holds for all of them at once.

Guarded by `test/validationFocus.test.tsx` in the antd renderer set, on the
plain text control, and by the focus block of `test/maskControl.test.tsx` in the
extended set. Both type through a stretch of invalid values into whatever
currently holds focus, rather than into a re-queried element, because a test
that re-queries the field keeps typing into a control that has been remounted
underneath it and so cannot see the defect at all.

---

## Adjustment 13 — The tuple control

**Type:** **adds** the schema dialects this family supports, the tester rank and
the write mechanism the contract implies; **narrows** two points the
specification leaves to renderer families. Nothing here diverges: section 18's
tuple entry is implemented as written, and this records the decisions it
delegates.

### 13.1 Both dialects, with `prefixItems` read first

**Adds.** Section 18 says "renderer sets must declare their supported schema
dialects", so: draft-07's positional `items` with `additionalItems`, and draft
2020-12's `prefixItems` with `items`.

`prefixItems` is checked **first**, and the order is not arbitrary. In 2020-12 a
tuple's `items` is the *tail*, and in draft-07 it is the *prefix*. A schema
carrying both, read in the wrong order, turns one tail schema into the whole
list of positions — a silent misreading rather than a failure.

This declares what the renderer *recognizes*. Whether the host's validator
understands 2020-12 is a separate question, which is why the worked example is
authored in draft-07.

### 13.2 A tuple is a value, so a position writes the whole array

**Adds** the mechanism, which the contract forces even though it does not
describe one.

Section 18 requires an edit at a missing position to fill the positions before
it and "commit the filled prefix and the edited value together, without creating
sparse arrays". A delegated control at `order.2` knows only its own path, and
writing index 2 of a one-element array produces `["a", undefined, value]` — a
hole, which is exactly what the contract forbids.

So each position **replaces `dispatch` for its subtree**. Anything writing
inside the position is caught, the array is rebuilt whole, and one update is
dispatched for the array; anything else passes straight through. This is the
same technique `CompositeDetailDialog` uses to keep a draft private, and it
works for the same reason: every JSON Forms control writes through the context's
dispatch rather than through a prop that could be handed to it directly.

Two consequences worth stating, because both are observable:

- **An edit at one position can change another.** Typing a quantity into an
  empty `[string, integer]` tuple produces `["", 30]`, in one update. That is
  the specification's own example.
- **An edit can be refused.** When a preceding position has no unambiguous
  initial value — a union type, an unconstrained schema — nothing is invented.
  The edit is held as a local draft and the blocking position is named, per
  "retain the edit as a local draft and identify the position needing input
  rather than inventing a type or null value".

Clearing follows the same rule from the other end. A string clears to `""`, an
object to `{}`; a number has no empty value, so a cleared numeric position is
held as a draft rather than quietly becoming `0` or `null`. Absence and
emptiness are different things and the array's length never changes.

### 13.3 Rank 25, and it claims its own failures

**Narrows.** The specification leaves ranks to renderer families. Rank 25 sits
above the mixed control at 20 and every array renderer below it.

More interestingly, the tester **also matches a control that asks for
`variant: "tuple"` and cannot have one** — a uniform array without equal
non-negative bounds, or a schema that is not an array. That looks wrong until
you read what section 18 asks for: an "unsupported configuration" must "report a
configuration diagnostic rather than guessing a positional count". A diagnostic
needs something to render it. Losing the tester match would hand the control to
an ordinary array renderer and the author's request would vanish without trace.

Equal bounds **alone** still select nothing: section 18 is explicit that they
"do not change the presentation of existing uniform-array controls", so a
fixed-length uniform array is an ordinary array until a variant asks otherwise.

### 13.4 An unconstrained position is a mixed control

**Adds.** Section 18 says an unconstrained tail "uses the mixed renderer with
type selection" but not how a renderer asks for one. Here, a tail of `true` or
`{}` is rendered against a schema naming every JSON type, which is what this
family's `isMixedControl` tester matches. A new trailing value starts as an
empty string, and its type is changed from the editor rather than guessed at.

### 13.5 The registry is host code, not a UI-schema document

**Narrows**, and it is the reason the worked example has a `.ts` file where
every other example is JSON.

Section 18 selects a complex position's editor through "the existing ranked
UI-schema registry", whose entries carry **tester functions**. Elsewhere this
project refuses function-valued options — Adjustment 11.8 drops a masking
`transform` for exactly this reason — but that rule is about the serialized UI
model. A registry is not part of it; it is a list the host assembles in code.

The practical consequence is visible in the demo: its UI Schemas tab renders
these entries through `JSON.stringify`, which cannot carry a function, so the
testers disappear and applying that tab leaves entries matching nothing. The
renderer therefore **ignores a registry entry whose tester is not callable**
rather than handing it to core, which calls every tester unguarded and would
otherwise take the whole form down with a `TypeError` over a host's mistake.

### 13.6 Where a label comes from, and why positions can share one

**Adds** nothing to the rule; records the trap.

Labels resolve through core's existing precedence — the delegated element's
`i18n`, the positional schema's `i18n`, then the path-derived prefix — with the
readable label as the fallback, and a localized `Item {position}` when the schema
supplies no title.

The trap is that **core's path-derived prefix strips array indices**, so
`coordinates.0` and `coordinates.1` resolve to the *same* translation key. Two
positions of one tuple therefore cannot be told apart by path, and the remedy is
the one section 18 prescribes: an explicit `i18n` on each positional schema.
This must not be worked around by inventing an index-bearing key here, which
would produce keys no other implementation generates.

A uniform tuple shows the other half of the rule: every position shares one
schema and so one set of metadata, which is why its positions can only carry the
position label. The position number is a **parameter** of that message, never a
number concatenated onto a translated word.

### 13.7 Presentation

`showBorder` defaults to true and encloses the heading, the positions, the
Additional items section and the array-level errors in one boundary, so a tuple
reads as a single value. `vertical` defaults to false — a row that wraps — and
is independent of the border.

Array-level errors sit beneath the tuple; a position's error sits beside that
position. An array-length error therefore never marks otherwise valid positions
invalid, which section 18 states and the worked example demonstrates with one
error of each kind.

### 13.8 Implementation

[`tuple.ts`](../packages/jsonforms-react-antd-renderers/src/util/tuple.ts) holds
the whole schema contract with no React in it — which schemas are tuples, what
each position renders, what a missing or cleared position is worth — and the
three components above it are the presentation:
[`TupleControlRenderer`](../packages/jsonforms-react-antd-renderers/src/complex/TupleControlRenderer.tsx),
[`TupleField`](../packages/jsonforms-react-antd-renderers/src/complex/TupleField.tsx)
and
[`TupleAdditionalItems`](../packages/jsonforms-react-antd-renderers/src/complex/TupleAdditionalItems.tsx).

Complex positions reuse `CompositeDetailDialog` and the composite summary the
table cells already use; the summary helper moved to
[`compositeSummary.ts`](../packages/jsonforms-react-antd-renderers/src/util/compositeSummary.ts)
so both call one implementation.

`withJsonFormsDetailProps` supplies the `uischemas` a complex position needs but
**no dispatch props at all**, so the renderer composes its own state and
dispatch mapping. Without that, the Additional items section — the one part that
writes the array itself rather than through a child — has nothing to write with.

Covered by `test/tupleControl.test.tsx`, and demonstrated by the
[tuple-control example](../packages/jsonforms-react-demo-common/src/examples/spec/tuple-control/README.md).

---

## Adjustment 14 — Dynamic property names, and the one reserved character

**Type:** **narrows**, **implements** section 18's empty-name policy, and
records a dependency. The specification places no
restriction on what a dynamic property may be called; JSON Schema places none
either beyond `propertyNames`. This adjustment states the single restriction
this implementation adds, why it exists, and why every other restriction it used
to have has been removed.

### 14.1 The rule

**A dynamic property name may contain any character. Only the schema refuses
one.**

Some names cannot be *addressed*, which is a different problem from not being
allowed. JSON Forms addresses data with dotted paths — `labels.colour`,
`order.2.code` — and the grammar has no escape, so a property literally called
`a.b` has no path, and an empty name composes away to its parent's path.

Those names are not refused; they are **routed to an editor that uses no path
at all** (§14.5). Refusing them would be refusing legal JSON, and data
containing them arrives from elsewhere whether or not this form can create
them.

### 14.2 What made the other characters legal

**This used to reject `[` and `]`**, and the reason was real: until
`@jsonforms/core` 3.9 the core reducer set and unset data with lodash's
`set`/`unset`, whose path grammar reads `a[0]` as index 0 of `a` and a bare `2`
as an array position. A property genuinely called `items[0]` was therefore
written somewhere else entirely, and a property called `2` created an array
where an object belonged. Refusing those names was the only safe thing to do.

3.9 replaced lodash in the reducer with a path walker of its own that **treats
every segment as a plain property name**, consults the schema when it has to
decide whether a missing container should be an array or an object, and handles
`__proto__` by defining an own property rather than assigning through it. So
`items[0]`, `2024`, `a$b`, `a/b`, `a~b` and the rest are ordinary keys now.

This project therefore **requires `@jsonforms/core` 3.9 or later**, and the
React packages are pinned to `3.9.0-alpha.1`, the version the Svelte families
use. The legacy Vue 2 packages stay on 3.7 and resolve their own copy; they are
unaffected and unimproved.

### 14.3 The name is checked against a schema, not a regular expression

**Narrows.** `propertyNames` is a full JSON Schema, and it is now evaluated as
one: the name is validated against a schema built from `propertyNames` plus,
when `additionalProperties` is `false`, an `anyOf` over the `patternProperties`
keys.

Before, only `propertyNames.pattern` was consulted and the pattern list was
joined into one alternation. Everything else — `minLength`, `maxLength`, `enum`,
`format`, `not`, a nested `allOf` — was silently ignored, so a name that matched
the pattern but broke a length limit was accepted by the field and then rejected
by the validator. `propertyNames: false` was ignored entirely.

**Without a validator, the check is reduced rather than skipped.** The component
takes Ajv from the form, and a caller that renders it outside a form has none.
In that case only the `pattern` constraints are evaluated, which is what the
field did before, and the reduction is documented where it happens. Skipping
name validation altogether in that case would be the worse failure.

### 14.4 Where this leaves the messages

Every refusal now goes through the translator (Adjustment 6), one message per
reason: the name is missing, the name is taken, or the name is not permitted
here. The pattern-mismatch message used to print the raw regular expression at
the reader; it now names the rejected value instead.

There is no longer a message about dots, because there is no longer a refusal
to explain.

### 14.5 `allowEmptyPropertyNames`, and what it drags in with it

**Implements** section 18's empty-name policy as written: a boolean in global
config and `uischema.options`, defaulting to `false`, where an explicitly
supplied element option overrides config **including `false` overriding
`true`** — which the element-over-config merge already gives, because only
`undefined` falls through.

Two consequences are not optional extras; permitting an empty name without them
would be worse than not permitting one at all.

**Names are stored exactly as typed.** Section 18: "preserve every accepted name
exactly; trimming is only a blankness check." This used to store `"a"` for
`"  a  "`. Once whitespace-only names are permitted that is no longer a rough
edge but a data loss: trimming `"   "` would erase the key. So `trim()` now
decides one thing — whether a name counts as blank — and nothing else.

**An unaddressable key needs an editor that does not use a path.** Composing an
empty segment yields the *parent's own* path, so a control dispatched there
edits the whole containing object rather than that property; a dotted name
composes into a path pointing at nested properties nobody declared. Both are
therefore edited in an isolated form rooted at the value (`scope: "#"`) and
written back under the exact key, which is section 18's literal-key contract.

**The isolated form's schema is rebundled.** Its root is the property's value,
so a local `$ref` inside that schema — `#/definitions/label` on a nested
property — no longer resolves: there is no such definition in a document that
starts at the value. `literalPropertySchema` carries the original root along
under `definitions.__jsonforms_root` and rewrites local references to point
into it. Only schema *keywords* are walked, never `default`, `const` or `enum`,
because those hold data and data may legitimately contain a `$ref` key.

A reference at the very top of a property's schema is already resolved upstream,
so it is the nested ones that show whether this works — which is what the test
uses.

The limitation to know about: **an isolated form validates its own value**, so
errors on such a property are shown beside it but are not part of the containing
form's error list. That is the price of editing a property that has no data path
at all.

**Presentation and draft feedback**, both from section 18: an empty name has a
visually blank label rather than the literal `""`, with Rename and Delete still
above the value input; and an exactly empty name box shows no inline error on
load or after being cleared — *including* an empty-name collision — while Add
stays disabled, because suppressing the message must not suppress the
judgement.

Deletion and renaming of an existing empty or whitespace-only key work
regardless of the option, as the specification requires.

### 14.6 Writing a name the prototype also has

**Adds.** Now that names are restricted only by the path grammar, `__proto__`,
`constructor` and `toString` are all reachable. `data['__proto__'] = value`
replaces an object's prototype instead of creating a property, so every write
goes through `Object.defineProperty` with an own, enumerable, writable
descriptor, and every read uses `hasOwnProperty`.

One thing this does **not** survive is authoring: a quoted `__proto__` in a JSON
file is an own property after `JSON.parse`, but a bundler compiles a JSON module
into an object literal, where `{"__proto__": v}` sets the prototype and the key
silently disappears. So the worked example demonstrates the name by typing it,
not by shipping it.

### 14.7 Implementation

[`additionalPropertyName.ts`](../packages/jsonforms-react-antd-renderers/src/util/additionalPropertyName.ts),
which holds the whole decision with no React in it, used by
[`AdditionalProperties.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/AdditionalProperties.tsx).
It is a port of the Svelte families' `additionalPropertyName.ts`, with one
deliberate difference: the result is a flat `{ name, error? }` rather than a
discriminated union, because this package compiles with `strict` off and without
`strictNullChecks` TypeScript will not narrow a union on a boolean literal
discriminant — `if (result.valid)` compiles but gives the caller no access to
`result.error`.

Covered by `test/additionalPropertyNames.test.tsx`, which asserts the names
round-trip into real form data rather than only that the validator accepts them.

---

## Adjustment 15 — An array element's type cannot be cleared

**Type:** **implements** a requirement the specification already states. This
was first recorded here as an addition, which was wrong: section 18's
mixed-value entry says it in as many words —

> For an array item, do not offer a clear-type action and guard the handler
> against unsetting the slot. This applies to ordinary array items, additional
> tuple items, and fixed tuple positions.

— and goes on to require that "selecting null, when allowed, writes actual JSON
null and retains its tree node and type selection". The reasoning below is kept
because it explains *why* the rule exists and what goes wrong without it, but
the rule is not ours.

### 15.1 The rule

The mixed control's type selector offers no clear affordance when the value it
edits **is an element of an array**, and refuses the action if one arrives
anyway.

### 15.2 Why

Clearing a type dispatches `undefined` at the value's path. Core unsets an array
element by deleting it **in place** rather than compacting the array — which is
correct, because splicing would silently renumber every later element and break
any path already pointing at one. What is left is a hole, and a hole serializes
to `null`.

So the value disappears from the structure view while the array still holds a
slot for it: the tree and the data disagree, and the length is wrong. The
reported symptom was exactly that — "the item is removed from the left tree but
in the data we set null".

There is also nothing to put in the slot. **A mixed value with no type has no
representation at all**; `""` or `0` would be inventing one, and that is
precisely what the mixed control exists to avoid. "No type" is a state a
*property* can be in, because a property can be absent. An array element cannot
be absent and still be an element.

Removing an element is therefore the array's own action — the Additional items
Delete in a tuple, the row action in an array control — and never the type
selector's.

### 15.3 The same section forbids the symptom directly

Worth quoting alongside, because it names the exact failure the reported bug
produced:

> Never create undefined values or sparse array slots: their serialization as
> null is not equivalent to storing an actual null value and must not be used
> to conceal an invalid internal data state.

### 15.4 What is unaffected

- **Changing** the type is untouched; only clearing goes.
- A mixed value at an object property keeps its clear affordance, because
  clearing there removes the property, which is a real and reachable state.
- A dynamic property's selector was already non-clearable for a related but
  distinct reason: clearing it would delete the property together with its key.

### 15.5 Implementation

`isArrayElementPath` in
[`MixedRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/MixedRenderer.tsx),
which reads the **data** rather than the schema — it is the data's shape that
decides what unsetting the path will do, whatever the schema says the container
ought to be. The nested per-node selectors inside the structure view were
already non-clearable; this closes the same hole on the control's own selector.

Covered by `test/mixedArrayItemType.test.tsx`. The reachable case it uses is a
tuple with an open tail, whose trailing value has no schema of its own and is
delegated to the mixed control at an array-index path.

---

## Adjustment 16 — Choice searchability and the array-choice variants

**Type:** **adds** this family's documented default for `options.autocomplete`,
which section 18 requires each family to declare and deliberately leaves open;
**narrows** which choice value types the two array-choice variants claim. The
encodings themselves are implemented as written.

### 16.1 Searching is off unless asked for

**Adds.** Section 18 says `autocomplete` absent "preserves the renderer family's
documented default. No universal default is imposed", and notes that Material
defaults to autocomplete. **This family defaults to off.**

An antd `Select` is already a compact dropdown with keyboard type-ahead that
jumps to the first matching option. Turning `showSearch` on replaces that with a
text caret and a filtered list — better for a long list, worse for the three- or
four-item enum that most choices actually are, because it trades a single
keystroke for a query. Making it opt-in keeps the common case cheap and leaves
`autocomplete: true` meaning exactly what it says.

The consequence worth stating: **a UI schema written against Material's default
renders a plain dropdown here.** `autocomplete` is portable, but its absence is
not.

Only `true` enables it, so an element `false` overrides a config `true` and
absence behaves like `false` — which matters only against a global default.

### 16.2 What the query does, which the specification requires to be stated

> A searchable renderer must define how the displayed choices respond to the
> query, including labels, locale, and empty results.

- **Labels, not values.** A case-insensitive substring of the displayed label.
  For a constant-based `oneOf` that is the branch title, so `Oper` finds
  Operations while `ops` — the stored constant — finds nothing.
- **Locale follows the labels.** They come from the translator, so a Bulgarian
  form is searched in Bulgarian.
- **Empty results** show a localized `enum.noMatches`.
- **Nothing is added.** Searching filters; it never creates a value. That is why
  a multi-select uses antd's `multiple` mode and never `tags`, which would.

### 16.3 The variants are the schema's decision, not an option's

**Implements.** `variant: "multi-select"` and `variant: "chips"` both rank 6,
above the automatic checkbox group at 5, because "explicit selection takes
precedence over automatic checkboxes".

What separates chips from a multi-select is not an option but the **item
schema**: finite items make the adder a chooser, free string items make it a
text box. Section 18 is explicit that "no separate free-entry option is
introduced", and there is none here.

`uniqueItems` is required for `multi-select` — it matches the same shapes the
checkbox group does — and optional for chips, where its absence is what permits
repeated tokens.

### 16.4 Chips draw their own tokens, because of duplicates

**Adds** the mechanism, which duplicates force.

A `uniqueItems`-free chips array may hold `["a", "a"]`, and section 18 requires
that removing one takes **the occurrence that was clicked**: "in presentations
allowing repeated values, removal must identify the intended occurrence."

antd's `Select` in tags mode cannot express that. It keys its tags by value, so
two equal tokens are one entry and closing either removes both. The tokens are
therefore rendered as `Tag`s of our own, **identified by position**, and removal
is by index. A missing target returns the array untouched rather than falling
back to an index — "never interpret a failed lookup as an array index
identifying another item".

### 16.5 Which value types the variants claim

**Narrows**, and the specification asks for exactly this judgement:

> A renderer's tester must match only choice value types that its selection,
> addition, and removal logic supports. Recognizing item oneOf branches
> containing const is not by itself evidence of support for object or array
> constants.

Both variants match **string** choices only — a string `enum`, or a `oneOf`
whose every branch has a string `const`. A numeric enum, or a constant that is
an object or array, is left unmatched so it stays "eligible for an appropriate
alternative renderer rather than selecting a widget that cannot edit it
correctly".

Value identity is nevertheless compared with deep equality rather than `===` or
`String(value)`, so the shared helper is correct if the claim is ever widened,
and so `1` and `"1"` stay distinct while `false` and `0` remain values rather
than absence.

### 16.6 Implementation

[`arrayChoices.ts`](../packages/jsonforms-react-antd-renderers/src/util/arrayChoices.ts)
holds the selection, identity and mutation rules with no React in it;
[`MultiSelectControl.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/MultiSelectControl.tsx)
and
[`ChipsControl.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/ChipsControl.tsx)
are the presentations. Searchability lives in
[`AntdSelect.tsx`](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdSelect.tsx),
so every single-value choice control inherits it.

Covered by `test/arrayChoices.test.tsx` and `test/autocompleteChoice.test.tsx`,
and demonstrated by the
[array-choices example](../packages/jsonforms-react-demo-common/src/examples/spec/array-choices/README.md)
and the searchable section of the
[choice-controls example](../packages/jsonforms-react-demo-common/src/examples/spec/choice-controls/README.md).

---

## Adjustment 17 — The confirmation policy

**Type:** **implements** section 14 as written. Nothing here diverges; what it
records is the shape of the implementation and the one boundary problem the
package layout creates.

### 17.1 What this replaced

Before this, every renderer decided for itself, and the results disagreed:

| Operation | Before | Now |
| --- | --- | --- |
| Array table row delete | Always confirmed, unconfigurably | Policy, fallback `always` |
| Array layout item delete | Never confirmed | Policy, fallback `always` |
| List-with-detail item delete | Never confirmed | Policy, fallback `always` |
| AG Grid selected-row delete | Never confirmed | Policy, fallback `always` |
| Mixed tree node delete | Never confirmed for a leaf; its own modal for a node with children | Policy, fallback `always` |
| Mixed type change | Never confirmed | Policy, fallback `complex` |
| Dynamic property delete | Never confirmed | Policy, fallback `always` |
| `oneOf` branch change | Confirmed on `!isEmpty(data)` | Policy, fallback `always` |
| `oneOf` clear | Never confirmed | Policy — clearing is a branch change |

The table's old behaviour is worth singling out because it *looked* correct: it
always confirmed, which agrees with the fallback. But it could not be switched
off, so `confirmation: { delete: "never" }` did nothing, and agreeing with a
policy by coincidence is not implementing it.

The `oneOf` rule was subtly wrong rather than merely unconfigurable. lodash's
`isEmpty` reports `0` and `false` as empty, and section 14 says the opposite:
"false, zero, empty strings, and empty containers are existing values." A branch
holding `0` changed without asking.

### 17.2 The policy is pure; the renderers only supply values

`confirmation.ts` answers two questions and knows nothing else: which policy
applies, and whether that policy prompts for the values being discarded. It has
no React in it and no dialog, so the resolution order and the meaning of
`complex` are testable directly rather than through eight renderers.

Two details from section 14 that are easy to get wrong and are settled there:

- **`complex` inspects the old value, not the destination type.** Turning a
  populated object into a string prompts; turning a string into an object does
  not. What matters is what is lost.
- **A batch asks once**, and asks at all if *any* discarded value qualifies —
  which is why the decision takes a list rather than a value.

An unrecognized policy value is ignored and resolution continues, so a typo
falls through to the fallback rather than silently meaning `never`.

### 17.3 Re-checking rather than remembering

Section 14: "confirmation performs the operation once, after rechecking
mutation guards and its target. Do not apply a stale confirmation to an
unrelated replacement item."

So the request carries a **closure**, not a decision. The guards it consults —
`removePropertyDisabled`, `canDeleteNode` — are re-read when the user confirms,
not captured when the dialog opened. The pending request is held in a ref as
well as in state so that confirming runs the closure the request was made with,
rather than whatever the latest render produced.

### 17.4 Confirmation is not permission

Worth stating because the two are easy to conflate: a prompt never appears for
an action the form would refuse anyway. `restrict`, `readonly`, disabled state,
`minItems` and schema constraints are all checked first, and confirming does not
relax any of them. A read-only form offers no deletes, so there is nothing to
confirm.

### 17.5 The AG Grid boundary

**The one place the package layout shows through.** Section 14's catalog list
includes `agGrid`, but that renderer lives in the framework-agnostic
`jsonforms-react-extended-renderers`, which must not depend on the antd set —
dependencies run extended → base, never the other way.

So two things are deliberately *not* in the agnostic package: the dialog, which
is antd's, and the policy vocabulary itself. It exposes a policy-free seam —
`useRemoveConfirmation`, which is told what would be discarded and what to do —
and the antd renderer set fills in the `agGrid` catalog id and the prompt, since
that is where the renderer is actually registered.

For the same reason `ConfirmationCatalogId` in the base package enumerates only
the ids that package owns and stays open (`| (string & {})`) for the rest. A
base package naming a downstream renderer would be the dependency running
backwards in the type system instead of in the imports.

Omitting the seam leaves the action immediate, so a renderer set that has not
opted in behaves exactly as it did.

### 17.6 One operation, one prompt — including the mixed tree

The mixed workspace's tree used to raise its own modal — *"Delete `route` and
all of its nested content?"* — whenever the node being deleted was a structured
one with children, and called the host's `onDelete` from that modal's OK. Once
`onDelete` routed through the shared policy, the result was **two** prompts for
one delete, the second of which no policy could switch off: it was the tree's
own state, not a resolved policy, so `confirmation: { delete: "never" }` got as
far as silencing the shared dialog and then met the tree's.

Every node now goes through `onDelete` and the shared policy decides. That
loses the old wording about nested content, which is the cost of section 14
owning the decision: one prompt, one place to configure it. The
`mixed.confirmDeleteTitle` and `mixed.confirmDeleteConfirm` keys went with it.

This is the general shape of the problem — a renderer that confirmed on its own
before the policy existed keeps confirming *as well*, and reads as correct
because a prompt still appears. The array table is the same situation handled
the other way: its dialog is the one the upstream antd renderers ship, and it
was kept, but the decision to open it was moved to the policy. Which component
asks is a per-renderer matter; whether to ask is not.

### 17.7 A row action must not also trigger the row

Every renderer here puts its destructive action **inside** the thing the action
operates on — a Delete button in a list entry, a collapse panel header, a tree
node. All three of those containers do something of their own on click: select,
expand, select. A DOM click on the button therefore reaches the container too
unless the handler stops it.

That is ordinary event bubbling, but section 14 turns it into a correctness
problem rather than a cosmetic one. The requirement is that **"cancellation
leaves committed data, selection, and expansion unchanged"**, and a prompt that
has already moved the selection cannot honour it: the move happened on the way
in, before there was anything to decline. Pressing Delete on one entry while
reading another would navigate to the entry being deleted, ask about it, and
leave the reader somewhere else if they said no.

So the rule is: **a row-level action calls `event.stopPropagation()` before
doing anything else.** Selecting and expanding stay the container's job; only
the action opts out.

| Renderer | Container's own click | Where it stops |
| --- | --- | --- |
| List with detail | Selects the entry | `ListWithDetailMasterItem.tsx`, the Delete button |
| Array layout | Expands the panel | `ArrayLayout.tsx`, the panel `extra` actions |
| Mixed tree | Selects the node | `AntdMixedTree.tsx`, Rename and Delete |
| Array table | — (no `onRow`, so rows are not clickable) | n/a |
| AG Grid | — (removal is a header action, not a row one) | n/a |
| Dynamic properties | — (the property rows have no click of their own) | n/a |

The bottom three rows are why this is worth writing down rather than leaving to
each renderer: a renderer that does *not* need the call looks identical in the
source to one that does, so "no `stopPropagation` here" is not evidence of
anything either way. The check is whether the container has a click handler of
its own — not whether the action looks unusual.

This is also the kind of defect that survives a passing test suite. Confirming
the delete produces the right data either way — the selection is the only thing
that differs, and only when the row being deleted is not the row being read.
`arrayDeleteConfirmation.test.tsx` pins it by selecting one entry and deleting
another.

### 17.8 Implementation

[`confirmation.ts`](../packages/jsonforms-react-antd-renderers/src/util/confirmation.ts)
for the policy,
[`useConfirmation.tsx`](../packages/jsonforms-react-antd-renderers/src/util/useConfirmation.tsx)
for the dialog and the request, and one call site per covered operation.

Covered by four suites, split by what they can break:

| Suite | Package | Covers |
| --- | --- | --- |
| `confirmation.test.tsx` | antd | The pure policy, plus dynamic-property delete |
| `arrayDeleteConfirmation.test.tsx` | antd | Array table, array layout, list with detail; and that a row action leaves the selection alone (17.7) |
| `confirmationRenderers.test.tsx` | antd | Mixed type change, mixed tree delete, `oneOf` branch change and clear |
| `gridDeleteConfirmation.test.tsx` | antd extended | AG Grid selected-row delete, and the batch case |
| `confirmationExampleRenders.test.tsx` | antd extended | That the worked example actually draws all of them |

The split matters for the last two: the grid's confirmation only exists when
this package supplies it, so a test in the base package could not see the seam
at all.

Demonstrated by the
[destructive-confirmation example](../packages/jsonforms-react-demo-common/src/examples/spec/destructive-confirmation/README.md).

---

## Adjustment 18 — The expandable array's expansion state

**Type:** **implements** section "Expandable array-item forms". One point
extends the specification rather than restating it, and is marked below.

### 18.1 What was actually wrong

Four options — `initCollapsed`, `collapseNewItems`, `hideAvatar` and
`hideArraySummaryValidation` — were specified, were exposed as toggles in the
demo's settings panel, and were read by no renderer at all. Flipping any of
them did nothing.

Three of the four are a line of work each. The fourth, `initCollapsed`, could
not be implemented at all until an underlying defect was fixed, and that defect
is the interesting part:

```tsx
const [expanded, setExpanded] = useState<string | boolean>(false);
const handleChange = useCallback(
  (panel: string) => (_event: any, expandedPanel: boolean) => {
    setExpanded(expandedPanel ? panel : false);
  }, []);
// ...
<Collapse onChange={(value: any) => handleChange(value)} />
```

`handleChange` is curried, and the `Collapse` calls it as though it were not.
`handleChange(value)` builds the inner function and throws it away, so
`setExpanded` never ran: `expanded` was permanently `false` and the `Collapse`
was left uncontrolled. Both halves type-check, because the outer call really
does return something.

The only user-visible trace was an avatar that never turned red — a debug style
(`backgroundColor: 'red'`) that had presumably been added to check this very
state and reported the truth. Everything else worked, because an uncontrolled
`Collapse` manages its own expansion perfectly well. It simply could not be
told anything.

### 18.2 Expansion is tracked by index

The state is now the expanded item's **index**, not its panel key, because
index is what every operation here already speaks: Add appends at `data`, the
sort buttons swap neighbours, Delete shifts everything after it down.

That matters because the specification asks for more than storing a number:

> Track the logical item through renderer-owned reorder operations rather than
> transferring expansion to the item now at its old index. Reconcile
> deletion/external replacement without editing the wrong item; do not inject
> business-data IDs solely for UI state.

So each mutation adjusts the index alongside the data — a swap moves the open
panel with its item, a delete closes it or shifts it down. The alternative the
specification rules out is a synthetic id on the data, which would put UI state
into the document.

`initCollapsed` is then a **lazy initial value**, not a controlled one:
"initialization only, not a continuously controlled expansion value." Reading
it on every render would reopen the first item whenever anything else changed.

### 18.3 `hideAvatar` hides the marker, not the identity

"True: hide that marker, without suppressing accessible item identity or
validation feedback." Removing the `Avatar` outright would also remove the only
statement of *which* item a header belongs to, since the label is the item's
own text and may be empty.

The index therefore moves into a visually-hidden span — clipped rather than
`display: none`, which would take it out of the accessibility tree as well.

**This is the point that extends the specification.** `hideAvatar` is defined
for the expandable array; list with detail draws the same one-based marker and
is not mentioned. It is honoured there too, because the option is set globally
from a host's configuration and a marker that disappears in one array renderer
and not the other reads as a bug rather than as a scope boundary. A superset,
not a divergence.

### 18.4 `hideArraySummaryValidation` subtracts, it does not blank

"True: hide that summary only; retain validation and field/item error
feedback."

The `errors` prop handed to an array layout is not the summary. JSON Forms
composes it as the control's **own** errors, then a newline, then the combined
child summary. Hiding the summary therefore means showing the first part, not
showing nothing: an array with `minItems: 3` and two items still has to say so.

The own errors are recomputed with `errorsAt(path, schema, p => p === path)`
rather than by trimming the composed string, which would depend on how the two
halves were joined.

### 18.5 Implementation

[`ArrayLayout.tsx`](../packages/jsonforms-react-antd-renderers/src/layouts/ArrayLayout.tsx)
for all four, and
[`ListWithDetailRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/additional/ListWithDetailRenderer.tsx)
plus
[`ListWithDetailMasterItem.tsx`](../packages/jsonforms-react-antd-renderers/src/additional/ListWithDetailMasterItem.tsx)
for `hideAvatar` and `hideArraySummaryValidation`.

Covered by `arrayOptions.test.tsx`. Every case there is driven through
**`config`**, not through the element's `options`, because that is how the
settings panel supplies them and an option that only works when written onto
the element does not answer the original complaint.

---

## Adjustment 19 — Pre-touch error filtering

**Type:** **implements** the specification's "Error-message filtering before
touch", with one documented limit. The algorithm is taken from the renderer
families the options come from rather than reinvented.

### 19.1 Why the algorithm is copied, not designed

The specification is explicit about the provenance: "existing options in the
inspected Svelte and Vuetify renderer-family helpers, adopted here with the
same names. They are not universal JSON Forms core options."

Shared names carry shared expectations. A form authored against
`vue-vuetify` and moved here must filter the same errors, so the branch order
in `filterErrorsBeforeTouch` is the branch order in
`vue-vuetify/src/util/composition.ts` and in the Svelte
`composition.svelte.ts`, which are themselves identical:

1. touched, or no errors, or filtering off → the errors unchanged;
2. a nonempty keyword list → drop the matching errors at this control's path,
   recompose the rest;
3. otherwise → the empty string.

Two details in that sequence are easy to lose by rewriting it:

**Step 2 returns the *original string* when nothing matched.** Recomposing from
core would be a no-op in the ordinary case and a silent difference wherever the
control's own `errors` prop carries more than core's errors do — which is
exactly the `additionalErrors` case the specification then asks about.

**An error with no `keyword` is never matched.** Both references guard with
`!error.keyword ||`, so a host-published error with no keyword is always
displayed rather than accidentally swept up by a keyword list.

### 19.2 Touch is per-control and local

Touch state is a `useState` inside each control, not a shared registry keyed by
path. That is what both references do, and it is right: nothing outside a
control needs to know it was visited, and the state is "runtime interaction
state, not form data or an authored UI-schema value".

An earlier note in the gaps document guessed this would need a provider on the
`PendingChangesProvider` model. It does not, and the guess was the more
expensive design.

**Touch is blur, not focus**, and it is one-way. `usePreTouchErrors` replaces
`useFocus` in the controls that filter, returning the same `focused`/`onFocus`/
`onBlur` triple plus the filtered message, so the wiring is a substitution
rather than a second hook to remember.

### 19.3 What is covered

Every control that prints its own errors: the scalar inputs through
`InputControl` and `NativeControl`, `MultiSelectControl`, `ChipsControl`, and
the extended colour, duration and null controls.

**Arrays and tuples are not.** The specification asks that summary
presentation "account for child touch state when it claims the same pre-touch
behavior" — and immediately says to "document supported summary behavior and
runtime touch-state lifecycle rather than assuming every array renderer shares
an implementation". This set does not claim it; neither does the Svelte family.

So an array header keeps reporting what is wrong beneath it, while the controls
*inside* an item form filter normally. That is a defensible reading rather than
an oversight: the summary's job is to point at trouble the user cannot see, and
a collapsed item is precisely that.

### 19.4 Implementation

[`preTouchErrors.ts`](../packages/jsonforms-react-antd-renderers/src/util/preTouchErrors.ts) —
`filterErrorsBeforeTouch` is pure and exported, so the branches a rendered form
does not reach are testable directly.

Covered by `test/preTouchErrors.test.tsx`: the
[worked example](../packages/jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/README.md)
rendered end to end, plus unit tests for a host-published `additionalError`
surviving a suppressed core error beside it, an error with no keyword, and a
keyword list that matches nothing.

The fixture is built so the two cases cannot be confused: four `required`
errors and three that are not. A filter that hid all seven would pass a fixture
with only required errors in it.

---

## Adjustment 20 — Placing a tuple's positions with a layout

**Type:** **adds** a UI option the portable specification does not describe.
Nothing here contradicts it; the specification fixes what a tuple's children
*are* and leaves where they appear to the renderer.

### 20.1 What it adds

`options.detail` on a tuple control supplies a UI schema that places the fixed
positions. It is the same name, and the same rule, every other container
control uses: **scopes resolve against the control's own schema.** For an
object that is `#/properties/city`; for a tuple it is `#/items/N`, or
`#/items/N/...` to reach inside a position.

**Not `options.layout`.** The specification reserves that: "flat layout options
configure immediate children. `options.layout` configures child participation"
— `span`, `weight`, `width` and the rest. A tuple inside a HorizontalLayout may
carry it, and it says nothing about the tuple's positions.

#### The other `detail`, and why there is no conflict

A tuple has two levels, and the name appears at both — on different elements:

| Element | What its `detail` lays out | Scopes resolve against |
| --- | --- | --- |
| the tuple's Control | the positions | the tuple (`#/items/N`) |
| a position's Control, from the registry | that position's dialog | the position's value |

They never meet, so a form may carry both, and `tupleControl.test.tsx` has the
case that keeps them apart.

What made this possible was **dropping the forwarding**: a tuple-wide `detail`
used to be passed down as the control in the position's `findUISchema` lookup,
which is what gave the name a second meaning at the same level. That behaviour
is not missed. It applied one dialog layout to every complex position whatever
its schema, it crashed outright on an array-typed position, and no test covered
it. The specification's own advice is to leave position dialogs to the
registry: "omit it when selecting individual registry entries."

**This is a divergence**, narrowly: the specification says "explicit tuple-wide
detail retains the existing JSON Forms detail lookup precedence", and it no
longer does. The replacement is a registry entry, which is more precise anyway
because it can match per position schema rather than applying to all of them.

### 20.2 A scope may reach inside a position

`#/items/0` is the whole position; `#/items/0/properties/city` is a field
within it. Both resolve against the tuple, so a layout has one scope base
however deep it goes — the same relationship `#/properties/city` has to an
object control.

The second form cannot be left to the outer dispatch, and the reason is a
constraint in core rather than a choice here. `schemaMatches` resolves a
Control's scope **only when the enclosing schema is an object**:

```js
var currentDataSchema = schema;
if (hasType(schema, 'object')) {
    currentDataSchema = resolveSchema(schema, schemaPath, context?.rootSchema);
}
```

A tuple's schema is an array, so a scoped Control dispatched against it is
offered the whole array schema, matches no renderer, and renders blank —
silently. `mapStateToControlProps` would have resolved it correctly; the
tester never gets that far.

So a scope with a remainder is re-rooted: dispatched at the position's data
path against the position's own schema, carrying `#/<remainder>`. That puts an
object back in the slot the tester inspects. A bare `#/items/N` needs none of
this, because the position renderer matches it by index without resolving
anything.

### 20.3 Dispatched, not interpreted

The layout goes through `JsonFormsDispatch` with the tuple's own schema and
path, so a `Group` in it is the ordinary Group renderer — collapse state,
validation indicator and all — and any layout type the form already supports
works, rather than a fixed list the tuple knows about. Interpreting the layout
would have meant reimplementing each container, and then keeping the copies in
step.

What makes that cheap is that `toDataPath` already understands positional
scopes: `#/items/0` resolves to `"0"` and `#/prefixItems/1` to `"1"`, with no
help needed.

Positions are still rendered by `TupleField`, through a renderer entry added to
the dispatched subtree only. So a position keeps its label, its complex-value
summary and its Edit dialog wherever the layout puts it — it does not decay
into an ordinary control on the way.

### 20.4 The position renderer is declared at module scope

`TuplePositionRenderer` and its registry entry are module-level constants, and
the per-render values they need arrive by context.

This is not tidiness. A renderer defined inside `TupleControl` would be a new
component *type* on every render, so React would unmount and remount the input
beneath it — and whoever was typing would lose the caret mid-word. It is the
same failure the masked input hit for a different reason, recorded in
Adjustment 11, and the same rule applies: the element tree may not change shape
underneath an input that has focus.

### 20.5 Omitting a position is allowed, and accounted for

A layout may name only some positions. The data behind the ones it leaves out
is still present and still validated, so without further care the result is a
form that is invalid with nothing on screen explaining it — the position that
failed being the one the author chose not to draw.

That is the "errors without rendered targets" requirement, reached from a new
direction: there the control did not exist, here the author hid it. The
specification's answer is the same either way, and it is not "refuse to hide":
"hiding a control does not discard its underlying errors or exempt its data
from validation. Ensure eligible errors remain discoverable without forcing
hidden controls visible merely to show them."

So an omitted position's errors are reported by the tuple itself, in the error
area it already has for array-level failures, prefixed with the position's name
because the field that would have identified them is not drawn. A position that
is drawn keeps reporting beside itself, unprefixed and exactly once.

**This is the part of the feature most likely to be lost in a refactor.** The
arrangement works perfectly well without it; the only symptom is a form that
cannot explain itself, and only when a hidden position happens to be invalid.

### 20.6 TODO — upstream fix so the workaround can be dropped

**Status: open. Needs a PR against `eclipsesource/jsonforms`.** Everything
below was measured in this repo against `@jsonforms/core@3.9.0-alpha.1`; it is
written so someone can act on it without repeating the investigation.

#### The defect

A tester resolves a Control's `scope` **only when the enclosing schema is an
object**. In `packages/core/src/testers/testers.ts`, in both `schemaMatches`
and `schemaSubPathMatches`:

```ts
let currentDataSchema = schema;
if (hasType(schema, 'object')) {
  currentDataSchema = resolveSchema(schema, schemaPath, context?.rootSchema);
}
```

For any other enclosing schema the predicate is handed the **whole enclosing
schema** instead of the scoped subschema. With an array — a tuple — that means
`isStringControl` is asked whether an *array* is a string, answers no, no
renderer matches, and the control renders **blank with no error**.

It is an asymmetry rather than a considered rule: `mapStateToControlProps`
already resolves correctly against `ownProps.schema` (`testers`' sibling, same
file group), so the control's props would have been right. Only selection is
wrong.

#### Minimal reproduction

```jsonc
// schema
{ "type": "object", "properties": {
    "pickup": { "type": "array", "items": [
      { "type": "object", "title": "Address",
        "properties": { "city": { "type": "string", "title": "City" } } },
      { "type": "number", "title": "Rank" } ] } } }
```

Dispatch a Control with `scope: "#/items/0/properties/city"` against the
**tuple's** schema. Expected: a string control bound to `pickup.0.city`.
Actual: nothing renders.

Directly, without any rendering:

```js
isStringControl(
  { type: 'Control', scope: '#/items/0/properties/city' },
  tupleSchema,
  { rootSchema }
);
// => false     (Resolve.schema(tupleSchema, sameScope, rootSchema) is correct)
```

#### The fix

Two lines, one at each call site:

```diff
- if (hasType(schema, 'object')) {
+ if (hasType(schema, 'object') || hasType(schema, 'array')) {
    currentDataSchema = resolveSchema(schema, schemaPath, context?.rootSchema);
  }
```

#### Evidence it is safe

Applied to `@jsonforms/core@3.9.0-alpha.1` in this repo:

| Check | Before | After |
| --- | --- | --- |
| `isStringControl` on the scope above | `false` | `true` |
| The three deep-scope tests, with our workaround removed | fail | **pass** |
| Full suite, four packages, 1098 tests | pass | **pass, no regressions** |

The blast radius is narrow by construction: the change alters only a Control
whose scope is deeper than `#` **and** whose enclosing schema is not an object.
Today those receive the whole enclosing schema, which is essentially always
wrong and renders blank, so nothing reasonable can depend on it.

**Caveat for the PR author:** that suite is *this* repo's. Upstream's own
array/tuple tests should be run before merging.

#### What to delete here once it lands

`TuplePositionRenderer` keeps a `renderWithin` branch that re-roots a scope
with a remainder. With the fix upstream it becomes dead weight:

1. narrow `positionEntry`'s tester to a **bare** position scope, so core
   handles the rest — `POSITION_SCOPE.exec(scope)` and require no `[2]` group;
2. delete `renderWithin` from the context and its use in
   `TuplePositionRenderer`;
3. the deep-scope tests in `tupleControl.test.tsx` should still pass unchanged
   — that is the signal the removal was safe.

### 20.7 ~~TODO — a summary-only registry entry hangs the dialog~~ — **fixed**

**It was not a tuple defect, and it was not about the dialog.** Both of those
were in the original report, and both were wrong; they are kept here because
the wrong description is what made it survive so long.

**What it actually is.** `ObjectRenderer` asks the UI-schema registry for the
schema of the object it is rendering and dispatches the answer **at the same
path**. If the answer is a `Control` matching that same schema, the dispatch
selects `ObjectRenderer` again, which asks the registry the same question:

```ts
uischemas = [{
  tester: (schema) => (schema.title === 'Address' ? 10 : -1),
  uischema: { type: 'Control', scope: '#' },
}]
```

That is enough. No tuple, no dialog, no `summary` - a plain object property
with that entry exhausts the heap on first render.

**Why it read as a tuple-and-dialog problem.** A tuple position resolves its
editor through the registry and renders it inside `CompositeDetailDialog`, so
that is where it was first seen; the dialog only mounts its body when opened,
which is why opening looked like the trigger. The original note also recorded
"an entry with no options at all is fine" - the opposite of the truth. That
observation is what sent the investigation towards `dialogOptions`, which has
nothing to do with it.

**The pattern worth remembering:** the entry with the *least* configuration is
the one that hangs.

| Registry entry | Before |
| --- | --- |
| `Control`, no options | **hangs** |
| `Control`, `options: {}` | **hangs** |
| `Control` with `summary`, no `detail` | **hangs** |
| `Control` with `options.detail` | fine |
| a layout | fine |

The two safe rows are safe for different reasons, and neither is a deliberate
guard: a layout does not dispatch back to a control renderer, and core's
`findUISchema` returns `control.options.detail` *before* it consults the
registry, so the cycle never forms.

**Why nothing threw.** An infinitely deep React tree is legal. There is no
stack overflow and no error - the process allocates until it dies, with an
out-of-memory abort naming no application code. A component-render counter
finds nothing either, because no component re-renders: the tree is deep, not
repainted.

**The fix** is a cycle guard in `util/uiSchemaCycle.tsx`. Each renderer
announces through context the element it is about to dispatch and the path it
will dispatch it at; a descendant about to dispatch the same element at the
same path uses the generated UI schema instead and reports
`uischema.registryCycle`, naming the path.

Context, not a module-level set, because two sibling objects of the same schema
are not a cycle - only an ancestor is. A test covers exactly that, since a
shared set would refuse the second sibling.

The signature is the path plus the element's `type` and `scope`, not object
identity: a caller may spread the entry to add a label, so the descendant sees
a copy rather than the same object.

`MixedRenderer` also resolves through the registry at its own path and was
checked for the same hazard. It does not loop - it dispatches a per-type
control rather than the resolved element - so it is left alone.

Covered by `uiSchemaRegistryCycle.test.tsx`, which asserts the render, the
diagnostic, both safe shapes, the sibling case, and the original tuple-dialog
report. **A regression there aborts the run rather than failing it**, for the
reason above; the test file says so.

### 20.8 Implementation

[`TupleControlRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/TupleControlRenderer.tsx).
A layout value that is not an object with a string `type` is ignored and the
default arrangement is used — the same rule `findUISchema` applies to
`options.detail`, so the two behave alike when malformed.

Covered by `tupleControl.test.tsx` (fifteen cases, including that editing a
repositioned field writes to its own index, the three for scopes reaching
inside a position, and the three for omitted positions) and
`tupleExampleRenders.test.tsx`,
and demonstrated by **Survey point** in the
[tuple-control example](../packages/jsonforms-react-demo-common/src/examples/spec/tuple-control/README.md).

---

## Adjustment 21 — The layout sizing model

**Type:** **implements** sections 6 and 7, and **removes** two options the
portable contract does not include. The removals are the part with
consequences, so they come first.

### 21.1 Two options that are gone

**`trim`** narrowed a control by suppressing its full width. The contract is
explicit — it "excludes the trim sizing option" and says to "use the shared
layout sizing options to control width". It was read in nine places across the
antd control set and in none of this repository's examples.

Controls are now always full width, and narrowing is the layout's job:
`options.layout.width` or `maxWidth` on the control. A form that set
`trim: true` gets a full-width control and a diagnostic.

**`columns`** encoded a child's width as an integer from 2 to 16 against a
fixed 16-column grid. It is **not** in the portable contract at any point; the
equivalent is `options.layout.span` against a configurable `gridColumns`.

This one is not a clean win, and the trade is worth recording. `columns` is
what the **Svelte** renderer family reads — `element.options?.columns`, with
the same 2-16 validation and the same row-packing — and this repository's
`HorizontalColumnsLayoutRenderer` is a port of it. Svelte implements none of
the portable model: `gridColumns`, `minItemWidth`, `layoutDefaults` and
`options.layout` appear nowhere in it.

So conforming here means the two families **stop agreeing on layout
authoring**, which was a deliberate decision rather than an oversight. The
renderer and its tester are still exported for a host that wants the old
behaviour; what changed is that they are no longer **registered**. At rank 3
that renderer outranked the base `HorizontalLayout`, so leaving it in would
have meant the sizing model could never take effect.

A control carrying either option draws a diagnostic. Silence was the wrong
answer: the form would render at the wrong size with nothing to explain it.

### 21.2 The two halves, on two elements

The distinction that makes the rest readable:

| Where | Configures | Shape |
| --- | --- | --- |
| `options.layout` on a **child** | how that child participates in its parent | `span`, `weight`, `width`, `height`, `min`/`max` |
| flat `options` on the **layout** | the container | `gap`, `wrap`, `align`, `justify`, `minItemWidth`, `gridColumns` |

"Flat layout options configure immediate children. `options.layout` configures
child participation."

`layoutDefaults` lives at `jsonformsExtended.layoutDefaults`, per Adjustment 1,
rather than at the top level of `config`.

### 21.2a The default gap is antd's, and depends on the direction

Section 7 recommends a fallback gap of 0 "unless renderer capability documents
another portable default". This is that documented default, and it is **16px
for a row and 0 for a column**.

Zero is right for a family whose controls carry their own margins. antd's do
not, horizontally: two controls placed side by side share an edge. And no
uischema written for another family says otherwise, because none of them set
`gap` — Material and Vuetify space children themselves. The upstream JSON
Forms examples are exactly this shape, and rendered here every one of them came
out with its horizontal rows touching. A fallback that makes every unmodified
uischema look broken is not a useful fallback.

Vertically the opposite holds, and this is why the default cannot be a single
number: `Form.Item` already carries `marginBottom: token.marginLG` (24px), so
a column gap is added *on top of* spacing that is already there. A non-zero
column default double-spaces every vertical form.

16px is not arbitrary — it is antd's own `Row gutter={16}` convention and the
value of its `margin` token.

Nothing about the resolution order changes: an explicit `gap` on the element
still wins, then `jsonformsExtended.layoutDefaults.gap`, and only then this.
**`gap: 0` restores the previous behaviour exactly**, at either level, so a
layout that wants its children to share an edge can still say so.

`resolveGap` takes the direction as a required argument rather than defaulting
it, since a caller that omitted it would silently give a column the row's
gutter.

### 21.3 The span formula, rearranged for CSS

The specification gives

```text
c = (W - (G - 1) * g) / G
spanWidth(n) = n * c + (n - 1) * g
```

which depends on the row's usable width `W`. CSS does not have it, so the
expression is rearranged to one that does not need it:

```text
spanWidth(n) = (n / G) * W - g * (G - n) / G
```

and emitted as `calc(<n/G * 100>% - <(G-n)/G> * <gap>)`. The percentage is of
the row, which is `W`, so the two agree exactly.

### 21.4 Min and max are constraints, and the browser redistributes

"Resolve mixed rows: effective children → gaps/chrome → Fixed → Span against
complete logical grid → Weight/Auto remainder → min/max redistribution."

The first four steps are what `itemSizing` computes. The last is left to flex
layout, which performs the same redistribution: flexible children shrink
first, then span and fixed ones down to their minimum. Reimplementing it would
have meant measuring the row and re-running on every resize, to arrive at the
same answer.

### 21.5 Hidden children leave layout

"Only effective visible UI-schema children participate."

The previous implementation gave every child `span={Math.floor(24 / elements.length)}`
against an antd `Row`, counting hidden children - so a hidden child still held
a column and its gutter open. Visibility is now resolved before sizing, and the
count that feeds the arrangement is the count of children that remain.

### 21.6 Spacer sizes on the parent's axis, and the parent applies it

A Spacer's `size` is a **top-level field**, and it applies to the parent's main
axis: width in a row, height in a column.

It would be natural to have the Spacer ask its parent which axis that is. It
does not, because a Spacer lives in the framework-agnostic package and the
layout in the antd one, and neither depends on the other - a context shared
between them would have created exactly the backwards dependency the AG Grid
seam was built to avoid (Adjustment 17.5).

Instead the **layout** resolves it: `itemSizing` reads a `Spacer`'s top-level
`size` as a Fixed main-axis dimension, so the axis is right by construction.
What remains in the Spacer is the standalone case the specification also
covers - "top-level `size` supplies intrinsic spacing independently of parent
layout support" - where the axis falls back to height.

`options.layout.weight` still applies, which is the specification's flexible-push
example; `flexShrink: 0` used to be hard-coded, so a weighted Spacer could not
flex.

### 21.7 Splitter

Three gaps closed: `resizable` (default true; false leaves the separator in
place as a boundary but stops it being focusable or draggable), initial sizes
from normal sizing rather than equal shares, and hidden panes leaving layout.

"Span SHOULD NOT be used" with a splitter, so a pane asking for one falls back
to Auto rather than being sized against a grid a draggable pane does not have.

`wrap` together with the splitter variant is "unsupported", and now draws a
diagnostic: panes divide a single axis with separators between neighbours, so
there is no second row to wrap on to.

### 21.8 Vertical weight uses a content-height basis

"Vertical weight distributes remaining height only when parent height is
definite/resolvable."

The obvious mapping - `flex: <weight> 1 0` on both axes - satisfies the first
half and breaks the second. A zero basis in a column collapses the child to
nothing whenever the parent's height is indefinite, which is the ordinary case
for a form on a page.

A column therefore emits `flex: <weight> 1 auto` instead. That *is* the
qualifier, in CSS: the child starts at its content height and weight divides
whatever is left over - nothing when the height is indefinite, the remainder
when it is. A row keeps the zero basis, where the qualifier does not apply.

Worth knowing because the two look like they should be symmetric, and the
first version of this was.

### 21.9 What is deliberately not implemented

Recorded so the remaining distance from sections 6 and 7 is a decision rather
than an unknown.

| Requirement | Status and reason |
| --- | --- |
| `options.layout.start` | **Accepted and ignored.** The specification marks it `// reserved` and defines no behaviour, so there is nothing to implement. It is in the type so a form carrying it does not look like a mistake. |
| `options.layout.responsive` | **Accepted and ignored**, same reason - `// reserved`, and typed `unknown` even in the specification. |
| min/max redistribution as an explicit pass | **Delegated to flex layout**, which performs the same redistribution the specification describes. See 21.4. |
| "without wrap Span/Fixed may shrink to minimum then overflow/scroll" | **Partly.** Shrinking to the minimum is flex behaviour and works. No `overflow` is set on the container, so the page scrolls rather than the row. Setting it would impose a scroll container on every layout, which the specification does not ask for. |
| `minItemWidth` only auto-fitting with `wrap: true` | **Applied regardless.** It is described as "parent default minimum", which is meaningful without wrapping; the wrap qualifier reads as being about auto-fit behaviour rather than about the minimum itself. If that reading is wrong the fix is one condition. |
| "HTML comments, Lit markers, fragments/placeholders MUST NOT affect sizing" | **Not applicable.** The requirement is aimed at template-based renderers. React emits no comment nodes here, and each participating child is wrapped in exactly one sized element. |
| "cross-row column positions align only for pure-span rows" | **Informational.** It describes what the formula produces, not a behaviour to add; mixed rows resolve per row, which is what it says they do. |

### 21.10 Implementation

[`layoutSizing.ts`](../packages/jsonforms-react-antd-renderers/src/util/layoutSizing.ts)
is the whole model, pure and with no React in it, so the resolution rules are
testable without rendering.
[`layout.tsx`](../packages/jsonforms-react-antd-renderers/src/util/layout.tsx)
applies it, and both layout renderers pass their own options through.

Covered by `layoutSizing.test.tsx` (22 cases: the resolution chains, the
formula, precedence, diagnostics, and a rendered row),
`layoutSizingExample.test.tsx` (the worked example) and
`layoutPrimitives.test.tsx` (Spacer and splitter initial sizes). Demonstrated
by the
[layout-sizing example](../packages/jsonforms-react-demo-common/src/examples/spec/layout-sizing/README.md).

---

## Adjustment 22 — Two template engines, selected per element

**Type:** **implements** section 13's TemplateLayout profiles, and **diverges**
in one named way: this set adds a `jsx` profile the portable contract does not
define.

### 22.1 Resolution, and why an unknown language is not a fallback

"Resolve the language from explicit `lang`, then the configured default, then
ractive for the default web profile. **Keep that existing config name.**"

The name is kept and the **namespace** is not. Adjustment 1 puts every
form-wide setting under `jsonformsExtended` and leaves element options flat,
and a key sitting at the top level of `config` is the one exception that would
have to be remembered. So it is read from
`config.jsonformsExtended.defaultTemplateLang`, with the specification's flat
spelling still honoured underneath it — a form written against the literal
wording keeps working, and the namespaced one wins when both are present.

The choice is made in the **tester**, because a `TesterContext` carries the
form-wide `config`. Registration is:

| Rank | Tester | Renderer |
| --- | --- | --- |
| 2 | `templateLangTester('jsx')` | the Sucrase/JSX profile |
| 2 | `templateLangTester('ractive')` | the Ractive profile |
| 1 | `unsupportedTemplateLangTester` | the diagnostic |

The engine testers deliberately **do not** consult `allowScriptEvaluation`. A
tester returning `-1` for a host that has not granted permission would leave
the element unmatched and the form silent, which is the opposite of what the
specification asks for - "report unsupported/evaluation-disabled behavior
instead". The element is matched, and the renderer explains itself.

### 22.3 Both engines are string evaluation

`allowScriptEvaluation` gates **both**, and the reason is worth stating because
one of them looks safer than it is.

The JSX profile compiles a template with Sucrase and evaluates the result with
`new Function`. Ractive does not compile a whole component, but it *does*
compile every `{{ }}` expression through `new Function` - verified by reading
the shipped bundle, where the call builds `return (expr)`. Narrower, and still
string evaluation; neither is a sandbox, and both need CSP `unsafe-eval`.

The default is therefore off, and a form that was rendering templates before
this change will stop until its host opts in. That is the intended migration,
not a regression: it was previously running `new Function` over UI-schema
content with no permission check at all.

### 22.4 Ractive in React: partials are placeholders, portals are the children

Ractive owns a DOM subtree and patches it surgically; React cannot render into
that subtree. So each named child becomes a **generated placeholder partial** -
`{{> body}}` resolves to an empty element carrying a slot attribute - and React
portals the delegated renderer into it. The partial registry is generated from
the child names, so a template never mentions the attribute.

Two things this has to get right:

- **Placeholders are re-reported after every `set`.** One inside `{{#if}}` or
  `{{#each}}` is a *different DOM node* after the condition changes, and a
  portal aimed at the old node renders into a detached element - visibly
  nothing, with no error. The Svelte implementation has `reportSlots()` for
  exactly this reason.
- **Portals are keyed by slot name**, so a child keeps its React identity
  across those refreshes rather than remounting.

The payoff, and the reason the profile is worth having: a data change patches
the bound text without the template re-running and without the slotted controls
remounting, so focus, caret and local state survive.

### 22.5 Why not react-jsx-parser

Worth recording, because it is the obvious third option and it fails for a
non-obvious reason.

It is the only candidate that needs **no** `new Function` - verified by
inspecting its bundle, where the only `Function(` hits are acorn's
`parseFunction` and the only `eval` strings are acorn's reserved-word table. It
slots, iterates, branches and interpolates correctly; the claim in its README
that it rejects inline arrow functions is **not** true of the shipped code.

It fails on reactivity. It re-parses the JSX and rebuilds the element tree on
every render, so React cannot reconcile: a slotted control is **remounted** on
every data change, losing focus and local state. Measured against a plain-React
baseline with an identical stable element and `key`:

| | same DOM node kept |
| --- | --- |
| plain React | yes |
| react-jsx-parser | **no** |

So its one hard guarantee costs the behaviour that makes slotting usable.

### 22.6 Both engines are code-split

Neither compiler is in the initial bundle. Each engine's module is loaded
through `React.lazy`, the same arrangement the AG Grid and Monaco controls
already use, so a form with no `TemplateLayout` downloads neither - and because
selection happens in the tester, a form of `lang: "ractive"` templates never
fetches Sucrase.

Measured on the demo application's build:

| | contains Sucrase | contains Ractive |
| --- | --- | --- |
| app entry (1.8 MB) | no | no |
| `DynamicJSXRenderer` chunk (224 KB) | yes | no |
| `RactiveTemplate` chunk (360 KB) | no | yes |

One detail makes this work and is easy to undo: the `ElementRender` marker
lives in **its own module**. It is a bare `Symbol.for`, but it used to be
exported from `DynamicJSXRenderer`, so a renderer importing just the symbol
pulled Sucrase into the initial bundle and defeated the split entirely.

### 22.6a The URL policy applies to what a template rendered

Section 12 makes the URL policy a MUST for "every URL-bearing value", and
`Link` and `ImageView` had always honoured it. A **template** had not:

```jsx
<a href={data.url}>go</a>
```

went straight into the anchor, so a `javascript:` URL arriving in **form data**
became a working script the moment anybody clicked it. Both string engines were
affected.

**Why it lasted.** Everything a reader checks first is safe. Text interpolation
is escaped by React and by Ractive, the engines themselves are gated behind
`allowScriptEvaluation`, and the template in every example is a trusted literal
written by the form's author. None of that helps: the *value* is data, and the
policy exists precisely because a trusted template can be handed a hostile
value.

**Where the check goes.** Below the engine, not in it. There are three engines
and no reason for each to learn the policy separately, so `util/templateUrls.ts`
holds the attribute table and both checks.

| Profile | Interception point | Timing |
| --- | --- | --- |
| `jsx` | the `createElement` pragma this package owns | **before** the element exists |
| `ractive` | a DOM pass over the subtree Ractive just rendered | same synchronous block as the render that wrote it |
| native (TSX) | none — the build compiles it with React's own pragma | the policy is handed to the template as `urlPolicy` |

The Ractive row is a genuine weakening and is documented rather than smoothed
over: Ractive owns its DOM and offers no hook for a bound attribute value, so
the attribute is briefly present. Nothing has painted and no click can have
arrived, so `javascript:` in an `href` — the case that actually executes
attacker code — is gone before it is reachable. A `src` may have begun loading.

The TSX row is not a hole of the same kind. A string template is **data** and
may arrive with the form; a TSX template is **code in this repository**, which
can already do anything. What is still data either way is the value, so the
resolved policy is passed in and `isAllowedUrl` is exported.

**A refused URL drops the attribute, not the element.** An `<a>` without an
`href` is text that cannot navigate; an `<img>` without a `src` shows its
`alt`. Removing the element would make a hostile value indistinguishable from
a missing one, which section 19's honest-rendering requirement rules out. The
refusal is reported as `template.urlRefused`, naming the attribute.

Three details the attribute table has to get right, each of which a
`href`-only fix would miss:

- **Fifteen attributes carry URLs**, not one — `src`, `srcSet`, `poster`,
  `action`, `formAction`, `cite`, `ping`, `background`, `manifest`, `profile`,
  `longDesc`, `codeBase`, `classID`, `xlink:href`.
- **`src` changes kind with its element.** On `<img>` it loads an image, so
  `allowImageDataUrls` may permit a `data:image/...`; on `<iframe>` the same
  attribute loads a *document*, where that opt-in must not apply.
- **Lists are refused whole.** `srcSet` and `ping` hold several URLs; keeping
  the survivors would silently change which image the browser picks.

And one false positive worth avoiding: on a **custom component** only string
values are judged, because a component may define `src` as something
structured, and whatever it eventually renders comes back through the pragma
anyway. On an intrinsic element anything non-null is judged, since React
stringifies it into the attribute — including an object with a hostile
`toString`.

Covered by `templateUrls.test.ts` for the attribute surface and
`templateUrlPolicy.test.tsx` for the policy reaching each engine end to end.

### 22.7 A load boundary must not report a render failure as a load failure

The chunking above needs an error boundary, because Suspense has none of its
own: if the import fails there is nothing to render and nothing to say. That
boundary sat at the top of `createLazyTemplate`, and its message was **"The
template engine could not be loaded."**

An error boundary does not catch only the thing you put it there for. It
catches everything below it — including a template that throws while React is
reconciling the output it returned. So a broken template reported itself as a
broken *download*, and sent the reader to the network tab.

It hid a real bug for exactly that reason (28.3). The fix is two-part:

- `createLazyTemplate` records whether `load()` ever resolved. Once the chunk
  is in, a later failure can only be the template's own, and the boundary says
  **"The template could not be rendered."** The markers are distinct too —
  `data-template-load-error` against `data-template-render-error` — so a test
  can tell the two apart.
- The JSX engine's **own** boundary was not a boundary at all. It had a
  `componentDidCatch` and **no `getDerivedStateFromError`**, so `hasError` was
  never set, `render` went on returning the children that had just thrown, and
  the error escaped upward on the retry. It now derives state, which is what
  makes its detailed "Template Runtime Error" panel — error, stack, template
  source, available bindings — actually reachable.

Worth stating as a rule, because the shape recurs: **a boundary's message must
describe the smallest thing it could be catching, not the reason it was
added.** A boundary placed for one failure will be the first to see every other
failure beneath it.

The Ractive profile has no inner boundary of its own, so the outer one is its
net; the `renderError` label is what it shows.

### 22.8 Implementation

[`templateLang.ts`](../packages/jsonforms-react-extended-renderers/src/util/templateLang.ts)
resolves the language and the permission, with no React in it.
[`templateEngines.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/templateEngines.tsx)
holds the testers and the diagnostic,
[`RactiveTemplate.tsx`](../packages/jsonforms-react-extended-renderers/src/components/RactiveTemplate.tsx)
the engine, and
[`lazyTemplate.tsx`](../packages/jsonforms-react-extended-renderers/src/util/lazyTemplate.tsx)
the split.

Covered by `templateEngines.test.tsx`: selection by `lang`, by
`defaultTemplateLang`, the `ractive` default, explicit beating configured, both
unsupported-language cases, the gate on each engine separately, partials by
name, index-named children, iteration and branching, and that a data change
leaves the label node and the slotted control identical.

The [worked example](../packages/jsonforms-react-demo-common/src/examples/spec/template-layout/README.md)
puts each engine in its own `Categorization` tab, with the two controls both
templates read left above the tabs. That is what a reader wants — one engine at
a time, the same five behaviours in each — and it also shows the split working:
the second compiler is fetched when its tab is opened. `templateLayoutExample.test.tsx`
drives the tabs and scopes every assertion to the open panel, since the panel
left behind stays mounted and prints the same words.

**Migration.** A template written for the JSX profile must now declare
`lang: "jsx"`, or it resolves to `ractive` and prints its braces literally. The
`template-layout` example's five elements were updated accordingly, and it
grants `allowScriptEvaluation` as a host would.

---

## Adjustment 23 — When a selection writes, and when it only displays

**Type:** **implementation notes** on sections 13 and 18, recording four
renderers brought into line with the specification and one rule that explains
why two of them behave differently from each other.

The four were found by writing the
[combinators](../packages/jsonforms-react-demo-common/src/examples/spec/combinators/README.md)
and
[presentation](../packages/jsonforms-react-demo-common/src/examples/spec/presentation/README.md)
examples. Each was a divergence nobody had noticed, because each one is
invisible until a form uses the shape the specification describes.

### 23.1 `ImageView` reads top-level `src`, `scope` and `alt`

Section 13 puts all three at the top level of the element. The renderer read
`options.src` and `options.alt` and nothing else, so the specification's own
example —

```json
{ "type": "ImageView", "src": "/images/logo.png", "alt": "Company" }
```

— rendered **nothing at all**. Not a broken image: no element.

`scope` was not implemented in any form, so an image whose URL lives in the
data had no way to be shown.

Now implemented in full, with the precedence the section specifies:

| Situation | Result |
| --- | --- |
| `src` defined | That is the source. Never falls through to `scope`. |
| `src` is `""` | A deliberate blank: no image, no diagnostic. |
| `src` defined but refused by the URL policy | No image, `image.urlRefused`. Still no fall-through. |
| Neither `src` nor `scope` | `image.noSource`. |
| `scope`, schema permits strings, value empty | No image, quietly. The property is simply unfilled. |
| `scope`, schema cannot hold a string | `image.scopeNotString`. |
| `scope`, value is not a string | `image.nonStringSource` — not coerced into a URL. |

**`options.src` and `options.alt` are kept as a fallback**, below the
top-level fields. Nothing in the specification asks for them; forms in this
repository were authored against them, and a silent blank is a poor way to
learn about a rename.

**A missing `alt` is reported and the image still renders.** `alt: ""` is the
documented way to declare an image decorative, and defaulting a missing one to
`""` quietly makes that claim about every image. But withholding the image
over a missing annotation helps nobody, so `image.missingAlt` is a warning
beside a rendered image rather than a replacement for it.

**`allowImageDataUrls` now does something.** It was declared in the URL policy
and read by nothing, because `isAllowedUrl` never consulted it. `ImageView`
goes through `isAllowedImageUrl`, which additionally accepts `data:image/…`
when the flag is set. Only images: a `data:` URL of any other media type stays
refused, so the flag cannot become a way to smuggle in a document.

### 23.2 `Separator` reads `options.vertical`

Section 13's single orientation encoding was read by nothing, so a vertical
separator rendered as a horizontal rule across the layout. It now also carries
`aria-orientation`, because an `<hr>` has an implicit `separator` role whose
orientation defaults to horizontal — without it a screen reader describes
side-by-side sections as stacked. The extent comes from the layout, as the
section requires: the rule stretches to its row and sets no height of its own.

### 23.3 `oneOf` preserves the enclosing schema's own properties

Section 18: "initialize from the selected branch's generated defaults and
preserve existing values of properties declared in the enclosing schema's own
properties. Those preserved values take precedence over generated defaults."

The renderer wrote the generated defaults alone, so every branch change — and
every clear — silently dropped every enclosing value. Against the
specification's worked example, switching from Email contact to Phone contact
turned `{"name":"Alex","kind":"email","email":"alex@example.com"}` into
`{"kind":"phone","phone":""}`. `name` is gone, and nothing says so.

`branchChangeData` in [`util/combinators.ts`](../packages/jsonforms-react-antd-renderers/src/util/combinators.ts)
now applies the rule, and it is deliberately narrow: a property is preserved
because the **enclosing** schema declares it, never because the branch being
left and the branch being entered share a name. The specification is explicit
about that second case, and `kind` in the example is exactly it — present in
both branches, and replaced.

The confirmation was also weighing the wrong value. Section 14 says to
"evaluate the data actually discarded, excluding enclosing properties
preserved during a branch change", so `discardedByBranchChange` removes them
before the policy sees it. Without that, a `complex` policy prompts about
`{"name":"Alex"}` although the switch loses nothing.

### 23.4 `anyOf` navigation writes nothing — and why that is safe

Section 18: "Tab navigation alone preserves data… the active tab is
presentation state only." Changing tab now writes nothing whatsoever, and
therefore prompts about nothing.

The change that made this worth writing down is the case it looks like it
should break. An **object branch displayed over a string value** has inputs
bound to paths that do not exist. It seems they must have nowhere to write, and
an implementation that seeds the branch on navigation — which is what this one
did, behind a "Clear form?" prompt — looks like the only way to make the tab
usable.

It is not. JSON Forms' `update` builds the containers along the path, verified
directly against `coreReducer`:

| Value before the edit | After a child write of `note` |
| --- | --- |
| `"a plain note"` | `{"note":"hello"}` |
| `undefined` | `{"note":"hello"}` |
| `42`, `null`, `{}` | `{"note":"hello"}` |

So the branch becomes real when the user **edits** it — the moment they
actually chose it — rather than when they merely looked at it. That is a
strictly better moment to replace their data, and it needs no prompt because
the replacement is the edit they just made.

`anyOfExample`'s test pins this at the level it lives: if core ever stops
building the container, every other assertion in that file becomes a silent
data loss, so the reducer behaviour has a test of its own rather than being
assumed.

### 23.5 The rule the two cases share

> A selection that changes **what is displayed** writes nothing. A selection
> that changes **what the value is** must write.

`anyOf` is the first. `oneOf` is the second, and the difference is not a
matter of taste: its branches carry generated defaults that the visible inputs
do not offer. In the specification's example the Phone branch requires
`kind: "phone"`, declared as a `const` — and the branch form renders inputs for
**Name** and **Phone** only. There is no field for `kind` anywhere, so no
amount of typing produces it. Without a write on selection that branch would
be permanently invalid, which is why section 18 gives `oneOf` an explicit
branch-change contract and `anyOf` none.

The same test separates the other selections in this renderer set: a mixed
control's type change, an array's Add, and a tuple position's type change all
change what the value *is*, and all write. A `Categorization` tab, a `Group`'s
expansion and a splitter's position change only what is displayed, and none of
them writes — section 22 lists exactly those as runtime state.

### 23.6 One editor for a composition that describes one

Section 18's project presentation contract: "when composition describes one
unambiguous scalar editor, render it once and preserve the outer Control's
label, description, i18n, options, and data path."

`{"type":"integer","anyOf":[{"maximum":3500},{"minimum":7500}]}` was rendering
as a **tab strip labelled `anyOf-0` and `anyOf-1`** over a single integer —
the generated labels for two branches that have no titles, because they are
not things to choose between. The `oneOf` form of it was worse: a branch
dropdown plus a duplicate copy of the control, from the enclosing-properties
pass.

`scalarCompositionTester` (rank 4 — above the three combinator renderers at 3,
below the finite-choice renderers at 5, which section 18 says "take precedence
where applicable") now renders one input. The tester is deliberately
conservative and answers "no" to anything it does not recognise, because the
branch presentation is what it falls back to and that loses nothing:

- exactly one combinator keyword, and no `enum` or `const` on the outer schema;
- every branch made only of validation and annotation keywords — anything with
  `properties`, `items`, `required`, `enum`, `const` or a nested combinator
  disqualifies the whole composition;
- one primitive type, agreed between the outer schema and every branch.

**`oneOf` and `anyOf` bounds are dropped from the input**, because they are
alternatives: "Do not copy both branches' bounds onto the input: minimum 20 and
maximum 10 would prevent valid entries. Even choosing just one branch's bound
would exclude values that the other branch permits." They are left to
full-schema validation, which still reports them beside the single input.

**`allOf` branches are folded in**, because `allOf` is an intersection and all
of its constraints apply together. That is what turns the draft-07
meta-schema's `nonNegativeIntegerDefault0` into one integer input with
minimum 0, as the section's example requires.

One detail cost an hour and is worth recording: **a tester is handed the
schema the dispatch started from, not the schema at the control's scope.** The
first version tested its `schema` argument directly, which is the root schema
for a top-level control, so it never matched and the tester looked broken while
the underlying predicate was correct. `schemaMatches` resolves the scope first,
and is what every core combinator tester uses for the same reason.

### 23.7 A `oneOf` branch follows the data until the user picks one

Section 18: "Opening the form selects a suitable editor for the existing
value… If the value matches a later oneOf branch, display that branch."

The selection was derived **once, at mount**, and never again. That made a
*discriminated* `oneOf` go stale the moment its discriminator changed:

```json
"oneOf": [
  { "title": "Collect in person", "properties": { "method": { "const": "collect" }, "collectionPoint": {…} } },
  { "title": "By post",           "properties": { "method": { "const": "post" },    "postcode": {…} } }
]
```

Choosing **By post** in the enclosing `method` select left the collection
point on screen and the postcode nowhere. Since the branch is the only
mechanism by which a schema alone decides which fields exist, this was the
feature failing at exactly the point it is worth having.

The rule matches `anyOf`'s: the branch follows `indexOfFittingSchema` until
the user selects one, after which the choice is theirs — and their selection
writes the branch's defaults, so the data is on that branch anyway.

**A value that fits no branch leaves the display alone.** Section 18 keeps a
fallback branch on screen "alongside validation errors, while retaining the
incoming data for correction", and re-deriving to "no branch" mid-edit would
hide the field the correction needs.

### 23.8 What a schema condition can and cannot do to presentation

Section 18 states the negative — "A schema condition does not itself define a
SHOW/HIDE rule" — and is silent on the positive, which is the question every
reader arrives with: *can a schema decide which fields are on screen?*

It can, and not through `if`/`then`/`else`. Three routes were tried, and the
findings are recorded here because two of them look like they work:

| Route | Result |
| --- | --- |
| A Control scoped at a property declared only inside `then` | **Renders always.** The scope resolves against the static schema, finds nothing, and the control falls back to the scope's last segment for a label — an unschema'd input bound to a path the schema never described. |
| Letting JSON Forms generate the UI schema | Generation reads `properties` only, so a property under `then` gets no control at any time. |
| A `oneOf` / `anyOf` branch with a `const` discriminator | **This is the mechanism.** The branch that fits the value is the branch on screen, and the fields change with the data. |

The first row is the trap: the field appears, accepts typing and stores what
is typed. Nothing reports it.

So the division is:

| To change… | Use |
| --- | --- |
| whether a value is **required**, or valid | `if` / `then` / `else` |
| whether a field is **on screen** | a combinator branch, or a UI `rule` |

Demonstrated in the combinators example's last tab, whose UI schema contains
no `rule` at all — a test asserts that, since the claim is that the schema did
the work.

### 23.9 `allOf` renders its enclosing properties

"The enclosing properties followed by all branch forms in schema order."
`AllOfRenderer` rendered the branches only — it never used
`CombinatorProperties` at all, which `oneOf` and `anyOf` both do — so a
property declared beside an `allOf` had no input anywhere on the form and no
way to be edited.

**This is the one to check first in another renderer set**, because two
details make it easy to repeat and the symptom is silence:

- `CombinatorProperties` reads as "the *selector's* enclosing properties", and
  `allOf` has no selector. The properties belong to the enclosing object, not
  to the selector, and are just as real without one.
- Its `combinatorKeyword` prop was typed `'oneOf' | 'anyOf'`. A family copying
  that type finds `allOf` rejected by the compiler and reasonably concludes the
  component does not apply to it.

Nothing errors, nothing validates differently, and the data keeps whatever the
property already held — so the value survives a round trip and the gap only
surfaces when somebody tries to edit that field. The
[gaps review §5.6a](jsonforms-react-antd-implementation-gaps.md) keeps the
entry, struck through, for exactly that review.

### 23.10 Implementation

| Change | Source | Tests |
| --- | --- | --- |
| ImageView | [`ImageViewRenderer.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/ImageViewRenderer.tsx) | `imageView.test.tsx` |
| Image data URLs | [`urlPolicy.ts`](../packages/jsonforms-react-extended-renderers/src/util/urlPolicy.ts) | `imageView.test.tsx`, `urlPolicy.test.ts` |
| Separator | [`SeparatorRenderer.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/SeparatorRenderer.tsx) | `layoutPrimitives.test.tsx` |
| oneOf preservation | [`util/combinators.ts`](../packages/jsonforms-react-antd-renderers/src/util/combinators.ts) | `combinators.test.tsx` |
| oneOf follows the data | [`OneOfRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/OneOfRenderer.tsx) | `combinatorsExample.test.tsx` |
| anyOf navigation | [`AnyOfRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/AnyOfRenderer.tsx) | `combinators.test.tsx` |
| Single scalar editor | [`util/scalarComposition.ts`](../packages/jsonforms-react-antd-renderers/src/util/scalarComposition.ts) | `combinators.test.tsx`, `combinatorsExample.test.tsx` |
| allOf enclosing properties | [`AllOfRenderer.tsx`](../packages/jsonforms-react-antd-renderers/src/complex/AllOfRenderer.tsx) | `combinatorsExample.test.tsx` |

**Still open**, and recorded in the gaps review rather than fixed here:
clearing a `oneOf` selection through the select's own clear affordance, and
the `composition.multipleMatches` / `composition.noMatch` summary fallbacks.

---

## Adjustment 24 — The Button contract

**Type:** **implementation notes** on section 14, recording what the `Button`
renderer was missing before the
[button-actions](../packages/jsonforms-react-demo-common/src/examples/spec/button-actions/README.md)
example was written against it.

### 24.1 The fields are top-level

Section 14 declares `label`, `icon`, `color`, `params`, `action` and `script`
on the element. The renderer read `options.action` and `options.label`, and
nothing else — so a conformant button had no action name and, worse, **no
`params` at all**: the field was declared on `ActionEvent` and never
populated.

That omission is not cosmetic. `params` is what lets one command serve several
buttons:

```json
{ "type": "Button", "label": "Български", "action": "setLocale", "params": { "locale": "bg" } }
```

Without it the only way to express two languages is two action names, and the
host grows a branch per language. The example's whole demonstration — buttons
that change the form's language — is impossible without the field.

`options.action` and `options.label` are still read, below the top-level
fields, for forms already authored that way.

### 24.2 Pending, and the duplicate activation guard

"Pending/loading covers the complete fireActionEvent promise. Duplicate
activation SHOULD be prevented while pending. Rejection clears pending and
propagates through existing application/platform error handling."

None of this existed: the handler was called and its result discarded, so a
slow command could be fired any number of times.

The guard is a **ref, not the pending state**. A second click can arrive
before React has re-rendered with `pending: true`, so state alone leaves a
window in which both activations get through. The reset is in a `finally`, and
the rejection is deliberately not swallowed — an unhandled rejection is the
platform error handling the section refers to.

### 24.3 The script path

`script` was not implemented. It is now, as the section specifies: an **async
function body**, invoked with the ActionEvent as `this`, so `this.context`,
`this.params` and `this.element` are reachable and top-level `await` works.
The async function constructor is not a global, so it is reached through
`Object.getPrototypeOf(async function () {}).constructor`.

It is gated on `jsonformsExtended.security.allowScriptEvaluation`, the same
permission the template engines use, and reports
`script.evaluationDisabled` in place of the button when the permission is
absent. A script button that silently did nothing would read as a broken
command rather than a policy decision.

`action` and `script` are mutually exclusive, so an element carrying both is
diagnosed (`action.conflict`) rather than resolved by precedence — the
specification states the exclusivity without saying which wins, because an
element carrying both is an authoring mistake.

### 24.4 Semantic colours

`color` takes section 14's closed set of six. They are names for intent, so
the mapping belongs to the renderer set: `error` becomes antd's `danger`,
`warning` its danger-tinted default (antd has no distinct warning button), and
`alternative` a dashed button. A different family maps them differently, which
is the point of naming them semantically.

The union is restated in the antd package rather than imported from the base
one. The base package publishes its types from a build, and a renderer set
should not need that build to be current before it compiles.

### 24.5 A `script` may be a function, and `action` wins over it

Section 14 places function-valued scripts outside the portable model - "Some
JSON Forms/extension APIs accept function values… That adaptation is outside
this portable v1 model" - which licenses them as a build-time authoring
convenience that never appears on the wire.

They were previously **silently swallowed**. A function passed as `script` was
stringified into an `AsyncFunction` body, where `() => { … }` is a closure
expression that is created and discarded: the button clicked, did nothing, and
said nothing. That is a worse failure than the template form's, which at least
crashed.

**The event is an argument, and `this` as well.** The specification binds
`this` because a string body has nowhere else to receive context. A function
does, and keeping `this` alone would be a trap:

```ts
script: (event) => console.log(event.context)        // works
script: function () { console.log(this.context); }   // works
script: () => console.log(this.context)              // `this` is undefined
```

`.call()` **cannot** bind an arrow function's `this` - it is lexical - so the
third line compiles, runs, and reads the wrong thing with no diagnostic. An
arrow is what anyone writes by reflex. `script.call(event, event)` binds both,
so neither idiom can be got wrong, and a body pasted across from the string
form keeps working.

**`allowScriptEvaluation` gates the string form only.** The permission exists
because compiling a string needs CSP `unsafe-eval`; a function the build
already compiled needs nothing of the sort, and requiring a permission for it
would be theatre.

**`action` wins when an element carries both.** The section states the
exclusivity without saying which takes precedence, because carrying both is an
authoring mistake - so the question is which failure is least harmful. An
action goes to the host's handler, where it can be logged, refused or
authorised; a script runs arbitrary code with no such oversight, and the
section itself calls it "a last-resort, non-portable runtime escape hatch".
Preferring the portable, auditable path is the choice this project makes
everywhere else, and it is also the only one available when a JSON form
carries a string script and the host has not granted the permission - in that
case the script cannot run **at all**, so any other precedence would make the
button dead rather than merely surprising.

The counter-argument, weighed and rejected: *specific beats general, and a
script is a local override of a generic action*. It does not survive 24.6 -
once the type makes both impossible to write deliberately in TypeScript,
anything arriving at the runtime with both is a mistake rather than an
override, and a mistake should fail towards the path someone can see. On those
two grounds the decision is not finely balanced.

The conflict is a **console warning**, not a rendered message. Replacing the
button would break a form that works today the moment somebody adds a stray
`action`, and the person filling it in can do nothing about either. A button
declaring *neither* still fires the action path with an empty action, rather
than becoming a dead control.

### 24.6 The type makes both impossible

```ts
export type ButtonUiSchema =
  | (ButtonUiSchemaBase & { action: string;       script?: never })
  | (ButtonUiSchemaBase & { script: ButtonScript; action?: never })
  | (ButtonUiSchemaBase & { action?: never;       script?: never });
```

`never` members rather than a discriminant, because the JSON form has no field
to discriminate on and inventing one would change the portable model to serve
the TypeScript one.

**The base is `BaseUISchemaElement`, not `UISchemaElement`**, and that detail
decides whether the type is usable. In this core version `UISchemaElement` is
a **union of nine types**, so intersecting it distributes across all of them:
the XOR became twenty-seven members, and an author who declared both an action
and a script was told their Button was *missing `elements`* — TypeScript
having wandered into the `HorizontalLayout` branch. `BaseUISchemaElement` is
the single interface those nine share, a Button remains assignable to
`UISchemaElement` through it, and adding the literal `type: 'Button'` gives
the discriminant that makes the error land where the mistake is:

```
Type '{ type: "Button"; … }' is not assignable to type '{ action?: never; script?: never; }'.
  Types of property 'action' are incompatible.
    Type 'string' is not assignable to type 'never'.
```

The same distribution applies to any `UISchemaElement & { … }` in this
codebase. It is harmless where the intent really is "any element, plus a
field" — `ExtendedUISchemaElement` — and worth avoiding wherever an author
will read the error. The runtime still has to cope with both being present,
since a JSON-authored form never passes through this type - which is why the
precedence above exists at all.

### 24.7 Not implemented

`icon` is accepted and handed to the renderer set, but no icon set is wired
up, so nothing is drawn for it. The `ActionEvent` also does not go through a
web-component `source.callback` round trip; the React path awaits the handler
directly, which is the behaviour the section describes for a renderer that is
not inside the web-component integration.

### 24.8 Implementation

[`ButtonRenderer.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/ButtonRenderer.tsx)
holds the contract and
[`AntdButtonRenderer.tsx`](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdButtonRenderer.tsx)
the colour mapping. The demo application answers `setLocale` in its own
`handleAction`, which is the host half of the example.

Covered by `buttonActionsExample.test.tsx`: the event and its params, one
command serving two buttons, the language actually changing, pending and the
duplicate guard, rejection clearing pending, the script running with the event
as `this`, both diagnostics, and that a disabled button fires nothing.

---

## Adjustment 25 — Temporal serialization and picker bounds

**Type:** one **defect fix** that had made a whole renderer family unusable,
one **addition** (the format bounds), and one **documented divergence** about
where `restrict` is read from.

Reported from the demo, as a screenshot: a time field showing
`must match format "time"` that the picker could not repair.

### 25.1 The default save formats produced invalid values

A temporal control is selected **by** the schema's `format` keyword. It
follows that the value it writes has to satisfy that same keyword — and it did
not.

JSON Forms' `createAjv` validates formats in **full** mode, where RFC 3339
`time` and `date-time` both require seconds *and* a timezone offset:

| Format | Written | `format: "time"` accepts it |
| --- | --- | --- |
| `HH:mm:ss` — core's `defaultTimeFormat` | `17:04:09` | **no** |
| `HH:mm:ssZ` — §18's default | `17:04:09-04:00` | yes |

So a time control put the form into an error state the moment anyone used the
picker, and using the picker again could not clear it, because **every value it
could produce was invalid**. That is what made this worth a report rather than
a shrug: the form offered no way out.

`dateTimeSaveFormat` was `YYYY-MM-DD HH:mm` — a space instead of `T`, no
seconds, no offset — against §18's `YYYY-MM-DDTHH:mm:ssZ`. `dateSaveFormat`
was already correct, because `date` needs no offset.

The Svelte renderer family (`jsonforms-svelte-skeleton`, outside this
repository) already defaults to `'HH:mm:ssZ'` and `'YYYY-MM-DDTHH:mm:ssZ'`,
which is both a useful
confirmation and a reminder that this was our bug, not the specification's
ambiguity.

The defaults now live in
[`util/temporalFormats.ts`](../packages/jsonforms-react-antd-renderers/src/util/temporalFormats.ts)
rather than being taken from core, and `temporalSaveFormats.test.tsx`
validates what a picker commits **with the same Ajv the form uses** — the only
check that would have caught this. Six of its tests fail against the old
defaults.

### 25.2 Format bounds now reach the picker

`formatMinimum`, `formatMaximum`, `formatExclusiveMinimum` and
`formatExclusiveMaximum` were read by nothing; §18 asks them to "prevent
choices and completed commits". [`util/temporalBounds.ts`](../packages/jsonforms-react-antd-renderers/src/util/temporalBounds.ts)
resolves them into antd's `disabledDate` and `disabledTime`, following the
Svelte family's `schemaBounds` closely enough to be worth reading side by side.

Three details carry the contract:

- **Exclusivity is resolved at the picker's precision.** A calendar offering
  whole days cannot express "after the 19th but not the 19th" except by
  starting at the 20th, which is the section's own worked example. An exclusive
  bound steps one unit; the unit is the picker's, not the bound's.
- **A bare time is a clock value.** Both ends are placed on one arbitrary
  reference day so they compare, rather than inventing a date or a zone.
- **Date-time bounds bite per boundary day.** `disabledDate` removes whole days;
  `disabledTime` narrows hours only on the first and last day, leaving a day
  strictly inside the range unrestricted.

Contradictory bounds are reported as an empty range and the picker offers
nothing, rather than silently offering everything.

**A bound never rewrites stored data**, which the section is explicit about:
"does not authorize clamping existing data". An out-of-range value stays as it
is and is reported by the validator. The temporal example ships exactly one
such value to demonstrate it.

### 25.3 `restrict` is not read from the flat config

§15 states the default plainly — "`restrict`: shared preferred default
**true**" — and JSON Forms core's `configDefault` sets `restrict: false`.

Those cannot both hold through the usual `merge({}, config, uischema.options)`.
Once merged, core's seeded `false` is indistinguishable from an author's
explicit `false`, so `restrict !== false` evaluates to `false` for every form
that does not opt in, and the specification's default becomes unreachable. This
is not hypothetical: the bounds above were wired up correctly and disabled
nothing at all until this was found.

`effectiveRestrict` therefore resolves **element `options.restrict` →
`config.jsonformsExtended.restrict` → `true`**, deliberately skipping the flat
`config.restrict`. That follows adjustment 1's namespacing — element options
flat, form-wide settings namespaced — and it is the only ordering in which a
host can express all three of "on", "off" and "unspecified".

**The same reasoning applies to every other `restrict` in this renderer set**,
which still uses the merged-config idiom and is therefore off by default. That
is recorded in the gaps review rather than changed here, because it would alter
the behaviour of array, mixed and additional-property renderers in one go and
deserves its own pass.

### 25.4 `views`, and the coupling that ran backwards

§18 makes `views` "a date-only array drawn from `year`, `month`, `day`" and
says plainly that it "does not automatically change `dateSaveFormat`". It was
read by nothing; the picker's granularity was **inferred from the save
format** instead — no `D` meant a month picker, no `M` a year picker.

That is the section's rule backwards. It lets storage decide interaction, and
it makes the legitimate request "a year/month picker that stores a full date"
inexpressible. `datePickerMode` now takes the finest view the author asked
for, and falls back to the old inference only when `views` is absent, for
forms already relying on it.

### 25.5 A save format the schema's format rejects is diagnosed

The trap that produced the original report, twice over:
`timeSaveFormat: "HH:mm"` on a control carrying `format: "time"` writes
`23:03`, which that keyword rejects. It reads like a display setting and is a
validity setting, and the result is a form nobody can make valid.

`saveFormatSatisfies` decides this **empirically** — it formats a fixed
reference instant with the save format and tests the result against RFC 3339 —
rather than parsing the format string, so a spelling nobody anticipated is
judged by what it actually emits. A schema with no ordered `format` has
nothing to contradict and never warns, which is exactly the point of selecting
a control through `options.format` instead.

**The reference instant is `2001-02-03T04:05:06`, and every component being a
single digit is the point.** An unpadded token emits two digits anyway for any
instant after 09:59, so a probe taken from the afternoon accepts `H:mm:ss` and
the padding bug ships. At 04:05:06 the same format emits `4:05:06`, which
RFC 3339 rejects. It is fixed rather than `dayjs()` because the answer must not
depend on when the form happens to be rendered.

It lives beside the check rather than at the call sites: the first version had
each picker pass its own copy of the instant, which put an implementation
detail of the probe into three files and made the choice above impossible to
state in one place.

`warnOnSaveFormat` reports it once per offending combination under the stable
code `temporal.saveFormatInvalid`, as a **console warning** rather than a
rendered message. That follows adjustment 10.5's precedent for
`Categorization`'s `initial`: it is a mistake in the UI schema, and the person
filling in the form already has the validation error and can do nothing about
the cause.

### 25.6 Consequences worth knowing

**Offsets are now visible in stored values**, and a picker displays an
offset-bearing value in the **viewer's** timezone: `09:30:45+02:00` reads as
`03:30` in a UTC−4 browser, and editing writes the browser's offset. For a
`date-time` that is defensible; for a bare time it is more doubtful, and the
Svelte family's `parseTemporalText` takes care to compare "in their entered
offset, not the browser's local timezone".

Left as-is, because §18 marks `timezone` / `saveTimezone` PROVISIONAL and
neither is implemented, so there is no way to express a different intent yet.
Recorded so it is a decision rather than an accident — and the example's tests
assert the *shape* of a displayed time rather than a wall clock, so they do not
depend on where they run.

One existing test pinned the old behaviour (`'15:37:00'`) and now expects a
pattern; the format it asserted was the invalid one.

---

## Adjustment 25a — `views` is not date-only

**Type:** **widens** section 18's `views` entry to what the convention it comes
from actually carries, and records the per-control split.

### 25a.1 What the specification says, and what the source says

Section 18 describes `views` as "a date-only array drawn from `year`,
`month`, `day`". That is narrower than the renderer convention it is adopted
from, whose three temporal controls all read the option and default it
differently:

| Control | Default in the source convention |
| --- | --- |
| Date | `['year', 'day']` |
| Date-time | `['year', 'day', 'hours', 'minutes']` |
| Time | `['hours', 'minutes']` |

So a UI schema written against that family and carrying
`views: ['hours','minutes']` was being accepted and ignored here — the seconds
column stayed, and nothing said why.

### 25a.2 The rule

| Control | Admissible views |
| --- | --- |
| Date | `year`, `month`, `day` |
| Time | `hours`, `minutes`, `seconds` |
| Date-time | all six |

The finest **date** view named is where the calendar lands; the **time** views
name the columns drawn. A view a control cannot use is accepted and ignored.

### 25a.3 An array naming no view of a kind leaves that half to the format

`timePickerColumns` returns `undefined` rather than an all-false set when no
time view is named, and this is load-bearing rather than tidiness: a picker
already derives its columns from the display format, so an explicit all-false
set would blank the panel of a time control whose `views` happened to be
date-only — which is exactly what a date-time control's natural default array
looks like from the time half's point of view.

### 25a.4 The date half of a date-time control is not narrowed

A date-time picker always offers a full date. Applying a `month` view to it
would leave the control unable to express a value it is required to store, so
only the time half of a combined array is applied.

### 25a.5 No separate "close on selection" option

The same source convention carries a boolean for whether picking a value
closes the picker. It is **not** adopted: that is the staging behaviour
section 18 already spells `showActions`, and section 5 forbids two equivalent
encodings for one presentation. A UI schema carrying the other spelling is
accepted and ignored.

`showActions` itself remains unimplemented here; that is a coverage gap, not a
reason to adopt a second name for it.

### 25a.6 Status

`datePickerMode` reads the date views; `timePickerColumns` reads the time
ones. Covered by `temporalBounds.test.ts` for the mapping and
`temporalViews.test.tsx` for the rendered columns, which asserts that omitting
`seconds` removes exactly one panel column.

The authoring schemas admit all six values, and the UI-schema pair narrows
them per control kind through `options.format`. A control selected by its
**data** schema's format is invisible to a UI-schema validator, so that
narrowing is partial by construction.

---

## Adjustment 26 — The validator these renderers expect, and antd's own language

**Type:** two **additions** — a validator factory and a locale registry — and
one **finding** about a schema shape that renders correctly and is not
validated at all.

### 26.1 `createFormsAjv`

JSON Forms' `createAjv()` is deliberately plain. Three of the things it leaves
off are things schemas here rely on, and the
Svelte renderer family's `core/validate.ts` (outside this repository) makes
exactly the same three choices — a useful check that this is the shape of
validator these renderers expect rather than a local preference.

| Option | Why |
| --- | --- |
| `$data: true` | See below; without it a schema using `$data` **fails to compile**. |
| `useDefaults: true` | A schema `default` is written into the data, which several renderers assume when they treat a value as "its default". |
| `discriminator: true` | A discriminated `oneOf` reports its branch's own errors rather than every branch's. |

It also registers `color`, which is not a JSON Schema format and which
`ajv-formats` does not define, and takes extra formats from the caller.

**`$data` is the one that bites.** It is not a matter of a bound going
unenforced:

```
Error: formatMinimum value must be ["string"]
```

Ajv throws that at **compile** time, so `{"formatMinimum": {"$data": "1/from"}}`
— the obvious way to write a date range — takes the whole form down rather than
degrading. A renderer set that ships bound support and a validator that cannot
compile the canonical use of it is not much use, which is why this factory
exists.

The **web component and the demo both use it**, one instance each (Ajv caches
compiled schemas; a fresh instance per paint would recompile on every
keystroke).

**The demo needing it is not a nicety.** The throw happens inside
`coreReducer` while the JSON Forms store initialises, so a single example with
a `$data` bound takes the *whole application* down at mount, with a stack that
names Ajv and never mentions which example. `specExamplesCompile.test.ts`
compiles every registered example's schema the way the app does, because a
per-fixture test cannot catch this - the fixture is fine, the wiring was not.

Not brought across from the Svelte factory: `ajv-errors`, `ajv-keywords` and
the `ajv-i18n` error translations. All three are present in the lockfile and
would be useful — `errorMessage` in particular — but each is a new direct
dependency and they deserve their own pass.

### 26.2 `$data` bounds reach the picker too

§18 keeps the two capabilities apart: "literal bounds and `$data` references
are separate support capabilities. A renderer claiming literal-bound support
must not imply that it resolves `$data` bounds." So resolving them is a
deliberate second step rather than something the bound work got for free.

One typing detail is worth knowing, because the error it produces points
somewhere else entirely. antd types `disabledTime` as
`(date: DateType) => DisabledTimes`, **not** nullable. Declaring the parameter
`Dayjs | null` makes TypeScript infer the picker's whole generic as
`Dayjs | null`, which then rejects the `onChange` handler beside it:

```
Type '(value: dayjs.Dayjs) => void' is not assignable to type
'(date: unknown, dateString: string | string[] | null) => void'.
```

That reads as an `onChange` problem and is caused by `disabledTime`. The
parameter is typed non-null with a runtime guard kept, since a bare time
picker really can be called with nothing.

`resolveDataBounds` follows the JSON Relative Pointer against the form data
before the bounds are computed, so the calendar for `to` greys out everything
before `from` and **follows along as `from` changes**. Anything it cannot
follow leaves the bound simply unapplied — the picker offers more than it might
and the validator still decides.

### 26.3 `prefixItems` renders correctly and validates nothing

Found while adding tuples to the temporal example, and the most surprising
thing in this pass.

JSON Forms configures a **draft-07** Ajv. `prefixItems` is a 2020-12 keyword it
has never heard of, while the tuple *renderer* understands it perfectly well:

| Spelling | Renders the positions | Validates them |
| --- | --- | --- |
| `items: [ … ]` + `additionalItems: false` | yes | **yes** |
| `prefixItems: [ … ]` | yes | **no** — the keyword is ignored, a bad value passes |
| `prefixItems: [ … ]` + `items: false` | yes | **rejects every element** |

The third row is the trap, and it is the spelling the 2020-12 specification
actually recommends: to a draft-07 validator `items: false` means "no items at
all", so a correct 2020-12 tuple can never be valid and nothing explains why.

Both are verified directly against the validator, and the temporal example's
fixture uses `prefixItems` **without** `items: false`, accepting that its
positions go unchecked rather than shipping a form that cannot be valid.

The remedy is a host-supplied Ajv built from `ajv/dist/2020`, verified to
validate the positions, reject a bad one and reject an extra item.
`createFormsAjv` does **not** do this: switching meta-schema changes how every
existing draft-07 schema in this repository is read, and that is a decision for
a host rather than a default.

### 26.4 antd's own language

JSON Forms carries a locale and translates the strings the **renderers** own.
antd owns a second set nobody authored here — month and weekday names, "Today",
"OK", a select's empty text, a table's sort tooltips — and they stayed English
however the form was configured. That reads as a translation gap in the form
rather than a setting nobody had connected.

`useAntdLocale` resolves a language tag to an antd locale and sets **dayjs**
alongside it, because antd supplies the widget chrome while dayjs supplies the
formatted date. The web component's `ConfigProvider` now uses it.

**Loaders, not imports.** antd ships 75 locales and dayjs 143; importing them
statically means bundling all of them to use one. Each entry is a function
whose `import()` the bundler turns into its own chunk, fetched only if that
locale is asked for — so the registry answers both halves of the question: it
*is* the build-time selection of supported languages, and only the one in use
is downloaded.

The specifiers are deliberately literal. A computed `import(path)` cannot be
analysed statically, and a bundler answers that by emitting either nothing or
all 75, so adding a language means adding a line. `setAntdLocaleLoaders`
replaces the set wholesale for a build that wants fewer chunks or more
languages.

**One thing that looked right and was not:** applying `dayjs.locale()` inside
the loader. It runs once per language, so switching back to an already-cached
locale left whichever language was loaded *most recently* formatting the dates.
The dayjs name is now carried on the loaded value and re-applied every time a
locale becomes active — `antdLocale.test.tsx` walks bg → de → bg to hold that.

A tag the build does not carry, and a chunk that fails to load, both fall back
to antd's own default, which is English. A form in English chrome is a better
outcome than one that will not render.

---

## Adjustment 27 — `name` belongs to the element model

**Type:** **implementation note** on section 2, recording where this project
declares what core does not.

Section 2 lists the core types a TypeScript implementation may import and then
adds one of its own:

```ts
export type NamedUISchemaElement = UISchemaElement & { name: string };
```

— "`name` is used where an element must be referenced, for example
Categorization initial selection."

Core does not declare `name` on `UISchemaElement`, and this project does not
control core. That gap had been filled **six times over, locally**: a
`NamedElement` in `TemplateRenderer`, an inline `UISchemaElement & { name?: string }`
in `TemplateLayoutRenderer`, casts in `SlotRenderer`, `ButtonRenderer` and the
Ractive partial naming, and a `{ lang?: unknown }` cast beside them.

They now come from [`core/uiSchema.ts`](../packages/jsonforms-react-extended-renderers/src/core/uiSchema.ts):

| Type | Meaning |
| --- | --- |
| `NamedUISchemaElement` | Section 2's own declaration, `name` **required** — for a `Template` invocation, a `Slot`, a registry entry looked up by name, where the type is the guarantee. |
| `ExtendedUISchemaElement` | Any element of this model: core's, plus an optional `name`. The type to read an arbitrary element through. |
| `ExtendedLayout` | A layout whose children may be named. |
| `isNamedUISchemaElement` | Narrows to the first; an empty name addresses nothing and does not count. |

**`name` is general, not a template feature.** It is read by the `Template`
registry lookup, `Slot` resolution, a Ractive partial, a `Button`'s action name
and `Categorization.options.initial`. Scoping the type to templates - which is
where it was first needed - would have been the wrong shape.

### 27.1 `TemplateLayoutProps` did not declare `lang`

The same gap, one level up. `TemplateLayoutProps.uischema` was
`UISchemaElement & { template: string; name?: string }` — no `lang`, and no
`elements`, although the renderer needs both. So `resolveTemplateLang` read the
language through `(uischema as { lang?: unknown }).lang` and both renderers
cast for their children.

`TemplateLayoutElement` now declares all four, and **`lang` is deliberately not
narrowed** to the two engines this set implements:

```ts
lang?: TemplateLang | (string & NonNullable<unknown>);
```

A closed union would make the diagnostic path unauthorable. The specification
requires an unknown language to be *diagnosed* rather than refused, and names
`vue` as a profile a web renderer set need not implement — so `lang: "handlebars"`
has to compile for the case the renderer exists to report to be written down at
all. The open union keeps editor completion for `ractive` and `jsx` while
accepting any string.

This package typechecks its tests, so `templateLayoutElement.test.ts` holds
both halves: a narrowing of `lang` fails the build there rather than silently
in a consumer.

---

## Adjustment 28 — Addressing a template's children

**Type:** a **defect fix** and one **rule the specification leaves open**.

Section 13: "each named child is available as a partial that mounts its
delegated renderer. Unnamed children receive their decimal index as a fallback
name."

It does not say what happens when those two collide, and they can: a child
explicitly named `"0"` wants the same key as the first child's index fallback.

### 28.1 A collision made a child disappear

Both engines built their slot map by last-writer-wins, so one of the two
children was **never placed at all** — no partial, no dispatch, no error. A
control was simply missing from the form and nothing said why:

```
elements: [ { Control, scope: '#/properties/a' },            // unnamed → "0"
            { Control, scope: '#/properties/b', name: '0' } ]

inputs rendered: ["BBB"]     // the control for `a` is gone
```

The rule now, in `resolveChildNames`:

- **An explicit name always keeps its key.** The author asked for it.
- **An index fallback applies only if no explicit name has claimed that
  index** — including one declared by a *later* child, which is why names are
  resolved in two passes.
- A child that cannot be addressed is **reported**, not quietly given some
  other number no template would reference.
- Two children claiming one name: the first keeps it, the second falls back to
  its index. Losing the name is consequence enough; losing the child as well
  would be gratuitous.

Diagnostics are `template.childNameCollision` and
`template.duplicateChildName`, as console warnings — an authoring mistake the
person filling in the form can do nothing about, the same precedent as
`Categorization`'s `initial` (adjustment 10.5).

### 28.2 Generating a name used to mutate the UI schema

Found in the same place. The JSX engine did:

```ts
if (!element.name) element.name = index.toString();
```

Section 22 forbids runtime behaviour mutating the UI schema, and the practical
consequence is worse than the principle: JSON Forms holds **one** element
object, so a second form sharing that schema inherited the first one's
generated names. Names are now computed into a parallel array and never
written back.

The render function is still attached to the element (`ElementRender`), which
is how a template reaches it through `elements['name']`. That one is recorded
as a known mutation rather than fixed here — it is load-bearing for the JSX
engine's slotting and deserves its own pass.

### 28.3 `elements` is an array as well as a map, and both halves are contract

Fixing 28.2 broke something nothing tested. The names moved out of the elements
into a parallel array, and the binding handed to the template moved with them —
from a list of elements to a list of `{ element, name }` wrappers.

But a template may render the **whole binding**:

```jsx
<div>{elements}</div>          // every child, in order
{elements['details']}          // one child, by name
```

The first form now emitted wrapper objects, and React refused them: *Objects
are not valid as a React child (found: object with keys {element, name})*.

**Why it survived a full test suite.** Every example in the spec folder
addresses children by name, so the array half had no test at all. And a casual
one would have passed: `elements` is a Proxy, a string key it knows resolves to
that child, and section 13 gives an unnamed child **its decimal index as its
fallback name** — so on an all-unnamed list `elements[0]` returned the element
either way. Give one child an explicit `name` and its index stops being a key,
the proxy falls through to the raw array, and the wrapper leaks. The trigger is
therefore *a named child in a list rendered as an array*, which is exactly what
the demo fixture has and no test did.

The rule that follows: **the items of `elements` are the elements themselves.**
Anything a template can iterate has to be something the engine can render, so
per-child metadata belongs beside the array, not wrapped around it. The name
already lived in `childNames`, positionally, and `elementsByName` is built from
that.

One consequence worth naming: a child whose name could not be resolved (28.1)
is **unaddressable, not unrenderable**. It still has a position, so `{elements}`
must mount it. Its renderable is keyed on a per-position key that no name can
collide with, and only a real name reaches `elementsByName`.

Covered by `templateChildren.test.tsx`, which asserts both halves and the
mixture, and whose all-unnamed case is retained as the baseline that stayed
green throughout.

---

## Adjustment 29 — `TemplateLayout`, authored in TypeScript

**Type:** an **addition** that is deliberately **not portable**, and one
parsing trap found while testing it.

Section 14 anticipates this: "Some JSON Forms/extension APIs accept function
values. An in-memory JS/TS UI model can carry them directly while JSON
serialization cannot. Platform infrastructure **MAY** adapt such
function-valued extension points… That adaptation is outside this portable v1
model."

So `template` may be a **function** — the same element, written rather than
serialized:

```tsx
{
  type: 'TemplateLayout',
  template: ({ data, Slot }) => (
    <Card title={data.customer}>
      <Slot name="details" />
    </Card>
  ),
  elements: [{ type: 'Control', scope: '#/properties/email', name: 'details' }],
}
```

### 29.1 It needs no script-evaluation permission

The string engines are gated on `allowScriptEvaluation` because they compile a
string into executable code, which needs CSP `unsafe-eval`. **A function the
build already compiled needs none of that**, so the TypeScript form is gated on
nothing — it is strictly the safer of the two, not merely the better typed.

That is the strongest argument for it, and it is easy to miss behind the
IDE-completion one.

### 29.2 Selected by the shape of `template`, not by `lang`

A function is not written in a template *language*, so routing it through
`lang` would be the wrong axis. `tsxTemplateLayoutTester` matches
`typeof template === 'function'` at rank 5, above the string engines at 2.

### 29.3 What it is handed

Close to what the string engines expose, plus what only a function can use:

| | |
| --- | --- |
| `data`, `errors`, `context`, `translate` | As the string bindings |
| `elements` | The child **elements**, by name — `.type`, `.scope`, `.options`, or a layout's own `.elements`. Definitions, not rendered output; this is already how the JSX engine's `elements` behaves |
| `Slot` | Places a named child. `<Slot name="x">fallback</Slot>` renders the fallback and warns `template.unknownSlot` when nothing answers to the name — section 13's structural `Slot` semantics, rather than a second spelling of `elements` |
| `path`, `schema`, `uischema` | To address a write, read a title, and read the layout's own options |
| `enabled`, `handleChange` | Below |

**`handleChange` is the normal dispatch, and a no-op while disabled.** Section
13 requires that a template's two-way binding "must not bypass
readonly/restrict or normal form change dispatch". It does **not** know about
`restrict`, which is per-renderer with no shared guard a layout can consult, so
a template can still write past an array's `maxItems`. Recorded as a limit
rather than pretended away.

The string engines get **no** `handleChange`. Data-write is a per-profile
capability in section 13, and a string form already needs
`allowScriptEvaluation`; adding write access widens that surface for no gain.

### 29.4 Why not a `render` on every element

Considered and rejected. Putting a render function on any element — a
`Control` with its own `render`, say — makes `type` mean two things at once:
what the element *is*, and that something else is drawing it. `TemplateLayout`
already declares "I am taking over presentation here", which is the honest
place for it.

A bound widget the registry knows nothing about — a cron-expression editor is
the motivating case — is served by a template plus `handleChange`, without
inventing an inline-renderer concept:

```tsx
template: ({ data, path, handleChange, enabled }) => (
  <CronEditor
    disabled={!enabled}
    value={data.schedule}
    onChange={(v) => handleChange(`${path}.schedule`, v)}
  />
)
```

What that does **not** give you is a Control's derived `label`, `required` and
scope-filtered `errors`. A custom control that wants those should still be
registered.

### 29.5 `context` is section 3's `FormContext`, in all three profiles

Section 13 says the Ractive profile "exposes data…, errors…, **context
(extended FormContext)**, elements, and translate", and section 3 declares
that shape: `config`, `readonly`, `locale`, `translate`, `data`, `schema`,
`uischema`, `errors`, `additionalErrors`, `fireActionEvent`.

All three profiles were passing something smaller and different — the JSX
engine a flat `locale` and **no `context` at all**, Ractive a `context` holding
only `{ locale }`. So `readonly` was unreachable from a template.

That matters the moment a template draws its own widget, because **readonly
and disabled are different states**. A read-only form does set `enabled` to
false, so a naive widget greys out and looks broken; what it usually wants is
to render the value as *text*. The TypeScript form therefore also exposes
`readonly` at the top level, beside `enabled` — the two belong together, and
`context.readonly` alone would make the distinction easy to miss.

`buildFormContext` is shared, so the three profiles cannot drift apart again.
`fireActionEvent` comes from the host's registered action handler where there
is one, which is what lets a template trigger a command rather than only
display data.

### 29.5a `Slot` is a component type, so its identity is load-bearing

A defect found only because the native profile was added to the **same** table
of assertions the two string profiles already answered to - specifically the
no-remount guarantee, which every profile has to meet.

`Slot` was a `useCallback` over `[byName, schema, path, enabled, renderers,
cells]`. That reads as careful dependency hygiene and is the opposite of it: a
template uses `Slot` as a **component type** (`<Slot name='note' />`), and React
unmounts and remounts a subtree whenever the type changes identity. A parent
that builds its `renderers` array inline - which is the ordinary way to write
`<JsonForms renderers={[...a, ...b]} />` - hands down a new array every render,
so every slotted control was torn down and rebuilt on each keystroke, taking
the cursor and the selection with it.

The string profiles never had this because they memoize each child into a
**ref**, keyed by name, which no dependency list can invalidate.

`Slot` is now created once (`useMemo(…, [])`) and reads its inputs from a ref
refreshed each render. It re-runs on every render regardless, because the
template function does, so it never shows a stale value.

The general point, and the reason this is worth a section: **a component
created during render is a new type each time.** The usual instinct - widen the
dependency list until it is "correct" - makes the remounting *more* reliable,
not less. The fix is always to stop recreating the component.

### 29.6 A Ractive attribute trap

Found while writing the tests, and worth an hour of anyone's time: Ractive
parses any attribute ending in **`-in`, `-out` or `-in-out`** as a *transition
directive* (`fade-in`, `fade-out`). So a marker like `data-out` is read as the
transition named `data` and never reaches the DOM, while `data-greeting` beside
it is untouched:

```
<div><p data-out>Hi {{x}}</p></div>       → <div><p>Hi Ada</p></div>
<div><p data-greeting>Hi {{x}}</p></div>  → <div><p data-greeting="">Hi Ada</p></div>
```

It is hard-coded in the parser — the pattern above is taken from
`ractive.js` — and there is **no option to disable it**.

What can be done instead: this profile registers **no transitions**, so every
such directive is dead code here, which makes warning about all of them
precise rather than guesswork. `ractiveTransitionAttributes` scans the
template and reports `template.ractiveTransitionAttribute`, naming the
attributes that will vanish. An author who wanted a transition learns this
profile has none; an author who wanted an attribute learns where it went.

The detector anchors on the whole attribute name, so `data-input`,
`data-outer` and `data-about` are left alone — only a name *ending* in `-in`,
`-out` or `-in-out` matches. Pinned by tests in `templateEngines.test.tsx` and
`childNames.test.ts`.

### 29.7 The portable model must not foreclose a native template — and what a native profile has to define

Generalising 29.1–29.3, because this is the part another renderer set has to
get right on its own.

**The rule.** `template: string` is the *portable spelling*, not the only one.
A renderer set **must remain free** to accept its platform's own template value
on the same `TemplateLayout` element, and the portable model must not be read
as forbidding it. Section 14 already says so for function values generally —
"an in-memory JS/TS UI model can carry them directly while JSON serialization
cannot… That adaptation is outside this portable v1 model" — and this is that
adaptation for `TemplateLayout`.

Nothing is lost by allowing it. A native template is **strictly safer** than
the string form (29.1), it type-checks, and it costs the portable form nothing:
a JSON UI schema cannot express one, so no portable document changes meaning.

What it *does* cost is a contract, and an unwritten one is where the trouble
starts. A native profile must define all eight of these.

| | What must be defined | Why it is not optional |
| --- | --- | --- |
| 1 | **The accepted value, and the predicate that detects it** | React takes a function; Svelte a component constructor; Vue a render function or SFC. The detector must be a predicate on `template` itself. |
| 2 | **Selection by shape, never by a new `lang` value** | A native template is not written in a template *language* (29.2). A `lang: "tsx"` would make a portable document claim an engine that does not exist off this platform. |
| 3 | **Rank above every string engine** | Both match `uiTypeIs('TemplateLayout')`, so without an explicit rank the winner is registration order. Ours is 5 against 2. |
| 4 | **The bindings, named and typed** | They must be the *same ideas* the string profiles expose — `data`, `errors`, `schema`, `uischema`, `elements`, `context`, `translate` — so the three forms stay one feature. A native profile may add what only a native value can use (a slot component, a guarded write, `readonly`), and must not rename what already exists. |
| 5 | **Child placement, by the same name resolution** | Section 13's names plus adjustment 28: explicit names win, unnamed children fall back to their decimal index, a collision is diagnosed — and `elements` is **both** a name-keyed map and an ordered list (28.3). An unknown slot name is a diagnostic, not silence. |
| 6 | **That it is not gated on `allowScriptEvaluation`** | Stated, not merely true. The permission exists for CSP `unsafe-eval`; applying it to a pre-compiled value would be a gate nobody can satisfy and nobody asked for. |
| 7 | **The write path** | Section 13: two-way binding "must not bypass readonly/restrict or normal form change dispatch". A native template gets a real handle to the form, so this is the one place it could. |
| 8 | **What a consumer sees when the document is serialized** | `JSON.stringify` drops a function **silently**. The profile must say that the element survives and its template does not, so the failure is documented rather than discovered. |

**How each platform would spell (1).** The predicate is the whole of the
platform-specific surface; everything else in the table is shared.

| Platform | `template` value | Predicate |
| --- | --- | --- |
| React (here) | `(props: TemplateRenderProps) => ReactNode` | `typeof template === 'function'` |
| Svelte | a component constructor | `typeof template === 'function' && 'render' in template.prototype` |
| Vue | a render function or SFC object | `typeof template === 'function' \|\| isVueComponent(template)` |

The type should widen the element rather than replace it, so the portable type
stays portable and only the platform-specific one admits the native value:

```ts
export type ReactTemplateLayoutElement<T = unknown> = Omit<
  TemplateLayoutElement,
  'template'
> & { template: string | TemplateRender<T> };
```

`TemplateLayoutElement.template` stays a `string`. A document typed against the
portable element therefore *cannot* carry a function by accident, and one typed
against the React element declares on its face that it will not travel — which
is the same boundary the Button draws between `action`/`script` in 24.5, drawn
in the same way.

---

## Adjustment 30 — The extended validator profile, ported from Vue 2

**Type:** an **addition**, bringing the React stack level with the Vue 2
`common` package, plus one deliberate divergence on security.

`createFormsAjv` already set `useDefaults`, `$data` and `discriminator` and
registered the `color` format. Four capabilities the legacy stack has were
still missing, and forms in this organisation are authored against all four:

| Capability | What a schema can do |
| --- | --- |
| `ajv-keywords` | `allRequired`, `select`, `typeof`, `dynamicDefaults`, … |
| An **extended `transform`** | `capitalize` and `startCase` beyond the plugin's own set |
| Extra **dynamic defaults** | offset-aware `date`/`time`/`datetime`, `dateUnit`, `searchParams`, `dynamic` |
| `ajv-errors` + `ajv-i18n` | schema-authored `errorMessage`, and localized validator messages |

### 30.1 Turning them off fails silently, which is why they default on

JSON Forms' factory sets **`strictSchema: false`**. Ajv therefore ignores a
keyword it does not know rather than rejecting it, so a schema carrying
`transform` or `allRequired` against a plain validator:

- compiles without complaint,
- validates less than it says it does, and
- leaves the data untransformed.

Nothing throws and nothing is logged. Verified, and pinned by a test that
asserts both halves. A capability whose absence is *loud* can reasonably be
opt-in; this one cannot.

### 30.2 `transform` replaces the plugin's keyword rather than extending it

`ajv-keywords`' transformation table is a module constant with no registration
hook, so `capitalize` and `startCase` are only reachable by removing its
keyword and registering ours in its place. That is what the Vue 2 package does
and this is a port of it.

Worth knowing about `transform` in general: it **mutates the data** as a side
effect of validation, and runs `before: 'enum'` so a transformed value is what
`enum` compares against. A validator that edits its input is unusual enough to
state out loud.

### 30.3 `dynamicDefaults` registers globally, not per instance

`dynamicDefaults.DEFAULTS` is a module-level table in `ajv-keywords`. A
generator registered for one validator is registered for **every** validator in
the process. That cannot be made per-instance without forking the plugin, so
`registerAjvKeywords` is written to be idempotent rather than pretending it
runs once.

### 30.4 `dynamic` is gated; the original is not

```json
{ "dynamicDefaults": { "ref": { "func": "dynamic", "args": { "func": "(a) => a.x" } } } }
```

The Vue 2 original compiles that string with `new Function`, unconditionally.
**Here it requires `jsonformsExtended.security.allowScriptEvaluation`**, the
same permission the template engines and `Button.script` need.

A schema is data. It can arrive with the form, from the same place the form
data does, so compiling a string out of it is exactly the capability section 14
governs — there is no principled reason this one entry point should be the
exception. Refused, it **warns** rather than quietly producing no default: a
default that silently does not appear is indistinguishable from a schema that
never asked for one.

### 30.5 `errorMessage` has to be unwrapped, or the fields go silent

This is the part that looks like a formatting detail and is not.

`ajv-errors` replaces the failures a schema's `errorMessage` covers with a
**single** error at the enclosing object's path, marking the originals
`emUsed`. JSON Forms maps errors to controls **by path**. So a schema that adds
friendly messages, left alone, makes every field it covers stop showing
anything at all — the message exists, at a path no control occupies.

Unwrapping expands the wrapper back into the errors it replaced, each keeping
its own `instancePath` and taking the schema's message. Pinned by a test that
renders the form and reads the message under each control, not by one that
inspects `validate.errors`.

The message is then run through the form's translator as
`error.errorMessage.<message>`, so a schema may carry a key; one that does not
resolve is used literally, which is the rule this renderer set already applies
to labels.

### 30.6 The translator is a getter, and messages are strings

The Vue 2 version takes a `Ref` and sets each message to a `computed()`,
relying on the template to unwrap it on read. That is not portable: JSON Forms
declares `ErrorObject.message` as a `string`, and a `computed` reaching React
renders as `[object Object]`.

Here the i18n state is read through a **getter** at validation time and the
message is a plain string. One validator therefore serves every locale — which
it must, because Ajv caches compiled schemas and rebuilding it per locale would
recompile the whole schema on a language switch.

**The cost is that a message produced during validation does not follow a
locale change.** This section first claimed "JSON Forms already revalidates on
an i18n change, so this costs nothing". That is **wrong**, and the worked
example is what showed it: the form switched to Bulgarian and every validator
message stayed English, because the data had not moved and nothing revalidated.

The fix is `createAjvErrorTranslator`, which produces the message at **render**
time through core's own `i18n.translateError` hook, and is what the demo, the
web component and the `validator-profile` example use. The validation-time path
is kept because it needs no wiring and matches the Vue 2 original; the two are
safe together, since `ajv-i18n` regenerates a message from the error's
`keyword` and `params` rather than editing existing text.

A schema-authored `errorMessage` has the same problem and the same fix: the
untranslated message is stashed on the error under a symbol, so the render-time
translator looks it up again under the current locale instead of reusing
whatever the validation happened to produce.

### 30.7 Locale data is opt-in, by its own entry point

`ajv-i18n/localize` re-exports around twenty languages. Anything reachable from
this package's main entry is reachable from every consumer's bundle, so
`ajvLocalizers` lives behind its own build entry and `exports` subpath:

```ts
import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers';
```

A host that ships two languages passes `{ en: ajvLocalizers.en, bg: localizeBg }`
and carries neither the rest nor that module. The web component defaults to
**none** and exposes `setAjvLocalizers`, matching how it already handles antd's
own locales; the demo carries all of them, being an application rather than a
distributable.

Two details the subpath needs, because the repository's TypeScript predates
`exports`:

- `exports` gives bundlers the runtime path;
- `typesVersions` gives `moduleResolution: "node"` the types, which ignores
  `exports` entirely. Without both, the import type-checks and fails to bundle,
  or bundles and fails to type-check.

Bulgarian is carried here because `ajv-i18n` does not ship it
(ajv-validator/ajv-i18n#312 is unmerged), and its `required` message is
overridden because the shipped wording interpolates an untranslated property
name into the sentence.

### 30.8 Stated for a validator that is not Ajv

Everything above is written in Ajv's vocabulary, because Ajv is what this
renderer set uses. None of it is *about* Ajv. This section says what the
**capability** is, so a renderer family built on a different validator can
offer the same thing under its own names — and so a reviewer can tell whether
it has.

The rule: **these are portable capabilities with a non-portable spelling.** A
schema that uses them is not portable as written — `transform` and
`dynamicDefaults` are Ajv keywords, not JSON Schema — but the *behaviour* each
one buys is something any validator integration can be expected to provide,
and a family that provides none of it should say so rather than leave an
author to discover it.

| Capability | What any validator integration should offer | Ajv spelling here |
| --- | --- | --- |
| **Authored messages** | A schema can carry the text shown for a failure, translated through the form's catalog and falling back to the literal text | `errorMessage` (ajv-errors), looked up as `error.errorMessage.<message>` |
| **Per-field association** | An authored message must reach the **control** that failed, not the enclosing object | unwrapping, §30.5 |
| **Localized validator wording** | The validator's own sentences follow the form's language, without the form defining error text | `ajv-i18n`, through `translateError` |
| **Value normalisation** | A declared, ordered list of normalisations applied as part of validation | `transform` |
| **Computed initial values** | Fields filled from the clock, the page address, or a declared expression | `dynamicDefaults` |
| **A permission for compiled expressions** | Anything that compiles a string out of a schema is gated | §30.4 |

Four of those carry a requirement that is easy to get wrong, and each is worth
checking in another family explicitly:

1. **Where the authored message lands.** Any mechanism that replaces several
   failures with one summary error will put it at the enclosing path, and any
   renderer that maps errors to controls by path will then show nothing on the
   fields. This is silent in both directions: the message exists, and the
   fields are blank.
2. **When the localized message is produced.** If it is produced during
   validation, it will not follow a locale change until something revalidates.
   Producing it at render time is the behaviour an author expects; a family
   that cannot should document the latency rather than let it read as a bug.
3. **That normalisation edits the data.** A validator that rewrites its input
   is unusual. It must be declared in the schema, ordered, and applied before
   the keywords that compare the value — `enum` above all.
4. **That computed defaults are computed once, into the data.** They are
   initial values, not derived fields: nothing recomputes them when the inputs
   change, and a stored value is never replaced.

**On what a non-Ajv family owes the author.** If a capability is not
available, the honest response is a declared limitation, not silence. That
matters more here than in most places because of the failure mode recorded in
30.1: an unknown keyword is *ignored*, so a schema authored against a richer
profile keeps working, validates less than it claims, and says nothing. A
family that cannot offer `transform` should reject a schema that uses it, or
document loudly that it does not enforce it — the one outcome to avoid is the
form looking correct.

### 30.9 Implementation

[`core/ajv.ts`](../packages/jsonforms-react-extended-renderers/src/core/ajv.ts),
[`core/keywords.ts`](../packages/jsonforms-react-extended-renderers/src/core/keywords.ts),
[`core/transform.ts`](../packages/jsonforms-react-extended-renderers/src/core/transform.ts),
[`core/dynamicDefaults.ts`](../packages/jsonforms-react-extended-renderers/src/core/dynamicDefaults.ts),
[`core/ajvI18n/index.ts`](../packages/jsonforms-react-extended-renderers/src/core/ajvI18n/index.ts).

Covered by `extendedAjv.test.ts` for the validator and
`schemaErrorMessages.test.tsx` for the messages reaching the right controls.

---

## Adjustment 31 — Renderer-published additional errors

**Type:** an **addition** (the first renderer to publish one), plus one
**deliberate divergence** on a default.

Section 21 asks the Monaco control to publish "at most one summary
additionalError per editor instance" when `propagateErrors` is on. Nothing in
the React stack published an additional error at all, so §18's ownership
contract had nothing to apply to.

### 31.1 How an error gets onto the form, and a correction

This section first said a renderer cannot publish because its contribution
"would be wiped the next time the form's data moved". **That is too strong.**
Core does this:

```js
var getAdditionalErrors = function (state, action) {
    if (action && hasAdditionalErrorsOption(action.options)) {
        return action.options.additionalErrors;   // a prop was supplied: it wins
    }
    return state.additionalErrors;                // no prop: preserved
};
```

So `UPDATE_DATA` never touches them, and `UPDATE_CORE` replaces them only when
the host actually passes the prop. Errors put into state by other means
survive indefinitely otherwise - verified.

What is true is narrower and still decisive: **core offers no action for
adding one, and no hook for withdrawing one.** So publication needs two
mechanisms, and `useAdditionalErrorProps(store)` supplies both:

Middleware is **passive** - publishing dispatches nothing - so something has to
make the form re-reduce. The obvious answer, putting the published errors in
the `additionalErrors` prop, **is wrong, and quietly**:

`JsonFormsStateProvider` lists that prop in an effect's dependencies and
re-dispatches `updateCore(data, …)` with the **prop** data of that render. A
renderer publishes from its own effect, and a child's effect runs *before* the
parent's - so the publication lands before `onChange` has told the host about
the edit that provoked it, and the re-dispatch carries the **previous** data.
The edit is undone.

It surfaced as a language select that would not move: choosing a language made
the editor publish, and publishing put the old language back. Reported as a
stuck dropdown; it was the form being reverted.

So `ExtendedJsonForms` composes `JsonFormsStateProvider` and
`JsonFormsDispatch` itself rather than rendering `<JsonForms>`, and puts a
bridge **inside** the provider. The bridge subscribes to the store and
dispatches `updateCore(core.data, core.schema, core.uischema)` - data from
core, which is current by construction, and no `additionalErrors` option, so
the middleware writes the store's set over whatever is there. The prop then
never changes when something publishes.

| | Carries | Sees |
| --- | --- | --- |
| the bridge's dispatch | nothing - it only provokes a reduce | core's current data |
| `middleware` | the store's errors, merged over host-supplied ones | `UPDATE` with the data before **and** after, which the clearing rule compares |
| `additionalErrors` prop | the **host's own** errors only | unchanged by publication |

Two things hid this while it was being built. Testing the middleware against
the reducer directly always dispatched an action afterwards, so injection
appeared to work. And the first end-to-end test published once, by hand, with
no data change - the revert needs a publication *caused by* an edit.

One more thing the published middleware documentation gets wrong: it names the
data action `UPDATE_DATA`, but the constant's value is `'jsonforms/UPDATE'`. A
filter written against the documented string never runs, and never says so.

### 31.1a Ownership, and the question every host asks first

A submit fails, the server marks the field a code editor is on, and then the
editor goes quiet. Does the server's error survive?

It does, and that is the whole reason the store is keyed by owner rather than
being one array. Retracting rebuilds from the map, so an owner can only ever
remove its own; host-supplied errors are filtered out of the merge by identity
and never touched at all. Both directions are covered end to end through a
real form, not against the store.

The Vue 2 Camunda container - which is where this pattern comes from - has a
single shared list that the submit button replaces wholesale. That is safe
there because nothing else writes to it. It stops being safe the moment a
renderer publishes too, which is exactly what this adds.

### 31.1b Clearing is the Camunda rule, moved

`CamundaResolvedJsonForms` prunes on every change:

```ts
_remove(this.additionalErrorsToUse, (error) => {
  const controlPath = error.instancePath.replace(/\//g, '.').replace(/^./, '');
  return _get(event.data, controlPath) !== _get(this.previousData, controlPath);
});
```

The same rule is now the store's default, applied in middleware rather than in
one container component, so every form gets it. Two details it keeps:

- **By value, not by the action's path.** An update that rewrites a field with
  what it already held is not a correction, and clearing there would let a
  stray re-render dismiss an error nobody addressed.
- **Per error, not per owner.** One of a server's two errors going does not
  take the other with it.

An owner that manages its own lifecycle opts out with
`{ clearOnChange: false }`. Monaco does: it republishes or retracts as the
language service reports, and a keystroke clearing its summary would make the
message flicker rather than inform.

### 31.1c A form that installs nothing

Publication is a host opt-in, so a bare `<JsonForms>` is not an error - but a
renderer with something to publish and nowhere to put it must **say so**.
Silence is indistinguishable from the option not working.

`additionalErrors.noStore` names the owner and the way out. The way out is
`<ExtendedJsonForms>`, which wires the store, the middleware and the prop, and
merges a host's own `additionalErrors` rather than replacing them.

It carries the **action handler** too, for the same reason: both hosts in this
repository wrapped `<JsonForms>` in a `HandleActionContext.Provider` and did it
identically, and a form without one turns every `Button` into a silent no-op.

Both are **inherited rather than shadowed** when the prop is absent. A wrapper
that unconditionally provided `value={onAction}` would set the context to
`undefined` for everything inside, so a container providing a handler for
several forms would find its buttons dead - the failure is silent and looks
like the button being broken. The same applies to the store: an enclosing
`AdditionalErrorStoreProvider` is used when no `store` prop is given, since it
can only have been put there deliberately. Pinned by a test that provides a
handler above the wrapper and presses the button.

**It deliberately does not resolve `$ref`**, which the Vue 2
`ResolvedJsonForms` does. The two cases differ: a **local** `$ref`
(`#/$defs/x`, `#/definitions/x`) already works - JSON Forms resolves it while
rendering, Ajv while validating, verified against both spellings - while a
**remote** one is asynchronous, so a wrapper doing it would hold the form
unmounted while it fetched and would own a loading and a failure state. That
is a different component with a different lifecycle; if remote schemas are
needed it belongs in a `ResolvedJsonForms` wrapping this one.

### 31.2 The default is `false`, and the specification says `true`

The one divergence, and it is on request.

Publishing turns a language-service diagnostic into something that can block a
form. A form collecting a snippet of deliberately rough code - the
specification's own example is "a form collecting deliberately invalid
JavaScript" - would become invalid because a linter disagrees with it, in a
host that never asked for language validation to participate.

So the effective default here is **off**, and a form that wants the portable
behaviour turns it on once:

```json
{ "jsonformsExtended": { "propagateErrors": true } }
```

Resolution is element option, then namespaced config, then flat config - the
order every other option in this renderer set uses - so a single editor can
still opt out of a form-wide setting.

**This is a divergence a reviewer should check in another renderer set rather
than copy.** It changes which forms are valid, not merely what is shown.

### 31.3 One summary, and the editor clears its own

| Rule | Why it is not a detail |
| --- | --- |
| At most one per editor **instance** | Twelve syntax errors are one message with a twelve in it. Publishing one per marker would bury the form's own errors. |
| Publish none when there are no error-level diagnostics | Clearing is publishing an empty list, so fixing the code, switching the option off and unmounting all retract through one path rather than three special cases. |
| Only error severity counts | "Warnings, informational messages, and hints stay inside Monaco." Monaco's severities are Hint 1, Info 2, Warning 4, Error 8. |
| Cleared on unmount | A summary left by an editor no longer on the form makes it permanently invalid with nothing on screen to explain it. |

Switching the option off and on again retracts and republishes **without a data
edit**, which the specification requires explicitly and which the count being
renderer state - not derived from the data - is what makes possible.

### 31.4 `params.owner`, and the internal marker

The published error is the AJV-compatible shape §21 gives - `keyword:
"editor.language"`, `instancePath` the JSON Pointer to the edited value, and
`params` carrying `source`, `language` and `errorCount` - plus an **owner**.

Several things can own errors at one path: two editors, or an editor beside a
server-side error the host published. §18 requires clearing "only errors
belonging to the affected owner; preserve unrelated renderer and host errors",
and without an owner key one editor going quiet would wipe the others. The
owner is `useId()`, which is unique per mounted component and stable across its
renders - exactly an owner's lifetime.

§18 asks for ownership metadata "in runtime integration state, outside business
data and the authored UI schema". An error's `params` is runtime state; it
never reaches form data or the UI schema.

### 31.5 What this does not do

The **combined-validity** integration a submit guard would consume is not
implemented. This publishes a settled summary; it does not expose pending
language analysis, so "do not report confirmed validity solely because stale
errors were removed while their replacements are pending" has nothing to apply
to yet.

The **file** and **duration** controls are named by the specification as
publishers too and still do not publish. The channel is now there for them.

Also unchanged: `instancePath` relocation after an array reorder or delete.
The published pointer is recomputed from the renderer's current `path` on every
render, which covers the ordinary cases, but there is no target-identity
tracking of the kind §18 describes for an asynchronous producer.

### 31.6 Implementation

[`util/additionalErrors.tsx`](../packages/jsonforms-react-extended-renderers/src/util/additionalErrors.tsx),
[`components/ExtendedJsonForms.tsx`](../packages/jsonforms-react-extended-renderers/src/components/ExtendedJsonForms.tsx),
[`util/editorDiagnostics.ts`](../packages/jsonforms-react-extended-renderers/src/util/editorDiagnostics.ts),
[`MonacoControlRenderer.impl.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/MonacoControlRenderer.impl.tsx).

Worked example: `additional-errors`, which shows both publishers - a rejected
submit and the editor - on one form.

Covered by `editorDiagnostics.test.ts` for the summary rules,
`additionalErrors.test.tsx` for the store and the middleware driven through
the real reducer, `monacoAdditionalErrors.test.tsx` end to end including the
server-beside-editor case, and `extendedJsonForms.test.tsx` for the wrapper and
the missing-store diagnostic.

---

## Adjustment 32 — The duration picker shows the units in play

**Type:** a **presentation change** within the portable contract. The component
set, the storage format and the `showActions` behaviour are unchanged; what
changed is how many of the components are on screen at once.

Section 21 specifies the baseline as "non-negative integer years, months, days,
hours, minutes, and seconds, or a separate weeks-only representation", and the
first implementation drew one row per component - seven rows, always.

Two problems with that, neither of them a conformance failure:

**Five rows of nothing.** For `P2DT3H`, two rows carry information and five say
`0`. The value has to be found by scanning past the noise, and `P0D` is a legal
duration, so a `0` cannot be read as "unused" either.

**Weeks was a mode pretending to be a component.** ISO 8601 forbids combining
`W` with anything else. The picker enforced that by disabling the Weeks row
whenever another field was non-zero - correct, and silent. Weeks sat *first*,
greyed, out of magnitude order, with nothing saying why; a user who wanted
weeks had to work out that five other fields must be zeroed first.

### 32.1 What it does now

- **Only the units in play** are drawn, in magnitude order, with the unit in
  the input's addon rather than in a label column - one object per row instead
  of two.
- **An add control** offers the units not shown; an added unit appears at zero
  in its magnitude position, not at the end.
- **Removing a unit clears it**, so the value always matches what is on screen.
  The last remaining unit has no remove action, because the panel needs
  somewhere to type.
- **Weeks is a segmented mode.** Switching clears the other representation,
  which is honest - the two cannot coexist - and the draft is still only
  committed on Apply, so Cancel restores.
- An **empty value opens on one unit** (hours), because a panel containing only
  an add control is not a picker.

### 32.1a `P0W` is valid, and must not be normalised away

Found by asking whether `P0W` is a legal value. It is: RFC 3339's
`dur-week = 1*DIGIT "W"` admits `0`, and Ajv's `duration` format accepts it.

Two things followed, and the second is the one that mattered.

**The mode cannot be derived from the value.** `P0W` parses to a draft of all
zeros - the same draft `P0D` parses to - so nothing about the *parts* says
which form was written. The picker had `mode = draft.weeks > 0`, which meant
clearing the Weeks box flipped the panel into components mode mid-edit: the
row being typed in vanished and the segmented control jumped. The mode is now
held as state, set from the **text** on open (`isWeeksDuration`) and otherwise
only by the user choosing it.

**Apply must not rewrite an equal value.** `formatExtendedDuration` is
canonical, so applying an untouched `P0W` wrote `P0D` - and `PT0S`, `P0Y` and
`P1DT0H` the same way. That marks the field dirty without an edit and silently
replaces whatever a server sent.

The specification already forbids it, twice, in other sections:

> Existing data must not be silently normalized solely because the renderer is
> mounted.

> The proposed saveTimezone governs future committed edits; it does not
> normalize incoming data merely on load.

The zero rule - "Zero duration: Serialize zero as `P0D`" - says what to write
when the user **means** zero, not what to do with an equivalent value that
arrived from elsewhere. Read the other way it would make every equivalent
spelling unstable, which is worth saying out loud because the line sits in a
table of serialization rules where the stricter reading looks natural.

So Apply commits only when the draft differs from what the current value
already parses to. `P0W` stays `P0W` until somebody changes it; typing `3` into
that same box writes `P3W`.

**Generalisable:** any control with a canonical serialization has this
hazard - temporal save formats, masked strings, number formatting. The test to
apply is "would opening this control and immediately confirming change the
data?" If it would, the control is rewriting rather than editing.

### 32.1a-ii Components are quantities, not clock fields

The same question asked of another field. The picker capped months at 11 and
hours, minutes and seconds at 23 or 59 — the shape of a **time of day**, which
a length of time is not.

ISO 8601 bounds none of them. `PT90M`, `PT3600S`, `P18M`, `P400D`, `PT25H`,
`P1Y13M` and `PT1H591212M` are all durations, and Ajv's `duration` format
accepts every one (verified, not assumed). Section 21 says "non-negative
integer years, months, days, hours, minutes, and seconds" — non-negative and
integral, with no upper bound stated.

The cap was not only wrong, it was **destructive**, because `changePart`
enforced it by clamping: typing 90 into Minutes silently became 59. And
`PT90M` is not interchangeable with `PT1H30M` as stored data even though the
two are the same length, so rewriting one into the other is the normalisation
§32.1a already forbids.

What remains is the only real bound: `Number.MAX_SAFE_INTEGER`, past which an
integer is no longer exact and the formatted string would stop saying what was
typed.

**Leading zeros** are the same question a third time. `1*DIGIT` admits them, so
`PT011H591212M`, `P0001D` and `P01Y02M03D` are valid, and the canonical form
has no way to spell them — parsing and reformatting *does* change the text.
Nothing normalises them away, because nothing reformats a value the user did
not edit; the Apply-unchanged rule of §32.1a covers this case without needing
to know about it.

### 32.1b The rows are a grid, so the panel lines up

The first version of the panel laid each row out as a flex row: the
number-and-unit group, then the remove button. A flex item keeps its natural
width, so the group sat at roughly half the panel while the add control below
it ran the full width, and a row that had no remove button — the last
remaining unit — grew into the space, so no two rows shared an edge.

Three things fix it, and each is load-bearing:

- **The row is a two-column grid** (`1fr` and the button's width). Grid items
  stretch, which is what makes the input fill the panel.
- **The button column is always there.** A row that cannot be removed renders
  an empty placeholder rather than nothing, so removable and non-removable
  rows align.
- **The unit column has one width for the whole panel**, measured in `ch` from
  the longest label the panel *can* show rather than the rows on screen.
  Sizing to the rows on screen would resize the inputs whenever a unit was
  added, and a fixed pixel width would clip: "Minutes", "Минути" and
  "Sekunden" are not the same width.

The unit moved from `InputNumber`'s `addonAfter` to `Space.Compact` with a
`Space.Addon`, which is antd 6's replacement for it — the addon props are
deprecated there and warn in development, and the explicit addon is what makes
the unit column's width settable at all.

### 32.2 What was deliberately not done

- **Presets** (15m, 1h, 1d …) would beat any component editor for the common
  case, and belong behind a uischema option so a form can supply its own. Not
  built; it is additive and needs to know what a given form collects.
- **Shorthand entry** - typing `2d 3h` and normalising to `P2DT3H` - would beat
  the picker outright for keyboard users. Also additive, and the specification
  already requires direct entry of the ISO string, which works today.
- **`showActions`** still defaults to staging, as the specification says. There
  is an inconsistency worth knowing about: typing in the text field commits
  immediately while the panel stages until Apply, so the same control has two
  commit rules depending on where you edit. Changing that is a divergence and
  has not been taken.

### 32.3 Implementation

[`util/useDurationControl.ts`](../packages/jsonforms-react-extended-renderers/src/util/useDurationControl.ts)
holds the mode and the visible-unit set, so a second renderer family gets the
same behaviour;
[`AntdDurationControlRenderer.tsx`](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdDurationControlRenderer.tsx)
draws it.

Covered by `durationPicker.test.tsx`, which asserts what is **shown** and what
Apply writes — including that a typed 591212 minutes and 25 hours survive, and
that the input offers no maximum that would clamp them — and
`durationValues.test.ts` for the weeks form, `P0W`, and the unbounded and
leading-zero spellings, each checked against Ajv before being asserted on;
`duration.test.ts` continues to cover the round trip. The alignment is
asserted from the inline geometry the renderer asks for — jsdom applies no
stylesheet, so what a test can check is the grid the rows declare and the one
width the unit column uses, not the pixels a browser then produces.

The unit labels, the mode switch, the add and remove actions and the format
message all resolve through the translator and follow the locale bundles of
[Adjustment 6](#65-a-missing-translation-falls-back-to-the-locale-then-to-english);
the format message lives in the renderer-agnostic package, alongside the hook
that produces it.

---

## Adjustment 33 — A queued edit is cancelled by three different events

**Type:** implements §18's "Pending edits, commit timing, and cancellation"
disposal rules. Nothing here changes the contract; it records which of them
are load-bearing and which of them a reasonable reading misses.

`useDebouncedChange` delays an ordinary edit by 300ms. §18 requires that
"disposal must leave no stale write callback active", and that queued work
whose target "was removed, rebound, or superseded" is cancelled.

### 33.1 Cancelled, never flushed

The spec is explicit — "do not blindly flush on unmount: it can recreate
deleted data or write into a different item" — and it is worth stating because
flushing is the intuitive reading of "don't lose the user's work". Losing a
last keystroke is recoverable; resurrecting a deleted array item is not.

### 33.2 Three events, and unmount is the least of them

| What happened | How it is detected |
| --- | --- |
| The control was disposed | Effect cleanup |
| The control was rebound to another path | The debounced function is keyed on `path`, so the cleanup runs for the old one, which still closes over the old path |
| The path stayed and what it points at changed | The value arriving from outside is not what this control last wrote |

The third is the specification's own worked example — type into item 0, delete
item 0, and the former item 1 takes its place — and **neither of the first two
fires for it.** `ArrayLayout` keys its rows by path, so the control at
`items.0` is not unmounted and not rebound: it re-renders with a different
item's data. A fix built only on disposal passes every test that does not
include this case, which is why §18 says "the path alone is insufficient
evidence that the original target still exists".

### 33.3 Telling replacement apart from the echo

Cancelling whenever `data` changes would eat ordinary typing. A commit lands
mid-word, returns through the props, and the keystrokes queued in the meantime
would be cancelled along with it — the control would drop text for no reason
the user could see.

§18 names the distinction: separate external replacement from "normal host
feedback of the just-committed data". The implementation records the value it
last wrote; data equal to that is its own commit returning, and anything else
is a replacement that supersedes the queue.

### 33.4 Status

Implemented in
[`util/debounce.ts`](../packages/jsonforms-react-antd-renderers/src/util/debounce.ts).
Covered by `test/debouncedDisposal.test.tsx`, which fails on all three counts
when the guard is removed, and by `test/debouncedClear.test.tsx` for Clear
superseding a queued edit.

**Blur does not flush yet.** §18 also asks for a pending committable edit to be
flushed on blur before its validation errors are presented; that remains open,
and is tracked in
[the gaps review §3.10](jsonforms-react-antd-implementation-gaps.md).

The test file also records why there is no end-to-end version driving a real
array through the DOM: with real timers the 300ms window elapsed while the
click was dispatched, and under fake timers the synthetic `input` event stopped
reaching the control, so the assertion passed against a race it never entered.
The guard is tested where it lives.

---

## Adjustment 34 — Authoring the model in TypeScript

**Type:** **adds** a development-time capability. Nothing about the runtime
model changes: the documents this produces are ordinary portable UI schemas,
and a renderer cannot tell one from a hand-written one. What is added is a set
of types under which a wrong `scope` stops compiling.

The guide is [typed-form-authoring.md](typed-form-authoring.md); the helpers
are in
[`src/authoring/`](../packages/jsonforms-react-extended-renderers/src/authoring/).
Recorded here because three of the rules it applies are **decisions about the
model**, not about TypeScript, and any implementation offering the same thing
has to make them.

### 34.1 A dotted property name has no scope, so it is refused

Section 11's path grammar and §14.1 agree: JSON Forms addresses data with
dotted paths and the grammar has no escape. A property literally called
`first.name` therefore has **no scope at all** — `#/properties/first/properties/name`
is well-formed, resolves to nothing, and reports no error anywhere.

The typed layer leaves such names out of the paths it offers. The alternative
is handing out a pointer that is silently wrong, which is the failure this
whole layer exists to prevent. The name stays legal and its data validates;
§14.5's path-free editor is how it is edited.

### 34.2 `/` and `~` are addressable, and must be escaped

The other two characters that collide with the addressing scheme have the
opposite answer: JSON Pointer reserves them, RFC 6901 escapes them, and core's
own `getPropPath` applies that escaping per segment. A property called `a/b`
is addressed as `#/properties/a~1b`.

This is worth stating because the dot case makes "collides with the syntax"
look like one problem with one answer. It is two problems: **where a correct
pointer exists, produce it; where none can, refuse.**

### 34.3 A property named `properties` is unremarkable

`#/properties/properties` is the keyword followed by the property, and
`#/properties/properties/properties/city` nests correctly. The same holds for
`items`, `type` and `required` as *names*. Worth recording only because it
looks like it should be a problem and is not — a reviewer checking another
implementation can stop here.

### 34.4 Where the types are narrower than the model

The sizing options (`width`, `gap`, `minWidth`, …) accept a curated
`CssLength` rather than the model's `number | string`. This is the one place
the authoring types are **narrower than the runtime**, which inverts the usual
risk: a false rejection turns correct CSS into a build failure. `fr` is
excluded deliberately — the containers are `display: flex`, so it would
type-approve a value the browser ignores.

### 34.5 Status

Implemented and exported from
`@chobantonov/jsonforms-react-extended-renderers`. Covered by
`typedAuthoring.test.ts`, `typedAuthoringCoverage.test.ts`,
`typedAuthoringCssLength.test.ts` and `typedAuthoringNames.test.ts`. The
negative cases use `@ts-expect-error`, so the guard fails the **build** rather
than a test run if the checking ever stops working.

Not adopted anywhere yet: the spec examples remain JSON, which is deliberate —
they are fixtures for the renderers, and a typed authoring layer between them
and the renderer would weaken what they demonstrate.

## Adjustment 35 — The markup label

**Type:** **implements** §10 for text elements, and **records four decisions**
the specification leaves to the implementation: where markup lives in the
model, whether the gate defaults open, what a refusal shows, and what the
parser's output is made of.

The renderer is
[`MarkupLabelRenderer.tsx`](../packages/jsonforms-react-extended-renderers/src/renderers/MarkupLabelRenderer.tsx);
the profile is
[`util/markdown.tsx`](../packages/jsonforms-react-extended-renderers/src/util/markdown.tsx).
The worked example is
[`markup-label`](../packages/jsonforms-react-demo-common/src/examples/spec/markup-label/).

### 35.1 An option, never a new element type

`Label` with `options.markup: "markdown"`. Not `MarkdownLabel`.

The reason is what each degrades to. §1 requires an unknown **option** to be
preserved and ignored, so a base-only renderer set draws the same Label with
its text unparsed — asterisks showing, but every word on the page. It requires
nothing of the kind for an unknown **type**, and an unmatched type renders as
nothing at all: the same document opened on a base-only build would lose its
text entirely.

The rule generalizes. *Where a capability changes how existing content is
presented, it is an option on the existing element. A new element type is for
content that does not otherwise exist.* `Link` and `ImageView` earn their
types; markup does not.

### 35.2 The Markdown gate defaults **open**

Every other extension gate in §12 defaults closed —
`allowScriptEvaluation`, `dynamicValues.enabled`, `allowImageDataUrls`. The
recommended configuration in §2 shows `markup.markdown.enabled: true`, and
this implementation takes that literally: absent configuration means Markdown
is parsed.

The asymmetry is deliberate and the criterion is worth stating, because it is
the one an implementer will get wrong by analogy:

> **A gate defaults closed when what it opens can act. It may default open
> when what it opens can only be read.**

The closed gates admit a compiler, a data-path resolver, or an inline payload
that bypasses the host's CSP. Markdown admits a grammar. The basic profile has
no raw HTML, no images, no embeds and no script, and §35.4 removes the last
place a string could have become executable. A host that disagrees still
closes it in one line.

The same criterion decides interpolation, which needs **no gate at all**: ICU
MessageFormat has no property access and no function calls, and an ICU
implementation that *interprets* an AST is inert. One that *compiles* messages
to JavaScript is not, and is gated like a template engine. The distinction is
the implementation's, not the message format's.

### 35.3 A refused request shows the diagnostic **and** the text

`markup: "asciidoc"`, or `markdown.enabled: false`, produces a diagnostic
beside the unparsed text. A refused `TemplateLayout` (§22) shows its
diagnostic *instead of* anything.

Not an inconsistency — the two are different kinds of thing. A template is a
program whose output is the content, so refusing to run it leaves nothing to
show. A label's text is the content, inert either way, and readable whether or
not its asterisks became bold. Hiding it would convert a policy decision into
missing information on the page, which is the failure mode §10's diagnostics
exist to prevent.

*Refuse the capability, not the content.*

### 35.4 "Sanitized after parsing" is met by never producing HTML

§10 requires Markdown output to be sanitized after parsing. The usual reading
is: render to an HTML string, then run a sanitizer over it. This
implementation reads the parser's **token stream** instead and builds UI
elements from it directly. No HTML string exists at any point.

This is stronger than sanitizing, and cheaper. What can reach the page is an
explicit allowlist of elements, and attributes are dropped except `href`;
there is no sanitizer in the dependency chain to be misconfigured, out of
date, or handed a construct it parses differently from the renderer — the
class of bug that every HTML sanitizer CVE belongs to.

An implementation on a platform with no token-stream API must sanitize, and
§10 is written for it. One with such an API should be read as: *the
requirement is that no unsanitized markup reaches the page, and producing none
satisfies it.*

### 35.5 Excluding a construct means disabling its rule

A profile excludes headings. Two ways to honour that: disable the heading
**rule**, so `# Title` stays the characters `# Title`; or parse normally and
drop heading nodes from the output, so the `#` is consumed and the line
quietly becomes a paragraph.

The first. An author who writes an excluded construct should see that it did
not work. The second silently produces *almost* what they wanted, which is how
an authoring mistake survives review.

One caveat, found by testing rather than reasoning: disabling a rule is not
the same as escaping the text, because another rule may claim the same
characters. With fenced code off, a ``` block is taken by the inline
backtick rule and renders as inline code — degraded to its nearest supported
neighbour rather than to literal backticks. Nothing is lost, but an
implementation should not promise literal source text in general.

### 35.6 The URL policy replaces the parser's own check, rather than joining it

markdown-it — and most Markdown parsers — carry a scheme allowlist of their
own. Left in place it sits *in front of* §12's policy, and the effective
policy becomes their intersection: a host that widens `allowedSchemes` gets
nothing for the schemes the parser happens to dislike, and cannot find out
why, because a link refused before parsing produces no link node and therefore
no diagnostic.

§10 says link targets MUST pass the URL policy. That is a statement about
which check is **authoritative**, not about how many there are. Turn the
parser's check off and hand every target to the policy.

Doing so is not a loosening: the default policy allows `https`, `http` and
`mailto` only, which is narrower than what markdown-it blocks. A refused
target keeps its text and loses its link, exactly as a refused `Link` element
does.

### 35.7 Substitution escaping, and the direction it runs

§9 already requires Markdown substitutions to be escaped before parsing. Worth
restating only because the order is the whole content of the rule:
**interpolate → escape → parse.** Escaping after parsing is too late; the link
already exists.

### 35.8 Typography is an option because margins collide

Rendered text is wrapped in the host UI library's text components by default,
so it inherits the theme's colour, size and link styling. `options.typography:
false` on the element, or `jsonformsExtended.markup.typography: false`
form-wide, turns that off.

It has to be switchable because those components carry their own margins,
which fight a form's own vertical rhythm — the same collision a non-zero
column gap produces (§21). The flag is about the box, not about the Markdown:
turning it off still parses.

One portability note for the slot a renderer set binds here. It is told
whether it is being handed **block** content or a single run, and a library
whose paragraph component renders a real `<p>` must not wrap block content in
it: `<p>` accepts phrasing content only, so a `<p>` or `<ul>` inside one is
invalid, the browser closes the outer tag early, and the resulting tree stops
matching what the renderer thinks it rendered. antd's `Typography.Paragraph`
renders a `div`, so it is safe for both and this implementation uses it for
both — which is why the slot is one component with a flag rather than two
components.

### 35.9 A Label's text is ICU's, never a `$dynamic` template

**Type:** **restricts** §11. `text` is not on §11.1's denylist, so nothing in
the portable model stops an author writing:

```json
{
  "type": "Label",
  "text": "Welcome",
  "i18n": "profile.welcome",
  "$dynamic": { "text": { "template": "Welcome, {data.firstName}" } }
}
```

That is legal today and should not be. It **bypasses the catalog entirely**:
`profile.welcome` is never looked up, and the form greets a Bulgarian reader
in English. The failure is silent — there is no missing key to report,
because the key was never consulted.

It is also the only place in the model where two interpolation grammars land
on the same string. With `interpolate`, `{firstName}` is an ICU argument;
inside a template, `{data.firstName}` is a data path. The braces are the same
and the escapes are not: `{{` is a literal brace in §11.4 and a syntax error
in ICU (measured — `MALFORMED_ARGUMENT`).

**The rule:** translated text may be supplied by `bind`, never by `template`.
Dynamic label text is written as §9's own example already writes it —
`$dynamic` supplies the arguments through `textParams`, ICU formats them:

```json
"$dynamic": {
  "options": { "textParams": { "firstName": { "bind": "data.firstName" } } }
}
```

One level more nesting, and it buys `plural`, `select` and locale-correct
numbers and dates, none of which a template can express.

**Nothing is removed from this implementation**, because nothing implemented
it: there is no `template` on a Label in any renderer or published schema, and
`$dynamic` resolution does not exist. What is removed is the **licence** to
add one later, recorded before the resolution layer is written rather than
after a form in the field depends on it.

This is the narrow, clearly-right half of
[TODO Decision 5](TODO.md): whether `template` survives at all — for an
`href`, an `src`, a `placeholder`, none of which are translated — stays open.
The two do not have to be answered together, and this one does not wait on it.

### 35.10 Status

Implemented for `Label`. Interpolation (`options.interpolate`) is **not**: the
tester deliberately claims only elements asking for markup, because claiming
an interpolating element and rendering it plain is worse than leaving it with
the base renderer, which does the same thing honestly.

Covered by `markdown.test.tsx` (the profile, the allowlist, the URL policy and
the escaping), `markup.test.ts` (the gate and option resolution) and
`markupLabelExample.test.tsx` (the example, end to end, in two languages).

## Adjustment 36 — A control is not automatically a cell

**Type:** **records a contract** between JSON Forms' two registries that is
easy to miss and fails silently in both directions.

### 36.1 An array column can only reach a *cell*

Both array presentations — the AG Grid renderer and the antd table — draw a
column through `DispatchCell` against the **cells** registry, never the
renderer registry. That is deliberate: dispatching a renderer would pick the
object renderer for a composite column and inline a whole detail form where a
one-line summary belongs.

The consequence is the part that surprises. **A control that exists only as a
renderer is unreachable in a column**, and the column falls back to the rank-1
text cell without reporting anything. Here that meant a `format: "color"`
field showed `#3366ff` as text and a `format: "duration"` field showed
`P2DT3H`, while the *same fields* in the *same form* rendered as pickers
outside the array. Nothing was broken; the two registries simply did not have
the same members, and only one of them was ever extended.

*Whenever a renderer set adds a control, decide whether it is also a cell.*
The answer is not always yes — a code editor is not a cell; it draws no form
item, it wants height a row has not got, and a value that large belongs in the
detail dialog. But the decision has to be **made**, because the default is a
silent text fallback rather than an error.

### 36.2 The same component can serve both, through one adapter

There is no need for a cell-only copy of each control. Cell mode already
strips what a column has no room for — the label a column header supplies
anyway, and the inline message that would grow the row.

One thing does differ, and it is the whole of this adjustment:

| | reads the value at |
| --- | --- |
| `mapStateToCellProps` | `ownProps.path` |
| `mapStateToControlProps` | `composeWithUi(uischema, ownProps.path)` |

`DispatchCell` hands a column **both** a full path (`people.0.favoriteColor`)
and a scoped uischema (`#/properties/favoriteColor`), because a cell ignores
the second. A control does not: it appends the scope and reads
`people.0.favoriteColor.favoriteColor`.

**Both failure modes are silent, and the second is the dangerous one.**
Reading the wrong path renders a control that is perfectly formed and simply
**empty** — it looks like missing data, not like a wiring fault. Writing the
wrong path stores `{ "favoriteColor": "#ff0000" }` where a string belongs,
and nothing complains until the data is validated or saved somewhere else.

The adapter is one line of substance: rewrite the scope to `#`.
`composeWithUi` returns the path unchanged when a scope has no data-path
segments, and the schema `DispatchCell` supplies is already the field's own,
so `#` is the correct scope against it.

### 36.3 Why the base cell registry cannot carry them

The extended controls live in the extended package, and the base renderer set
must not depend on it. So the cells ship as their own export beside the
renderers, and a host opts in by concatenating it — which also means **a host
that does not gets the old text fallback**, with no error. That is the cost of
the layering, and it is why the export is named and documented rather than
folded into something that already ships.

### 36.4 Status

Implemented as `antdExtendedCells` in
`@chobantonov/jsonforms-react-antd-extended-renderers`, with `asCell` in
`renderers/asCell.tsx`. Registered for colour, duration, mask and null;
**not** for the code editor. Adopted by the demo app and the web component.

Covered by `extendedCells.test.tsx`, which asserts the read, **the write**,
the label suppression, and the text fallback a host without the export still
sees. `RendererRegistry.test.tsx` pins the membership of both registries.

## Adjustment 37 — CEL as the one expression language

**Type:** **replaces** §9's message formatter with an expression language, and
in doing so **collapses two interpolation surfaces into one**. This is a
deliberate trade, not a simplification: something is gained and something is
lost, and both are recorded here.

The implementation is `util/interpolate.ts` (grammar and scope, no evaluator
import), `util/celTemplate.ts` (the evaluator) and
`renderers/InterpolatedText.tsx`. The worked example is
[`label-interpolation`](../packages/jsonforms-react-demo-common/src/examples/spec/label-interpolation/).

### 37.1 Why not ICU

ICU MessageFormat is the obvious choice for text, and it cannot address data.
Measured against `intl-messageformat` 10.7.18:

| Pattern | Result |
| --- | --- |
| `{data.sku}` | `SyntaxError: MALFORMED_ARGUMENT` |
| `{data.items.0.price}` | `SyntaxError: MALFORMED_ARGUMENT` |
| `a {{ b` (§11.4's literal brace) | `SyntaxError: MALFORMED_ARGUMENT` |
| `a '{' b` (ICU's literal brace) | `"a { b"` |

An ICU argument name cannot be a path — `.`, `[` and `]` are Pattern_Syntax
characters. So ICU can format a *message* but cannot read the form, which
means a model that uses it for text still needs a **second** grammar for
§11.4's `template`, with a **different escape rule**: `{{` is a literal brace
in one and a syntax error in the other.

CEL addresses data natively, so one language serves both. That was the
deciding property. It also answers
[TODO Decision 5](TODO.md) — the two surfaces need not be reconciled,
because there is only one.

### 37.2 The two scopes, and why a catalog may not name a data path

The text and a parameter's value see different things:

| | may reference |
| --- | --- |
| a `textParams` **value** | the namespaces, subject to the gate |
| the **text** | the declared parameters, and `locale` |

So `{data.customerName}` written in a label's text resolves to nothing and is
reported, while `{product}` — declared once in the UI schema as
`"product": "{data.customerName}"` — resolves.

**This is about translation, not security.** A catalog that names data paths
is coupled to the schema: renaming a field invalidates every translation in
every language, and the translator is shown a path rather than a name for the
thing being talked about. `You are subscribed to {product}.` is a unit a
translator can work with; `You are subscribed to {data.customerName}.` is not.

The text still evaluates **expressions**, over the parameters. Restricting it
to bare substitution would have been simpler and would have moved every plural
into the UI schema, where only the authoring language can reach it. Keeping
expressions in the text is what lets the Bulgarian catalog write its own test:

```json
"seats.text": "Планът ви включва {seats} {seats == 1 ? \"място\" : \"места\"}."
```

`interpolate` governs the whole feature rather than only the dynamic half: with
it, the text is a template and parameter values are expressions; without it the
text is literal and `textParams` are inert. A parameter whose value has no
placeholder is simply a literal, so a static parameter needs no extra syntax.

#### What an expression language still does not give you

**Plural and gender are hand-written conditionals.** There is no `plural` or
`select`. Adequate for a two-category language, inadequate for one with more,
where the author must know the rules and write a branch per category. The
mitigation — each language writes its own test in its own catalog entry — is
real but partial.

**Locale-aware formatting is supplied, as functions** — see 37.3. What is not
supplied is a way to avoid writing the conditional.

### 37.3 Formatting is functions, not an implicit rule

A locale decides more than the words: `148.5` is `148,50 €` in German and
`€148.50` in English, and `2026-10-01` is `1.10.2026 г.` in Bulgarian.

`number`, `currency`, `percent`, `date`, `time` and `dateTime` are registered
into the evaluator, bound to the form's locale, backed by `Intl` — so there is
no locale data to ship and the output matches the platform's own.

**Explicit calls rather than automatic formatting**, because an implicit rule
cannot tell a price from an order number, a year or an identifier: it would
render `2026` as `2,026`, and there would be no way to opt out. A test pins
that an unformatted number stays unformatted.

Two things worth carrying across:

- **A typed environment costs nothing here.** Registering functions requires
  the library's `Environment`, which wants its variables declared. Declaring
  them all as `dyn` accepts and refuses exactly what the untyped `evaluate()`
  did — including refusing `seats + 1`, where CEL will not mix a double-typed
  value with an integer literal (`seats + 1.0` works). Measured both ways
  before switching.
- **A date-only value must be formatted as UTC.** `"2026-10-01"` is a calendar
  date; formatting it in the viewer's zone renders 30 September for readers
  west of the meridian. A one-day error that appears for only some readers is
  the worst kind, and it has its own test.

### 37.4 It needs no script-evaluation gate

By the criterion in [35.2](#352-the-markdown-gate-defaults-open) — *a gate
defaults closed when what it opens can act* — CEL sits on the "reads" side,
and the probes that put it there are worth repeating because they are the
whole argument:

| Attempt | Result |
| --- | --- |
| `alert("x")`, `require("fs")` | `found no matching overload` |
| `data.constructor`, `data.__proto__` | `No such key` |
| `data.toString()` | `found no matching overload` |
| `data.x = 1` | `ParseError: Unexpected character: =` |
| `while (true)` | `ParseError: Reserved identifier` |
| `eval` / `new Function` in the package | none |

It is an AST interpreter over a scope the renderer constructs, with no host
functions registered, and it is non-Turing-complete by design — `all()` over
5,000 items returns in single-digit milliseconds. §11.3's "own-property lookup
only, no calls, no operators" is satisfied **by construction** rather than by
enforcement, which is a materially better place to be.

What it *can* do is read whatever is in scope. That is data exposure, not
injection, and it is why the four dynamic namespaces sit behind
`dynamicValues.enabled` (closed by default) while `textParams` and `locale`
are always available.

### 37.5 Escaping is per-segment, and that is the whole security property

The order is **interpolate → escape → parse**, and the escaping applies to
**substituted values only**:

- Escape nothing and a data value carrying `**bold**` or
  `[click](javascript:…)` becomes markup. Removing the escaping makes three
  tests in `celSecurity.test.tsx` fail immediately.
- Escape the finished string and the author's own `**bold**` dies with it.

Distinguishing the two requires the template to be **split into literal and
expression segments** rather than substituted with a regex. That structural
requirement is the reason `splitTemplate` exists and returns segments.

A URL position gets no protection from value escaping, because the
destination is the author's markup — `[docs]({data.url})` interpolates into a
place escaping does not reach. The URL policy covers it, and it is
authoritative for exactly this reason (§35.6). Verified: with escaping
removed, a `javascript:` destination was *still* refused.

### 37.6 Three chunks, and a label downloads only what it reaches

| Label | markdown-it | CEL |
| --- | --- | --- |
| plain | — | — |
| `markup: "markdown"` | yes | — |
| `interpolate: true` | — | yes |
| both | yes | yes |
| `interpolate: true`, no `{…}` | — | — |

The last row is why the grammar lives in a module that does **not** import the
evaluator: splitting is pure string work, so a template that turns out to have
no placeholders is finished before a chunk is ever requested. `interpolate:
true` is a declaration of intent, not a download.

Two consequences that were found by testing rather than reasoning:

- **The wrapper belongs outside the Suspense boundary.** Built the other way,
  a label whose chunk never arrived rendered a bare string with no element,
  no typography and no `data-markup-label`. What is *asked for* is known
  synchronously; only the result is not.
- **Skipping the evaluator is not skipping the grammar.** A placeholder-free
  template still needs `{{` unescaped to `{`. The first implementation
  returned the authored text unchanged and got this wrong.

### 37.7 Status

Implemented for `Label`. Covered by `celSecurity.test.tsx` (the evaluator's
limits and the escaping, each proven load-bearing by removal),
`celFormatting.test.ts` (the locale functions, with the exact strings each
language produces), `labelInterpolation.test.tsx` (the renderer),
`labelChunkIsolation.test.tsx`
(which makes the evaluator unloadable to prove which paths reach for it) and
`labelInterpolationExample.test.tsx` (the example, in two languages).

Not yet done: no element other than `Label` interpolates, and §11's `$dynamic`
resolution — which would share this grammar and this evaluator — does not
exist.

## Adjustment 38 — What an expression may see, and what is worth reporting

**Type:** **refines** Adjustment 37 after the design met real data. Four
decisions, each of which changes what appears on a page.

### 38.1 Namespaces belong to the parameter, not to the text

`textParams` values read `data`; the text reads only the declared parameters.
So `{data.customerName}` written in a label's text resolves to nothing and is
reported, while `{product}` — declared once as
`"product": "{data.customerName}"` — resolves.

**The reason is translation, not security.** A catalog string naming a data
path is coupled to the schema: rename a field and every translation in every
language breaks at once, and the translator was shown a path rather than a
name for the thing. `You are subscribed to {product}.` is a unit a translator
can work with.

The text still evaluates **expressions** over those parameters. Restricting it
to bare substitution would have moved every plural into the UI schema, where
only the authoring language can reach it.

**But "the text may hold expressions" is not "put expressions in the text".**
The test is whether the expression's *shape* differs by language:

| | belongs in |
| --- | --- |
| a plural or gender conditional | the **text** - each language branches differently |
| reading data, `translate(...)`, `currency(...)`, `date(...)` | the **parameter** - the call is identical in every language |

The first draft of the worked example had `{translate("plan." + plan)}` and
`{currency(amount, "EUR")}` in the catalog strings. They render correctly, and
they are still wrong: the same call is then repeated in every language, a
translator has to reproduce it exactly, and one who drops the `translate(...)`
wrapper silently renders `Team` instead of `Екип` with nothing reported. A
catalog entry carries the words and the grammar; the parameter carries the
plumbing.

### 38.2 Absent data is not an authoring error

Two failures that look alike:

| | reported? |
| --- | --- |
| a name the text does not declare, an unknown namespace or function, a type mismatch | yes |
| a field nobody has filled in, a missing object on the way, an index past the end, an explicit null | **no** — empty text, silently |

A form being filled in is mostly empty. Reporting absence puts a
developer-facing message beside much of a fresh form, and a diagnostic that
appears when nothing is wrong is one people stop reading.

The line is the **namespace**: the root must resolve, and anything reached
through it may be missing at any depth. The evaluator separates the two
cleanly — `No such key` for a missing key at any depth including an
out-of-range index, `Unknown variable` for a root that is not in scope — so
the classification is a string test rather than a judgement.

One consequence worth noting: `data.constructor` on an object that has no such
property is refused *silently*, because it is indistinguishable from any other
absent key. That is fine — the security property is that nothing is returned,
not that something is said.

### 38.3 A function cannot arrive through the data

`translate` is **registered** into the evaluator. A function placed in
`context` is not callable — measured: a member call finds no overload, a bare
call finds no overload, and merely reading it is an unsupported type.

This is what keeps 37.4's "an expression cannot act" true in practice. Were a
callback in the data callable, every host exposing one would widen the sandbox
without meaning to, and the guarantee would depend on what each host happened
to put in `context`. It is also why §11.2 says `context` carries values, not
functions.

What registering a translator buys: a value out of the data is often a **key**
rather than a word. `data.plan` is `"Team"` in every language, and
`{translate("plan." + plan)}` lets the catalog localize it without the UI
schema knowing the set of plans.

### 38.4 A property named `constructor` is ordinary JSON

Any string is a legal JSON property name. The chosen evaluator identifies a
plain object with `switch (v.constructor)`, which a data property of that name
shadows — so it rejects the **whole object**, and an unrelated field becomes
unreadable because a *sibling* was called `constructor`. Measured: only
`constructor` does this; `__proto__`, `toString`, `valueOf` and
`hasOwnProperty` as data keys are all fine.

Data is read the way JSON means it, so the evaluation is **retried** with the
objects rebuilt as `Map`s, whose entries live in an internal slot and cannot
shadow `.constructor` — and `Map` is already one of the evaluator's accepted
shapes.

**The retry runs only after that specific failure.** Converting up front would
mean walking the whole form's data on every label of every render to serve a
case almost no schema has; this way the ordinary path converts nothing. That
is the general shape worth copying: *pay for the rare case in the rare case.*

### 38.5 Status

Covered by `celAbsentData.test.ts` (the classification, the repair, and the
four names that need no repair), `celFormatting.test.ts`,
`celSecurity.test.tsx` and the
[`label-interpolation`](../packages/jsonforms-react-demo-common/src/examples/spec/label-interpolation/)
example, which is organised so that **no correct-usage tab carries a
diagnostic** and every reported case sits on one tab of its own.

---

## Adjustment 39 — The cron picker asks how often first

**Type:** a **new control**, within the portable contract. It adds no keyword
and no storage format: the value is the string it always was, and section 5's
two selection routes reach it the same way every other format-selected control
is reached.

A cron expression is six values hidden in six fields of punctuation. The
question a reader has — *when does this run?* — is not answerable by looking at
`0 0/15 * * * *` unless they already know the dialect, and the control that
existed for it was a text input.

### 39.1 The dialect is stated, not guessed

Six fields, `second minute hour day-of-month month day-of-week`. Unix cron has
five and no seconds; Quartz has seven and adds a year. The same text means
different things in each, and **the mistake does not announce itself**: a
five-field expression ported from a crontab is a valid string that schedules
nothing, and a seven-field one from Quartz is rejected by a six-field parser
only if something is checking.

Two consequences follow.

`cron` is **registered as a format** in the extended validator profile, beside
`color`. Without it, `format: "cron"` selects the renderer and validates
nothing — Ajv ignores an unknown format with a warning — so the schema route
would be the column of section 5's table that promises validation and does not
deliver it.

And the two day fields are **ANDed**. `CronExpression.nextOrSame` applies every
field in sequence with none of Quartz's OR special case, so `0 0 0 1 1 SUN` is
not New Year's Day; it is New Year's Day when it falls on a Sunday, which is
roughly one year in seven. Nothing in the picker may fill in one day field
while the other is set.

### 39.2 A period is a lens, not a value

The picker asks **how often it repeats** first, and that decides which of the
six rows are on screen: a schedule that runs every hour has nothing to say
about which day it is, and five rows reading "Every" is a form that hides its
own answer.

It **asserts nothing of its own**. A property with no schedule in it opens with
no period chosen and no rows — a picker that arrived showing `Daily` would be
claiming a repetition the value does not have — and choosing a period writes
nothing at all. The one thing changing it does write is the conditions it is
about to hide: a monthly schedule switched to daily that kept its day of the
month would still run once a month, with nothing on screen saying so, because
the row that said it is gone.

It is held as state rather than derived, for the same reason the duration
control holds its mode ([§32.1a](#321a-p0w-is-valid-and-must-not-be-normalised-away)):
emptying the last dropdown of the current period would otherwise re-derive a
finer one mid-edit and take the row being cleared off the screen.

### 39.3 Choosing a value pins the time below it

In cron a field left alone means **every** value, so `* * 9 * * *` is not nine
o'clock — it is every second of the hour after it, 3600 executions. A picker
that let someone choose an hour and wrote only that would be producing the
wrong schedule from the right selection.

So choosing a value pins the **time** fields below it that are still saying
every: Hours = 9 writes `0 0 9 * * *`, and a weekday writes `0 0 0 * * MON`.
Only downwards, only the time fields, and only when something was chosen —
clearing pins nothing. The day and month fields are never filled in, both
because that is the question being asked and because of the AND in §39.1.

Every pin is one selection away from being undone, so "every minute during the
nine o'clock hour" is still reachable; it is just no longer what picking an
hour silently means.

### 39.4 A field that is not a list is edited as text

`L`, `LW`, `L-3`, `15W`, `5L`, `FRI#2` and a range that wraps the week
(`FRI-MON`) are legal and are **not sets of values**. "The last weekday of the
month" cannot be offered as a list of days without changing what the schedule
does.

So a field whose value does not parse to a set shows the text it is, with a
note saying why, and every other field keeps its dropdown. Nothing is
reinterpreted, nothing is widened, and nothing is taken away from whoever wrote
it. This is what a picker owes an expression it does not fully model, and it is
the difference between supporting a dialect and supporting the easy half of one.

### 39.5 Applying an untouched picker writes nothing

The rule §32.1a records for durations, in the form cron takes: `0 0/15` and its
asterisk spelling select the same minutes, `@daily` is `0 0 0 * * *`, `7` and
`SUN` are the same day, and `9-11` is `9,10,11`. Each has a canonical form the
picker would otherwise write back on Apply, marking the field dirty without an
edit and replacing whatever a server sent.

> Existing data must not be silently normalized solely because the renderer is
> mounted.

Two mechanisms, because one does not cover the empty case. Expressions are
compared as **values, field by field** — the only comparison that sees two
spellings of one schedule as equal — and a field neither side can state as a
set is compared as text, since two pieces of unmodelled syntax are only known
to agree when they are identical. And the picker tracks whether it was
**touched**, because on a property with no schedule there is nothing to compare
against.

The same care applies to a schedule that *is* edited: only the field that was
touched is rewritten, so changing the hour leaves the minutes spelled `0/15`
rather than reformatting them into an equivalent.

### 39.6 Implementation

[`util/cron.ts`](../packages/jsonforms-react-extended-renderers/src/util/cron.ts)
reads and writes the six fields as value sets, so a second renderer family gets
the same behaviour and the validator profile can share the parser;
[`AntdCronControlRenderer.tsx`](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdCronControlRenderer.tsx)
draws it, as one field with the picker in the input's prefix — the shape the
duration and color controls already use.

Clearing is `AntdClearableInput`, so the button carries `control.clearValue`,
appears on hover or focus, and returns the property to a missing state.
`showActions: false` commits each selection immediately, as elsewhere.

Covered by `cronValues.test.ts` for the reading and writing of every field —
including that a five-field expression is rejected rather than reinterpreted,
and that `@reboot` is refused, since it is in Unix cron and in the picker
libraries and not in this dialect — and `cronPicker.test.tsx` for what the
panel shows and what reaches the data. The selection is asserted from the open
list rather than from the chips: the rows ask for `maxTagCount: 'responsive'`,
and antd's overflow measures every item as zero wide in jsdom.

The worked example is
[`cron-control`](../packages/jsonforms-react-demo-common/src/examples/spec/cron-control/).
