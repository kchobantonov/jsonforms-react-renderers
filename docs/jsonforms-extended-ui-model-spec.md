# JSON Forms Extended UI Model Specification

**Status:** v1 implementation-review specification\
**Scope:** Portable UI-model semantics and runtime/renderer behavior
layered on JSON Forms.\
**Out of scope:** visual-editor UX, palette/inspector design, editor
migrations, editor design mode, and renderer-specific implementation
specifications themselves.

## 1. Purpose and portability

This specification defines a portable extension model for JSON Forms for
web renderer sets and future non-web implementations such as Kotlin
Multiplatform or Dart.

The normative contract is the **serialized UI-model shape and behavioral
semantics**. TypeScript declarations are reference representations only;
other languages may model the same semantics differently.

The model SHOULD require no changes to `@jsonforms/core`. A
wrapper/resolution layer may preprocess extended UI-schema elements
before ordinary tester dispatch.

  ------------------------------------------------------------------------------------
  Class                           Portable? Example              Other implementations
  ------------------- --------------------- -------------------- ---------------------
  Portable model                        Yes `$dynamic`,          MUST reproduce
  semantic                                  `variant:"chips"`,   semantics
                                            span/weight          

  Common JSON Forms                 Desired `multi`,             SHOULD support when
  behavior                                  `dateFormat`,        applicable
                                            `dateSaveFormat`     

  Renderer                 Desired behavior schema-aware date    SHOULD strive to
  enhancement                               limits               reproduce semantics

  Renderer-contract                      No underlying component Preserve; interpret
  escape hatch                              props                only for matching
                                                                 renderer contract

  Platform                               No web `$el: Element`   May define equivalent
  integration                                                    or omit

  Runtime escape                         No JavaScript `script`  Preserve; execute
  hatch                                                          only when
                                                                 supported/permitted
  ------------------------------------------------------------------------------------

A UI-library brand alone does not uniquely identify an escape-hatch
contract. Svelte+shadcn and React+shadcn, or React Ant Design and Vue
Ant Design Vue, may share visual intent but expose different props. Each
renderer specification declares a sufficiently unique namespace. Unknown
renderer namespaces MUST be preserved and ignored by non-matching
renderers.

## 2. Core TypeScript references

A TypeScript implementation may import:

``` ts
import type {
  BaseUISchemaElement,
  Internationalizable,
  JsonFormsI18nState,
  JsonSchema,
  Layout,
  Translator,
  UISchemaElement,
} from '@jsonforms/core';
```

These are TypeScript references, not requirements on other platforms.

``` ts
export type NamedUISchemaElement = UISchemaElement & {
  name: string;
};
```

`name` is used where an element must be referenced, for example
Categorization initial selection.

## 3. Runtime context and web action contract

Reference web/TypeScript context:

``` ts
export interface FormContext {
  [key: string]: unknown;
  config?: unknown;
  readonly?: boolean;
  locale?: string;
  translate?: Translator;
  data?: unknown;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  errors?: ErrorObject[];
  additionalErrors?: ErrorObject[];
  fireActionEvent?: <TypeEl extends Element = Element>(
    action: string,
    params: Record<string, unknown> | undefined,
    el: TypeEl,
    element?: UISchemaElement,
  ) => Promise<void>;
}
```

Web-specific action event:

``` ts
export type ActionEvent = {
  action: string;
  callback?: (event: ActionEvent) => void | Promise<void>;
  context: FormContext;
  params: Record<string, unknown>;
  $el: Element;
  element?: UISchemaElement;
};
```

`$el` and DOM `Element` are explicitly web-specific. Missing optional
Button params are normalized to `{}` when constructing ActionEvent.

A JavaScript implementation may use:

``` ts
export const AsyncFunction =
  Object.getPrototypeOf(async function (_event: ActionEvent) {}).constructor;
```

This is a JavaScript implementation detail, not portable API.

## 4. Reuse before adding types

  ---------------------------------------------------------------------------------
  UI concept                                    Representation
  --------------------------------------------- -----------------------------------
  Editable/viewable data                        `Control`

  Horizontal/vertical structure                 existing layouts

  Bounded section                               `Group`

  Collapsible section                           `Group` + collapsible

  Tabs/stepper/accordion                        `Categorization`; variant for stepper/accordion

  Chips/multi-select/table/switch/slider/code   `Control` + options
  editor                                        

  Interpolated rich text                        Internationalizable element + text
                                                options

  Image                                         `ImageView`

  Separator                                       `Separator`

  Whitespace/flexible push                      `Spacer`

  Command                                       `Button`

  Navigation                                    `Link`
  ---------------------------------------------------------------------------------

Deferred: Progress, explicit breakpoint overrides,
grid `start`, validation-gated wizard semantics, richer Separator
features.

## 5. Established presentation options and canonical variants

Existing JSON Forms conventions MUST be retained when they already express
the intended presentation. This model uses one encoding for each of the
following presentations; it does not introduce equivalent variant aliases.

| Presentation | UI-schema encoding | Applicability |
| --- | --- | --- |
| Multiline text | `options.multi: true` | string |
| Masked string | `options.mask` containing a mask pattern | string |
| Boolean switch | `options.toggle: true` | boolean |
| Radio choices | `options.format: "radio"` | supported enum/oneOf choices |
| Searchable choices | `options.autocomplete: true` | supported finite choices |
| Slider | `options.slider: true` | number/integer satisfying the renderer's range tester |
| Color | `options.format: "color"` | string; schema `format: "color"` also selects the renderer |
| Password | `options.format: "password"` | string; schema `format: "password"` also selects the renderer |
| Date | `options.format: "date"` | string; schema `format: "date"` also selects the renderer |
| Time | `options.format: "time"` | string; schema `format: "time"` also selects the renderer |
| Date and time | `options.format: "date-time"` | string; schema `format: "date-time"` also selects the renderer |

The existing `isRangeControl` tester requires `minimum`, `maximum`, and
`default` in the target numeric schema. Renderer behavior specifications
MUST document the applicable tester requirements for their targeted version.

New variants must add a
documented capability beyond renaming an established option. The remaining
variant proposals below are subject to renderer-by-renderer convention review.

### Schema-driven and UI-driven format selection

Schema `format` and UI `options.format` have distinct responsibilities.
Schema format describes the data; UI format requests a presentation without
changing the data schema. Supporting both is intentional and does not
justify adding a third encoding through `variant`.

Password, date, time, and date-time controls MUST retain schema-driven
selection, including when the host supplies no UI schema and JSON Forms
generates it. They MUST also support the corresponding UI `options.format`
for a string schema without a format.

`password` is a custom format convention supported by this project, not a
built-in JSON Schema validation format. Password-content constraints must
be expressed separately from the obscured presentation. See the
[JSON Schema format reference](https://json-schema.org/understanding-json-schema/reference/type#format).

Display format, stored format, and renderer selection are separate concerns.
For example, a plain string schema can use `options.format: "date"` with
`dateSaveFormat: "YYYY-MM"` to edit a month representation without claiming
that the stored value satisfies JSON Schema's full-date format. UI options
MUST NOT rewrite the schema or disable its validation. If the schema does
specify a format, a custom save format must remain compatible with it to
avoid validation errors when format validation is enabled.

Existing date/time testers accept either selection path using OR conditions;
this does not establish UI-format precedence when schema and UI formats
conflict. Renderer specifications must document competing tester ranks and
fallbacks. A universal conflict policy remains a review item.

### Syntax provenance and consistent selection

Distinguish these origins wherever a renderer or option is defined:

- **JSON Forms core**: element structure or semantics provided by core, such
  as Control/scope, layouts/elements, and schema-based rules.
- **JSON Forms renderer convention**: behavior implemented by a named official
  renderer family, not necessarily understood by core or every renderer set.
- **Project extension**: this project's additional renderer or behavior.
- **Proposal**: a target contract awaiting implementation or final review.

A renderer entry's origin applies to its examples and options unless an option
is explicitly marked otherwise. Extended behavior on an existing JSON Forms
renderer must be identified separately. Source availability in a neighboring
fork is not proof of official upstream support. Pending provenance should be
labelled unverified rather than attributed to upstream.

| Syntax / behavior | Origin |
| --- | --- |
| Control/scope, HorizontalLayout, VerticalLayout, Group, Categorization/Category | JSON Forms core structure. |
| multi, toggle, slider, radio presentation encodings | JSON Forms renderer conventions; support remains family-specific. |
| Categorization `options.variant: "stepper"` | JSON Forms renderer convention, verified in official React Material. |
| HorizontalLayout/VerticalLayout `options.variant: "splitter"` | Project extension. |
| AG Grid, Monaco, file/color/duration renderer contracts | Project extensions, even when they use schema keywords or standard core elements. |
| cells[property].summary/detail composite dialogs and forced nested tables | Project extensions to table behavior. |
| $dynamic, common layout sizing, combined editor validity, new color serialization profile | Project extension target contracts; implementation status belongs in the separate review document. |
| Control variants chips and multi-select | Project extensions; automatic enum-array checkboxes retain their existing encoding. |

`variant` is already used by JSON Forms renderers; it is not a core dispatch
mechanism with universally defined values. Preserve existing selection options
when available. For new alternate presentations, use variant when it selects
one presentation mode, and booleans for independent behavior within that mode.
For example, splitter selects a split-pane layout, while resizable controls
whether its dividers can be dragged. Do not provide two equivalent selection
encodings for the same presentation.

Official source: [Material categorization stepper tester](https://github.com/eclipsesource/jsonforms/blob/master/packages/material-renderers/src/layouts/MaterialCategorizationStepperLayout.tsx).

### Global defaults, local options, and tester selection

**Origin:** existing renderer integrations commonly merge JSON Forms config with
UI-schema options to obtain applied renderer options. This is distinct from
registry tester evaluation; core does not universally merge config into the
UI schema before selecting a renderer.

For supported renderer options, global config supplies defaults and local
UI-schema options override them. For example, these form inputs retain the
local false value:

```json
{
  "config": {
    "showUnfocusedDescription": true
  },
  "uischema": {
    "type": "Control",
    "scope": "#/properties/name",
    "options": {
      "showUnfocusedDescription": false
    }
  }
}
```

The description therefore follows the focused-only behavior for this control.
The outer object illustrates separate form inputs; config is not a field of the
UI element. Explicit false, zero, and empty string remain meaningful overrides
where the option accepts those values. Do not use truthiness-based fallback to
replace them with global defaults. Option-specific validation and defaults still
apply; a value is not made valid merely because it is explicit.

Renderer selection has a separate input contract. Core optionIs testers read
UI-schema options, while tester context separately exposes config. For example,
config.multi: true does not guarantee selection of a multiline renderer simply
because a renderer later receives multi in its applied options. Use
uischema.options.multi: true for the established selection request. Likewise,
author format and variant selection in the UI schema unless the applicable
tester explicitly documents config-based selection. The generic $dynamic
preprocessing contract still supplies the effective UI element before testing,
subject to its existing target restrictions.

Do not assume a single merge policy for every nested object or array. Existing
web helpers commonly use recursive Lodash merging, whose arrays merge by index;
that implementation detail is not a universal portable array-override rule.
Each structured option must document its merge behavior where relevant. The
agreed agGridOptions contract specifically replaces local arrays as a whole,
including columnDefs, while recursively merging option objects. Preserve source
config and authored UI-schema objects rather than mutating them during merging.

Dedicated contracts take precedence over this general defaulting description.
In particular, readonly sources follow core's documented precedence, confirmation
uses its namespaced operation/renderer defaults, and validator construction
settings are not renderer config options. Listing an option in global config
does not establish support in every renderer or authorize it as a selection key.

### Additional presentation variants

`options.variant` expresses the additional portable presentations below.
When absent, ordinary JSON Forms selection applies, including established
UI-schema options; `variant:"auto"` is not canonical output.

  ------------------------------------------------------------------------------------------------
  Element          Variant          Applicability            Intended UI            Fallback
  ---------------- ---------------- ------------------------ ---------------------- --------------
  Control          chips            array of strings      removable chips/tags   automatic
                                    values                                          array

  Control          multi-select     array + choices          multiple-choice        automatic
                                                             dropdown/list          array

  Categorization   stepper          Categorization           ordered step           renderer
                                                             presentation           default

  Categorization   accordion        Categorization           expandable sections    renderer
                                                                                    default

  ------------------------------------------------------------------------------------------------

Renderer specs may add variants but MUST NOT rename canonical variants.

Established options are runtime UI-schema conventions, not aliases for
new variants. Renderer behavior specifications document their support,
defaults, and selection rules for each targeted version. Canonical variant
is static; established options may be dynamic and can affect tester
selection. Any remaining proposal overlapping an existing convention must
be reviewed before defining additional encodings or precedence rules.

## 6. Layout types and semantics

``` ts
type Dimension = number | string;

interface LayoutItemOptions {
  span?: number;
  weight?: number;
  width?: Dimension;
  minWidth?: Dimension;
  maxWidth?: Dimension;
  height?: Dimension;
  minHeight?: Dimension;
  maxHeight?: Dimension;
  start?: number;       // reserved
  responsive?: unknown; // reserved
}

interface LayoutContainerOptions {
  gap?: Dimension;
  wrap?: boolean;
  minItemWidth?: Dimension;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' |
    'space-between' | 'space-around' | 'space-evenly';
  resizable?: boolean;
}

interface HorizontalLayoutOptions extends LayoutContainerOptions {
  gridColumns?: number;
}

interface VerticalLayoutOptions extends LayoutContainerOptions {}
```

Validation: gridColumns/span positive integers; weight finite \> 0;
dimensions non-negative where appropriate. On web numeric Dimension
means CSS px; other platforms define equivalent logical units.

Flat layout options configure immediate children. `options.layout`
configures child participation.

Primary modes: Auto, Span, Weight, Fixed. Conflict precedence: Fixed \>
Span \> Weight \> Auto. Min/max are constraints.

Horizontal Auto behaves as weight 1. Vertical Auto means natural/content
height. Vertical weight distributes remaining height only when parent
height is definite/resolvable.

For usable row width W, G grid columns, gap g:

``` text
c = (W - (G - 1) * g) / G
spanWidth(n) = n * c + (n - 1) * g
```

Clamp span above gridColumns and diagnose. Span widths are
deterministic; cross-row column positions align only for pure-span rows.

Resolve mixed rows: effective children → gaps/chrome → Fixed → Span
against complete logical grid → Weight/Auto remainder → min/max
redistribution.

Only effective visible UI-schema children participate. Hidden children
leave layout. HTML comments, Lit markers, fragments/placeholders MUST
NOT affect sizing/gaps/splitters.

Structural layouts have no implicit outer padding. Gap applies only
between effective visible immediate children, so deep single-child
nesting does not accumulate whitespace.

Unsupported hints are ignored with diagnostic; e.g. span under
Group/VerticalLayout does not create a horizontal grid.

## 7. Wrap, defaults, splitter and Spacer

gridColumns: explicit → `jsonformsExtended.layoutDefaults.gridColumns` →
renderer default → 16.

wrap: explicit → `jsonformsExtended.layoutDefaults.wrap` → false.

Recommended fallback gap is 0 unless renderer capability documents
another portable default.

Wrapping uses resolved fit/minimum constraints. Weight/Auto shrink
first; with wrap enabled non-fitting children move rows; without wrap
Span/Fixed may shrink to minimum then overflow/scroll.

`minItemWidth` is parent default minimum. Auto-fit requires wrap=true.
Fixed children remain fixed subject to constraints; flexible Span/Weight
arrangements may degrade to equal flexible shares and wrap.

justify = main axis; align = cross axis.

Split-pane selection uses `options.variant: "splitter"` on HorizontalLayout
or VerticalLayout. **Origin: project extension**, reusing existing JSON Forms
layout types and the established renderer-option convention of `variant`.
Layout type determines direction. Initial sizes use normal sizing; Span
SHOULD NOT be used; dragged sizes are runtime state; vertical splitters
require definite height; splitter+wrap unsupported; `resizable` defaults
true. Interactive splitters require platform-appropriate
keyboard/focus/separator accessibility.

``` ts
interface SpacerElement extends BaseUISchemaElement {
  type: 'Spacer';
  size?: Dimension;
}
```

**Origin:** Spacer is a project extension. Suggested renderer name:
`SpacerRenderer`. Match `type: "Spacer"`; no JSON Schema type or data binding
is required. Top-level `size` supplies intrinsic spacing independently of parent
layout support. It defaults to 32 and uses the shared non-negative Dimension
type (numeric values are CSS pixels on web).

Inside HorizontalLayout, size supplies intrinsic width. Inside VerticalLayout,
at the top level, or without a recognized directional parent, it supplies
intrinsic height. Supporting parents may override sizing using options.layout;
without that support, size still applies. Spacer is a normal visible layout
child, so surrounding gaps apply normally. It is noninteractive and hidden from
assistive technology; it does not read or modify form data.

``` json
{
  "schema": {},
  "uischema": { "type": "Spacer", "size": 16 }
}
```

A flexible push inside a supporting HorizontalLayout uses
`{"type":"Spacer","size":0,"options":{"layout":{"weight":1}}}`.
Here size provides the intrinsic fallback and parent weight distributes the
available space. Top-level size describes the Spacer itself; options.layout
controls participation in a supporting parent.

## 8. Group and Categorization

### Group

**Origin:** Group/label/elements are JSON Forms core syntax. Collapsible
behavior and the data-presence indicator below are project extensions.
An ordinary Group presents related controls as a labelled section; its default
visual treatment belongs to the renderer family and does not require a variant.

| Option | Default | Behavior |
| --- | --- | --- |
| `collapsible` | false | Enables an accessible disclosure control. |
| `collapsed` | false | Initializes expansion and synchronizes it when the effective boolean changes. Ignored unless collapsible is true. |
| `showDataIndicator` | false | Shows a data-presence indicator when at least one bound descendant contains data. |

``` json
{
  "schema":{
    "type":"object",
    "properties":{"alternatePhone":{"type":"string"}}
  },
  "uischema":{
    "type":"Group",
    "label":"Additional contact details",
    "options":{
      "collapsible":true,
      "collapsed":true,
      "showDataIndicator":true
    },
    "elements":[
      {"type":"Control","scope":"#/properties/alternatePhone"}
    ]
  }
}
```

Data presence is defined over descendant Controls' bound values, including
Controls nested in structural layouts. Resolve scopes in the current data
context, including the current item path when the Group occurs inside an
array. Unrelated form data does not count. False and zero count as data;
missing/null values, empty or whitespace-only strings, and recursively empty
arrays/objects do not. A container counts if any nested value counts.

Hidden descendant Controls participate in this check. The indicator means
only that data is present; it does not imply validity, completion, required-field
satisfaction, or unsaved changes. Provide a localized accessible label such
as "Contains data" rather than relying solely on the visual marker. Retain the
runtime name `showDataIndicator`; the editor should label this option
"Show data presence indicator". This editor label introduces no runtime alias.

Runtime expansion does not mutate UI schema. The renderer initializes expansion
from effective `options.collapsed` and synchronizes when that boolean changes,
regardless of whether it came from static configuration or dynamic resolution.
Header clicks may change local expansion between these updates. Unrelated
rerenders, or replacement UI elements with the same effective boolean, must not
reset the user's local expansion. A toggle can supply these updates:

``` json
{
  "schema": {
    "type": "object",
    "properties": {
      "hideDetails": { "type": "boolean" },
      "alternatePhone": { "type": "string" }
    }
  },
  "uischema": {
    "type": "VerticalLayout",
    "elements": [
      {
        "type": "Control",
        "scope": "#/properties/hideDetails",
        "label": "Hide additional details",
        "options": { "toggle": true }
      },
      {
        "type": "Group",
        "label": "Additional details",
        "options": { "collapsible": true, "collapsed": false },
        "$dynamic": {
          "options": { "collapsed": { "bind": "data.hideDetails" } }
        },
        "elements": [
          { "type": "Control", "scope": "#/properties/alternatePhone" }
        ]
      }
    ]
  }
}
```

`$dynamic` is one-way resolution, not a writable binding. Header clicks do not
write back to the source property. For example, after hideDetails becomes true,
the user may reopen the Group locally while hideDetails remains true. A later
change of the effective collapsed boolean synchronizes expansion again.
The header remains an accessible disclosure control with the current local
expanded state. No renderer-specific inspection of `$dynamic` is required.

Undefined resolution uses the ordinary static fallback; an absent effective
collapsed option defaults to false. A supplied nonboolean value, including null,
is invalid and produces a configuration diagnostic, without truthiness coercion.
Disabling dynamic resolution leaves ordinary static effective values, subject
to the same synchronization behavior.

Collapsible groups preserve field data and validation when closed.

The inspected Vuetify renderer's `bare` and `alignLeft` options are
renderer-specific presentation conventions, not additional portable Group
variants. Document their supported effects in that renderer's specification.

### Categorization

Categorization supports ordinary category navigation. Ordinary Categorization
selects tabs without a variant; the editor's "Tabs" entry emits this existing
encoding. The established `variant: "stepper"` convention selects stepper
presentation. `variant: "accordion"` is a project extension selecting vertically
stacked category disclosures with one category open at a time. Linear-wizard
workflow and validation-gated step transitions are deferred from v1, not
ordinary navigation.

| Option | Default and behavior | Origin |
| --- | --- | --- |
| `variant: "stepper"` | Selects stepper presentation rather than the renderer's default categorization presentation. | JSON Forms renderer convention, including official Material. |
| `variant: "accordion"` | Selects category disclosures with a single open category. | Project extension. |
| `showNavButtons` | False when absent; true shows Previous/Next actions for the stepper. | Existing Material, inspected Vuetify, and Svelte renderer convention. |
| `vertical` | False when absent (horizontal); true requests vertical category/step presentation. | Existing inspected Vuetify renderer convention, adopted for this model; support is family-specific. |
| `initial` | Optional direct Category name; fallback described below. | Project extension. |

Use `vertical` as the single Categorization orientation encoding. This does
not change orientation options on other element types.

``` json
{
  "type":"Categorization",
  "options":{"variant":"stepper","showNavButtons":true,"vertical":true},
  "elements":[
    {"type":"Category","label":"Contact","elements":[]},
    {"type":"Category","label":"Preferences","elements":[]}
  ]
}
```

Previous/Next actions operate on visible categories and stop at the first/last
visible category. Visibility rules must not leave navigation pointing at a
hidden or missing category. Hiding navigation buttons does not itself require
linear navigation or disable category-header navigation where supported.
Neither stepper presentation nor showNavButtons implies a requirement to
validate the current step before moving. These actions change runtime selection,
not form data or the UI schema.

`Categorization.options.initial` references a direct Category `name`.
Sibling names SHOULD be unique. Missing target falls back to
first visible category with diagnostic. Tabs/accordion/stepper require platform
accessibility patterns.

#### Container visibility and hidden children

**Origin:** existing JSON Forms element-level rule evaluation. A container's own
visibility follows its rule and the applicable rendering context; it is not
inferred from how many descendants are visible. A hidden ancestor suppresses
its subtree's presentation even if an individual descendant's rule would show it.

For example, this category applies a visibility rule only to its company control:

```json
{
  "type": "Category",
  "label": "Business details",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/company",
      "rule": {
        "effect": "SHOW",
        "condition": {
          "scope": "#/properties/isBusiness",
          "schema": { "const": true },
          "failWhenUndefined": true
        }
      }
    }
  ]
}
```

When isBusiness is false or missing, the company control is hidden, but the
category remains visible and may have empty content. To hide the entire category,
place the same rule on the Category element instead of its child. The category
requires no data scope of its own; its rule evaluates in the current rendering
context using the existing condition-scope convention.

Hidden immediate children consume no layout space or gaps, as specified by the
shared layout rules. A visible Group or Category may still retain its own heading,
container presentation, or navigation entry when all children are hidden. Do not
automatically hide such containers or introduce a hideWhenEmpty option. This also
preserves categorization for presentation elements without data-bound controls.

When the selected category becomes hidden, select an available visible category
according to the categorization navigation contract. If none remain visible,
there is no active category or stale active panel. This applies to tabs, stepper,
and accordion presentations; a visible but empty category remains eligible for
selection. Visibility and navigation changes preserve data and do not suspend
schema validation.

#### Accordion categorization

Suggested renderer name: `CategorizationAccordionRenderer`. Match
`type: "Categorization"` with direct Category children and
`options.variant: "accordion"`; give this explicit match precedence over the
generic Categorization renderer. Selection has no JSON Schema type requirement,
Control scope, or array binding. Categories are structural UI sections and can
contain unbound content or be used with an empty data object. Expandable array
item forms remain a separate, data-bound renderer.

``` json
{
  "schema": {},
  "uischema": {
    "type": "Categorization",
    "options": { "variant": "accordion", "initial": "overview" },
    "elements": [
      {
        "type": "Category",
        "name": "overview",
        "label": "Overview",
        "elements": [{ "type": "Label", "text": "General information" }]
      },
      {
        "type": "Category",
        "name": "help",
        "label": "Help",
        "elements": [{ "type": "Label", "text": "Further guidance" }]
      }
    ]
  }
}
```

Exactly one visible category is open whenever any categories are visible.
Initially open the visible category named by `options.initial`, otherwise the
first visible category; an unavailable named target produces a diagnostic.
Opening another category closes the previous one. Activating the already-open
header leaves it open; no multiple-open or all-closed mode is defined. If the
active category becomes hidden or is removed, open the first remaining visible
category; when none are visible, no panel is open. Preserve the selected
category's identity across reordering.

`initial` sets initial selection only. Expansion is runtime UI state and does
not modify data or UI schema. Closing a category preserves its data and
validation. Use accessible accordion headings and controls with expanded-state
and panel relationships, including keyboard activation. Accordion panels are
stacked vertically; the `vertical` orientation option and stepper-only
`showNavButtons` do not alter this presentation.

## 9. Internationalizable text

Use `textParams`, not action `params`.

``` json
{
  "type": "Label",
  "text": "Welcome, {firstName}",
  "i18n": "profile.welcome",
  "options": {
    "interpolate": true,
    "markup": "plain",
    "textParams": {"firstName":"there"}
  },
  "$dynamic": {
    "options": {
      "textParams": {
        "firstName": {"bind":"data.firstName"}
      }
    }
  }
}
```

interpolate defaults false; markup = plain\|markdown, default plain.

Static textParams and ICU formatting work even when
dynamicValues.enabled=false. Only `$dynamic` resolution is gated.

Visible text using i18n+interpolate uses ICU MessageFormat-compatible
behavior supplied by extended i18n. Pipeline: effective textParams →
translation/message → ICU formatting → safe markup rendering.

Required ICU functionality: simple args, plural, select, selectordinal,
#, apostrophe quoting, number/currency/date/time formatting. Hard
cross-platform conformance vectors cover
simple/plural/select/selectordinal/#/quoting. Exact localized
number/date/currency strings may depend on CLDR/platform data and use
platform-specific expected vectors.

ISO `YYYY-MM-DD` is a calendar date only when consumed by a date
formatter. ISO date-time with offset/Z is normalized only for date/time
formatting. ISO-looking strings used as simple `{x}` remain strings.

Missing simple param → empty text + diagnostic. Missing/invalid
formatter params → diagnostic and no unrelated fallback choice.

Interpolation for standard JSON Forms labels is advertised only when
renderer/integration can supply textParams without core hacks. Markdown
substitutions are escaped before parsing.

## 10. Markdown policy

Basic profile supports paragraphs/line breaks, bold, italic,
strikethrough, inline code, links, ordered/unordered lists.

Basic excludes raw HTML, images, media, iframes, tables, blockquotes,
headings, fenced code. An implementation MAY offer an extended profile
adding headings/blockquotes/tables/fenced code while retaining security
rules.

All Markdown output MUST be sanitized after parsing. Markdown link
targets MUST pass URL policy. Images and raw HTML are independently
gated; HTML remains sanitized even when enabled.

## 11. Dynamic values and path grammar

`$dynamic` recursively overlays static values. Leaf is exactly
`{ "bind": "..." }` or `{ "template": "..." }`, one key with string
value. Extra descriptor keys are invalid.

Only undefined means no override. null/false/0/empty string are real
overrides. Objects recursively overlay; arrays replace whole values.
Source UI schema is never mutated.

Resolution occurs before testers and covers nested children, array
detail/generated schemas, and all dispatch paths. Effective identity
SHOULD remain stable when values are unchanged.

The shared resolution layer supplies each renderer with its effective UI element
through normal reactive props/bindings and updates that element when resolved
values change. Renderers consume ordinary effective properties; they do not
inspect `$dynamic` descriptors or distinguish static values from resolved values.
The integration must update/rebind nested dispatches as well as top-level ones
without remounting unchanged renderer selections or discarding unrelated local
state. Re-evaluate testers against the effective element when relevant values
change. Binding resolution never implies write-back to its source.

Static denylist: type, scope, elements, rule, i18n, name, \$dynamic,
canonical options.variant.

Namespaces: data, item, locale, config, context. `item` is nearest
enclosing array-detail item, otherwise undefined. `context` is safe
host-exposed values, not arbitrary FormContext functions. config MUST
NOT expose `config.jsonformsExtended`.

Paths support dot and bracket notation:

``` text
data.customer.name
data.items.0.price
data.items[0].price
data.metadata['some key']
data.metadata["field.with.dots"]
context['help host']
locale
```

`.length` allowed for arrays/strings. Own-property lookup only.
**proto**, prototype, constructor forbidden. No calls/operators/method
invocation.

Template parser is quote-aware. `{{` emits literal `{`, `}}` literal
`}`; single `{` starts a placeholder ending at matching `}` outside
quoted bracket content. Invalid/unresolved placeholders make whole
template undefined. `{{data.firstName}}` is literal and SHOULD trigger a
dev warning as likely Mustache confusion.

`$dynamic.template` never invokes ICU/i18n. For translated text use
i18n+interpolate.

## 12. URL and extension security configuration

Recommended configuration:

``` json
{
  "restrict": true,
  "jsonformsExtended": {
    "layoutDefaults": {
      "gridColumns": 16,
      "gap": 0,
      "wrap": false
    },
    "dynamicValues": {
      "enabled": false,
      "namespaces": {
        "data": true,
        "item": true,
        "locale": true,
        "config": false,
        "context": false
      }
    },
    "security": {
      "allowScriptEvaluation": false,
      "urlPolicy": {
        "allowedSchemes": ["https", "http", "mailto"],
        "allowRelative": true,
        "allowImageDataUrls": false
      }
    },
    "markup": {
      "markdown": {
        "enabled": true,
        "profile": "basic",
        "allowImages": false,
        "allowHtml": false
      }
    }
  }
}
```

Use the existing `restrict` option for preventive UI constraints. Resolve it
from per-element `options.restrict`, then global `config.restrict`, then this
model's preferred default of true. This default is a target profile, not a
claim about existing JSON Forms defaults. The option is not duplicated under
`jsonformsExtended` and is unrelated to Ajv's strict-mode configuration.
No separate renderer `strict` option is introduced.

Defaults when extension config is absent: -
config.restrict=true (unless explicitly false) - dynamicValues.enabled=false - allowScriptEvaluation=false - allowed
schemes https/http/mailto - allowRelative=true -
allowImageDataUrls=false - Markdown enabled, basic profile,
images=false, HTML=false - gridColumns=16, gap=0, wrap=false

URL-bearing v1 targets: Link.href, ImageView.src (including scope-resolved sources), Markdown links/images.

For URL templates, data/item/locale substitutions use
encodeURIComponent-equivalent encoding. Allowed config/context
substitutions are host-provided URL components. Final URL MUST pass
policy.

Image data URLs may be enabled for File→Image preview. Only image MIME
types are accepted; SVG data URLs are blocked by default unless host
explicitly opts into a stricter SVG-safe policy.

## 13. ImageView, Separator and Link

``` ts
interface ImageViewElement extends BaseUISchemaElement, Internationalizable {
  type: 'ImageView';
  src?: string;
  scope?: string;
  alt: string;
}

interface SeparatorElement extends BaseUISchemaElement {
  type: 'Separator';
  options?: BaseUISchemaElement['options'] & {
    vertical?: boolean;
  };
}

interface LinkElement extends BaseUISchemaElement, Internationalizable {
  type: 'Link';
  label?: string;
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
}
```

These are reference TypeScript representations.

**ImageView origin:** project extension. Suggested renderer name:
`ImageViewRenderer`. Match `type: "ImageView"`; a direct source imposes no JSON
Schema type requirement. This is a display-only element, not an editable Control.

`src`, `scope`, and required string `alt` are top-level fields. At least one of
src or scope must be supplied; both may coexist. If effective src is defined,
use it, including an empty string which intentionally displays no image.
Otherwise resolve scope against the current schema/data context using Control
scope semantics, including the current array-item path. The scoped schema must
permit strings. Empty or missing source data displays no image; supplied
non-string values produce a diagnostic rather than being coerced to URLs.
An invalid defined src does not silently fall through to scope.
`alt: ""` explicitly denotes a decorative image.

The ordinary shared dynamic layer can override top-level src or alt; scope
remains static under the common denylist. Undefined resolution retains a static
src fallback, if supplied; otherwise the renderer uses scope. Apply the same URL
policy to direct, dynamically resolved, and scope-bound sources. No special
source precedence depends on how the effective property was produced.

``` json
{
  "schema": {
    "type": "object",
    "properties": { "photo": { "type": "string" } }
  },
  "uischema": {
    "type": "ImageView",
    "scope": "#/properties/photo",
    "alt": "Profile photo",
    "$dynamic": { "src": { "bind": "context.photoOverride" } }
  }
}
```

Here a defined effective src overrides the scoped photo; an undefined dynamic
result leaves scope as the source. A static image instead uses
`{"type":"ImageView","src":"/images/logo.png","alt":"Company"}`.
The editor may name this entry "Image" while emitting ImageView.

**Separator origin:** project extension. Suggested renderer name:
`SeparatorRenderer`. Match `type: "Separator"`; no JSON Schema type or scope
is required. This display-only element visually separates sections without
reading or modifying form data.

`options.vertical` defaults to false (horizontal); true requests a vertical
separator. This is the single orientation encoding for Separator, following the
shared project convention; it is not a universal JSON Forms core option. Parent layout sizing determines the available extent; a vertical
separator requires usable height from its layout context. This is a static
separator, with no dragging, resizing, or keyboard interaction. Use appropriate
separator semantics and expose orientation when applicable. Visibility follows
the common element visibility contract.

``` json
{
  "schema": {},
  "uischema": {
    "type": "Separator",
    "options": { "vertical": true }
  }
}
```

For the default horizontal presentation, use `{"type":"Separator"}`.
An editor may label the entry "Divider" while emitting the Separator type;
that label does not introduce a runtime alias.

Link href is static fallback. Empty href is allowed and renders
non-navigating/plain semantics rather than inventing a destination.
target=\_blank MUST enforce noopener and SHOULD add noreferrer according
to host policy.

### Template, Slot, and technology-specific TemplateLayout

**Origin:** project extensions. Template and Slot compose UI-schema elements
structurally; TemplateLayout hosts a technology-specific template language. They
are distinct from the restricted $dynamic.template interpolation grammar.

| Suggested renderer | Selection and purpose |
| --- | --- |
| TemplateRenderer | type Template; resolve a reusable named UI schema from uischemas. No particular data-schema type is required. |
| SlotRenderer | type Slot; dispatch supplied named content or a fallback in the current template context. |
| TemplateLayoutRenderer | type TemplateLayout plus supported lang; render a template string and delegate embedded UI-schema children. |

**Template registry lookup.** Top-level name is required. Find the first registry
entry whose uischema.name equals that name. This is name lookup, not ranked tester
selection; testers are not evaluated for this lookup. Duplicate names should be
avoided and diagnosed; the existing first-match behavior is deterministic. Missing
templates render no substituted content and should produce a diagnostic.

Template.elements supplies named slot contents. Merge these over inherited slot
contents, with local names taking precedence. Named reuse preserves the caller's
schema and data path; it does not create a new data object. Guard recursive named
references against unbounded expansion. The same registry also serves ordinary
ranked detail selection, combinator branches, and mixed-type forms; these lookup
modes must not be conflated.

For example, an application can register this structural template:

``` ts
const uischemas = [{
  tester: () => NOT_APPLICABLE,
  uischema: {
    type: 'Group',
    name: 'contactSection',
    label: 'Contact',
    elements: [{
      type: 'Slot',
      name: 'body',
      elements: [{ type: 'Label', text: 'No content supplied' }]
    }]
  }
}];
```

NOT_APPLICABLE is the core tester constant. Returning it excludes the entry from
ordinary ranked lookup, while named Template lookup still finds it. Registry
adapters currently require testers; named lookup itself needs no executable tester
logic. A non-JavaScript integration can represent this nonmatching tester through
its own registration API, without executing JavaScript.

Invoke the template using:

``` json
{
  "type": "Template",
  "name": "contactSection",
  "elements": [
    { "type": "Control", "name": "body", "scope": "#/properties/email" }
  ]
}
```

**Slot resolution.** Slot.name selects a supplied entry from the enclosing
slot-content context, not directly from uischemas. If absent/unresolved, render
the first Slot.elements child as fallback; if there is none, render nothing.
Use a layout as that child when multiple fallback elements are needed. Additional
fallback siblings are not implicitly rendered. Supplied/fallback content retains
normal rules, effective dynamic options, renderer selection, and the caller's
schema/path. Structural Template and Slot can be implemented across web/native
platforms without interpreting markup.

**TemplateLayout fields and profiles.** template is the required source string;
elements contains child UI-schema elements; optional top-level lang selects the
engine. Resolve the language from explicit lang, then config.defaultTemplateLang,
then ractive for the default web profile. Keep that existing config name. Unknown
or unsupported languages must be diagnosed rather than interpreted as another
engine. This does not require a native implementation to provide a web engine.

| Profile | Scope |
| --- | --- |
| lang ractive | Shared web profile based on Ractive template syntax and DOM rendering. Available independently of whether the surrounding renderer family uses Svelte or Vue. |
| lang vue | Vue-specific web profile using Vue template syntax and the host's registered components. Requires a compatible Vue renderer/runtime; not portable across all web renderer sets. |
| Native/other profiles | Require a separately declared engine and contract. Ractive/Vue strings are not directly portable to Kotlin or other native renderers. Preserve unsupported documents and report unsupported capability. |

The Ractive web profile exposes data (whole-form data), errors (core schema
errors), context (extended FormContext), elements, and translate to the template.
These are template-engine bindings, not new core condition.validate fields.
context may expose additionalErrors and application capabilities; errors alone
must not be described as combined validity. Live data/error/context changes must
refresh the supported bindings without stale slot editors.

For Ractive, each named child is available as a partial that mounts its delegated
renderer. Unnamed children receive their decimal index as a fallback name; explicit
names are recommended for stable authoring. Example:

``` json
{
  "type": "TemplateLayout",
  "lang": "ractive",
  "template": "<section><h2>Contact details</h2>{{>body}}</section>",
  "elements": [
    { "type": "Control", "name": "body", "scope": "#/properties/email" }
  ]
}
```

The Vue profile uses its template compiler and slot syntax for child insertion,
for example <slot name="body"></slot>, rather than Ractive partial syntax. A
registered structural Template may resolve to a TemplateLayout; its portability
then depends on that layout's language and template dependencies.

TemplateLayout delegates children at the original schema/data path and preserves
normal validation, rules, enabled/readonly behavior, and dynamic resolution.
Mount/unmount slot content cleanly as template structure changes, retain correct
ownership for repeated placeholders, and release engine resources on disposal.
Report template compilation/rendering errors accessibly. Template-local UI state
must not inadvertently become form data.

Markup/executable template profiles are runtime escape hatches, not the sanitized
Markdown profile or a security sandbox. Follow the host's trust/CSP policy and the
existing script-evaluation permission where JavaScript string compilation or
execution is involved. Do not silently treat enabling $dynamic as permission to
execute templates. Profiles must document expression, event, raw-HTML, and data-
write capabilities; engine two-way binding must not bypass readonly/restrict or
normal form change dispatch. Structural Template/Slot composition alone does not
require executable-string permission.

## 14. Button, actions and script

``` ts
type ButtonSemanticColor =
  | 'primary' | 'secondary' | 'alternative'
  | 'success' | 'warning' | 'error';

type Script = string; // async function body

interface ButtonElement extends BaseUISchemaElement, Internationalizable {
  type: 'Button';
  label?: string;
  icon?: string;
  color?: ButtonSemanticColor;
  params?: Record<string, unknown>;
  action?: string;
  script?: Script;
}
```

These are TypeScript/web reference types, not cross-platform type
requirements.

action and script are mutually exclusive. Button invokes commands; Link performs
navigation through href. A renderer may offer link-like Button appearance through
its documented styling options, while preserving button semantics, keyboard
activation, disabled behavior, and pending-action handling. No portable Button
variant is defined for that appearance. An editor may expose the styling only
when the selected renderer advertises support; it must not turn an action into
navigation merely to obtain a visual treatment.

### Action path

Button action renderers call `FormContext.fireActionEvent` and await it.
They do not call the Web Component handler directly. The existing web
integration may construct ActionEvent, invoke
handleAction/onhandleaction, require the host to set `source.callback`
to signal handled status, then await that callback.

Pending/loading covers the complete fireActionEvent promise. Duplicate
activation SHOULD be prevented while pending. Rejection clears pending
and propagates through existing application/platform error handling.

### Script path

**Origin:** project extension. Script executes directly rather than through
fireActionEvent.

`script` is a string containing an **async function body**, with top-level await
supported. Invoke it with the ActionEvent as `this`, equivalent to
`await new AsyncFunction(script).call(source)`. The context includes `this.context`,
`this.params`, `this.$el`, and `this.element`. No positional event argument or
wrapper function expression is required. For example:

``` json
{
  "type": "Button",
  "label": "Inspect",
  "script": "console.log(this.context.data);"
}
```

Await completion using the same pending/loading and duplicate-activation rules
as actions; rejection clears pending and follows application error handling.
Direct function-valued scripts are not part of this Button contract. Named
action remains the alternative for dispatching a command to the host.

String evaluation requires
`jsonformsExtended.security.allowScriptEvaluation=true`.

Enabling string evaluation means the host treats the UI schema as
trusted executable code. Web CSP may prohibit runtime evaluation unless
unsafe-eval/equivalent is permitted; the renderer MUST NOT weaken CSP
and MUST report unsupported/evaluation-disabled behavior instead.

Other platforms may define another script representation or
ignore/preserve unsupported script. Script is a last-resort,
non-portable runtime escape hatch.

Some JSON Forms/extension APIs accept function values. An in-memory
JS/TS UI model can carry them directly while JSON serialization cannot.
Platform infrastructure MAY adapt such function-valued extension points
to/from strings, subject to the same trusted-code concerns. That
adaptation is outside this portable v1 model.

### Shared destructive-change confirmation

**Origin:** project extension. Confirmation is separate from mutation permission
and validation. It never bypasses restrict, readonly, disabled state, or schema
constraints. Ordinary typing, navigation, adding a new value, and selecting the
already selected type/branch do not prompt through this policy. Picker OK/Cancel
staging is a separate interaction contract.

Global JSON Forms config supplies confirmation policy under the project-owned
`jsonformsExtended` namespace to avoid collisions with other implementations:

``` json
{
  "jsonformsExtended": {
    "confirmation": {
      "default": "always",
      "renderers": {
        "mixed": { "typeChange": "complex" }
      }
    }
  }
}
```

Per-element UI schema may override individual operations:

``` json
{
  "type": "Control",
  "scope": "#",
  "options": {
    "confirmation": { "typeChange": "never", "delete": "always" }
  }
}
```

| Policy | Behavior |
| --- | --- |
| `always` | Confirm covered destructive actions against existing values. No prompt when there is no value to discard. False, zero, empty strings, and empty containers are existing values. |
| `never` | Perform the otherwise-permitted action without a confirmation prompt. |
| `complex` | Confirm when the value being discarded is a nonempty object or array; simple values and empty containers do not prompt. Inspect the old value, not the destination type. |

Covered operations are typeChange (mixed-type selection), branchChange (oneOf
selection), and delete (removing a property/item/subtree). Clearing a mixed type
selection follows typeChange; clearing a oneOf selection follows branchChange.
Ordinary input clearing follows the shared clear-value contract and does not
become a confirmation on every edit. For batches, one confirmation covers the
operation; complex applies if any discarded value qualifies. Evaluate the data
actually discarded, excluding enclosing properties preserved during a branch
change. A nonempty object has at least one own key; a nonempty array has at least
one item, independently of whether its nested values are empty.

Resolve policy in this order:

1. Element options.confirmation[operation].
2. Config jsonformsExtended.confirmation.renderers[catalogId][operation].
3. Config jsonformsExtended.confirmation.default.
4. Documented fallback: mixed/typeChange uses complex; other covered operations
   use always.

Catalog IDs are stable semantic identifiers, not library component names:
`mixed`, `oneOf`, `arrayTable`, `arrayLayout`, `listWithDetail`, `agGrid`, and
`additionalProperties`. For delete/rename controls hosted inside another renderer,
use the owner of the action: dynamic-property Delete uses additionalProperties;
tree Delete in the mixed workspace uses mixed. Unsupported operation entries do
not introduce new actions. The default configuration example deliberately opts
into always globally while restoring complex for mixed type changes; without
that exception a global always also applies to mixed type changes.

Cancellation leaves committed data, selection, and expansion unchanged.
Confirmation performs the operation once, after rechecking mutation guards and
its target. Do not apply a stale confirmation to an unrelated replacement item.
Use localized action-specific dialog text and accessible focus handling.
The runtime resolves configuration into a shared policy; individual UI libraries
do not define different meanings for these values.

## 15. Readonly, restrict and mutation constraints

### Read-only sources and existing precedence

| Source | Spelling and role |
| --- | --- |
| JsonForms component property | `readonly: true` establishes form-wide read-only state; element settings cannot override it. |
| JSON Forms config | `readonly` or `readOnly` supplies a default, subject to core precedence. It is not an unconditional form-wide lock. |
| UI-schema options | Prefer `options.readonly` for authoring; accept `options.readOnly` as an existing compatibility spelling. This requests read-only behavior independently of schema annotation. |
| JSON Schema | `readOnly` is the standard spelling. Lowercase readonly is not the schema keyword. |

JSON Schema readOnly is an annotation indicating that applications should not
modify the value. Standard schema validation does not compare previous and new
values or enforce immutability merely because the annotation is present. The
rendering/application integration enforces editing restrictions. See
[JSON Schema annotations](https://json-schema.org/understanding-json-schema/reference/annotations)
and [JSON Forms read-only documentation](https://jsonforms.io/docs/readonly/).

Preserve existing core precedence rather than treating config true as a new
unconditional lock. In the inspected core read-only resolver, form-wide readonly
true wins first, followed by applicable read-only rules, explicit UI options,
explicit config values, schema readOnly true, and inherited renderer readonly.
Within UI options or config, lowercase readonly is checked before readOnly.
An explicit false at an earlier level can override a later source, including
schema or inherited annotations; it cannot override form-wide readonly true.
Avoid authoring both spellings together. Version-specific rule and enablement
handling must follow the selected core integration; do not infer precedence from
how a widget visually represents read-only state.

The existing separateReadonlyFromDisabled config option distinguishes effective
read-only state from enabled state. With the compatibility default false,
read-only sources participate in disabling controls. With true, the integration
and renderer must honor read-only separately from enabled, including guarding
mutations; setting it alone does not prove every renderer supports inspection
without disabling. Do not conflate a disabled widget with a different precedence
for read-only sources.

Form-wide read-only settings in a host/demo should update the JsonForms readonly
property. They need not rewrite config, individual UI options, or schema
annotations. Config readonly/readOnly retains its existing default-setting role.

### UI-schema rules and effective state

**Origin:** JSON Forms rule syntax and shared core evaluation. Renderer sets
consume the resulting state rather than independently implementing condition
semantics. READONLY/WRITABLE require a core integration supporting those effects.

| Effect | Condition matches | Condition does not match |
| --- | --- | --- |
| `SHOW` | Visible | Hidden |
| `HIDE` | Hidden | Visible |
| `ENABLE` | Enabled | Disabled |
| `DISABLE` | Disabled | Enabled |
| `READONLY` | Read-only | Writable |
| `WRITABLE` | Writable | Read-only |

The table describes each rule's state decision, subject to applicable form-wide
state and the core's source precedence. In particular, READONLY/WRITABLE are
two-way decisions, not conditional additions to an underlying readonly value.
They take precedence over element/config/schema read-only settings; component
readonly true still wins. An enabled state does not grant permission to mutate
a separately read-only value. Read-only and enablement remain distinct when the
integration supports separate state.

``` json
{
  "type": "Control",
  "scope": "#/properties/notes",
  "rule": {
    "effect": "READONLY",
    "condition": {
      "scope": "#/properties/locked",
      "schema": { "const": true },
      "failWhenUndefined": true
    }
  }
}
```

Here notes is read-only when locked is true, and writable otherwise unless the
form-wide readonly property is true. failWhenUndefined true makes an unresolved
condition value fail explicitly. Without that flag, the condition schema is
validated against the resolved value, including undefined; do not assume missing
data necessarily makes every schema condition false. Use the existing condition
scope/data-path rules, including the current nested rendering context.

Schema-based conditions evaluate data, not the collected additionalErrors or
pending editor validation state. A valid-form command guard must use the combined
validity integration described elsewhere rather than assuming an ordinary rule
observes those errors. Hiding an element preserves its data and does not remove
its schema constraints or exempt it from validation. Rule evaluation does not
mutate either data or the authored UI schema.

#### Conditional validation versus conditional presentation

**Origin:** JSON Schema conditional validation and existing JSON Forms UI rules
are separate mechanisms. A schema condition does not itself define a SHOW/HIDE
rule. Do not infer automatic conditional layouts from validator support for
if/then/else or dependency keywords.

For example, the form schema can make email required when contactByEmail is true:

```json
{
  "type": "object",
  "properties": {
    "contactByEmail": { "type": "boolean" },
    "email": { "type": "string", "minLength": 1 }
  },
  "if": {
    "properties": { "contactByEmail": { "const": true } },
    "required": ["contactByEmail"]
  },
  "then": {
    "required": ["email"]
  }
}
```

An explicit UI rule separately controls the email input's visibility:

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/contactByEmail"
    },
    {
      "type": "Control",
      "scope": "#/properties/email",
      "rule": {
        "effect": "SHOW",
        "condition": {
          "scope": "#/properties/contactByEmail",
          "schema": { "const": true },
          "failWhenUndefined": true
        }
      }
    }
  ]
}
```

At the form root, contactByEmail true shows the email control and activates the
schema's required constraint. False or missing hides the control and does not
activate that required constraint. The rule does not create, clear, or transform
email. Existing email values remain subject to their property schema: for
example, {"contactByEmail":false,"email":""} still fails minLength even though
the control is hidden. Hiding is not a validation exemption. Applications must
coordinate schema constraints and presentation so users can resolve errors;
do not silently remove hidden values to achieve validity.

Without the explicit UI rule, conditional required validation alone does not
request that the control be hidden. Automatic UI generation and schema lookup
must not be advertised as a complete conditional-form presentation mechanism.
Properties declared only inside conditional branches require documented renderer
or generation support, or an explicitly authored UI schema with supported scope
resolution. Validator acceptance of those schemas alone does not establish that
an editor will be generated. This distinction introduces no new UI-model option
and does not change the established combinator renderer contracts.

#### Property dependencies: presence, validation, and clearing

**Origin:** JSON Schema dependency keywords define validation. The error-placement
and data-preservation requirements below are the project presentation contract;
they do not imply automatic conditional layouts or introduce UI-schema options.

In draft-07, an array-valued dependencies entry requires other properties when
its triggering property is present:

```json
{
  "type": "object",
  "properties": {
    "purchaseOrder": { "type": "string" },
    "billingAddress": { "type": "string" }
  },
  "dependencies": {
    "purchaseOrder": ["billingAddress"]
  }
}
```

With draft 2019-09 or later, express the same dependency as
`"dependentRequired": { "purchaseOrder": ["billingAddress"] }`, using a validator
configured for that dialect. Dependency activation tests property presence,
not truthiness or whether a string is nonempty. Dependencies are directional:
billingAddress alone does not require purchaseOrder in this example.

| Data | Result for this schema |
| --- | --- |
| `{}` | Valid; the dependency is inactive. |
| `{"purchaseOrder":"PO-123"}` | Invalid; billingAddress is missing. |
| `{"purchaseOrder":""}` | Invalid; the empty string still occupies the triggering property. |
| `{"purchaseOrder":"","billingAddress":""}` | Valid; both properties exist and neither string has a minimum-length constraint. |
| `{"billingAddress":"Main Street"}` | Valid; the dependency is inactive and the address is preserved. |

Dependencies do not automatically create, show, hide, or delete controls. Use
the ordinary property editors and explicit UI rules where conditional visibility
is wanted. Missing-dependent-property errors SHOULD appear beside the affected
control when it exists; provide discoverable object-level feedback when no such
control is rendered. Apply the shared validation-display rules and retain error
feedback for hidden or otherwise unavailable fields.

Removing the triggering property deactivates that dependency but must not remove
dependent properties or their values. Clearing follows the existing context's
semantics: if an ordinary control unsets purchaseOrder, its dependency becomes
inactive. If a dynamic additional-property string editor clears it to an empty
string while retaining the key, the dependency remains active. Only its explicit
property Delete action removes that key, subject to the shared deletion rules.

A schema-valued draft-07 dependencies entry, or dependentSchemas in newer drafts,
applies an additional schema to the whole containing object when the triggering
property is present. It does not apply only to the triggering property's value,
merge schemas by overwriting constraints, or inherently request another form.
The complete original schema remains authoritative for validation.

See the [JSON Schema conditional-validation reference](https://json-schema.org/understanding-json-schema/reference/conditionals)
for dependency semantics and dialect differences.

#### Rule data scopes and current-form schema references

Ordinary JSON Forms conditions resolve scope in the current rendering context.
At the form root, scope # selects the entire form value. Within an array item's
detail form it selects that item; #/properties/locked selects the item's locked
property, not the root form's locked property. The inspected core also treats
#/ as the current context. Condition scopes are combined with the supplied data
path, not appended to the target Control's own property value.

For example, consider:

``` json
{
  "locked": true,
  "contacts": [
    { "name": "Alex", "locked": false, "notes": "Call in the morning" },
    { "name": "Sam", "locked": true, "notes": "Email only" }
  ]
}
```

A root-level condition with scope #/properties/locked evaluates true. The same
condition on notes inside each contact detail evaluates that contact's locked
value: false for Alex, true for Sam. A READONLY rule therefore permits editing
Alex's notes and prevents editing Sam's, absent a form-wide override:

``` json
{
  "type": "Control",
  "scope": "#/properties/contacts",
  "options": {
    "detail": {
      "type": "VerticalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/name" },
        {
          "type": "Control",
          "scope": "#/properties/notes",
          "rule": {
            "effect": "READONLY",
            "condition": {
              "scope": "#/properties/locked",
              "schema": { "const": true },
              "failWhenUndefined": true
            }
          }
        }
      ]
    }
  }
}
```

To validate the whole current item instead, use scope # with a condition schema
such as {"type":"object","properties":{"locked":{"const":true}},
"required":["locked"]}. Required prevents an absent locked property from
satisfying the properties constraint by omission. Reordering items must update
context paths so rules continue to evaluate the correct data.

This scope grammar is distinct from $dynamic paths: data.locked explicitly reads
the whole form's flag, while item.locked reads the nearest array item's flag.
Using $dynamic.options.readonly supplies an effective option, still subject to
read-only precedence; it does not redefine rule scope or override a read-only rule.

**Current-form schema reference — project extension.** The integration makes the
current form schema available to rule validation under the reference /#.
This uses standard JSON Schema $ref with an integration-provided schema resource
identified by /. It avoids duplicating the form schema in each condition:

``` json
{
  "type": "Button",
  "label": "Submit",
  "action": "submit",
  "rule": {
    "effect": "ENABLE",
    "condition": {
      "scope": "#/",
      "schema": { "$ref": "/#" },
      "failWhenUndefined": true
    }
  }
}
```

Placed at the form root, this enables Submit when the form data validates against
the current form schema. Scope selects the data; $ref selects the validation
schema. Inside an item detail, the same scope selects the item even when $ref
references the entire form schema. Do not mistake /# for a root-data escape.

Register/update the schema reference when the schema or validator changes,
preserving original reference bases, IDs, and internal/external reference
resolution. Ensure the alias belongs to the current form: forms sharing a
validator must not replace one another's schema registration. Use isolated
validation contexts or equivalent integration-managed resolution as needed.
Unresolved references must produce a diagnostic, not imply valid data.

This condition checks schema validity only. Host additionalErrors, published
editor diagnostics, and pending validation do not automatically participate.
Use the separate combined-validity integration when a command must also wait for
or reject those states. The /# alias is an extension guarantee, not something
ordinary JSON Forms rule evaluation provides without schema registration.

#### Reusable schema fragments and function conditions

Use schema-based conditions for the portable rule representation. In addition
to the current-form root reference /#, reference a fragment without copying its
schema definition into the rule:

``` json
{
  "effect": "ENABLE",
  "condition": {
    "scope": "#/properties/address",
    "schema": { "$ref": "/#/properties/address" },
    "failWhenUndefined": true
  }
}
```

A shared definition can instead be referenced as
`{"$ref":"/#/$defs/address"}` (or the schema dialect's definitions location).
The data scope and schema fragment must describe the intended validation target.
Reference reuse avoids schema duplication and may reuse compilation; it does not
inherently reuse the form's previous validation result. Validating a fragment
alone also does not test constraints on that value defined elsewhere in the
whole form schema. Do not introduce a new VALIDATION condition type: portable
conditions retain existing JSON Forms syntax and evaluation.

The supported JavaScript/TypeScript core integration also accepts a synchronous
condition.validate function returning a boolean. Its context contains data
(scoped value), fullData, path, uischemaElement, and config. It does not supply
errors, additionalErrors, or pending validation directly. Config access is part
of the inspected core callback contract, not an additional project-only context
field. Keep the current callback context aligned with core. This runtime capability
is not a portable executable representation for Kotlin or other platforms.

A future integration adapter may expose a read-only validation-state snapshot
without modifying core, using the existing function-adaptation mechanism. Such
an extension would need explicit semantics for errors, additional errors,
pending/current state, and reevaluation when validation changes independently of
data. This is a future design possibility, not a currently supported context field
or required implementation. No new validation-state injection is defined here.
For now, use portable schema-reference conditions or application-owned TypeScript
callbacks as described below.

A host can use a closure to read already-computed validation state, avoiding a
second schema validation. For example, in application-owned TypeScript:

``` ts
import { RuleEffect, type Rule } from '@jsonforms/core';

type ValidationSnapshot = {
  current: boolean;
  pending: boolean;
  errors: readonly unknown[];
  additionalErrors: readonly unknown[];
};

function submitRule(
  getValidation: () => ValidationSnapshot | undefined
): Rule {
  return {
    effect: RuleEffect.ENABLE,
    condition: {
      scope: '#',
      validate: () => {
        const state = getValidation();
        return state !== undefined && state.current && !state.pending &&
          state.errors.length === 0 && state.additionalErrors.length === 0;
      }
    }
  };
}
```

Attach the returned rule to the Button. ValidationSnapshot/getValidation are
host-owned application interfaces in this example, not new core context fields
or serialized UI-schema options. additionalErrors must include the host's and
participating renderers' published errors. Pending/current must reflect the latest
data and validation configuration; unavailable or stale results must not count
as valid. The host must arrange rule reevaluation when this state changes, even
without a data edit. Reading a closure alone does not establish that subscription.
The same requirement applies if a host exposes validation state through config.

A function supplied directly by trusted application code needs no string
compilation. JSON cannot carry that function. Where the JavaScript integration
supports serialized condition.validate strings, the string is a complete function
expression accepting context, not the async body syntax of Button.script:

``` json
{
  "effect": "ENABLE",
  "condition": {
    "scope": "#",
    "validate": "(context) => context.data !== undefined"
  }
}
```

This serialized extension requires
jsonformsExtended.security.allowScriptEvaluation true before compilation or
execution and must respect the existing CSP/security contract. No executable
string is portable merely because it is stored in JSON. Disabled/unsupported
execution must be diagnosed and must not be silently treated as a satisfied
condition or dropped to leave a guarded action enabled. The integration must
handle the affected action conservatively for either rule polarity. The callback
must return a boolean synchronously; promises are not valid condition results.

### Validator profile and default assignment

The web reference integration uses Ajv with the following selected defaults.
These are **Ajv-specific validator construction options**, not UI-schema fields,
JSON Schema keywords, or jsonforms.config properties, and their names are not a
cross-validator API.

| Ajv option | Default | Intended capability |
| --- | --- | --- |
| `allErrors` | true | Collect multiple validation failures rather than stopping at the first. |
| `verbose` | true | Provide richer error metadata for mapping and presentation. |
| `strict` | false | Disable Ajv's strict schema checks; this does not disable instance validation and is unrelated to UI restrict. |
| `addUsedSchema` | false | Avoid automatic registration of schemas supplied to compile/validate; explicit registration remains available. |
| `useDefaults` | true | Assign supported schema defaults to missing properties/items during validation. |
| `$data` | true | Enable supported data-dependent keyword values using Ajv's $data reference extension. |
| `discriminator` | true | Enable Ajv's supported discriminator handling for tagged oneOf schemas. |

The first four settings come from the core validator factory; the extended
profile enables the last three. The profile also registers formats through
ajv-formats and extended formats/keywords and error localization/customization.
Those plugins and project keywords are capabilities, not additional core JSON
Schema guarantees. A host-supplied validator must have its capabilities documented
rather than being assumed to inherit the default factory's setup.

Each UI technology should select a validator offering comparable capabilities
where possible and enable equivalent defaults. Where an engine uses different
APIs, reproduce the observable behavior rather than copying Ajv option names.
Declare unsupported formats, keywords, default assignment, data references, or
discriminator behavior explicitly. A platform need not execute JavaScript to
provide equivalent validation. Compatibility tests should exercise the selected
schema dialect and supported extensions; permissive handling must not silently
claim validation of unsupported constraints.

Distinguish three default mechanisms:

- Renderer display fallbacks, such as a provisional slider thumb position, do
  not themselves write data.
- Explicit Add or permitted type/branch changes initialize values through the
  schema/default-generation mechanism.
- Validator default assignment may change missing properties during validation,
  independently of renderer initialization.

For example, validating {} against
{"type":"object","properties":{"name":{"type":"string","default":"Anonymous"}}}
with useDefaults true can insert name: "Anonymous". Clearing that property to
undefined may therefore cause subsequent validation to restore it. The renderer
must not independently reapply the default during clearing, but permanent absence
cannot be promised when the configured validator assigns defaults. Under this
profile an empty string is not missing; Ajv's separate useDefaults: "empty"
behavior is not enabled. Dynamic string properties cleared to "" retain that
value and key under ordinary default assignment.

Default assignment is nonstandard validator behavior; JSON Schema default alone
does not mandate data mutation. Ajv cannot replace the root argument directly,
and default assignment has supported-location limitations, including combinator
contexts. Do not promise that every default in every schema is applied. See
[Ajv data modification and defaults](https://ajv.js.org/guide/modifying-data.html).

Rule evaluation must leave live form data unchanged even when the form's ordinary
validation profile assigns defaults or uses other mutating keywords. Use a
nonmutating rule-validation profile or validate an isolated value as appropriate,
with matching schema-reference/format support. This includes /# schema-reference
conditions. Clearly distinguish validation of the supplied value from validation
of a normalized copy if normalization is retained. Prevent hidden mutations caused
merely by rendering or evaluating a button condition. Validator-driven mutations
in the ordinary form pipeline must be reflected consistently in form state and
change notifications.

### Optional validator-specific schema extensions

**Origin:** ajv-keywords and project extensions registered by the extended web
validator integration. These capabilities are outside the portable renderer
contract. Registration enables their use; a schema must opt in to the relevant
keyword. Other validators/platforms must declare which equivalents they support.

| Feature | Location | Effect |
| --- | --- | --- |
| `useDefaults: true` | Validator construction | Enables supported default assignment; it is not a schema keyword. |
| `transform` | Schema extension keyword | Applies ordered string transformations that can modify stored values during validation. |
| `dynamicDefaults` | Schema extension keyword | Supplies computed defaults using registered providers. |

For example, this schema requests normalization of a nested string:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "transform": ["trim", "toUpperCase"]
    }
  }
}
```

With the registered transform implementation, validating
`{"name":" Alice "}` can change the value to `{"name":"ALICE"}`.
This is a data transformation, not presentation formatting or a renderer action.
The `trim` transformation is unrelated to the excluded renderer sizing option
of the same name. The web integration also supplies project transformations
such as capitalize and startCase; their registration does not make them standard
JSON Schema behavior.

Computed defaults are likewise validator behavior, separate from generic
UI-element overrides through $dynamic. Provider availability, evaluation timing,
arguments, and environment dependencies belong to the validator integration's
capability documentation. Do not assume a provider computes a fresh value for
every initialization unless its documented semantics guarantee that behavior.
Browser URL access and JavaScript execution are not required of native ports.

Where a provider compiles or executes a supplied JavaScript string, the existing
jsonformsExtended.security.allowScriptEvaluation policy applies before compilation
and execution. Enabling a validator keyword must not bypass that policy. Other
platforms may offer native providers without supporting JavaScript strings.

The data-mutation and rule-isolation requirements above also apply to these
keywords. Their use must not silently mutate live data during rule evaluation.

### Error-message customization and translation

**Origin:** JSON Forms core supplies control error translation and aggregation.
The extended web validator integration additionally supports ajv-errors and
validator-message localization. Keep these mechanisms distinct: changing error
text does not remove errors, alter validation results, or make the form valid.

For example, a control can supply an explicit translation prefix:

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "i18n": "profile.name"
}
```

The existing default core pipeline uses the following precedence when the
control has errors:

1. `profile.name.error.custom`, if resolved, replaces the combined error text
   for that control. Its translation context includes schema, uischema, path,
   and the matching errors.
2. Otherwise, each error is translated separately. For a minLength error, try
   `profile.name.error.minLength`, then `error.minLength`.
3. If neither resolves, try translating the error's message itself, then use
   the fallback message. Core also simplifies its recognized default English
   required-property message for presentation beside the affected control.
4. Combine the resulting per-error messages using the core presentation helper.

The keyword minLength is illustrative; the same lookup applies to other error
keywords. The UI-schema i18n prefix takes precedence over schema i18n metadata;
without either, core derives a prefix from the data path, omitting array indices
and using root for the empty path. A host-supplied translateError callback can
replace the default per-error translation behavior. Missing translation lookups
must preserve the undefined/fallback semantics expected by this pipeline.

For example, a locale catalog for the Control above can provide:

```json
{
  "profile.name.error.minLength": "Enter a longer name.",
  "error.required": "This field is required."
}
```

The first key overrides minLength only for that control prefix. The second is a
global fallback for required errors. To replace every displayed error for the
name control with one message, add `profile.name.error.custom`. Use that key
only when intentionally replacing all its error details. Catalogs are passed
through the form's i18n translator, not through UI options or JSON Forms config.

A minimal TypeScript host using flat catalog keys can use core's createTranslator:

```ts
import { createTranslator } from '@jsonforms/core';

const messages: Record<string, string> = {
  'profile.name.error.minLength': 'Enter a longer name.',
  'error.required': 'This field is required.'
};
const i18n = {
  locale: 'en',
  translate: createTranslator((key, fallback) => messages[key] ?? fallback)
};
// Supply i18n to JsonForms; replace the catalog/translator when locale changes.
```

Return the supplied fallback for an unknown key, including undefined when no
fallback was supplied. Returning the key itself for every miss would stop the
error lookup chain prematurely. Translators may use the context's error.params
for parameterized messages; interpolation syntax belongs to the translator, not
JSON Forms core. An empty-string translation is an intentional resolved value,
not a missing key, and does not clear the underlying validation error.

**AJV localization versus control overrides.** The extended web validator profile
uses ajv-i18n to localize generated AJV messages after failed validation. It reads
the current i18n locale, first tries an exact supported locale, then its language
subtag (for example bg-BG falls back to bg). If no localizer is available, it
leaves the generated messages unchanged. The integration includes Bulgarian
localization. This is validator-adapter behavior, not a portable UI-model option
and not automatic behavior of a caller-supplied AJV instance.

Control translation happens after this validator localization. Thus a localized
AJV message is the fallback, while field-specific and global keyword keys can
still replace it. Prefer stable keyword keys to keys made from raw error text:
AJV message text may change with locale or validator version. ajv-i18n localizes
validator messages; it does not translate labels, buttons, or arbitrary host
additionalErrors. Its wrapper reads the locale when validation runs; refreshing
already-produced messages on a locale change requires the host's localization
or revalidation lifecycle, not a change to form data.

**Scalar-composition summaries.** These use the same combined-message and
per-error override pipeline. For a Control with `i18n: "quantity"`, supported
overrides include `quantity.error.custom`, `quantity.error.oneOf`,
`quantity.error.anyOf`, and global `error.oneOf` / `error.anyOf`.
`composition.multipleMatches` and `composition.noMatch` customize the renderer's
summary fallback, distinguishing multiple matching oneOf alternatives from no
matching alternative. The ordinary control/keyword/message overrides still take
precedence. Without an explicit composition override, preserve messages already
localized by ajv-i18n or supplied by ajv-errors; do not replace them with an
English summary. More explanatory summaries may replace stock English AJV text.
A custom i18n.translateError callback replaces the default per-error pipeline;
the control's error.custom override still takes precedence over that callback.

The extended validator profile also accepts the optional schema extension
`errorMessage`, provided by ajv-errors. For example, a property schema may be:

```json
{
  "type": "string",
  "minLength": 3,
  "errorMessage": {
    "minLength": "nameTooShort"
  }
}
```

The extended adapter translates the custom message through
`error.errorMessage.nameTooShort`, falling back to `nameTooShort`. A translation
such as "Enter at least three characters" therefore supplies the readable text;
a literal readable message may also be used when no translation is provided.
The adapter unwraps the ajv-errors wrapper into its underlying errors, preserving
their keywords and paths while assigning the custom message. Subsequent core
control-level or keyword-level translations can still override that message.
One custom message may cover several underlying errors; it does not imply a
single error object or erase their individual validation meaning.

The errorMessage keyword is a validator-specific schema extension, not a
UI-schema field, jsonforms.config option, or standard JSON Schema keyword.
Other validator integrations must declare equivalent support or its absence.

Renderer-generated additionalErrors participate in the core control-message
pipeline when mapped to the control's path. They do not automatically pass
through the Ajv validator-message localization wrapper. Participating renderers
must provide meaningful fallback messages and support translation, including
Monaco's single error summary and file-selection failures. Preserve error
ownership, paths, and validity independently of the displayed translation.
Changing locale should refresh displayed messages without requiring a data edit;
this applies to validator errors and renderer-generated additionalErrors alike.

### Validation execution and error visibility

**Origin:** existing JSON Forms validationMode behavior. The form-level
validationMode is separate from renderer selection, readonly, and restrict.

| Mode | Automatic form-schema validation | Schema-error display |
| --- | --- | --- |
| `ValidateAndShow` | Runs; default mode. | Show the resulting errors. |
| `ValidateAndHide` | Runs and retains results. | Hide schema errors in ordinary control error presentation. |
| `NoValidation` | Does not compute automatic form-schema validation results. | No automatically computed schema errors to display. |

Additional errors remain available for presentation in all three modes.
ValidateAndHide does not suppress host additionalErrors or participating renderer
error summaries. Renderer-owned publication options such as Monaco propagateErrors
control their own contribution independently; do not interpret validationMode as
a universal switch for external or language-service validation.

Schema-based rules still validate their condition schemas independently of the
automatic form validation mode. In particular, a condition referencing /# can
still evaluate the form schema under NoValidation. This is a separate validation
invocation, not evidence that automatic form validation is enabled. Function
conditions likewise follow their own callback contract.

An empty errors array under NoValidation does not prove the form schema passed.
Hosts consuming cached validity must distinguish unvalidated/unavailable, pending,
stale, valid, and invalid results. The current flag in the application-owned
validation snapshot example means validation actually completed for the current
data and validation configuration; it must not be inferred solely from an empty
array when validation is disabled. Error visibility also does not determine
validity: ValidateAndHide may retain schema failures while showing none.

Restrict remains independent. NoValidation does not disable min/max prevention,
readonly/disabled mutation guards, or action permissions. Conversely, restrict
false does not disable schema validation in either validating mode. Changing a
validation mode must update error presentation and notify integrations consuming
validation state without requiring the user to edit data.

### Change events, context errors, and combined validity

**Origin:** existing JSON Forms change-event and error-selector conventions;
separate extended-context access and combined-validity requirements must not be
confused with the event payload. Preserve the existing meaning of change-event
errors rather than silently redefining that field.

| Interface | Error information |
| --- | --- |
| Base change event | data and core schema-validation errors; errors does not automatically include additionalErrors. |
| Extended form context | Separate errors and additionalErrors collections, available to consumers through the integration's context API. |
| Control error selectors | Combine applicable schema errors and additionalErrors for the control, subject to validation-display policies. Mapped display text is not an authoritative complete-validity collection. |

The inspected extended Svelte and Vue/Vuetify wrappers forward the base change
event unchanged while exposing additionalErrors separately in their context.
Supporting additionalErrors for control display and context access therefore
does not imply that the change event's errors field includes them.

For example, a Monaco editor may publish a participating additional error while
its stored string remains valid against the form schema. A host checking only
changeEvent.errors.length === 0 can observe no schema errors while that editor
still blocks combined validity. Access to both collections in an extended
context supports a fuller check, but current/pending state must also be considered.

A host requiring complete validity must consider current schema-validation
results, host and renderer additionalErrors, and participating pending validation
under the established propagation policies. An empty core error collection under
NoValidation does not prove validity. Presentation filtering, hidden messages,
or translated control error strings must not become the validity source.

Notify combined-validity consumers when additional errors or participating
pending/current state change, even without a data edit. Do not rely exclusively
on a data-change event or assume that an additional-error update always triggers
one with a newly aggregated payload. Account for the separate host-notification
scheduling and pending-edit synchronization contracts. This requirement defines
observable behavior without prescribing a new event name, payload, or context
field, and does not extend the core rule callback context implicitly.

### Additional-error ownership and changing data paths

**Origin:** JSON Forms accepts additionalErrors separately from schema-validation
errors. Ownership and lifecycle coordination below are shared extended integration
requirements, not automatic core error-remapping behavior or new UI options.

Associate renderer-generated errors with their owning editor and logical data
target, not solely with the current array index. Keep ownership and target/version
metadata in runtime integration state, outside business data and the authored
UI schema. Publish instancePath using the current JSON Pointer to that target.
No business-data identifier is required merely to support error ownership.

For example, an editor owns an error at /items/1/code. Deleting item 0 moves its
item to index 0. If the target is known to be the same logical item, update the
published error path to /items/0/code; leaving the old path can associate the
error with another item. Deleting the owning target instead removes its owned
errors. Apply corresponding handling to known property renames and other path
changes. Do not infer identity from an index or display label alone.

Discard asynchronous diagnostic results for obsolete targets or data/model
versions. When a target cannot be reliably matched after external replacement,
invalidate stale renderer-owned results and evaluate the current target rather
than guessing a relocation. Clear only errors belonging to the affected owner;
preserve unrelated renderer and host errors.

Host-supplied errors remain under their producer's ownership. That producer or
its explicitly coordinated integration must refresh or invalidate them as data
changes. Renderers must not independently rewrite arbitrary host-error paths or
clear host errors merely because their own target moved. Make this lifecycle
responsibility explicit to hosts that publish server-side validation results.

Core data updates recalculate schema errors but do not automatically relocate or
remove additionalErrors. Existing array ADD/REMOVE/MOVE action metadata can help
an integration track known mutations, but does not itself implement this lifecycle
and does not cover every external data replacement or custom update.

Participating asynchronous validation must expose pending/current state to
validity consumers during reassociation and reevaluation. Do not report confirmed
validity solely because stale errors were removed while their replacements are
pending. Apply the existing propagation policy, including Monaco propagateErrors,
without making nonparticipating diagnostics block form validity. Coordinate error
lifecycle with pending-edit cancellation and correct item-summary association.

### Error-message filtering before touch

**Origin:** existing options in the inspected Svelte and Vuetify renderer-family
helpers, adopted here with the same names. They are not universal JSON Forms
core options; support must be declared per renderer family. Filtering controls
presentation only, independently of validation execution and form validity.

| Option | Default and behavior |
| --- | --- |
| `enableFilterErrorsBeforeTouch` | False when absent. True enables pre-touch error-message filtering. |
| `filterErrorKeywordsBeforeTouch` | A nonempty array names error keywords to suppress before touch. When filtering is enabled, an absent or empty array suppresses all otherwise displayable control error text before touch. Ignored when filtering is disabled. |

These are renderer options with supported global config defaults and per-control
UI options overriding them. For example, the form config may contain:

```json
{
  "enableFilterErrorsBeforeTouch": true,
  "filterErrorKeywordsBeforeTouch": ["required"]
}
```

A missing required value initially has its required message hidden, while
nonmatching errors remain eligible for display. The control becomes touched on
blur: receiving focus alone is insufficient, and leaving the control counts even
if the user did not change its data. After touch, display the errors permitted
by the active validationMode without pre-touch keyword filtering. Touch state is
runtime interaction state, not form data or an authored UI-schema value.

The form remains invalid while a required error is hidden. Filtering must not
remove structured errors, suspend validation, modify data, or alter the error
collections used by host validity consumers. It does not make a schema-based
rule observe errors that the rule would not otherwise inspect. Disabling this
filter restores ordinary presentation subject to validationMode; it does not
force core errors to appear under ValidateAndHide or NoValidation.

Apply granular filtering to the complete set of errors eligible for the control,
including mapped additionalErrors. A nonmatching additional error must not be
lost merely because a matching core error was suppressed. Matching additional
errors may have their text suppressed by the selected keyword filter, and the
all-message mode may suppress their control text; their structured entries and
validity contribution remain unchanged. Existing renderer-specific ownership and
propagation rules, including Monaco propagateErrors, continue to apply.

Array/detail summary presentation must account for child touch state when it
claims the same pre-touch behavior: it must not permanently suppress a matching
error simply because filtering remains enabled after the child is touched.
Document supported summary behavior and runtime touch-state lifecycle rather
than assuming every array renderer shares an implementation. Hiding or revealing
messages does not change array restrictions or item data.

### Read-only interaction and restrictive editing

Readonly prevents mutation of form data but does not disable every
application command.

Renderer-owned mutation actions such as array Add/Remove/Move and clear
MUST obey readonly/enabled state.

Renderer sets SHOULD support preventive UI constraints through the effective
`restrict` option. With restriction enabled, supported interactions prevent
invalid committed edits rather than merely displaying an error afterward.
Explicit false disables these preventive restrictions without disabling schema
validation or readonly/enabled rules.

| Control family | Constraints to enforce through restrictive interaction |
| --- | --- |
| Arrays, checkbox groups, multi-selects, chips | `minItems` and `maxItems` govern removal/addition. |
| Additional-properties editor | `minProperties` and `maxProperties` govern property removal/addition; count all properties in the target object, including declared properties. |
| Date, Time, Date-time | Supported inclusive/exclusive format bounds constrain picker selection and completed typed commits. |
| String input | Supported `maxLength` prevents excess entry, accounting for displayed versus stored representation. |

This is a renderer-aware policy, not a promise to turn every JSON Schema
keyword into an input filter. Schema `pattern`, for example, does not imply
a mask. Each catalog entry must identify preventive support separately from
validation-only support.

For arrays with restriction enabled:

- Disable or reject additions when the resulting array would exceed
  `maxItems`, including Add buttons, new checkbox selections, multi-select
  additions, and chip creation.
- Disable or reject removals when the resulting array would fall below
  `minItems`, including Remove buttons, unchecking, deselection, chip removal,
  and clearing a nonempty array when a positive minimum applies.
- Evaluate batch edits against their resulting array size. A replacement
  preserving the count should not be blocked merely because the array is
  already at a boundary.
- Apply the same checks to mutation handlers as to visible action state;
  keyboard interaction must not bypass them.

Already-invalid arrays must remain visible without automatic truncation or
padding. Allow repairs toward validity: removing items from an oversized
array and adding items to an undersized array. Readonly/enabled restrictions
remain mandatory independently of `restrict`; moving an item does not change
array size and is not blocked by minItems/maxItems alone.

Apply the same rules to additional-property counts: block creation beyond
`maxProperties` and deletion below `minProperties`, guard the handlers, and
allow repairs of initially invalid objects. Renaming without changing the
property count is not prohibited by these count constraints alone; property
name and value constraints remain separate.

For temporal entry, keep partial text as a local draft so users can complete
or correct it. When restricted, do not commit a completed value violating a
supported temporal bound through typing, pasting, picking, or confirmation.
Provide feedback without silently clamping or replacing the user's input.
With restriction disabled, out-of-range edits may be committed and reported
by validation. Masking can still guide syntax independently of `restrict`.

Renderer specifications must declare which constraints and interaction paths
support prevention. Validation remains necessary for external data, unsupported
constraints, and cross-field conditions. Existing invalid data must remain
visible and repairable rather than being rewritten on mount.

## 16. Adaptive desktop/mobile behavior

The v1 model supports **adaptive layout**, not separate arbitrary
desktop/mobile UI-schema branches.

Portable mechanisms: - Horizontal/Vertical layouts -
gridColumns/span/weight/fixed sizing - wrap - minItemWidth auto-fit -
renderer-native responsive widgets - renderer-specific capability
behavior

A renderer on mobile SHOULD use platform-appropriate controls while
preserving semantic intent. For example, a date Control may use a mobile
date picker while desktop uses a desktop picker; both represent the same
Control.

Deeply nested structural layouts remain spacing-neutral.

Explicit named breakpoint overrides are deferred from v1. Renderer specs
may provide platform-specific responsive enhancements, but portable
documents should rely on content/container-driven layout first.

A host may select a different UI schema when the product genuinely
requires a substantially different mobile workflow. That is composition
outside the portable element language, not a hidden automatic branch
inside a Control.

## 17. External context, visibility and security

JSON Forms rules remain the portable mechanism for data-driven
SHOW/HIDE/ENABLE/DISABLE behavior.

External application state such as user role, feature flags,
entitlements, or workflow mode may influence which UI
schema/config/context the host supplies. A host may also expose safe
values through the permitted dynamic `context` namespace for
non-security-sensitive presentation options.

**UI visibility is never an authorization boundary.**

For example, an admin UI may include additional controls/buttons while a
normal-user UI omits them, but backend/service authorization MUST
independently reject unauthorized operations. Hiding a Button or Control
is presentation, not security enforcement.

Recommended patterns, in order: 1. Host selects/composes the authorized
UI schema for the current user/context. 2. Ordinary JSON Forms rules
handle conditions based on form data. 3. Safe external context may drive
non-structural `$dynamic` values. 4. Renderer/platform escape hatches
are not used as an authorization system.

v1 does not define portable `$dynamic` replacement of structural fields
such as elements/rules/name/variant. If external authorization requires
structural differences, compose/select the UI schema outside the
portable resolver.

## 18. Renderer behavior specifications

The portable model defines semantics. Each renderer set SHOULD have a
separate behavior specification.

JSON Forms documents that UI-schema options can be renderer-specific,
and renderer implementations differ by framework. Official React
Material date/time renderers, for example, expose `dateFormat`,
`dateSaveFormat`, `timeFormat`, `timeSaveFormat`, `dateTimeFormat`, and
`dateTimeSaveFormat`. Renderer specs should preserve useful established
behavior when applicable. citeturn0search0turn0search1turn0search10

A renderer behavior spec documents: 1. canonical variants supported; 2.
established options and their encodings; 3. JSON Schema keywords honored; 4.
default/fallback behavior; 5. visual/usability behavior; 6.
accessibility; 7. invalid/out-of-domain data behavior; 8.
readonly/enabled/constraint behavior; 9. i18n/interpolation support; 10.
useful underlying-library enhancements; 11. renderer-contract
escape-hatch namespace and options.

### Renderer catalog structure and provenance

This document maintains a human-readable renderer catalog. It describes
runtime behavior and is distinct from the optional machine-readable editor
metadata in section 20. Suggested renderer names are descriptive identifiers,
not new serialized UI-schema types or variants.

Catalog entries MUST state syntax provenance using the categories in section 5,
including option-level exceptions to the renderer entry's origin.

Catalog entries MUST include a concrete JSON Schema and/or UI-schema
selection example, plus the supported options that change default behavior.
State each option's type, default, effect, and applicable renderer family;
unreviewed details must be marked pending. Include schema-driven selection
without supplied UI schema where applicable, alternative supported selection
paths, and at least one incompatible-schema example where selection could
otherwise be misleading. Examples supplement, not replace, applicability rules.

Catalog entries MUST identify:

- Suggested name, visual presentation, and interactions.
- Exact JSON Schema and UI-schema selection conditions, including selection
  with a generated UI schema, tester rank, and competing renderers.
- Supported options, types, defaults, and precedence, separating selection,
  display, storage, and underlying-component properties.
- Schema keywords used for selection, widget constraints, and validation;
  validator support alone does not establish widget support.
- Missing, null, invalid, readonly, disabled, and fallback behavior.
- Applicability per renderer family/version and provenance. Product
  implementation gaps and remediation work belong in a separate review
  document, not this specification.

Keep two catalog groups: JSON Forms renderer capabilities and this project's
extended renderer capabilities. Within the first group, distinguish official
upstream support, additions in the neighboring fork, and Svelte adaptations.
A feature present in one family MUST NOT be described as supported by all.
Package membership and upstream provenance are separate facts.

### JSON Forms renderer catalog: initial entries

These entries describe the intended contract, not implementation completion.

| Suggested name | Presentation | Selection on a string property | Presentation and storage options |
| --- | --- | --- | --- |
| Password control | Obscured text entry with a reveal/hide action | Schema `format: "password"` OR UI `options.format: "password"` | UI `format` selects presentation; password-content constraints remain separate. |
| Date control | Date entry with renderer-specific picker | Schema `format: "date"` OR UI `options.format: "date"` | `dateFormat` controls display; `dateSaveFormat` controls storage. |
| Time control | Time entry with renderer-specific picker | Schema `format: "time"` OR UI `options.format: "time"` | `timeFormat` controls display; `timeSaveFormat` controls storage. |
| Date-time control | Combined date/time entry | Schema `format: "date-time"` OR UI `options.format: "date-time"` | `dateTimeFormat` controls display; `dateTimeSaveFormat` controls storage. |

### Catalog contract: applicability and observable behavior

Every renderer entry must separate the following effects. A keyword can have
more than one effect; merely listing it as "supported" is insufficient.

| Effect | What the catalog must explain | Example |
| --- | --- | --- |
| Selection | Eligible schema types, resolved scope, required schema/UI combinations, and competing presentations | Date control accepts a string with schema or UI date format. |
| Presentation | Changes to the visible widget or available interactions | `ampm` changes time-picker interaction. |
| Input restriction | Which choices or edits are prevented, and on which input path | `formatMinimum` limits picker choices and completed typed commits when restricted. |
| Conversion and commit | Parsing, formatting, stored value, and when edits reach form data | `dateSaveFormat` changes serialization; `showActions` stages picker edits. |
| Validation only | Errors reported without changing the editing interaction | String `pattern` does not imply a mask or character filter. |

Applicability is evaluated against the property schema resolved from a
Control's scope, including references. Ranking chooses among eligible
renderers; rank MUST NOT make an incompatible schema eligible. Suggested
baseline names and domains are:

| Suggested name | Eligible domain | Usual presentation and behavior |
| --- | --- | --- |
| String control | `Control` targeting string | Text entry; specialized string renderers may outrank it. `pattern` and `minLength` do not imply input filtering. With `restrict: true`, supported `maxLength` handling limits input length. |
| Number control | `Control` targeting number | Numeric entry; must not match a string merely because its current value looks numeric. UI `step` affects stepping, not schema validity. |
| Integer control | `Control` targeting integer | Integer entry; fractional input handling and stepping must be documented. |
| Date / Time / Date-time control | `Control` targeting string, plus matching schema `format` OR UI `options.format` | Specialized text entry and picker; UI selection alone does not impose a schema format. |

Type unions, nullability, inferred types, and combinator handling must be
stated explicitly in each renderer-family specification. These domain rules
do not mean current data must already be valid before the renderer can display
it. Exact tester ranks and tie-breaking belong to the renderer registry
contract, not a universal portable rank assignment.

#### Schema references and renderer applicability

**Origin:** existing JSON Forms scoped-schema resolution and root-schema context;
the requirements here describe the shared renderer contract. Validator reference
resolution and renderer schema resolution are separate capabilities. Registering
a schema with the validator alone does not establish renderer support for that
reference.

For example, this form schema uses a local reference:

```json
{
  "type": "object",
  "definitions": {
    "birthday": {
      "type": "string",
      "format": "date"
    }
  },
  "properties": {
    "birthDate": {
      "$ref": "#/definitions/birthday"
    }
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/birthDate"
}
```

The resolved string/date schema makes the date control eligible just as an
inline definition would; the registry still determines the winning renderer.
The control edits birthDate, not definitions.birthday. A schema reference
identifies the value's schema and does not relocate its data. This example uses
definitions; use the definition container supported by the selected schema
dialect, such as $defs where applicable.

Referenced schemas participate in renderer selection and schema-driven behavior,
including supported formats and bounds. Nested object, array, detail, and cell
dispatch must retain the original root-schema reference context and the correct
scoped data path. Do not detach a referenced fragment in a way that loses its
reference bases or access to required definitions.

Each integration must declare its supported schema dialects and reference forms.
Do not promise support for external references, anchors, or other reference
mechanisms solely because its validator accepts them. An unresolved reference
must produce a diagnostic without modifying data or silently treating the value
as unconstrained.

Finding a property through a combinator or conditional subschema is a schema
lookup, not proof that a branch is active or that all applicable constraints have
been combined. Likewise, reference lookup must not be described as an automatic
merge of every keyword beside $ref. Apply supported dialect semantics and state
any renderer-resolution limitations explicitly. Whole-form validation remains
authoritative; an editing schema selected for a control does not replace it.


#### Boolean checkbox and switch controls

Suggested renderer names: `BooleanControlRenderer` and
`BooleanToggleControlRenderer`. Match a Control targeting a boolean schema.
Use a checkbox by default; options.toggle true requests a switch through the
existing JSON Forms convention. Do not introduce a switch variant. Present the
boolean widget with its associated label and shared description/error feedback.

True and false are real stored values. Displaying missing data must not write
false or otherwise initialize the value. Distinguish an unanswered value from
false: use an indeterminate checkbox, or an accessible "Not set" indication when
the selected widget cannot represent an indeterminate state. User interaction
commits a boolean; indeterminate is presentation state, not a third stored value.
Null is not a valid boolean unless the schema explicitly permits it; nullable
mixed-type editing follows the mixed-value contract.

Do not use truthiness to interpret invalid incoming values. For example, the
string "false" must not be shown as checked. Preserve invalid incoming data for
correction, expose validation feedback, and do not present it as a valid true or
false selection. Disabled/read-only state prevents changes.

Clearing follows the shared clear-control contract and is distinct from switching
off: switching off stores false. False still counts as a present value for the
clear affordance. In dynamic-property context clearing must retain the key under
the context-aware clear-value policy rather than removing the row; it must not
invent a universal third boolean value.

Required status means the property must be present, not that it must be true.
A required boolean with value false satisfies presence and type requirements.
Native checkbox required behavior must not introduce an unintended true-only
constraint. To require agreement, authors can explicitly constrain the schema
with const true; neither checkbox nor switch presentation implies that rule.

``` json
{
  "schema": {
    "type": "object",
    "properties": { "notifications": { "type": "boolean" } },
    "required": ["notifications"]
  },
  "uischema": {
    "type": "Control",
    "scope": "#/properties/notifications",
    "options": { "toggle": true }
  }
}
```

Here both true and false are valid answers; absence is invalid. A true-only
agreement field instead uses {"type":"boolean","const":true} as its property
schema, with required on the enclosing object when presence is also required.
Validation remains authoritative independently of the visual widget state.

#### Password control interaction

Suggested renderer name: `PasswordControlRenderer`. Match a Control targeting a
string schema with schema format password or UI options.format password. These
selection paths retain the existing password convention; the reveal behavior
below is a project interaction requirement, not a universal upstream feature.

Start with the value obscured. Provide a keyboard-operable reveal/hide action
with a localized accessible name, "Show password" or "Hide password", reflecting
the action it will perform. Toggling changes presentation only: it must not write
form data, trigger a value-change event, alter validation, or mark the value dirty.
Reveal state is local runtime UI state, never serialized into data or UI schema.
Do not introduce another portable option solely to disable the reveal action.

Keep reveal and clear actions distinct, with separate accessible names and hit
targets. Clearing follows the shared clear-control contract, including retaining
an empty string for a dynamic property. Ordinary string constraints and readonly/
disabled mutation rules still apply. Password presentation itself imposes no
complexity rules or additional content validation.

``` json
{
  "schema": { "type": "string" },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "format": "password" }
  }
}
```

The equivalent schema-driven selection is a string schema with format password
and an ordinary Control; it also works with generated UI schema.

#### Multiline string control

Suggested renderer name: `MultiStringControlRenderer`. Select a Control targeting
a string schema with `options.multi: true`, following the existing JSON Forms
convention. Present a multiline text input with the shared label, description,
validation, focus, and clear behavior. Preserve entered whitespace and line breaks.

| UI option | Default | Behavior |
| --- | --- | --- |
| `multi` | false | True requests multiline entry for a string schema. |
| `rows` | 3 | Positive integer specifying initial visible text rows, excluding labels, descriptions, and validation messages. It does not limit content length. |
| `resizable` | true | Allows manual vertical resizing where supported by the platform. False removes that affordance; overflowing content remains scrollable. |

Rows and textarea resizing are project target options. The positive resizable
name follows the common option vocabulary, with behavior defined by element
context: on this control it affects the textarea, not its parent layout.
Explicit layout height constraints take precedence over rows, and manual resizing
must respect applicable layout bounds. On platforms without manual resizing,
preserve scrolling and access to the full content. Automatic content-driven
height growth is outside this contract for now.

``` json
{
  "schema": {
    "type": "object",
    "properties": { "notes": { "type": "string", "maxLength": 2000 } }
  },
  "uischema": {
    "type": "Control",
    "scope": "#/properties/notes",
    "options": { "multi": true, "rows": 4, "resizable": false }
  }
}
```

Use the shared layout sizing options to control width. The portable contract
excludes the trim sizing option and introduces no negative no-resize alias.
With restrict enabled, maxLength participates in supported entry prevention;
minLength and pattern retain their validation roles. Clearing follows the shared
contract, including preserving an empty string and its key in dynamic-property
context. Neither sizing nor resizing changes the stored string.

#### Number and integer controls

Suggested renderer names: `NumberControlRenderer` and `IntegerControlRenderer`.
Match a Control bound to the corresponding resolved numeric schema type; numeric-
looking string values do not make a string schema eligible. Render a numeric
input, optionally with increment/decrement actions, using the shared label,
validation, focus, and clear-control contracts. Store numbers, not display text.
These are existing JSON Forms control conventions; the behavior below defines
this project's target numeric interaction contract.

| Input | Effect |
| --- | --- |
| `options.step` | Explicit stepping increment; takes precedence over multipleOf-derived stepping. Must be finite and positive. It does not redefine schema validity. |
| `multipleOf` | Schema validation constraint; also supplies the default stepping increment when suitable for the numeric type. |
| `minimum` / `maximum` | Inclusive bounds; with restrict enabled, guard step actions and completed typed/pasted commits. |
| `exclusiveMinimum` / `exclusiveMaximum` | Exclusive bounds in the configured schema dialect; preserve exclusivity in input handling, not merely validation text. |
| `restrict` | Shared preferred default true. Applies supported preventive constraints; false does not disable schema validation. |

Resolve number stepping as options.step, then schema.multipleOf, then 0.1.
For integers use options.step, then a suitable schema.multipleOf-derived increment,
then 1. An integer increment must be a positive integer; do not copy a fractional
multipleOf directly into an integer spinner. A fractional explicit integer step
is invalid configuration and needs a diagnostic. When a fractional multipleOf
cannot directly supply an integer increment, use the integer fallback while
retaining the multipleOf validation constraint. Stepping is not a guarantee that
the resulting value satisfies all schema constraints.

``` json
{
  "schema": {
    "type": "number",
    "minimum": 0,
    "maximum": 10,
    "multipleOf": 0.25
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

This suggests quarter-unit increments. Adding options.step changes the increment
only; it does not change the accepted multiples. Schema multipleOf is measured
against zero, not relative to the input's minimum or current value. Native input
step-mismatch behavior must not silently become a different schema rule.

Integer input must not silently truncate fractional values. Keep incomplete text
such as a sign as a local draft rather than committing NaN or another invented
value. Apply supported bounds to completed typed/pasted commits as well as step
actions; native min/max attributes alone do not establish enforcement. Preserve
out-of-range incoming data for correction and follow the common restrict repair
policy. Do not round or clamp values merely to fit a bound or stepping increment.
Handle decimal arithmetic without exposing binary floating-point artifacts as
user edits. Clearing follows the shared empty-value contract, including dynamic-
property key preservation.

Decimal precision is not a separate portable option here. Renderer-specific
precision settings must document whether they affect display, rounding, or stored
values; no arbitrary rounding or loss of supplied precision is implied by this
contract.

#### Numeric parsing and representation limits

**Origin:** shared numeric editing requirements; accepted entry syntax and numeric
representation capabilities remain integration-specific. This adds no new option
and does not require arbitrary-precision arithmetic on every platform.

Parse the complete input before committing a number. Do not accept a numeric
prefix while silently discarding the rest of the user's entry. For example,
1.9 must not become integer 1 through truncation. An integer editor may reject
exponent notation as an unsupported entry syntax, but it must not interpret 1e3
as 1. If that syntax is accepted, parse its complete numeric meaning and then
apply integer and other applicable constraints.

Never commit NaN or positive/negative infinity as numeric form values. Preserve
incomplete or unsupported input as an appropriate local draft with feedback,
following the existing commit and restrictive-editing contracts. Do not replace
it with zero, null, or another invented value to make conversion succeed.

Each implementation must declare its supported numeric range and precision.
Detect an input outside those capabilities before committing a silently changed
integer. For example, ordinary JavaScript Number conversion changes the decimal
integer text 9007199254740993 to 9007199254740992, and 1e309 overflows to infinity.
Checking only that a converted value is finite is insufficient to detect the
integer precision loss. Apply documented decimal precision behavior without
silently introducing arbitrary rounding.

Do not work around representation limits by converting a numeric field into a
stored string, or by adding minimum/maximum constraints to the author's schema.
A host may explicitly choose another representation and compatible schema when
its domain requires it. Unsupported numeric entry needs a clear diagnostic or
editing limitation, not a false claim of full numeric support.

Values already rounded by parsing or transport before reaching the renderer
cannot be reconstructed from the received number. Preserve this distinction
between limitations of the incoming data representation and conversion of new
user-entered text. Existing invalid data remains subject to the shared display
and correction contract.

#### Slider control

Suggested renderer name: `SliderControlRenderer`. Select a numeric/integer
Control with options.slider true and the range tester's required minimum,
maximum, and default. Retain this existing JSON Forms selection convention;
a string schema is not eligible merely because its data looks numeric.

Render a labelled horizontal track with minimum/maximum labels and a current-
value indication. Provide keyboard operation and accessible value information.
Shared descriptions, validation, readonly/disabled, and clear behavior apply.

Use schema.multipleOf as the increment, otherwise 1. The numeric text input's
options.step precedence does not automatically apply to sliders. Preserve integer
values for integer schemas even when multipleOf is fractional. Bounds determine
the track range; respect exclusive limits and applicable preventive constraints.
Schema multipleOf is measured from zero, not from minimum. A native widget whose
steps start at minimum must be adapted so it does not invent another allowed set.

``` json
{
  "schema": {
    "type": "integer",
    "minimum": 1,
    "maximum": 6,
    "default": 2,
    "multipleOf": 2
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "slider": true }
  }
}
```

Here selectable valid values are 2, 4, and 6, not 1, 3, and 5. Keep the declared
bounds distinct from the available step positions. If no valid position exists,
diagnose the incompatible range rather than manufacturing a value. No arbitrary
epsilon or rounding may silently weaken an exclusive bound or integer constraint.

Zero is a real current value and must not be replaced by a default through a
truthiness fallback. Missing data may use schema.default as a visual thumb
position, but must be visibly and accessibly identified as "Not set" until edited.
Mounting or rerendering must not commit that default. Invalid incoming values
remain available for correction; do not coerce strings/null to numbers or silently
clamp stored data to the track. If the widget cannot display the incoming value,
show the actual invalid value and associated error separately from its provisional
thumb position, without misrepresenting that position as committed data.

Clearing follows the shared clear-value contract: ordinary controls return to a
missing state, while dynamic-property controls preserve their key under the
context-aware policy. Required validation remains active. A fallback thumb
position after clearing must not immediately recommit a value. Disabling restrict
does not disable validation or require a finite slider to represent every
out-of-range value as a selectable position.

#### Temporal controls: preferred interaction

Date, Time, and Date-time controls SHOULD provide a picker as the preferred
selection interaction: a calendar for dates, a time picker for times, and
combined or coordinated pickers for date-times. The picker should make valid
choices discoverable and apply supported schema bounds to its selections.

Controls SHOULD also allow direct keyboard entry as a complementary path.
A format-aware input mask should guide users through the expected date/time
parts and separators, using the effective display format and locale. Keep
the expected format visible through a placeholder or accessible hint. Hosts
may disable masking with `options.mask: false` where supported.

The mask guides input structure; it does not establish calendar validity or
replace schema validation. Incomplete edits should remain local while being
entered rather than prematurely replacing stored data. Completed typed input
and picker selections must use the same save-format contract and remain
subject to the same schema validation. Native platform pickers may differ
visually while preserving these interaction semantics.

#### Temporal controls: schema-driven behavior

The following is the behavioral contract for schema-aware Date, Time, and
Date-time controls. Renderer-family support must be documented separately;
it must not be inferred merely from validator support.

| Schema keyword | Behavioral meaning for the widget | Validation distinction |
| --- | --- | --- |
| `type: "string"` | Establishes the intended value domain. | A picker still serializes a string, not a native Date object. |
| `format` | `date`, `time`, or `date-time` can select the corresponding renderer without an explicit UI format. | Validation depends on the validator's format configuration. |
| `formatMinimum` | Inclusive lower bound: When restricted, prevent choices and completed commits before the bound. | Restricted completed typing observes the bound; external values still require validation. |
| `formatExclusiveMinimum` | Exclusive lower bound: the boundary itself is not selectable. | Exclusivity must be preserved at the picker's supported precision. |
| `formatMaximum` | Inclusive upper bound: prevent picker choices after the bound. | Does not authorize clamping existing data. |
| `formatExclusiveMaximum` | Exclusive upper bound: the boundary itself is not selectable. | Same precision requirements as the lower exclusive bound. |
| `pattern`, `minLength`, `maxLength` | Do not automatically define calendar limits or a date mask. | Validate the serialized string; any additional input restriction must be explicitly documented. |
| Parent `required` | Required indication and clear/empty interaction according to the renderer contract. | Required-property presence and valid string content are separate constraints. |
| `readOnly` | Prevent data-changing interactions when honored by the integration's readonly policy. | This is an annotation, not a value-validity constraint. |

The preventive bound behavior above follows effective `restrict` (section 15).

The four format-bound keywords are extensions supplied by `ajv-formats`,
not built-in JSON Schema keywords. Ajv validation requires a schema `format`
with comparison support; UI `options.format` cannot supply that requirement.
Literal bounds and `$data` references are separate support capabilities.
A renderer claiming literal-bound support must not imply that it resolves
`$data` bounds. See [Ajv's format comparison documentation](https://ajv.js.org/packages/ajv-formats.html).

For Date control, bounds operate on calendar dates. An exclusive bound on
2026-09-19 excludes that date; the adjacent selectable dates are September
20 for a lower bound and September 18 for an upper bound.

For Time control, the picker compares time-of-day values at its supported
precision. A minute-resolution picker cannot blindly truncate a lower bound
of 09:30:30 to 09:30: its earliest valid minute is 09:31. Exclusive bounds
must select the next/previous representable value satisfying the comparison,
with midnight and empty ranges handled explicitly. Fractional-second support
must be declared rather than inferred from an accepted parse format.

For Date-time control, compare complete date-time values. Restrict calendar
dates first, and apply time-of-day limits only on the corresponding boundary
date. For a lower bound of September 19 at 14:00, September 19 must exclude
earlier times while September 20 must not inherit the 14:00 lower limit.
Recompute limits using the currently selected date, including uncommitted
picker selection when confirmation actions are enabled. An exclusive bound
may move the earliest/latest available date across midnight.

With confirmation actions enabled, changing the date can make the existing draft
time invalid. Under restrict, preserve that draft, display a translated range
explanation in the picker, and disable Apply until the complete date-time satisfies
all supported bounds. Guard the Apply handler as well as the button state. For
example, changing June 16 at 09:00 to June 15 must not apply June 15 at 09:00 when
the minimum is June 15 at 12:00. Do not silently clamp the time. Correcting the
draft re-enables Apply; Cancel discards it without changing committed data.
With restrict false, allow an out-of-range draft to be committed; ordinary schema
validation and error reporting remain independent of this preventive UI check.

For text entry, a parseable temporal value outside the supported range may be
committed even with restrict enabled, following the number/integer text-input
convention. Show the range validation error on the control and let the user
correct the value. For example, typing June 15 at 09:00 with a minimum of
June 15 at 12:00 retains that entered value in the model and reports the violation;
a restricted picker must prevent committing that same selection. The committed
range error must participate in form validity through schema validation or the
established additionalErrors mechanism when renderer-side validation is needed.
Do not silently clamp the typed value. This allowance concerns range violations;
it does not authorize silently normalizing an impossible date or clock value.

Temporal feedback for an unapplied value describes the **local draft**, not a
validation failure of the committed form data. It may use error styling to explain
why Apply is disabled, but must not automatically publish an additionalError against
a still-valid committed value. With explicit Apply/Cancel, Cancel clears the draft
feedback and leaves committed data and its validation unchanged. A form-level action
must follow the host's explicit policy for open confirmation drafts: require the
user to Apply/Cancel, or deliberately operate on committed data. It must never
silently apply the draft.

This feedback is also required when there are no confirmation buttons. If a typed
or picker edit cannot be committed because it is incomplete, invalid, or outside
supported restrictions, provide an associated explanation near the temporal input
or within its open picker. Do not leave the user with an unexplained rejected edit.
Ordinary unresolved input still participates in the shared pending-edit policy so
submission cannot silently consume an older value. A valid committed value and an
unresolved edit are separate states; keeping draft feedback local must not hide
that pending state from the integration. Once an invalid value is actually committed
(for example through text entry or with restrict false), normal validation/error
propagation applies.

Use the existing translator for all temporal draft feedback, including the reason
Apply is unavailable. The DateTime range message uses the key dateTime.outOfRange
with the fallback "Select a date and time within the allowed range." Equivalent
date/time feedback must follow the same i18n conventions. Translate any explanatory
bound labels and format displayed bounds using the active display format and locale;
do not expose raw validator/debug text as the only explanation. Feedback must have
an accessible association with the editor, update when the draft, bounds, or locale
changes, and clear when corrected or discarded. Ordinary partial input need not
produce a disruptive alert on every keystroke.

When multiple schema bounds apply, eligible picker values should satisfy
all of them. An empty intersection must not manufacture a valid-looking
selection. Preserve existing invalid data and expose validation errors;
picker bounds are not a substitute for validating typed, pasted, or
externally supplied values. Renderer-specific limits may affect picker
behavior but never alter schema validation.

Each renderer specification must state its comparison timezone/offset policy,
precision, behavior for invalid bounds, and support for dynamic bounds.
These details are especially important when displayed local time differs
from the stored offset or when daylight-saving transitions occur.

#### Temporal controls: UI options and defaults

**Origin:** mixed renderer conventions; display/save formats are established
Material conventions, while this default profile and picker-bound behavior
come from inspected Svelte and neighboring Vuetify-fork implementations.
Uniform restrict/commit behavior is a project target contract.

The following established option meanings and observed default profile are
based on the inspected Svelte and neighboring Vuetify renderer families.
They are not a claim of identical support in official Material or every
Vuetify release. Preserve the semantic effects when implementing another
renderer family; document any unsupported behavior and fallback.

| UI option | Domain and default profile | Observable effect |
| --- | --- | --- |
| `format` | `date`, `time`, `date-time`; absent uses ordinary selection | Selects a temporal presentation for a string even without schema format. |
| `dateFormat` | String; localized `L`, fallback `YYYY-MM-DD` | Display and typed-input parsing format; supplies the default placeholder and mask. |
| `timeFormat` | String; localized `LT`, fallback `H:mm` | Display/parsing format; seconds in the format enable seconds interaction in the inspected profile. |
| `dateTimeFormat` | String; localized `L LT`, fallback `YYYY-MM-DD HH:mm` | Combined display/parsing format and seconds interaction. |
| `dateSaveFormat` | String; `YYYY-MM-DD` | Serialization after a successful edit. |
| `timeSaveFormat` | String; `HH:mm:ssZ` | Serialization after a successful edit, including offset under this format. |
| `dateTimeSaveFormat` | String; `YYYY-MM-DDTHH:mm:ssZ` | Serialization of the combined date/time after an edit. |
| `mask` | Boolean; enabled unless false | Derives a temporal input mask from display format; incomplete nonempty masked edits are staged instead of immediately replacing form data. This is distinct from a generic String Mask control's mask-pattern option. |
| `ampm` | Boolean; false, Time and Date-time | Requests 12-hour picker interaction; display and save formats remain separate settings. |
| `showActions` | Boolean; false | False commits picker selection directly; true stages it until OK, with Cancel discarding pending picker edits. This does not defer all text-input commits. |
| `okLabel`, `cancelLabel` | Strings; `OK`, `Cancel` | Translated labels for confirmation actions. |
| `placeholder` | String; defaults to effective display format | Replaces the input hint without changing parsing or storage. |
| `focus` | Boolean | Requests initial input focus where supported. |
| `clearable` | Boolean; shared inspected bindings default to true when enabled | Exposes a clear action; empty-value serialization follows the renderer/host clear-value contract. Required validation remains independent. |
| `views` | Date-only array drawn from `year`, `month`, `day`; absent uses default picker navigation | Restricts selectable calendar views, e.g. year/month selection without a day grid. This does not automatically change `dateSaveFormat`. |
| `pickerIcon` | Renderer-specific icon representation | Changes the picker trigger icon where supported; icon names are not cross-library portable. |

The inspected JavaScript profile uses Day.js format tokens and expands
localized formats before building the mask. Another platform must document
its compatible token subset or translation; it must not silently interpret
these strings using an incompatible formatter dialect. Accepted input formats
and parser strictness must also be stated. Parsing successfully does not
establish schema validity.

Configuration defaults and per-control options are distinct from tester
selection: merging global configuration into renderer options does not imply
that a tester reads that same merged object. Document the actual selection
path as well as option precedence.

#### Temporal timezones, formatting, and round-trip preservation

**Status: PROVISIONAL — NOT FINALIZED; further timezone-design review required.**
This status covers this section and its subsections, including timezone,
saveTimezone, showTimezoneSelector, the proposed timezoneChangeMode, their defaults,
selector behavior, examples, and lifecycle/precedence rules. They are design
proposals, not finalized conformance requirements or claims of implementation.
Normative-sounding wording below describes the candidate contract only. Existing
format-option names and cited format semantics remain distinct from these proposals.

**Origin:** timezone is terminology used by MUI pickers; consistent UI-model
support for timezone and saveTimezone is a project extension, not established
cross-renderer JSON Forms support. Keep existing dateTimeFormat/dateTimeSaveFormat
and timeFormat/timeSaveFormat names; do not introduce savedDateTimeFormat as an
alias.

JSON Schema date-time and time formats follow RFC 3339 offset-bearing syntax;
they do not specify that display must use the current user's system timezone.
The schema does not supply an IANA zone name or select the renderer's display
zone. Format validation capability remains governed by the selected validator.
See [JSON Schema validation](https://json-schema.org/draft/2020-12/json-schema-validation)
and [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339).

Formatting and timezone conversion are distinct. In the Day.js-compatible token
profile, L/LT select localized date/time presentation, not a timezone. Z emits
the formatted value's offset; it does not request conversion to UTC. [Z] emits a
literal Z. It must not label a non-UTC wall-clock value as UTC. Existing format
strings cannot reliably identify system versus named-zone conversion, daylight-
saving rules, or the reference date needed by a time-only value. Do not infer a
conversion policy from these tokens or add a timezone DSL inside format strings.
See [Day.js formatting](https://day.js.org/docs/en/display/format).

| Option | Supported explicit values and effect |
| --- | --- |
| timezone | system, UTC, or a supported IANA zone such as Europe/Sofia or America/New_York. Selects the display/editing timezone. |
| saveTimezone | system, UTC, or a supported IANA zone. Selects the timezone used to serialize a committed edit, independently of display. |

Allow global config defaults with per-control overrides for these options.
Absent options retain the renderer's documented existing behavior; this addition
does not silently impose universal UTC storage or rewrite existing values.
Declare unsupported zones with a diagnostic instead of silently substituting the
system zone. system means the execution environment's timezone, not a zone inferred
from locale or language. These options apply to time and date-time controls,
including UI-selected controls backed by plain strings. Date-only values remain
calendar dates without timezone conversion.

For a property appointment with schema {"type":"string","format":"date-time"}:

```json
{
  "type": "Control",
  "scope": "#/properties/appointment",
  "options": {
    "timezone": "system",
    "saveTimezone": "UTC",
    "dateTimeFormat": "L LT",
    "dateTimeSaveFormat": "YYYY-MM-DDTHH:mm:ss[Z]"
  }
}
```

Parse the stored offset-bearing value, display it in the selected timezone,
interpret an actual wall-clock edit in that display zone, and convert to the save
zone before serialization. UTC plus literal [Z] in this example deliberately
produces UTC text. A format with fractional seconds is needed when committed
edits must retain that precision. Formatting alone must not perform an implicit
zone conversion. Reject configurations that would falsely label a non-UTC value
with a literal UTC suffix.

Changing timezone to Europe/Sofia displays Bulgarian time even on a US device;
UTC displays UTC directly. Changing display zone alone preserves the stored
instant and data. A separate timezone choice control may provide the effective
option through $dynamic.options.timezone; no embedded selector is required.
MUI demonstrates separate stored/display timezones, but adapter implementation is
required for the portable contract:
[MUI timezone support](https://mui.com/x/react-date-pickers/timezone/).

Time-only values lack a date. Associating a named zone with a wall-clock time
is meaningful, for example for a recurring schedule, but resolving its date-dependent
offset for conversion or offset-bearing serialization requires an explicit
reference date; do not silently use today. Fixed-offset-to-fixed-offset clock conversion does not require daylight-
saving lookup, but must document midnight rollover because time-only storage
cannot retain the date change. The reference-date input/encoding remains to be
specified before advertising complete named-zone time-only conversion; it may
be supplied from another field through the generic dynamic mechanism once that
input is defined. No invented current-date default is implied.

Preserve offset-free custom strings as wall-clock values unless an explicit
source-zone interpretation policy is supplied. Display/save zone configuration
must not silently invent the source zone of existing ambiguous data. Without a
reference date or required source interpretation, diagnose the unsupported
conversion rather than guess. This is separate from standard schema format
validation and introduces no switch to ignore the schema's format requirements.

Diagnose nonexistent local times at daylight-saving transitions. Ambiguous local
times require explicit resolution before a conversion-dependent commit; do not
silently choose an offset or shift the user's time. Evaluate bounds under the
same documented temporal interpretation and retain existing restrict behavior.

Mounting, changing locale, opening/closing a picker, and leaving unchanged input
must preserve the original stored value exactly, including offset spelling and
precision. Only an actual committed edit applies the save format and save zone.
Document whether edits preserve or reset seconds/fractions hidden by the display;
do not confuse an equivalent display conversion with a value-change operation.

##### Editing a value's offset or zone while preserving clock fields

**Origin:** project target interaction, analogous to OffsetTime-style fixed-offset
editing. This is distinct from the display-timezone options above and does not
require other platforms to use a particular language's temporal class.

Distinguish display-zone selection from value-zone editing:

| Interaction | What stays unchanged | Result |
| --- | --- | --- |
| Change display timezone | Stored data and the represented instant, where defined | The displayed clock fields may change to show the same instant in another zone. |
| Edit the value's offset/zone | Entered wall-clock fields, and the entered date for date-time | The value acquires a different offset/zone association; for date-time this changes the represented instant. |

For example, editing the offset of 02:00:00Z to +02:00 produces
02:00:00+02:00 before any explicitly configured storage-zone normalization.
It must not change the entered time to 04:00. Converting the original time to
+02:00 while preserving its UTC relationship would instead produce 04:00:00+02:00;
that is the separate display-conversion operation. Java provides the corresponding
fixed-offset operation as withOffsetSameLocal:
[Java OffsetTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/OffsetTime.html).

For the first version, time-only value-zone editing uses a fixed-offset selector,
including UTC. Preserve the entered hour, minute, second, and fractional fields
when the user changes the offset. Named-zone selection for a time-only value
must not pretend that Europe/Sofia denotes a single permanent offset: resolving
that association still needs a reference date, or separate storage of the zone
name without resolving it. Named-zone time-only conversion remains subject to
the reference-date contract above.

Date-time value-zone editing may additionally offer named zones. Preserve the
entered date and clock fields, then resolve the new zone against that date.
For example, changing the association of 02:00 UTC to Europe/Sofia keeps 02:00
on the selected date; the applicable offset comes from the zone rules for that
date. Diagnose nonexistent local times and explicitly resolve ambiguous times
before committing. Do not silently shift the clock to make the local time valid.

An explicit value-zone edit is a data-changing interaction and follows ordinary
readonly/enabled, restriction, validation, and staged OK/Cancel behavior. Changing
options.timezone, including through $dynamic, remains a presentation change and
must not implicitly perform this data mutation. The offset/zone editing affordance
must communicate which operation it performs. Use options.showTimezoneSelector
to expose value-zone editing as described below.

An explicitly configured saveTimezone still normalizes a committed value before
serialization. Thus selecting 02:00 at +02:00 and storing in UTC yields 00:00:00Z;
the entered clock was preserved during association, and storage conversion is a
separate step. To retain the chosen offset in the saved value, the integration
must preserve that offset on serialization rather than normalize to another
zone, and use a save format that emits it. Document this mode explicitly; do not
silently use a renderer's system-zone fallback to replace the chosen offset.
An offset-free save format cannot preserve the offset, and a standard time or
date-time string with an offset does not preserve an IANA zone identifier.
If the zone name is business data, store it separately through an explicit host
schema/data contract; do not add an undeclared property to the user's data.

##### Timezone-selector option and closed-control presentation

**Origin:** project extension. options.showTimezoneSelector is a boolean, default
false, enabling a value-offset/zone editing affordance within the existing time
or date-time control. It does not select a new renderer variant. Support global
config defaults with per-control overrides under the shared option contract.

```json
{
  "type": "Control",
  "scope": "#/properties/startTime",
  "options": {
    "format": "time",
    "showTimezoneSelector": true,
    "timeSaveFormat": "HH:mm:ssZ"
  }
}
```

This example targets a string property; its schema may also specify format time.
Time controls expose fixed-offset choices including UTC. Date-time controls may
add supported named zones. Label fixed-offset selection "Offset" and named-zone
selection "Time zone", with localizable accessible names. Changing the selection
preserves entered clock fields under the value-zone editing contract; it is not
a display-zone conversion command.

When showActions is true, time/date and zone changes share the same OK/Cancel
transaction. The closed control reflects the committed selection after Cancel.
When the value is empty, choosing an offset/zone may establish a local selection
for subsequent entry but must not manufacture midnight or otherwise create a
stored temporal value. Hiding the selector preserves existing data and its offset.
Without an explicit saveTimezone, selector-based edits preserve the chosen offset
on serialization using an offset-bearing save format. Explicit saveTimezone
performs the separate agreed storage conversion. Do not silently discard the
selection through an incompatible save format; diagnose the configuration.

**Closed-control visibility is required when the selector is shown.** Users must
be able to see the selected offset/zone without opening the picker. Show it in
the input text, as an integrated suffix/dropdown, or immediately adjacent within
the same visual control. Do not rely on a tooltip or a generic timezone icon as
the only indication. Respect the configured temporal text format: when it does
not include the necessary information, add a separate visible zone indication
rather than silently changing its parsing/format tokens.

Recommended layout: a leading picker icon, the date/time input, and a trailing
zone/offset suffix or dropdown, with a distinct Clear action using the shared
focus/hover rules. This arrangement leaves room for the zone indication and
clear affordance while presenting one coherent control. Exact icon order,
placement, responsive layout, and whether the suffix is directly interactive
remain renderer-specific. Maintain keyboard access, accessible labels, and
separate action targets; zone selection or picker activation must not accidentally
clear the value.

Display a meaningful offset such as UTC or +02:00. For named zones, identify the
zone rather than showing only an ambiguous abbreviation; an applicable offset
may supplement the name. Distinguish the zone associated with the edited/displayed
value from a different configured storage zone. With saveTimezone UTC, a selected
+02:00 must not be mislabeled UTC merely because serialization normalizes to UTC.
If a separate timezone option converts the displayed clock fields, their visible
zone indication must describe that display accurately, with the selected editing
association distinguishable where different. Do not pair clock text from one
zone with a label implying another.

The selector's runtime selection is not automatically an IANA-name data property.
Persisting a named zone across reloads still requires the explicit host data
contract described above. No reference-date input for named-zone time-only
conversion is introduced by showTimezoneSelector.

##### Provisional timezone examples and change-mode proposal

**Not finalized.** The following records the discussion for further review.
Stored text ending in Z denotes UTC. By contrast, the Day.js format token Z emits
the formatted value's offset, and [Z] prints a literal Z. It does not necessarily
emit the device's current offset: the integration must preserve or deliberately
select the value's offset before formatting. Thus 10:00:33+02:00 is not valid only
on devices in +02:00; its explicit offset is independent of the viewer's location.
L/LT select localized text formatting, not a timezone.

For incoming 10:00:33+02:00, with showTimezoneSelector true and timeFormat HH:mm:ss,
the candidate initial presentation and commit behavior is:

| Options | Initial visible clock/selector | Incoming storage before an edit | Example committed edit |
| --- | --- | --- | --- |
| No timezone or saveTimezone; timeSaveFormat HH:mm:ssZ | 10:00:33, +02:00 | 10:00:33+02:00 | Change hour to 11: store 11:00:33+02:00. |
| saveTimezone UTC; timeSaveFormat HH:mm:ss[Z]; no timezone | 10:00:33, +02:00 | 10:00:33+02:00 | Change hour to 11: store 09:00:33Z, continue displaying 11:00:33 at +02:00. |
| timezone UTC and saveTimezone UTC; timeSaveFormat HH:mm:ss[Z] | 08:00:33, UTC | 10:00:33+02:00 | Change selector to +03:00 in keepLocalTime mode: display 08:00:33 at +03:00 and store 05:00:33Z. |

The proposed saveTimezone governs future committed edits; it does not normalize
incoming data merely on load. Consequently a loaded +02:00 value can coexist
with saveTimezone UTC until an actual edit. This distinction needs to be clear
to authors rather than implying that the configuration validates existing storage
as already normalized. With no configured conversion and a selector enabled,
the candidate default is to display and preserve the stored offset.

Proposed options.timezoneChangeMode would explicitly control user changes through
the value-zone selector:

| Proposed value | Select UTC from 10:00:33+02:00 | Meaning |
| --- | --- | --- |
| keepLocalTime (proposed default) | 10:00:33Z | Preserve clock fields and change their offset association. For date-time, preserve date as well and change the represented instant. |
| keepInstant | 08:00:33Z | Adjust clock fields to preserve the represented instant for date-time, or UTC relationship on an implied day for time-only values. |

The earlier clock-preserving selector descriptions correspond to keepLocalTime.
keepInstant is a newly proposed alternative, not an already finalized behavior.
For named-zone conversion of time-only values, the missing reference-date problem
remains; the mode does not resolve it. Storage conversion through saveTimezone
would remain a separate step after the selector operation.

Candidate runtime precedence: timezone establishes the initial display/editing
zone, an explicit selector choice becomes the local editing zone, and ordinary
rerenders or feedback of the saved value retain that choice. A subsequent effective
timezone option change changes presentation without rewriting committed data.
Staged Cancel restores the previous value and selected zone. The renderer can
observe effective option changes without knowing whether $dynamic produced them.
This lifecycle proposal remains under review, including external replacement,
active drafts, remounts, and named-zone persistence.

The proposed mode governs explicit user selector interaction. Programmatic changes
to timezone, including $dynamic, remain presentation-only under this proposal;
they must not silently execute the data-changing keepLocalTime operation.

Before finalizing, review option names/defaults and whether both modes are needed;
fixed-offset option encoding and supported ranges; interpretation of offset-free
strings; reference-date encoding and which calendar date it denotes; daylight-
saving ambiguity; selector/display/storage precedence; external update and draft
handling; and how the selected named zone is persisted when required. No automatic
migration or implementation requirement should be inferred from these examples.

#### Temporal controls: renderer-contract options

Picker component props can further alter available dates, appearance, and
interaction. Preserve those escape hatches within their renderer namespace;
do not promote component prop names to portable options without review.
Observed bound mappings include Vuetify `v-date-picker.min/max` and
`v-time-picker.min/max`, Flowbite `Datepicker.availableFrom/availableTo` and
`Timepicker.min/max`, and Skeleton/shadcn `DatePicker.min/max` adapters.
These are adapter contracts, not interchangeable underlying-library APIs.

Renderer specifications must state whether an explicit component bound
replaces or intersects a schema-derived bound and whether a later prop spread
can override it. They must also describe calendar-view availability, picker
confirmation, shared description/required/error presentation, and readonly
behavior on both the text and picker paths.

Temporal conformance examples should cover inclusive/exclusive bounds,
minute/second precision, boundary-day selection, midnight rollover, empty
ranges, invalid existing data, typing versus picking, custom save formats,
confirmation/cancel, and timezone behavior. `$data` resolution requires its
own examples if advertised.

### Choice and suggested-string controls

**Origin:** JSON Forms choice-renderer conventions, with project target behavior
for uniform autocomplete selection and typed-value preservation. Family-specific
option support is documented separately.

These are suggested renderer names, not additional UI-schema element types.
All use `Control`. Searchable finite choices and free-text suggestions have
different data semantics even when their widgets look similar.

| Suggested name | Schema applicability | Typical presentation |
| --- | --- | --- |
| Enum choice control | Resolved schema defines `enum`; core also recognizes `const` as a single-choice case | Select one permitted value from a dropdown or searchable list. Supported value types must be declared per renderer. |
| Named choice control | Supported `oneOf` with `const` on each branch; branch `title` supplies a human-readable label when present | Select a label while storing its corresponding constant value. Arbitrary `oneOf` schemas are not finite-choice lists. |
| Autocomplete choice control | Same finite-choice applicability as above, with searchable presentation requested or selected by default | Type a search query to filter permitted choices, then select a value. Search text is not itself a new allowed value. |
| Suggested string control | String schema with UI `options.suggestion` containing an array of strings | Free-text entry with optional suggestions; values outside the suggestions remain permitted if the schema accepts them. |
| String-or-enum control | Supported `anyOf` containing a string enum branch and a non-enum string branch | Offer the enum values as suggestions while allowing values accepted by the other branch. Additional schema constraints still apply. |

The String-or-enum presentation must not be generalized to every `anyOf`.
Renderer-family specifications must define the accepted branch shapes and
fallback to ordinary combinator rendering for unsupported combinations.

#### Choice options and observable effects

| Option or schema keyword | Effect |
| --- | --- |
| UI `autocomplete: true` | Requests searchable finite-choice selection. |
| UI `autocomplete: false` | Requests a non-searchable choice selector. It does not request radio buttons or imply a platform-native select. |
| UI `autocomplete` absent | Preserves the renderer family's documented default. No universal default is imposed. |
| UI `format: "radio"` | Requests visible radio choices through the existing convention. Interactions with other presentation requests must be documented. |
| UI `suggestion` | An array of suggested strings; does not add an enum constraint or authorize values forbidden by the schema. |
| UI `placeholder` | Input/search/empty-selection hint; does not become a stored value. |
| UI `clearable` | Exposes a clear action where supported, subject to enabled/readonly state and the host's empty-value contract. Clearing may produce a validation error. |
| Schema `enum` / `const` | Supplies permitted stored values, affecting both choice construction and validation. |
| Branch `title` and supported i18n metadata | Supplies choice labels without changing stored values. |
| Schema `pattern`, `minLength`, `maxLength` for free-text strings | Validates the stored string; suggestions do not replace these constraints. Input restrictions, if any, must be separately documented. |

Use the established `options.autocomplete` encoding. Searchability does not
mean accepting arbitrary
new values. Likewise, a combobox-shaped widget is not sufficient evidence
of search support: a searchable renderer must define how the displayed
choices respond to the query, including labels, locale, and empty results.
Remote lookup and asynchronous suggestions are not implied by this option.

An example of finite searchable choices:

``` json
{
  "type": "Control",
  "scope": "#/properties/department",
  "options": { "autocomplete": true }
}
```

Here the department property defines its permitted values through `enum`
or a supported constant-based `oneOf`. For a plain string accepting other
values, use suggestions instead:

``` json
{
  "type": "Control",
  "scope": "#/properties/department",
  "options": { "suggestion": ["Engineering", "Finance", "Operations"] }
}
```

#### Radio-choice layout and interaction

Suggested renderer names: `RadioGroupControlRenderer` and
`OneOfRadioGroupControlRenderer`. Select supported enum or oneOf/const choices
with options.format radio, using the existing JSON Forms convention. This does
not apply to arbitrary oneOf branch forms. The orientation and interaction rules
below define the project's shared presentation contract.

`options.vertical` defaults to false: arrange choices horizontally and allow
wrapping. True stacks choices vertically. Use one group label with a label beside
each radio, preserving schema choice order. Preserve original choice value types;
labels and internal widget strings must not become stored values. Provide keyboard
navigation and accessible orientation consistent with the displayed arrangement.

Missing data starts with no selection; mounting must not choose the first option.
Activating the selected radio does not clear it. Use the shared clear action,
including focus/hover visibility, enabled/readonly handling, and dynamic-property
clear semantics. Invalid/out-of-domain data remains available for correction and
must not silently map to an unrelated choice. Group descriptions and errors
follow the shared presentation contract.

Format radio determines the presentation; autocomplete has no effect on this
renderer. No additional radio variant or orientation alias is introduced.

``` json
{
  "schema": { "type": "string", "enum": ["Standard", "Express"] },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "format": "radio", "vertical": true }
  }
}
```

#### Choice-label translation

**Origin:** existing JSON Forms core enum/oneOf mapping and i18n conventions.
The i18n metadata used here is a JSON Forms convention, not a standard JSON
Schema validation keyword. No new renderer-selection or translation option is
introduced.

For example, the department property may have this schema:

```json
{
  "type": "string",
  "enum": ["eng", "fin"]
}
```

Its control can supply a translation prefix:

```json
{
  "type": "Control",
  "scope": "#/properties/department",
  "i18n": "department"
}
```

Core looks up department.eng and department.fin, falling back to eng and fin
as labels. Non-string enum values use their JSON serialization as the initial
label; their stored values retain their original JSON types. The prefix follows
the core precedence described under error-message translation: UI-schema i18n,
then schema i18n, then the data-path-derived prefix.

For constant-based named choices, explicit branch keys make translations
independent of the fallback title:

```json
{
  "type": "string",
  "oneOf": [
    {
      "const": "eng",
      "title": "Engineering",
      "i18n": "departments.engineering"
    },
    {
      "const": "fin",
      "title": "Finance",
      "i18n": "departments.finance"
    }
  ]
}
```

The exact key departments.engineering supplies the first label, with Engineering
as the fallback; selecting it still stores "eng". Without branch i18n, core
uses the control prefix plus the fallback label: department.Engineering in this
example. Without a title, the fallback label is the string constant itself or
the JSON serialization of a non-string constant. Branch i18n is an exact key,
not a prefix to which the title or value is appended.

Core's multi-choice mapper uses the same label helpers for enum or constant-based
oneOf choices in an array's items, with the array control's translation prefix.
These mappings apply to supported choice presentations such as dropdowns,
searchable choices, and radio groups; they do not turn arbitrary oneOf schemas
into finite choice lists.

Locale changes must refresh available and selected labels without modifying
selection or stored data. Distinct values remain distinct choices even when
their translated labels are identical. Labels and translation keys must never
serve as stored-value identity; follow the identity requirements below.

#### Choice identity and existing values

The selected value MUST retain its JSON type. A numeric option `1` must not
be stored as string `"1"`; the two must remain distinguishable if both are
permitted. Widget identifiers and labels are presentation details, not the
identity of form values. Renderers must declare their supported enum value
types, including any limits for null, booleans, objects, or arrays.

Do not treat a permitted empty string or null as absent merely because the
widget uses that value internally to represent no selection. Unsupported
value shapes need a documented fallback. Unknown existing values must remain
unchanged until an explicit edit and be represented according to section 19;
filtering the list must not silently clear or substitute the current value.

Renderer-family specifications must document default searchability, explicit
option support, registry-dependent selection, matching behavior, label/i18n
mapping, and keyboard interaction. The established Material convention uses
autocomplete by default and a select when `autocomplete` is false; other
families may have different defaults or separately registered renderers.
This distinction does not create a new portable encoding.

### Masked string control

**Origin:** inspected Svelte and neighboring Vuetify-fork convention; official
upstream provenance has not been established by this review.

Suggested name: **Masked string control**. Presentation: a text field that
uses a mask to guide entry of characters and separators, for example a
reference displayed as `123-456`. This is an existing convention in the
inspected Vuetify/Svelte families, not a new extended element type or a
claim of support in every JSON Forms renderer set.

Applicability: a `Control` targeting a string schema, with a mask pattern
in `options.mask`. Schema `pattern` alone does not select this renderer.
The generic mask-pattern option
must be distinguished from the boolean `mask` toggle on temporal controls;
a boolean temporal option must not by itself request a generic masked field.
Exact tester ranks and handling of competing specialized string presentations
belong in renderer-family specifications.

| Option or keyword | Default / supported form | Effect |
| --- | --- | --- |
| UI `mask` | Pattern string, e.g. `###-###` | Guides character entry and inserts mask literals. Additional mask forms require explicit renderer-family documentation. |
| Default mask tokens | `#`: ASCII digit; `@`: ASCII letter; `*`: ASCII letter or digit | Defines accepted characters at each token position in the inspected profile. |
| UI `returnMaskedValue` | Boolean; false | False stores the unmasked value; true stores the value including mask literals. |
| UI `tokens` | Token definitions; absent uses defaults | Customizes accepted characters. The inspected profile accepts regex strings or token objects containing a pattern, and falsy entries remove tokens. Additional token-object fields are masking-library-specific. |
| UI `maskReplacers` | Existing compatibility option | Alternative token configuration. Prefer `tokens` for new documents; when both are present, the inspected profile uses `tokens` rather than merging both configurations. |
| UI `tokensReplace` | Boolean; true | Controls whether supplied tokens replace the masking library's default token definitions. This differs from overriding entries in the renderer's token map. |
| UI `eager` | Boolean; false | Requests eager insertion of mask literals according to the supported masking-library contract. |
| UI `reversed` | Boolean; false | Requests mask processing from the end according to the supported masking-library contract. |
| UI `placeholder` | String; renderer-family default | Provides an entry hint; document whether the mask itself is the fallback placeholder. |
| UI `restrict` with schema `maxLength` | Input restriction when enabled | May limit input length; implementations must distinguish displayed mask length from stored-value length. |
| Schema `pattern`, `minLength`, `maxLength` | String validation keywords | Validate the stored string. They do not implicitly define mask tokens or mask structure. |

Example: a reference with six stored digits and a display separator.

JSON Schema for the property:

``` json
{
  "type": "string",
  "pattern": "^[0-9]{6}$"
}
```

UI schema:

``` json
{
  "type": "Control",
  "scope": "#/properties/reference",
  "options": {
    "mask": "###-###",
    "returnMaskedValue": false,
    "placeholder": "123-456"
  }
}
```

The field displays `123-456` and stores `123456`. If
`returnMaskedValue: true` is chosen, the schema must instead describe the
stored representation containing the separator. The renderer must not
rewrite the schema when this option changes.

Input masks guide structure; they do not prove completeness or business
validity. Unlike the temporal mask contract, a generic mask does not imply
that partial input is withheld until the mask is complete. Renderer-family
specifications must state commit timing, paste and deletion behavior,
empty-value handling, and treatment of existing values that do not fit.
Shared focus, clearable, readonly, description, and validation presentation
remain applicable. Existing data must not be silently normalized solely
because the renderer is mounted.

Cross-platform implementations must document their mask/token grammar and
regex compatibility. Function-valued masking-library options are not portable
serialized UI-model features. Conformance examples should cover masked versus
unmasked storage, custom tokens, incomplete input, separators versus length
limits, and selection alongside temporal controls.

### Shared detail UI-schema selection

**Origin:** existing JSON Forms findUISchema convention. For object controls,
array item forms, ListWithDetail, and other renderers using this detail-selection
mechanism, select the form description in this order:

1. If options.detail is an inline UI-schema element with a type, use it directly.
2. If options.detail is "GENERATE", generate the fallback form and bypass the
   registered UI schemas. Emit this uppercase spelling in authored examples;
   the inspected core recognizes it case-insensitively.
3. Otherwise, use the highest-ranked applicable registered UI schema.
4. If no registered entry matches, generate the renderer's fallback form.

``` json
{
  "schema": {
    "type": "object",
    "properties": {
      "contacts": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": { "name": { "type": "string" } }
        }
      }
    }
  },
  "uischema": {
    "type": "ListWithDetail",
    "scope": "#/properties/contacts",
    "options": { "detail": "GENERATE" }
  }
}
```

Even if the host registers a reusable contact editor, this location requests a
generated item form. Omitting detail permits the registered form to match; an
inline layout instead supplies the form explicitly. Do not invent another
registered-form selection string or treat arbitrary detail strings as registry IDs.

Scopes inside a detail form are relative to its object/item schema and data
context; preserve the original item data path and root schema reference context.
UI-schema registry testers select a form description, while renderer testers
select components for the resulting elements. These are separate registries and
selection steps. Inline, registered, and generated detail forms all pass through
shared dynamic resolution and normal nested dispatch. Rendering a generated form
must not itself initialize or overwrite data.

This contract applies where the renderer uses the shared detail mechanism; it
does not automatically expand cells.<property>.detail, whose composite-dialog
contract separately specifies a UI-schema element/layout. Mixed per-type detail
options feed the shared mechanism as described in the mixed renderer entry.

#### UI-schema registry tester contract

For ranked detail selection, each uischemas entry contains tester and uischema.
The existing core tester signature is `(schema, schemaPath, path) => number`:
schema is the schema considered for the detail form, schemaPath is its schema
scope/path, and path is the current data-instance path. This is distinct from
the renderer-registry tester signature and must not be conflated with it.

Return the core NOT_APPLICABLE constant (-1) to reject an entry; otherwise return
a finite nonnegative rank. Highest applicable rank wins, with the first registered
entry winning equal ranks under the inspected core behavior. Testers must be
synchronous and side-effect-free. They may run more than once during selection;
do not mutate data/schema or depend on invocation count. Promises, NaN, infinity,
and nonnumeric results are invalid and must be diagnosed and treated as
NOT_APPLICABLE by adapters validating external tester inputs.

``` ts
import { NOT_APPLICABLE, type JsonFormsUISchemaRegistryEntry } from '@jsonforms/core';

const uischemas: JsonFormsUISchemaRegistryEntry[] = [{
  tester: (_schema, schemaPath, _path) =>
    schemaPath === '#/properties/contacts' ? 10 : NOT_APPLICABLE,
  uischema: {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/name' }]
  }
}];
```

This entry supplies a contact detail form when the caller supplies that schema
path. Path arguments reflect the actual dispatch location; do not assume a
particular array index or that every delegation uses the same schemaPath.

The JavaScript integration may accept a serialized tester as a complete function
expression, exposing NOT_APPLICABLE to that expression:

``` json
{
  "tester": "(schema, schemaPath, path) => schemaPath === '#/properties/contacts' ? 10 : NOT_APPLICABLE",
  "uischema": {
    "type": "VerticalLayout",
    "elements": [{ "type": "Control", "scope": "#/properties/name" }]
  }
}
```

Serialized testers are a runtime extension, not portable executable JSON.
Compilation/execution requires jsonformsExtended.security.allowScriptEvaluation
true and compliance with host CSP. Direct application-owned functions require
no string compilation. Disabled/unsupported evaluation or execution failures must
produce diagnostics and make that tester nonapplicable; do not silently select
its form. Native integrations may register native tester functions through their
own APIs and must not claim support for JavaScript source strings.

Named Template lookup remains first-match lookup by entry.uischema.name, without
tester evaluation. An entry whose tester returns NOT_APPLICABLE can therefore
remain usable by name while excluded from ranked selection. Do not evaluate a
serialized tester merely to resolve a named template.

### Array Add-item initialization

**Origin:** existing JSON Forms core createDefaultValue behavior, used by the
inspected Svelte, Material, and Vuetify array layouts. Explicit Add initializes a
new value; this is separate from validator default assignment through useDefaults
and from provisional renderer display fallbacks.

| Item schema | Initial value from the existing core convention |
| --- | --- |
| Explicit default | A deep copy of that default, including false, zero, or null. |
| String without a specialized temporal format | Empty string. |
| Number or integer | 0. |
| Boolean | false. |
| Array | Empty array. |
| Object without an explicit object default | An object populated from supported declared property defaults; properties without defaults are not automatically filled with primitive placeholders. |
| Null | null. |
| String with schema format date, time, or date-time | A current temporal value serialized by the core helper for that format. |

These are initial values, not a guarantee that the complete item schema is
satisfied. The format-based temporal case is driven by the schema; selecting a
date/time renderer through UI options alone does not give a plain string schema
that initialization behavior.

For example, an array's item schema may be:

```json
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "active": { "type": "boolean", "default": true }
  }
}
```

Explicit Add initially creates:

```json
{ "active": true }
```

The missing name remains a validation error until supplied. The helper does not
invent a valid name. Likewise, initializing a number to 0 does not guarantee
that minimum: 10 is satisfied. Ordinary validator processing can subsequently
apply its separately documented defaults and report remaining errors.

With restrict enabled, Add must obey structural constraints such as maxItems,
as well as readonly/enabled and disableAdd guards. A newly added item may still
require completion: full item validity is not a prerequisite for inserting an
editable item. Subsequent edits follow the applicable input restrictions. This
exception for initialization does not authorize bypassing ordinary edit guards
or silently changing existing invalid values.

Rendering an existing item must not independently repeat initialization or
replace its data. Object/array defaults must not share mutable instances between
new items or mutate the schema. Follow the existing schema/default-generation
mechanism for supported combinators; do not assume its first usable branch
creates a value valid against the entire schema. Initialization is not a general
schema satisfiability solver. Unsupported or invalid defaults and initial values
must remain distinguishable from validated data.

### Object-level errors and errors without rendered targets

**Origin:** schema-validation errors can apply to an object or a property without
an available control. The following is a shared error-presentation requirement,
not a new renderer type, UI option, or prescribed summary component.

Provide accessible feedback for object-level errors near the object editor.
Delegating object content to a generated or registered layout must not imply that
all errors can be displayed by its child controls. For example:

```json
{
  "type": "object",
  "minProperties": 1,
  "properties": {
    "name": { "type": "string" }
  }
}
```

For {}, minProperties fails on the object itself. The optional name control is
not individually required, so displaying only that field's errors does not
explain the object failure. Provide an object-level explanation instead of
mislabeling name as required or automatically creating a value.

Errors without a rendered target must remain discoverable through an enclosing
summary or form-level error presentation, subject to validation-display and
filtering policies. For example, with additionalProperties: false, an unexpected
property may have no generated control. Core's web error-path mapping associates
that failure with the offending property, but that association alone does not
create a place to display it. The presentation must identify the affected data
clearly even when it cannot focus a corresponding input.

Retain field-specific feedback beside available controls. Avoid unnecessarily
duplicating every message at every enclosing level; implementations may combine
local explanations, summary indicators, and accessible error lists. Exact styling
and summary components remain renderer-specific. Hiding a control does not discard
its underlying errors or exempt its data from validation. Ensure eligible errors
remain discoverable without forcing hidden controls visible merely to show them.

Respect validationMode, pre-touch filtering, and additional-error propagation
policies; this requirement does not force hidden core messages to appear under
ValidateAndHide. Underlying errors and their validity contribution remain separate
from presentation. Appropriate host error-resolution flows may be needed for
uneditable data. Do not silently delete, rename, or rewrite invalid data merely
to remove an error without a rendered target.

### Array-level errors and item summaries

**Origin:** existing JSON Forms error mapping distinguishes errors at the array's
path from descendant errors. Adapters may combine them for presentation; a
property named childErrors must not be assumed to contain descendants only.
The shared contract concerns correct presentation and association, not a required
internal collection shape.

In the existing core array-control mapping, errors is a translated/combined
string for the array itself, while childErrors contains structured descendant
errors. A summary requiring structured array-level errors must obtain them from
the appropriate error selector (getErrorAt in the web core integration) or an
equivalent adapter API before aggregation. Do not reconstruct structured errors
from display text or assume that core supplies a separate structured array-level
error prop. This does not prescribe those internal prop names for other platforms.

Provide an accessible explanation of array-level errors near the array, including
when it has no items. For example, minItems can fail for an empty array, while a
missing name inside an item belongs to that item's detail. A combined summary may
present array and descendant errors together; separate displays are also valid.
Do not require duplicate messages merely because an adapter exposes the same
failure in multiple mapped properties.

hideArraySummaryValidation suppresses the optional child-error summary, not the
array's own error explanation. If the implementation uses a combined summary,
retain an appropriate array-level presentation when that summary is hidden.
Apply the agreed validationMode and pre-touch filtering policies consistently;
the summary option itself does not remove validation errors or their validity
contribution.

Item badges and summaries must associate errors with the correct item using path
segments. An error belongs to an item when its normalized control path identifies
that item itself or a descendant, not merely a textual prefix. For example,
employees.10.name must not count as an error for employees.1. Handle root arrays
and escaped property names through the integration's supported path utilities.
Mapped additionalErrors follow the same association rules. Preserve accurate
targeting after reorder/deletion under the existing error and pending-edit
lifecycle contracts.

### Shared array item labels

**Origin:** elementLabelProp is an existing JSON Forms renderer convention;
core supplies schema-aware child-label mapping. The target contract applies
consistent display-label behavior to expandable item headers and ListWithDetail
entries, independently of the UI library.

Use options.elementLabelProp to select an item-relative dotted data path, such
as department or contact.name. This is a data path, not a JSON Schema pointer.
Without an explicit path, use the first primitive property identified by the
shared schema helper. If no usable label is available, provide a readable,
localizable item fallback, such as "Item 1". Preserve 0 and false as meaningful
labels rather than treating them as missing.

For example, the employees property has this schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "department": {
        "type": "string",
        "oneOf": [
          { "const": "eng", "title": "Engineering" },
          { "const": "fin", "title": "Finance" }
        ]
      }
    }
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/employees",
  "options": {
    "elementLabelProp": "department"
  }
}
```

An item containing {"department":"eng"} displays Engineering, or its translated
choice label, rather than the raw constant eng. Resolve the selected property's
schema and use the existing enum/constant-based oneOf label helpers where
applicable. Ordinary values remain data text; do not treat arbitrary user-entered
strings as translation keys. Unsupported or invalid existing values must not
cause data mutation merely to obtain a label.

Editing the selected property or changing locale refreshes the displayed item
label without changing selection or expansion. A label is presentation, not an
item identifier; duplicate labels must not merge items or redirect actions.
For elementLabelProp, dots remain path separators; this does not establish
literal-dot addressing. Brackets are literal characters with core 3.9.0-alpha.1
or newer. The Additional Properties isolated-editor contract below handles
literal dotted names without interpreting them as paths. Do not introduce an additional authoring alias for elementLabelProp.

### Array matching constraints: contains and matching counts

**Origin:** JSON Schema validation keywords; the preferred action prevention
below is a project extension, not an assertion of official renderer behavior.
`contains` requires matching array entries. In supported dialects, `minContains`
and `maxContains` constrain the number of entries matching its schema; these
keywords do not constrain the total array length. Without minContains, contains
requires at least one match. minContains/maxContains have no effect without
contains. minContains/maxContains require draft 2019-09 or later support.
See the [JSON Schema array reference](https://json-schema.org/understanding-json-schema/reference/array#contains).

For example, require at least one primary contact:

```json
{
  "schema": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "primary": { "type": "boolean" }
      }
    },
    "contains": {
      "type": "object",
      "properties": { "primary": { "const": true } },
      "required": ["primary"]
    }
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

The required inside contains matters: an object without primary must not count
as a match. With a supporting dialect, adding minContains 1 and maxContains 1
would require exactly one matching entry, while allowing other nonmatching entries.

These constraints do not select a renderer, replace items, or prescribe a schema
for every item. They apply across the complete array, including a tuple's fixed
prefix and any additional items, without changing positional field selection.
Expose violations through the shared array-level error contract, including for an
empty array; no item needs to exist for the error to be discoverable.

Under restrict, renderer sets SHOULD prevent a discrete deletion that would reduce
a satisfied matching-count minimum below its required value, where matching can
be evaluated reliably. For example, deleting the only primary contact should be
prevented, while deleting a non-primary contact remains possible subject to the
other action restrictions. Evaluate against current data and the configured
validator's dialect/reference semantics without mutating data through default
assignment or other validator transforms. If reliable evaluation is unavailable,
retain validation feedback and document the preventive-support limitation rather
than guessing which entries match.

This preference does not require blocking every intermediate item edit. Incomplete
edits and transferring primary status between entries can temporarily violate
matching counts; allow correction with validation feedback under the shared editing
contract. Do not assume general matching-count insertion prevention or automatic
creation of a valid item. Preserve incoming invalid data and never automatically
add matches, change item values, or delete excess matching entries. General
uniqueItems validation and its separately documented renderer-specific prevention
remain unchanged.

### Tuple control: positional array fields

**Extended presentation contract:** `options.showBorder` defaults to `true`
(global defaults may be overridden per control). Enclose the tuple heading,
fixed positions, additional-items section, and array-level error messages in
one subtle visual boundary. Additional items form an inner section with spacing
or a divider rather than a separate card. `showBorder: false` removes the outer
border and its padding for compact embedding, without removing labels, errors,
or the grouping semantics. This remains an array-bound Control, not a Group
layout. `vertical` independently selects a row or column of fixed positions.

For example, coordinates may use
`{"variant":"tuple","vertical":false,"showBorder":false}`; a positional record
with trailing values uses the default border. Array-level validation such as
`maxItems` highlights the tuple heading and error area, not valid Code/Quantity
positions. Child controls retain their own field-level validation feedback.


**Origin and support:** project extension; **preferred capability — renderer sets
SHOULD support it**. This is a target contract, not a claim of existing official
JSON Forms renderer support. Suggested name: **TupleControlRenderer**. It is a
Control bound to array data, not a layout whose children come from UI schema
elements.

#### Selection and options

| Schema / UI schema | Selection |
| --- | --- |
| Array with positional schemas (`items: [...]` in older drafts, or `prefixItems: [...]` in draft 2020-12) | Automatically eligible for the tuple control; no variant is necessary. Renderer ranking still applies. |
| Array with a single item schema and equal explicit `minItems` / `maxItems` | Retain ordinary array selection unless tuple presentation is explicitly requested. |
| The same uniform fixed-length array with `options.variant: "tuple"` | Render the specified number of positions using the shared item schema. Bounds must be equal non-negative integers. |
| Uniform array with missing or unequal bounds and `variant: "tuple"`, or a non-array schema | Unsupported configuration; report a configuration diagnostic rather than guessing a positional count. |

`options.vertical` defaults to false: arrange positional fields in a row,
allowing responsive wrapping; true stacks them in a column. Derive labels from
each positional schema's title, with a localized position fallback. Delegate each
value to JSON Forms using its positional schema, array-index data path, and the
original root schema for reference resolution. Do not use a single item schema
for all positions when the schema declares different schemas by index.

There are no Add, Delete, or Reorder actions for the declared positions. Equal
bounds alone do not change the presentation of existing uniform-array controls.
An explicit tuple variant may also be accepted for an already-positional schema,
but editors SHOULD omit that redundant encoding.

#### Labels and internationalization

Tuple support includes labels and internationalization for the whole control,
each positional field, and the additional-items section. Reuse the existing
JSON Forms label, description, error translation, and accessible-name conventions.
The parent Control's label describes the tuple as a whole; it must not be copied
onto every delegated field.

For each field, use its effective delegated Control's explicit label when supplied,
otherwise the positional schema title, otherwise a localized position label such
as "Item 1". Visible position numbering is one-based; data paths remain zero-based.
Use the existing translation-prefix precedence: the delegated UI element's i18n,
then its schema's i18n metadata, then the core path-derived prefix. Resolve labels
through `<prefix>.label` with the readable label as fallback; descriptions and
validation errors retain their existing translation conventions. Schema i18n is
JSON Forms metadata, not a standard JSON Schema validation keyword.

Core's path-derived i18n prefix removes array indices. Consequently, different
tuple positions must not be assumed to receive distinct translation keys merely
because their paths differ. Use explicit positional schema i18n prefixes (or
existing delegated UI-schema i18n metadata) when positions need distinct labels:

```json
{
  "type": "array",
  "items": [
    { "type": "number", "title": "X", "i18n": "coordinates.x" },
    { "type": "number", "title": "Y", "i18n": "coordinates.y" }
  ],
  "minItems": 2,
  "additionalItems": false
}
```

For example, an English translation catalog can contain
`"coordinates.x.label": "Horizontal coordinate"` and
`"coordinates.y.label": "Vertical coordinate"`; another locale supplies translated
values under the same keys. Missing translations fall back to X and Y. This
example uses older-draft positional items syntax; prefixItems carries the same
metadata in draft 2020-12.

Uniform fixed-length arrays share their item schema and its metadata. Localize
the position fallback, but do not infer business-specific names such as X/Y from
indices. Authors needing distinct per-position schema labels can use positional
schemas. No new parallel labels/translations option map is introduced here.

Localize the additional-items heading, position labels, Add/Delete and dialog
edit/open actions, dialog titles, and draft/error feedback through the renderer's
existing translator. Position-label translation accepts the displayed position as
a parameter rather than concatenating a fixed English word with a number. Refresh
labels, descriptions, accessible names, and errors when the locale changes without
changing array values, defaults, selection, or active drafts. Compact complex-value
summaries and their dialog controls must retain the positional field's accessible
identity even when the value is empty.

#### Complex position summaries and dialog details

**Extended contract:** reuse composite-cell summary semantics for complex tuple
positions. Object summaries resolve a Control scope against the position value;
without a usable summary, show localized “View details.” Array summaries resolve
against each item, show up to two usable scalar previews and a localized remaining
count, and fall back to the item count. Missing values show localized “Not set.”

Only the Edit icon opens the detail dialog. Summary text remains selectable.
Displaying a summary or opening a dialog must not create or normalize data.

Use the existing ranked UI-schema registry to select a position-specific Control:
its `options.summary` describes the preview and `options.detail` supplies the
dialog UI schema. A registry entry that is already a layout remains usable
directly as the dialog detail. Explicit tuple-wide detail retains the existing
JSON Forms detail lookup precedence; omit it when selecting individual registry
entries. No separate tuple position-options map is introduced.

For an object position, a selected registry UI schema can be:

```json
{
  "type": "Control",
  "scope": "#",
  "options": {
    "summary": { "type": "Control", "scope": "#/properties/street" },
    "detail": {
      "type": "VerticalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/street" },
        { "type": "Control", "scope": "#/properties/city" }
      ]
    }
  }
}
```

For an array of phone strings, summary scope `#` selects each phone string;
detail scope `#` edits the whole position array. Preserve the original root
schema for reference resolution and the actual array-index data path for edits.

#### Coordinate and business examples

A positional coordinate pair needs no presentation variant (draft-07 example):

```json
{
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "array",
    "items": [
      { "type": "number", "title": "X" },
      { "type": "number", "title": "Y" }
    ],
    "minItems": 2,
    "additionalItems": false
  },
  "uischema": { "type": "Control", "scope": "#" },
  "data": [12, 34]
}
```

This presents `X [12]  Y [34]`. In draft 2020-12, replace the positional
`items` array with `prefixItems` and `additionalItems: false` with `items: false`.
The positional-schema count defines the described prefix, not the required data
length: without minItems, missing trailing positions remain schema-valid unless
other constraints require them. Closing the tail prevents extra positions.
See the [JSON Schema array reference](https://json-schema.org/understanding-json-schema/reference/array).

A uniform coordinate pair can request the same presentation explicitly:

```json
{
  "schema": {
    "type": "array",
    "items": { "type": "number" },
    "minItems": 2,
    "maxItems": 2
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "variant": "tuple", "vertical": false }
  },
  "data": [12, 34]
}
```

Uniform schemas use position labels unless a separate supported label mechanism
is configured; use positional schemas when X/Y titles are important. Other uses
include a lower/upper range pair, width/height/depth dimensions, or a business
record encoded as `[productCode, quantity]` with distinct string/integer schemas.
Such presentation does not itself validate relationships such as lower <= upper.

#### Additional items

For positional schemas, show permitted trailing values in an **Additional items**
section below the fixed fields. Label entries by position; there is no property
name input. With an unconstrained tail (the applicable keyword is true or omitted),
use the mixed renderer with type selection. With a tail schema, delegate using
that schema. Older drafts use additionalItems; draft 2020-12 uses items alongside
prefixItems. Renderer sets must declare their supported schema dialects.

**Suggested presentation:** use a distinct section with a heading and an Add
icon button in its header, consistent with the additional-properties control.
Each trailing item has a positional label and a Delete icon button. Use a plus
icon for Add and a trash/delete icon for Delete, with localized tooltips and
accessible names such as "Add item" and "Delete Item 3". Tooltips supplement,
rather than replace, accessible button names. Preserve keyboard and touch access.

Place the positional label above the complete item editor. For mixed values,
align the type selector and delegated value input on the same row; the label
must not push only the selector down. Allow responsive stacking where necessary.
Use each renderer set's normal container, spacing, and action presentation;
these recommendations do not prescribe a CSS framework or new UI-schema options.

Tail Add/Delete actions obey readonly/disabled state, disableAdd/disableRemove,
and minItems/maxItems prevention under restrict. They must not remove or reorder
the fixed prefix. No reorder affordance is required by this contract. If the tail
is forbidden or existing values exceed the permitted count, preserve those values
and expose their errors and an explicit corrective removal action; never truncate
on load. The same preservation applies to an overlong uniform fixed-length array.

#### Missing positions, defaults, and clearing

Render all declared fields even when data is missing, but do not populate the
array merely by rendering it. An explicit edit at a missing index may initialize
preceding missing positions using the shared **Array Add-item initialization**
contract: deep-copy explicit defaults first; otherwise create the supported
unambiguous type's initial value. This includes empty strings, zero, false, empty
arrays, and objects populated from supported property defaults. Preserve existing
preceding values. Commit the filled prefix and the edited value together, without
creating sparse arrays or relying on undefined-to-null JSON serialization.

For schemas `[string, integer]`, editing the second field to 30 while data is []
produces `["", 30]`. For numeric coordinates, editing Y to 34 first produces
`[0, 34]`. These initial values need not satisfy every constraint: an empty string
with minLength 1 remains an error. If a preceding schema has no unambiguous
supported initialization, retain the edit as a local draft and identify the
position needing input rather than inventing a type or null value. The shared
pending-edit and validity contract applies to such drafts.

Absence and emptiness are distinct: [] has no first position; [""] contains an
empty string at index zero. Clearing an existing string preserves that empty
string. Value clearing must never splice the array, shift later positions, or
write undefined into it. For a type without a natural empty value, such as a
non-nullable number, keep a cleared input as a local draft with appropriate
feedback; do not silently replace it with zero or null. Null is an explicit value
only where the schema permits it. Empty objects and arrays remain present values.

#### Validation placement

Apply the shared validation and pending-edit contracts to tuple fields:

- Array-level errors, including minItems, maxItems, and uniqueItems violations,
  appear beneath the tuple as a whole. An array-level error must not automatically
  mark every positional field invalid.
- Position-specific errors appear beside the corresponding delegated field,
  using its array-index data path.
- Nested errors appear at the relevant fields inside a complex position's detail
  dialog. Keep an accessible error indicator beside the closed summary so errors
  remain discoverable without opening every dialog.
- Feedback for uncommitted input, such as clearing a non-nullable numeric
  position, stays beside that editor and follows the shared pending-edit
  contract. Do not present it as a validator error against a value that has not
  been committed.

This placement applies to validator errors and applicable additionalErrors under
the shared error-display rules. Preserve validation independently of whether a
detail dialog is open.

For example, this older-draft positional schema selects the tuple renderer
without an explicit variant:

```json
{
  "type": "array",
  "items": [
    { "type": "string", "minLength": 1 },
    { "type": "integer", "minimum": 1 }
  ],
  "minItems": 2,
  "additionalItems": false
}
```

| Data | Feedback |
| --- | --- |
| `["Code", 0]` | Minimum error beside Item 2. |
| `["", 3]` | Minimum-length error beside Item 1. |
| `["Code"]` | Array-length error beneath the tuple; Item 2 remains available for entry. |
| `["Code", 3, true]` | Excess-item error beneath the tuple; preserve Item 3 and offer corrective Delete, subject to the shared removal restrictions. |

A missing position does not itself contain an invalid value: in the third
example, minItems fails at the array level. Do not fabricate an integer-type
error for the absent Item 2 or populate it merely to display validation.

#### Complex positional values

Object and array positions SHOULD use compact summaries with an edit/open action,
similar to composite table cells. Open a dialog containing a delegated detail form
for that position. Reuse the existing detail UI schema / ranked registry resolution
and fallback generation mechanisms, retaining the position's schema, data path,
and original root schema. This contract does not introduce a new tuple-specific
per-index detail-option encoding. Apply the shared composite-dialog editing,
readonly, pending-edit, and error-display behavior. Errors must remain discoverable
when the dialog is closed, and opening a missing value must not create it until an
explicit edit requires initialization.

Use a dedicated edit-icon button beside selectable summary text. The detail
dialog uses the renderer set's normal dialog surface, title, content area, and
clearly visible action footer. Edits stay in a private draft until Apply commits
the position once. Cancel, Escape, and other dismissals discard the draft. See
the shared composite-dialog action contract below.

The footer optionally offers **Clear** (empty contents) when `showEmptyButton: true`, reusing the shared composite action,
tooltip, and translation keys (including `composite.empty`); no new tuple option
is introduced. Empty an object position to `{}` or an array position to `[]`.
This draft edit preserves the position and the containing array's length; Apply commits it.
Do not offer **Remove value** for a fixed position or write undefined, create a
hole, or shift subsequent positions. Removing a whole trailing position remains
the Additional Items section's explicit Delete action.

For example, emptying Address in
`[{"street":"Main Street"},["111","222"]]` produces
`[{},["111","222"]]`. Emptying the second position instead produces
`[{"street":"Main Street"},[]]`. Opening either dialog alone changes nothing.

Disable Empty contents when the value is absent or already empty, the control is
readonly/disabled, or `disableRemove` is true. Under `restrict: true`, also
disable it when applicable restrictions forbid the empty value: for example,
object `required` or positive `minProperties`, array positive `minItems`, or
`contains` with a required positive matching count. Evaluate these restrictions
against the position schema, not the containing tuple's length constraints.
With `restrict: false`, allow emptying and report resulting validation errors;
readonly/disabled state and `disableRemove` still apply.


Apply composite clearing according to the positional context: Empty contents
retains {} or [] at the same array index, subject to the shared structural
restrictions. Do not offer Remove value for a fixed position or write undefined
into an array slot. For an additional item, removal belongs to its explicit
Delete action in the additional-items section.

For example, emptying the object in ["Office", {"city": "Sofia"}] produces
["Office", {}]. It must not produce ["Office"], a sparse array, or an implicit
null value. If that object is an additional item rather than a declared position,
its separate Delete action may produce ["Office"], subject to the array's
removal restrictions.

### Array tables and detail forms: baseline versus extension

Ordinary JSON Forms selection generally prefers a table for flat object rows
or supported primitive arrays, and a higher-ranked detail-form renderer when
items contain nested objects, arrays, or other supported complex structures.
This is a selection preference, not a claim that every table tester rejects
nested items. Preserve existing `ListWithDetail` selection as well: it uses
`type: "ListWithDetail"` with an object array, rather than a Control variant.

Suggested names: **Array table control**, **Expandable array detail control**,
and **List with detail**. Renderer-family specifications must document exact
nesting tests and rank/order behavior. Primitive-array table support must not
be described as requiring object rows.

The project's extended table behavior SHOULD permit an explicit table request
to keep nested item properties in columns instead of switching to expandable
item forms. Svelte currently accepts `options.table: true` and the compatibility
encoding `options.format: "table"`; these are not assertions of universal
upstream support. The example below uses `table: true`. Selecting a table
must not make a non-array schema applicable, flatten nested data, or discard
complex properties.

#### Shared array action options

**Origin:** existing Material renderer conventions, adopted across the project's
array tables, expandable array forms, ListWithDetail, and AG Grid contracts.
`disableAdd` and `disableRemove` are booleans, both false by default. Resolve each
from per-element options over global JSON Forms config; retain the established
config.disableAdd/config.disableRemove locations rather than introducing names
under jsonformsExtended.

| Option | Effect |
| --- | --- |
| `disableAdd` | True prevents inserting items, independently of current array size. |
| `disableRemove` | True prevents deleting items, independently of current array size. |

``` json
{
  "schema": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": { "name": { "type": "string" } }
    }
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "disableAdd": true, "disableRemove": true }
  }
}
```

These options leave existing item values editable unless another rule disables
editing. Neither inherently disables reorder operations. A false value merely
removes this option's prohibition; it cannot override readonly/disabled state,
core-derived action restrictions, or applicable minItems/maxItems prevention under
restrict. A per-element false may override a global option true, but not those
independent restrictions.

Hide or disable the corresponding affordance and guard the underlying handler.
Apply the policy consistently to toolbar actions, row actions, keyboard shortcuts,
context menus, duplication, insertion/deletion through paste, and batch operations
where those paths exist. Recheck permissions after any confirmation dialog; a
confirmation policy never grants permission to add or remove items. These options
do not by themselves define permissions for dynamic object-property editing.

#### Expandable array-item forms

Suggested renderer name: `ArrayLayoutRenderer`. This is an existing JSON Forms
renderer presentation convention: a Control bound to an object array with nested
item structure normally selects expandable item forms. The reviewed tester uses
isObjectArrayWithNesting at rank 4; exact dispatch still depends on the registry,
including explicit table requests. No accordion variant is needed for this array
presentation. Each panel corresponds to a data item, unlike structural Categories.

**Suggested layout.** Render a bounded section with the array label in a top
toolbar, a child-validation summary indicator, and an Add action at the trailing
edge. Below it, stack item disclosure panels. Each header contains a one-based
index marker, an item label, an indication of item errors, optional Move up/down
actions, a Delete action, and an expansion affordance. Keep action buttons separate
from the disclosure activation target so deleting or moving does not toggle the
panel. Expanded content contains the delegated item form at the item's data path,
with enough spacing for its controls; do not require a particular card library.
An empty array shows a localized empty-state message while retaining the toolbar.

| UI option | Default and behavior |
| --- | --- |
| `initCollapsed` | False: initially open the first item if present. True: initially close all items. Initialization only, not a continuously controlled expansion value. |
| `collapseNewItems` | False: open the newly added item. True: leave it closed and preserve existing expansion. |
| `elementLabelProp` | Optional item-relative dotted data path for its header label. Follow Shared array item labels for choice translations, first-primitive-property fallback, readable item fallback, and preservation of zero/false values. |
| `detail` | Existing item-detail UI-schema convention; delegate at the item path. Otherwise use registered/generated item UI schemas. |
| `showSortButtons` | False: hide reorder actions. True: show Move up/down, disabled at array boundaries or when mutation is prohibited. |
| `hideAvatar` | False: show the index marker. True: hide that marker, without suppressing accessible item identity or validation feedback. |
| `hideArraySummaryValidation` | False: show child-error summary. True: hide that summary only; retain validation and field/item error feedback. |
| `restrict` | Shared preferred default true: enforce minItems/maxItems and applicable mutation restrictions. |

Default to at most one open item; opening another closes the previous item and
all items may be closed. This differs from Categorization accordion's exactly-one-
visible-category rule. Multiple-open presentation is renderer-specific for now,
not another portable option. Preserve expansion through ordinary rerenders;
collapsing must not clear data or suppress validation. Track the logical item
through renderer-owned reorder operations rather than transferring expansion to
the item now at its old index. Reconcile deletion/external replacement without
editing the wrong item; do not inject business-data IDs solely for UI state.

Add initializes an item using its schema/default-generation mechanism, dispatches
the array change, and applies collapseNewItems after insertion. With restrict,
maxItems disables/prevents Add and minItems disables/prevents Delete. Disabled or
read-only state prevents all mutations. Delete follows the shared confirmation policy (fallback always), using a
localized dialog when required; cancel preserves data and expansion. Recheck guards on confirmation and
ensure the operation still targets the intended item. Reordering changes stored
array order, not merely visual sorting. Guard handlers as well as visible buttons.

Provide keyboard-operable disclosure and actions, localized names/tooltips, and
expanded-state relationships. Index styling is optional; item identity and errors
must remain understandable without color or hover alone.

``` json
{
  "schema": {
    "type": "array",
    "minItems": 1,
    "maxItems": 5,
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": {
          "type": "object",
          "properties": { "city": { "type": "string" } }
        }
      }
    }
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "label": "Contacts",
    "options": {
      "elementLabelProp": "name",
      "initCollapsed": false,
      "collapseNewItems": false,
      "showSortButtons": true,
      "detail": {
        "type": "VerticalLayout",
        "elements": [
          { "type": "Control", "scope": "#/properties/name" },
          { "type": "Control", "scope": "#/properties/address" }
        ]
      }
    }
  }
}
```

Here item headers use contact names, item forms edit name and address, Add is
prevented at five entries and Delete at one when restrict is enabled. Reordering
remains available within boundaries and does not change the item count.

#### List with detail

Suggested renderer name: `ListWithDetailRenderer`. This existing JSON Forms
convention selects `type: "ListWithDetail"` bound to an object-array schema.
No Control variant is needed. Show an array toolbar with label, optional child-
validation summary, and Add action above a selectable item list on the left and
a delegated detail form on the right. The list may scroll independently; avoid
requiring fixed pixel widths and adapt the arrangement to available space.
List rows show item labels, selection/error state, and applicable reorder/delete
actions. Keep actions separate from row selection and make them keyboard accessible.

| Option | Behavior |
| --- | --- |
| `elementLabelProp` | Item-relative label path; otherwise use the shared generated item-label fallback. |
| `detail` | Item form UI schema, with scopes relative to the item; otherwise use registered/generated UI schemas. |
| `showSortButtons` | Default false; true exposes Move up/down within array boundaries. |
| `hideArraySummaryValidation` | Default false; true hides the array child-error summary without disabling validation. |
| `restrict` | Shared preferred default true; apply minItems/maxItems and mutation constraints. |

Initially no item is selected, and the detail panel displays a localized selection
prompt. An empty array displays an empty-state message while Add remains available
when allowed. Selection/navigation do not modify data. Add generates an initial
item value and selects the new item for immediate editing. Edits in the detail
panel update that item's original path. Reordering changes stored array order and
preserves selection of the logical item. Deleting the selected item clears
selection; deleting another item preserves the selected item at its new path.
Deletion uses the same confirmation behavior as expandable array-item forms;
cancellation preserves data and selection. Recheck the intended item and mutation
guards when confirming, including after external data changes. Disabled/read-only
state prevents mutations; navigation remains distinct from editing.

``` json
{
  "schema": {
    "type": "array",
    "minItems": 1,
    "maxItems": 5,
    "items": {
      "type": "object",
      "properties": { "name": { "type": "string" }, "notes": { "type": "string" } }
    }
  },
  "uischema": {
    "type": "ListWithDetail",
    "scope": "#",
    "options": {
      "elementLabelProp": "name",
      "showSortButtons": true,
      "detail": {
        "type": "VerticalLayout",
        "elements": [
          { "type": "Control", "scope": "#/properties/name" },
          { "type": "Control", "scope": "#/properties/notes", "options": { "multi": true } }
        ]
      }
    }
  }
}
```

#### Shared table-cell behavior

**Origin:** JSON Forms cell-registry dispatch is an existing convention; the
behavioral parity requirements below are this project's target contract for
ordinary array tables and extended grids. Cells are selected through their cell
registry and effective schema/UI options, not a new top-level UI-schema type.
A renderer may delegate to an ordinary control or implement a specialized cell;
internal component reuse is not required.

A cell retains the corresponding control's value conversion, schema validation,
restrict behavior, readonly/disabled state, and clear-value semantics, including
dynamic-property key preservation where that context applies. Preserve specialized
selection options: password masking, multiline input, radio choices, switches,
sliders, masks, and temporal controls must not lose their meaning merely because
the editor appears in a table. Unsupported cell capabilities must be reported or
use a documented compatible editing fallback, not silently weaken data semantics.

Shared dynamic resolution occurs before cell selection and delegated rendering.
Pass effective UI options, schema/root-reference context, and the original scoped
data path through delegation. Every edit targets the original row/property,
including after view sorting or filtering; a visible row index is not inherently
the stored array index. Reconcile row changes without redirecting an edit or a
pending dialog to another item.

Use compact presentation suited to the column. Repeated visible field headings
may be omitted while retaining accessible identification from the column and row
context. This is a cell-presentation requirement and does not settle the separate
general label: false review. Expose errors at the affected cell through accessible,
discoverable feedback; an array-level summary alone is insufficient. Hiding a
summary does not hide all evidence of an invalid cell or disable validation.

Pickers, popups, and composite dialogs must support keyboard operation, predictable
focus transfer, and focus return to the invoking cell when it still exists. Avoid
clipping interactive overlays to the cell viewport. Keep editing/navigation keys
from accidentally invoking unrelated row actions. Readonly may permit inspection
while prohibiting value changes. Composite cells additionally follow the summary
and detail-dialog contract below.

#### Composite cell detail editing

Suggested name: **Composite cell**; a project extension usable by ordinary
tables and the AG Grid control. Object and array cells show a summary and an
edit trigger opening a dialog with a JSON Forms form for that cell's value.
Scalar cells continue to use appropriate scalar cell renderers.

| Cell option | Meaning |
| --- | --- |
| `options.cells.<property>.summary` | A Control-shaped summary descriptor. For an object, `scope` selects a value relative to that object. For an array, it selects a value relative to each item; `#` selects a primitive item itself. This is not an arbitrary inline form renderer. |
| `options.cells.<property>.detail` | A UI-schema element or layout defining the dialog form, relative to the cell schema/data. |
| Detail omitted | Dispatch `{ "type": "Control", "scope": "#", "label": false }` for the whole cell value. |
| Summary omitted or unresolved | Array item count, object schema title or generic details label, or an unset-value label. These labels should be localizable. |

Array cells use a localized item count by default. An explicit summary descriptor
enables a short per-item preview: show up to two resolved, nonempty scalar values
in array order, separated by commas, followed by a localized "(+N more)" suffix
for items not represented in the preview. Preserve false and zero as text; skip
null, missing, empty/whitespace-only, and object/array results. The remaining count
includes skipped items, so the preview does not imply those items are absent.
If no usable value resolves, fall back to the total item count. Empty [] shows
"0 items"; an absent array shows the localized unset-value label.

For example, summary { "type": "Control", "scope": "#/properties/name" }
on an array of people can show "Alice, Bob (+3 more)". On an array of phone-number
strings, summary { "type": "Control", "scope": "#" } can show
"555-0100, 555-0200 (+1 more)". No new template language or summary-limit option
is introduced. Both object and array cells retain independent detail configuration.

Use translation keys composite.summary.item, composite.summary.items, and
composite.summary.more with count in the translation context. The details and
unset fallback labels use composite.summary.details and composite.summary.unset.

Example for an array of employees containing an object-valued address and
an array-valued phoneNumbers property:

``` json
{
  "type": "Control",
  "scope": "#/properties/employees",
  "options": {
    "table": true,
    "cells": {
      "address": {
        "summary": { "type": "Control", "scope": "#/properties/street" },
        "detail": {
          "type": "VerticalLayout",
          "elements": [
            { "type": "Control", "scope": "#/properties/street" },
            { "type": "Control", "scope": "#/properties/city" }
          ]
        }
      },
      "phoneNumbers": {
        "summary": { "type": "Control", "scope": "#" },
        "detail": { "type": "Control", "scope": "#" }
      }
    }
  }
}
```

The address dialog edits the original employee's address at its full form-data
path. Detail scopes are relative to the address, not the employee or root form.
Use singular `detail`; per-cell detail is distinct from the array-level
`options.detail` convention used by item-detail renderers.

**Extended dialog contract:** editing is transactional. Opening creates a private
draft with the original root schema and path context. Apply commits the edited
value once; Cancel, Escape, the close icon, or backdrop dismissal discard it.
Nested dialog acceptance updates only its enclosing draft until that outer dialog
is accepted. Opening and cancelling emit no form-data changes. Unchanged Apply
also emits no change. Flush pending debounced input before Apply; cancel it on dismissal or an explicit
Empty/Remove action so delayed edits cannot restore discarded contents.
Discard late updates from unmounted draft editors.
Do not overwrite an externally changed target with a stale draft; require reopening.
Preserve validation feedback, enabled/readonly state, and focus restoration.
Apply is not automatically gated on whole-form validity.

| UI option (global default, per-control override) | Default | Meaning |
| --- | --- | --- |
| `showEmptyButton` | `false` | Show Clear inside the dialog, subject to its usual restrictions. |
| `showRemoveButton` | `false` | Show Remove inside the dialog only where the containing context permits removal. Never enables removing a tuple position. |
| `okLabel` | Apply | Text/translation key for committing the draft. |
| `cancelLabel` | Cancel | Text/translation key for discarding the draft. |
| `emptyLabel` | Clear | Text/translation key for the optional empty action. |
| `removeLabel` | Remove | Text/translation key for the optional remove action. |

Reuse the temporal-action convention for explicit labels: translate the supplied
string as a key, falling back to that same string. Without an override use
`composite.apply`, `composite.cancel`, `composite.empty`, and `composite.remove`
with the defaults above. These options affect dialog actions; the external cell
clear icon retains its existing `clearable` contract.

Example: `{"showEmptyButton":true,"okLabel":"address.save","cancelLabel":"address.cancel"}`
with translations `{"address.save":"Save address","address.cancel":"Discard changes"}`.
In a table, place these options on the selected cell descriptor; for a tuple,
use the tuple options or the registry-selected position Control options.


#### Dialog action guidance and pending updates

Apply is the default commit label (replacing the earlier Done wording); Cancel
is the discard label. Temporal pickers retain their existing OK/Cancel defaults.
Keep the option names `okLabel`, `cancelLabel`, `emptyLabel`, and `removeLabel`.
Clear means emptying contents; Remove means unsetting the property. Both remain
opt-in dialog actions and remain subject to contextual restrictions. Use
localized tooltips, available on hover and keyboard focus:

| Action | Translation key | Default tooltip |
| --- | --- | --- |
| Apply | `composite.applyTooltip` | Apply changes and close. |
| Cancel | `composite.cancelTooltip` | Discard changes and close. |
| Clear | `composite.emptyTooltip` | Clear contents, keeping the object or array. |
| Remove | `composite.removeTooltip` | Remove this value from the form data. |

Tooltips supplement visible labels and accessible names; do not require a tooltip
for operating the dialog on touch devices. Give Remove destructive styling.
Fixed tuple positions may offer Clear, never Remove.

**Required lifecycle, independent of framework or debounce library:**

1. Open a private draft. Descendant edits and their validation update that draft,
   not the committed form. Retain the root schema and scoped data path.
2. On Apply, flush pending debounced child edits into the draft **before** reading
   its value. Complete any required asynchronous preparation before accepting;
   do not commit an older value while the last edit is still queued. Recheck
   enabled state and target identity, then commit once and close. An unchanged
   draft produces no data update. Flushing is not permission to commit a partial
   or invalidly parsed input; the shared pending-edit contract still applies.
3. On Cancel, Escape, close-icon activation, or backdrop dismissal, cancel queued
   updates, discard the draft, and close without publishing a form-data update.
   Cancel must not flush changes to the committed form or implement rollback by
   first writing edits and later restoring a snapshot.
4. Clear and Remove supersede earlier pending edits in their target. Cancel those
   queued edits before modifying the draft so Apply cannot restore cleared data.
   These actions remain draft-only until Apply; Cancel also discards them.
5. Unmounting or replacing a draft editor cancels its pending work. Ignore late
   timers and asynchronous completions from a discarded session, including after
   reopening the same dialog. Nested Apply writes only to the enclosing draft;
   cancelling the outer dialog discards the nested edits too.

For example, type a street and immediately click Apply, before its debounce delay
expires: the new street must be committed once. Type and immediately Cancel:
no change is committed, even after waiting past that delay or reopening. Type,
then Clear, then Apply: the result is the empty container, not the queued street.
Recheck restrictions at action execution; do not overwrite an externally changed
target using the stale draft. Implementations should test these sequences,
including keyboard dismissal and nested dialogs, without relying on an arbitrary
sleep to make the expected behavior work. No universal debounce delay or new
UI-schema debounce option is introduced.

Composite cell interaction and clearing are part of the project contract:

- Open the detail dialog only by activating a dedicated edit-icon button, including
  keyboard activation. Clicking or selecting the summary text must not open it.
  Render summary text separately from the button so users can select and copy it
  with normal platform actions. Clicking the summary does not automatically copy
  it to the clipboard. Grid selection/focus must not convert that interaction into
  a dialog trigger or prevent ordinary text selection.
- The edit icon is a real focusable button with a localized accessible name such
  as "Edit Address". It may be visually revealed on cell hover or focus-within;
  it must remain discoverable by keyboard and available on touch devices.
- Add a separate clear X for **Remove value**, following the shared clear-button
  visibility contract. It appears only for a present value when the cell is hovered
  or focused, with equivalent touch access. Empty objects and arrays are still
  present values. Give the action its own localized accessible name and keep it
  separate from both summary selection and the edit trigger.
- Inside the dialog, provide **Apply** and **Cancel**. **Clear** and
  **Remove** are hidden by default and shown only by their explicit options.
  Empty contents assigns {} for an object or [] for an array, retaining the
  container and its property. Remove value unsets the scoped property through
  the normal change mechanism; undefined is an internal removal instruction,
  not a serialized JSON value. Disable redundant Empty contents on an already
  empty container and do not offer removal for an absent value.
- Respect readonly/enabled state for both mutations. Under restrict, Empty
  contents must respect applicable structural restrictions, including minItems,
  minProperties, and required child properties. Do not use it to bypass protected
  deletion rules. Property removal follows the existing context-specific removal
  and clearing rules; distinguish required child properties from the parent
  declaring the cell property required, which still follows the shared
  required-control clearing contract and ordinary validation.
- In a dynamic additional-property context, clearing contents retains the key.
  Removing the key belongs to the explicit property Delete action; do not expose
  a competing generic unset action that bypasses its restrictions.
- If the cell represents an array element itself, never write undefined to that
  slot. Element removal belongs to the owning array's delete action and obeys its
  restrictions. Unsetting an object-valued property within a table row is a
  different operation and must not remove the row or shift array indices.
- Empty/remove actions change only the dialog draft, like delegated field edits.
  Apply commits; Cancel discards all of them. Apply the existing confirmation
  policy where required.

For the people-table example, an address containing street "Main Street" displays
that street as selectable summary text. Only its edit icon opens the configured
address detail layout; clicking the street must not open the dialog. Empty
contents changes address to {}, while Remove value removes address from that
person and leaves their other properties intact. Emptying phoneNumbers produces
[] (zero items); removing it leaves phoneNumbers absent. These different model
states must not be conflated.

#### Mixed-value control and deep-structure navigation

**Origin:** project renderer contract. Suggested name: `MixedRenderer`. Select
for a Control with a resolved schema whose type is an array of permitted JSON
types. An unconstrained true schema may also be edited through this renderer;
a false schema must not be treated as permitting arbitrary values. More specific
explicit renderer requests remain subject to registry precedence. No mixed-type
variant is required.

``` json
{
  "schema": { "type": ["string", "integer", "boolean", "null", "object", "array"] },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Initialize the type selection from the existing value without replacing or
coercing it. An integer is also admissible under number. Preserve out-of-domain
incoming data for correction and display validation errors. Explicitly choosing
a different type initializes its value through the normal default-generation
mechanism. Apply the shared typeChange confirmation policy: fallback complex
confirms replacement of a nonempty object/array, without routine prompts for
simple values. Explicit configuration can require or suppress confirmation.
Selecting the current type must not reset it. Disabled/read-only state prevents
these mutations. Both mixed and oneOf changes use the shared confirmation
policy, with their documented operation-specific fallbacks.

Selecting null writes JSON null; clearing removes the selection/value using the
shared clear-value contract. Empty string, null, and absence remain distinct.
For an array item, do not offer a clear-type action and guard the handler against
unsetting the slot. This applies to ordinary array items, additional tuple items,
and fixed tuple positions. Type changes replace the value at the same index;
selecting null, when allowed, writes actual JSON null and retains its tree node
and type selection. With primitive/leaf nodes visible, a null item remains
selectable and its detail panel must allow changing its type.

Deleting an item is a separate array action that removes the position and obeys
the array's restrictions; fixed tuple positions cannot be deleted. Clearing a
value, such as changing a string to an empty string, remains distinct from
clearing its type. Never create undefined values or sparse array slots: their
serialization as null is not equivalent to storing an actual null value and
must not be used to conceal an invalid internal data state.

The clear X follows shared focus/hover and data-presence rules. Choosing a type
does not guarantee that the remaining schema constraints validate.

**Value schema and delegated rendering.** Resolve references in the scoped
schema and derive an independent rendering schema for each allowed type. Narrow
type to the selected single type and exclude type-inapplicable keywords from the
rendering view so testers choose the appropriate editor. Retain applicable
constraints, formats, annotations, and reference context. A schema default is
usable only when compatible with the selected type; otherwise use normal
initialization for that type. Keep the original schema authoritative for full
validation and never mutate the caller's schema during normalization.

Where dispatch expects the enclosing schema and original Control scope, replace
only the scoped subschema in a copied enclosing schema. Preserve the original
data path and root-reference context. Normalize unconstrained array items into
an editable mixed-type schema when necessary, without weakening constrained or
false item schemas. Select the value editor through normal JSON Forms registry
and UI-schema delegation, rather than hardcoding one widget for each type.

`options["<type>-detail"]` supplies a type-specific detail UI schema (for example,
`object-detail` or `array-detail`), taking precedence over general detail for that
type. Otherwise use ordinary registered/generated UI schemas. This is an extended
option convention; UI schemas and resulting controls still pass through shared
dynamic resolution and normal dispatch.

**Primitive layout.** For string, integer/number, and boolean values, place the
type selector on the left and the delegated value editor immediately to its
right. Align the actual input controls despite differing labels, descriptions,
and validation messages; avoid duplicating labels solely to achieve alignment.
The value area takes remaining width. Boolean editing follows the same aligned
row. Null or no selection displays the type selector without a value editor.
Responsive layouts may stack controls when necessary while preserving order.

**Object/array layout.** Complex values open a navigation workspace with a
resizable splitter: a searchable tree on the left and the selected node's editor
on the right. This avoids rendering deeply nested structures as progressively
indented, nested forms. Navigation changes the viewed path, not the data.
Provide accessible splitter resizing, tree navigation, selection, and named
controls without depending on a particular component library.

The tree represents object properties and array items. Search filters nodes by
field label/path and retains the ancestors needed to locate matches. Provide a
"Show primitive values" toggle for leaf nodes such as strings, numbers, booleans,
and null; default off so the tree emphasizes objects and arrays. This toggle and
search are local presentation state, not filters on stored data or validation.
Selection and the selected node's detail editor are independent of tree-row
visibility. Preserve the search text and the "Show primitive values" setting
across navigation, rename, and type changes. Apply the active filters normally:
do not force a nonmatching selected row or its ancestors into the filtered
results, and do not clear the search to reveal a selection.

For example, with search "customer", renaming customer to client selects client
and keeps its detail panel open at the new data path. If client does not match
the active filter, its tree row remains hidden while its logical tree selection
is retained. Clearing or changing the search to include client reveals that same
selected row. Similarly, hiding primitive rows, or changing a selected complex
value to a primitive while primitive rows are hidden, must not close its detail
panel or redirect selection to the root. Explicit View navigation may select a
filtered-out node without changing the filters; open its ancestor chain for
when it becomes visible. Reconcile selection to a surviving node only when the
selected data path actually ceases to exist, not merely when its row is hidden.

Hovering or focusing a tree row exposes applicable delete and rename actions.
Keyboard users must have equivalent access. Rename applies to object-property
keys, not array indices, and follows the additional-property contract: validate
names, reject collisions, preserve values, and reassess the schema at the new
path. Update tree selection after rename. Deletion updates the owning object or
array and reconciles selection to a surviving node. Apply the shared delete confirmation policy (fallback always); cancel leaves
data and selection unchanged.

After an explicit deletion, reconcile selection using complete data-path segments:
- If the selected node or one of its ancestors was removed, select the nearest
  surviving parent.
- Deleting an unrelated object property preserves selection. For example,
  deleting `item` must not affect selection of `itemCode`.
- Deleting an earlier array element shifts the selected surviving item's index
  down by one, preserving any descendant suffix. With
  `["Alice","Bob","Carol"]`, selecting Carol at index 2 and deleting Alice keeps
  Carol selected at index 1. A selected `people.2.name` becomes `people.1.name`.
  Deleting index 1 must not classify index 10 as its descendant.
- Preserve active search and primitive-visibility filters during reconciliation.
  Subsequent edits must use the reconciled path, not the removed or previous index.

For external array replacements without stable item identity or an explicit
mutation description, do not infer identity from equal values or promise to
follow the same item. Reconcile against the new structure, discard stale target
state, and apply the shared pending-edit rules so queued work cannot be redirected
to a different item.

Use the shared `restrict` option (preferred default true), not a new strict
option. Prevent deletion below parent minProperties/minItems and removal of
required properties, and apply maxProperties/maxItems to additions. Enforce
constraints in handlers as well as action availability; count all properties.
Rename preserves property count but must obey required-key and name rules.
Readonly/disabled prevents mutations regardless of restrict. Inherit schema
`readOnly` through every ancestor and into delegated detail editors; an editable
root does not authorize editing a locked descendant. Recheck current permissions
in delete/rename handlers and when accepting a previously opened confirmation.

The web integration requires JSON Forms core 3.9.0-alpha.1 or newer. Its data
paths use dots as separators and treat brackets literally: `test[0]` names a
property, while `test.0` addresses an array element. Additional-property Add and
Rename accept brackets (subject to schema name validation); edit, clear, rename,
and delete must preserve literal keys, including under bracketed parent keys.
Numeric object keys remain object keys.

**Literal-key tree navigation and editing (extended contract).** Tree node
identity must preserve exact property-key segments. A literal `"a.b"`, nested
`a` → `b`, and an empty key are distinct nodes. Use an unambiguous internal
encoding for keys that cannot be represented by ordinary core paths. Such IDs
are tree state only: never dispatch them to core or persist them in form data.
Show an empty key as `""` so it remains discoverable and searchable.

Selecting a node below a literal dotted or empty key opens an isolated form
rooted at its value, using the applicable value schema and preserving references,
validation, i18n, configuration, readonly state, and renderer registrations.
Translate nested View/drill-in actions back to the parent tree so the existing
tree and selected-node panel remain coordinated. Preserve the selected editor
when filtering or hiding primitives removes its visible tree row.

Write changes through a copy of the mixed renderer's data using exact own-key
segments, then dispatch at the mixed renderer's valid root path. Rename and
Delete similarly copy the actual parent object/array. Do not interpret brackets
or dots inside a property name as nested paths. Recheck permissions and ancestor
`readOnly` constraints at mutation time; apply parent `minProperties`/`minItems`
restrictions when restriction mode is enabled. Rename validates the actual
parent schema's name constraints, preserves whitespace, prevents collisions,
and selects the new node identity. Array deletion must rebase the selected index
without confusing similarly named object keys. An obsolete editor must not
recreate a property that has already been removed.

For example, with `{"": {"asd": {"": "value"}}}`, selecting the innermost
`""` node edits that string without applying the enclosing object's
`propertyNames` constraints at a deeper level. A name constraint belongs to the
object schema that declares it; it is not inherited by arbitrary nested objects.

This support does not change core path syntax for ordinary Controls. A delegated
aggregate object form that would expose schema-declared dotted/empty keys
through ordinary core paths must remain view-only; select the individual tree
node to edit its value through the isolated editor. Other direct-path integrations
must likewise protect unsupported operations rather than mutate a different key.

Resolve the actual
parent schema, including references and applicable patterns, rather than guessing
constraints from the currently displayed child.

**Drilling into complex values.** In a parent's form, a nested object or array
is represented compactly by its type selector followed by a "View" action,
commonly an eye icon. Activating View selects that node in the left tree,
reveals its location, and replaces the right panel with its own editor. It must
not open another recursively nested workspace or copy the value elsewhere.

The selected complex node's right panel places its type selector across the full
width above its delegated object/array form, allowing direct type changes there.
The tree root may use its already-visible workspace type selector instead of
duplicating it. Descendant complex fields in that form again use compact View
references. Breadcrumbs or equivalent ancestor navigation support returning to
parent nodes. All delegated edits operate on the original node path. Reconcile
the tree and detail panel after type changes, deletion, rename, and external
data updates without redirecting an edit to the wrong array item/property.

#### Combinator controls: oneOf, anyOf, and allOf

**Origin:** combinator Control selection is an existing JSON Forms renderer
convention. The default presentations below follow the Svelte/Vuetify renderer
families; the preservation policy for enclosing properties is the project target
contract. Match a Control whose resolved schema contains the corresponding
combinator. No particular primitive type is required. More specific finite-choice
oneOf/const and string-or-enum anyOf renderers take precedence where applicable;
do not turn arbitrary branches into enum values.

Combinator keywords describe validation composition; their presence does not
inherently require a branch selector or multiple forms. **Project presentation
contract:** when composition describes one unambiguous scalar editor, render it
once and preserve the outer Control's label, description, i18n, options, and data
path. Annotation-only branches do not create separate inputs. The branch-form
defaults below apply when distinct editing forms are appropriate; existing
specialized finite-choice renderers retain their selection conventions.

For example, the draft-07 meta-schema defines:

```json
{
  "definitions": {
    "nonNegativeInteger": { "type": "integer", "minimum": 0 },
    "nonNegativeIntegerDefault0": {
      "allOf": [
        { "$ref": "#/definitions/nonNegativeInteger" },
        { "default": 0 }
      ]
    }
  },
  "type": "object",
  "properties": {
    "minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" }
  }
}
```

A Control scoped to `#/properties/minLength` renders one integer input labelled
"Min Length", with minimum 0. The default annotation does not describe another
field, and delegating the input at a branch-local scope must not lose the outer
property's label. Default assignment remains subject to the existing validator
and initialization contracts.

Any schema derived for renderer selection or presentation must not replace the
original validation schema or discard its constraints. Do not shallow-merge
arbitrary allOf branches, or collapse oneOf/anyOf alternatives merely because
their types match. Their intersection, exclusive-match, and alternative-match
semantics remain distinct. If a safe single-editor presentation cannot be
established, retain the supported combinator presentation and full validation.

**Validation-only scalar alternatives and native input restrictions.** When an
unambiguous scalar type is established and branches only add validation
constraints, prefer one scalar editor without branch tabs or a branch selector.
For example:

```json
{
  "type": "integer",
  "anyOf": [
    { "maximum": 10 },
    { "minimum": 20 }
  ]
}
```

One integer input accepts 5 and 25; 15 produces a validation error. Do not copy
both branches' bounds onto the input: minimum 20 and maximum 10 would prevent
valid entries. Even choosing just one branch's bound would exclude values that
the other branch permits.

```json
{
  "type": "integer",
  "oneOf": [
    { "multipleOf": 3 },
    { "multipleOf": 5 }
  ]
}
```

Here 6 and 10 are valid, while 15 is invalid because it matches both branches.
A single integer editor retains that exclusive-match validation; no user branch
selection is necessary. Do not derive an input step from an arbitrary branch.

Native min/max/step, length limits, picker restrictions, and other input
prevention must be safe for the complete composition. Enclosing restrictions
remain applicable. Branch restrictions may be used only when their combined
meaning is reliably established; otherwise leave them to full-schema validation
and error feedback. The restrict option does not authorize an unsafe merge or
the exclusion of valid alternatives. Editing does not reset data or invoke a
branch-change confirmation merely because a different branch now validates.

Preserve specialized finite-choice and string-suggestion conventions. Retain
branch-form presentation when alternatives need distinct editors or layouts, or
when a safe single-editor presentation cannot be established. These rules add
no UI-schema option and do not change the schema's validation semantics.

**Visible scalar-composition errors.** A failed composition must provide localized
feedback beside its single input under the shared validation-display rules.
For the disjoint-range example, 15 fails because no permitted alternative
matches. Present that alternative-match failure rather than displaying both
branch bounds as simultaneous requirements. For the exclusive-multiple example,
15 fails because more than one alternative matches; selecting an editor branch
would not resolve that error.

Summarize failed alternatives without hiding independent enclosing constraints.
For allOf, the individual constraints apply together and their relevant errors
can be shown normally. Preserve structured validator errors and form validity;
do not publish duplicate additionalErrors solely to restore visible feedback.
The error-display projection must not mutate the original errors. Support
localized messages, accessible invalid state, validation visibility settings,
and feedback removal on correction. Host additionalErrors retain their existing
ownership and visibility rules.

| Suggested renderer | Default UI | Data and validation semantics |
| --- | --- | --- |
| OneOfRenderer | A dropdown of branch labels with the selected branch's form below it. | Explicit branch changes may replace branch data after confirmation. Exactly one branch must validate. |
| AnyOfRenderer | Tabs selecting the branch form to display over the same bound value. | Tab navigation alone preserves data; one or more branches may validate. These are editor views, not checkboxes enabling schema branches. |
| AllOfRenderer | The enclosing properties followed by all branch forms in schema order, without a branch selector; a matching registered UI schema may supply a combined form. | All editors address the same value, and every branch constraint remains applicable. |

Branch titles supply human-readable labels through the normal combinator label
and translation machinery, with generated labels when titles are absent. Branch
forms use registered/generated UI schemas at the same scoped data path. Outer
properties are presented independently of selected branch content. The configured
validator evaluates the full schema, not merely the currently visible branch.
The inspected Vuetify `options.variant: "tab"` for oneOf is a renderer-specific
alternative, not a new portable variant or a requirement for other families.
Additional-property editing, when available, follows the object contract below;
options.allowAdditionalPropertiesIfMissing controls availability, not validation.

**Initialization and data preservation.** Opening the form selects a suitable
editor for the existing value without replacing that value with defaults. If the
value matches a later oneOf branch, display that branch. If none matches, a
fallback branch may be displayed alongside validation errors, while retaining
the incoming data for correction. If multiple branches match, selecting one for
display does not resolve the oneOf validation error. With no value, the dropdown
may initially have no selection. Mounting, remounting, or choosing an initial
view must not itself write generated defaults to form data.

**Explicit oneOf branch changes.** When the user selects a different branch,
apply the shared branchChange confirmation policy (fallback always) before
discarding existing values. Once permitted and, when required, confirmed, initialize from the
selected branch's generated defaults and preserve existing values of properties
declared in the enclosing schema's own properties. Those preserved values take
precedence over generated defaults. Replace other branch-specific data; do not
infer preservation merely because two branches contain the same property name.
Cancel preserves both committed data and the previous selection. Disabled or
read-only state prevents data-changing branch switches. Selecting the already
selected branch must not reset it. Branch selection alone does not establish
validity or guarantee all required values have been generated.

``` json
{
  "schema": {
    "type": "object",
    "properties": { "name": { "type": "string" } },
    "oneOf": [
      {
        "title": "Email contact",
        "properties": {
          "kind": { "const": "email", "default": "email" },
          "email": { "type": "string" }
        },
        "required": ["kind", "email"]
      },
      {
        "title": "Phone contact",
        "properties": {
          "kind": { "const": "phone", "default": "phone" },
          "phone": { "type": "string", "default": "" }
        },
        "required": ["kind", "phone"]
      }
    ]
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Given `{"name":"Alex","kind":"email","email":"alex@example.com"}`,
initial rendering shows Email contact without changing the data. After an explicit,
confirmed switch to Phone contact, the generated initial value is
`{"name":"Alex","kind":"phone","phone":""}`. Name survives because it is
in the enclosing properties; email is removed, and the phone form is displayed.
A new branch may further constrain name, so preserving it can still leave a
validation error requiring correction. Preservation does not override validation.

Examples for the other default presentations:

``` json
{
  "schema": {
    "type": "object",
    "anyOf": [
      { "title": "Email", "properties": { "email": { "type": "string" } }, "required": ["email"] },
      { "title": "Phone", "properties": { "phone": { "type": "string" } }, "required": ["phone"] }
    ]
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Switching tabs does not delete email or phone. A value containing both can satisfy
anyOf; the active tab is presentation state only.

``` json
{
  "schema": {
    "type": "object",
    "allOf": [
      { "title": "Identity", "properties": { "name": { "type": "string" } }, "required": ["name"] },
      { "title": "Contact", "properties": { "email": { "type": "string" } }, "required": ["email"] }
    ]
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Both forms are shown by default and edit the same object. Neither branch is
optional. Combining the presentation must not weaken overlapping constraints or
reinterpret allOf as a shallow schema merge.

#### Object controls and additional-property editing

Suggested renderer name: `ObjectRenderer`. Match a Control whose resolved schema
is an object schema. Basic object dispatch and `options.detail` follow existing
JSON Forms conventions. Additional-property editing and the options below belong
to this project's extended object contract; they are not universal core features.
Dispatch a nested form at the object's data path. An explicit detail UI schema
uses scopes relative to that object; otherwise select a registered detail UI
schema or generate one. A more specific applicable renderer may take precedence.

| Input | Effect on editing |
| --- | --- |
| `options.detail` | Supplies the nested object form using the existing detail convention. |
| `additionalProperties: true` or a schema | Exposes dynamic-property editing; a schema determines additional values' editors and validation. |
| Nonempty `patternProperties` | Exposes editing of pattern-matched properties; apply all matching schemas, not just the first match. |
| `options.allowAdditionalPropertiesIfMissing` | Default false. True exposes dynamic-property editing when additionalProperties is absent. This controls UI availability, not whether schema validation permits extra keys. |
| `additionalProperties: false` | Disallows new keys outside declared properties and pattern matches; it does not prohibit keys allowed by patternProperties. |
| `propertyNames` | Constrains key names, including names proposed during add/rename. |
| `minProperties` / `maxProperties` | With restrict enabled, prevent removals/additions that violate size bounds, counting all keys, including declared properties. Follow the common repair behavior for invalid incoming data. |
| `required` | Prevent removal or rename that would remove a required key under the common restrict contract. |

``` json
{
  "schema": {
    "type": "object",
    "properties": { "title": { "type": "string" } },
    "additionalProperties": { "type": "string" },
    "propertyNames": { "pattern": "^[a-zA-Z][a-zA-Z0-9_]*$" },
    "maxProperties": 5
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Here additional values use string editors, the name-entry UI validates proposed
keys, and the five-property limit includes title when present. For a schema that
omits additionalProperties, opt into the editing UI explicitly:

``` json
{
  "schema": { "type": "object" },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "allowAdditionalPropertiesIfMissing": true }
  }
}
```

Rename must reject collisions instead of overwriting another property's value.
A rename preserves the value, changes the key atomically, and reassesses the
applicable value schema and renderer under the new name. It does not change the
property count. Preserve schema-invalid incoming values for correction rather
than dropping or coercing them. Disabled/read-only state prevents all mutations.

##### Rename into a different value schema

Name validity and value validity are separate. For example:

```json
{
  "type": "object",
  "patternProperties": {
    "^text_": { "type": "string" },
    "^count_": { "type": "integer", "minimum": 0 }
  },
  "additionalProperties": false
}
```

Renaming text_quantity in `{"text_quantity": "five"}` to count_quantity produces
`{"count_quantity": "five"}`. Accept the rename if the name and permissions allow
it, select the integer renderer, and display the type error at the new location.
Do not convert the string to zero, drop it, or reject the name merely because the
retained value is incompatible.

The renderer may display incompatible data using its native input behavior.
A numeric input may appear blank for a nonnumeric string; the ordinary validator
error explains that the stored value is not a number. Do not force conversion,
erase the data, or require a separate always-visible original-value panel.

When the native widget cannot faithfully represent the stored value, a compact
hint icon beside the input is recommended. Show the original JSON value in a
tooltip on hover or keyboard focus, distinguishing strings such as `"5"` from
numbers such as `5`. Keep the normal validator error in its usual location.
The icon must not add a separate row or push the input away from its label.
Readonly controls may still expose the hint for inspection.

Web numeric controls use `numeric.incompatibleValue` (default: "Stored value")
for the accessible hint label and `numeric.clearValue` for a separate clear
label when needed. Translate labels, not raw values; render values as escaped
text. Link the tooltip to its trigger and input with accessible descriptions.
Only an explicit edit or clear changes data; mounting or switching a renderer
must not coerce the original value.

The Rename dialog reports name errors such as collisions or propertyNames
violations. After successful rename, the value control reports value errors
using the normal validation and i18n pipeline. Do not add a confirmation dialog
solely because the applicable validation schema changes. Existing permissions
and applicable confirmation policy still apply.

Property names must retain their exact identity. Additional Properties accepts
literal dots, brackets, Unicode, leading/trailing whitespace, and the empty
string when explicitly enabled and allowed by the schema. Do not trim names or impose a character
blacklist. Schema name restrictions (`propertyNames` and applicable
`patternProperties`/`additionalProperties` rules) still apply. Existing keys and
schema-owned property names cannot be added again; rename must not overwrite a
different property. Readonly state and object size constraints still govern
which operations are available.

**Empty property name policy.** `allowEmptyPropertyNames` is a boolean option
available in global config and `uischema.options`, defaulting to `false`.
An explicitly supplied UI-schema option overrides global config, including
`false` overriding `true`. It applies to Add and Rename in Additional Properties
and to mixed-tree Rename. When disabled, reject names whose `trim().length` is
zero. When enabled, accept empty and whitespace-only names subject to schema
name constraints and collision checks. Preserve every accepted name exactly;
trimming is only a blankness check. The presence of `propertyNames` does not
automatically enable this option, and schema constraints always apply.
Existing empty or whitespace-only keys remain visible and editable and may be
deleted or renamed to a permitted name regardless of this option. This policy
is independent of empty property-value storage and clearing behavior.

**Empty-name presentation.** In the Additional Properties control, an empty
property name has a visually blank label. Do not display the literal text
`""` as a substitute name. Reserve the label/action space needed to keep
Rename/Delete above the value input without adding a separate action row to
ordinary named properties. A mixed editor's type selector and value input must
remain aligned. This is presentation only: the actual key remains the empty
string, and name validation, exact-key addressing, and accessibility of the
action buttons are unchanged. This rule does not change tree-node naming.

**Empty add-name draft feedback.** An exactly empty name input must not show
inline name-validation errors on initial load or after it is cleared or reset,
including an empty-name collision when `allowEmptyPropertyNames` is enabled.
Suppressing that feedback must not bypass validation: Add stays disabled when
the empty name is disallowed, already exists, or violates schema constraints,
or when permissions or applicable property-count limits prevent adding.
A permitted empty name can still be added when the option is enabled. Nonempty
duplicate or invalid drafts retain their ordinary inline validation feedback.
This feedback rule applies to the Add name input, not the Rename dialog.

**Literal-key editing (extended renderer contract).** Core data paths still use
dots as separators. A literal dotted name or empty name must therefore be edited
in an isolated form rooted at that property's value (`scope: "#"`), with updates
written to the containing object using the exact property key. Never construct
a child data path from such a name. This supports nested dynamic objects as well
as scalar values; clearing a value preserves its dynamic property, while Delete
explicitly removes the key. Use own-property access and safe property creation
so names such as `__proto__` do not alter object prototypes.

The web implementation selects the editing strategy as follows. These are
transport details, not additional schema restrictions:

| Property name | Handling |
| --- | --- |
| `a.b` | Isolated value editor; the dot is part of the key, never a separator in a dispatched child path. |
| Empty string (`""`) | Isolated value editor; its root represents the value of the empty-named property, not the containing object. |
| `test[0]`, `part]name[` | Normal delegation with core 3.9.0-alpha.1 or newer; brackets are literal characters. |
| `15` on an object | Remains an object key; do not create an array merely because the segment is numeric. |
| `  name  `, Unicode, `/`, `~`, or other schema-permitted characters | Preserve the exact name. Slash and tilde need escaping when constructing JSON Pointers, not when storing the key. |
| `__proto__` and other names also found on object prototypes | Treat as own data properties. Use safe property definition/copying, never prototype assignment or inherited-property lookup. |

For an isolated editor, read the value with an own-key lookup such as
`parentData[propertyName]`. Its UI schema starts at `scope: "#"`; do not pass
`parentPath + "." + propertyName` as its editing path. When a changed value is
returned, recheck editability and that the property still exists, ignore an
unchanged value, and replace the parent object with a copy containing the exact
key and new value. Add and Rename use the same literal-key discipline; Delete
removes that own key from a copy of the parent object. Check collisions using
own keys so `toString`, for example, is not rejected merely because it exists on
an object prototype.

When the containing object is itself under a dotted dynamic name, repeat this
isolation at that boundary. Nested editors update their immediate isolated
parent, and parent-object updates propagate outward without ever dispatching a
path containing a literal dotted segment.

For example, editing or deleting `"a.b"` in
`{"a.b": 1, "a": {"b": 2}}` must leave `a.b` inside the separate object `a`
unchanged. The parent update replaces the literal key, not the nested value.

The isolated editor must preserve the property's schema, local and recursive
root references, validation mode, renderer/cell registrations, UI-schema registry,
configuration, i18n, and readonly behavior. Validation errors must remain
associated with the actual property in the parent data. Rebase local schema
references without rewriting JSON values inside `default`, `enum`, or `const`.
Add must flush pending name-input changes before validating and creating the
property, including when the empty string is a permitted name.

Additional Properties and the mixed-tree selected-node editor use this isolation
strategy. Ordinary Controls still cannot address literal dots through a core
data path; unsupported direct-path operations must remain blocked rather than
silently editing a different property.

##### Value schemas for dynamic names matching multiple patterns

Evaluate every regex in `patternProperties` against the exact property name;
matching is not first-match selection, and patterns are not implicitly anchored.
Every matching schema applies conjunctively, as with `allOf`. Use the
`additionalProperties` schema only when the name matches neither a declared
`properties` entry nor any pattern. In particular, `additionalProperties: true`
must never replace a matched value schema.

For a dynamic key without a declared property schema, select its editor using
all matching schemas. Compatible scalar constraints should produce one control
with their combined restrictions: `^price_` specifying a number with minimum 0
and `_total$` specifying maximum 1000 give `price_total` one number editor
bounded by 0 and 1000. Reversing pattern declaration order must not change this
behavior. Multiple lower bounds use the strongest lower bound, and multiple
upper bounds use the strongest upper bound.

Do not perform an arbitrary shallow merge of structural or incompatible schemas.
Retain their conjunction when a safe scalar projection is unavailable. Preserve
incoming values and expose validation errors; schema selection must not coerce
or discard data. The original full object schema remains authoritative for
validation, including constraints not projected into native input behavior.

Recompute the applicable schemas after Add/Rename or schema changes, preserving
the renamed property's value. Regexes may be compiled and cached per pattern set;
all patterns still need evaluation for each new name. A value-only change does
not change which names match, although value validation must run again.

The shared **Additional properties (overlapping patterns)** example illustrates
overlap, reversed pattern order, a single match, fallback schemas, and renaming.

##### Pattern-derived errors on existing property controls

A declared property can also match one or more patternProperties schemas. Those
constraints participate in validation of its value; they do not require a second
control in the additional-properties editor. That editor must reject adding a
name already declared by the schema, as well as collisions with existing data.

```json
{
  "type": "object",
  "properties": {
    "price_total": { "type": "number", "title": "Total price" }
  },
  "patternProperties": {
    "^price_": { "minimum": 0 },
    "_total$": { "maximum": 1000 }
  },
  "additionalProperties": false
}
```

The existing price_total control displays the applicable validation error when
its value is -1 (minimum) or 1001 (maximum); 500 satisfies these constraints.
Errors must be associated with the affected data location even when their
constraint is declared under patternProperties rather than properties.

In the AJV/JSON Forms web pipeline, instancePath identifies the affected value
(`/price_total`); schemaPath identifies the constraint (for example,
`#/patternProperties/%5Eprice_/minimum`). Core maps the data location to the
existing control's path. Do not require a schemaPath under properties to display
an error on that control. Equivalent validator integrations must preserve this
distinction. Shared validation-mode and error-presentation settings still apply.

This validation/error-routing requirement does not require merging pattern schemas
into the schema used to select the declared property's renderer. The earlier
requirement to apply all matching schemas describes their validation semantics;
it must not be interpreted as a requirement to create duplicate property controls.

##### Additional-properties editor: interaction and key ownership

Suggested renderer/component name: `AdditionalPropertiesRenderer`. It is hosted
by an applicable object editor, not selected through a new UI-schema type. Show
an input for the **new property name** and an adjacent Add action. Validate the
proposed name using the object's name rules, applicable pattern restrictions,
and collision checks; display actionable errors alongside that input. Add is
unavailable while the name is invalid or already used, or mutation is disabled.
With restrict enabled, also prevent addition at maxProperties. Validate again
in the handler. Successful addition creates the key with an appropriate initial
value and exposes its delegated value editor; reset the name-entry draft.

The property's name and its value have separate validation schemas. For example:

```json
{
  "schema": {
    "type": "object",
    "propertyNames": { "pattern": "^[a-z][a-z0-9_]*$" },
    "additionalProperties": { "type": "string" }
  },
  "uischema": { "type": "Control", "scope": "#" }
}
```

Entering customer_code in the new-name input permits Add when the name is unused
and the other action restrictions allow it. Entering Customer Code displays a
name-validation error and prevents addition. After addition, the value is edited
as a string according to additionalProperties; propertyNames constrains the key,
not that string value. Apply the same name constraints when renaming.

Build the name-input validation schema from the object's propertyNames constraint
and validate the proposed name before mutation. Keep declared-name reservations
and existing-key collision checks separate from that schema validation. When
additionalProperties is false, a new dynamic name must also match at least one
patternProperties pattern; that admission check does not replace validation of
the value against all applicable pattern schemas. Revalidate in Add/Rename handlers,
not only when computing the enabled state. These checks reuse existing validation
and translation behavior; no new UI-schema option is needed.

List dynamic properties with their names, delegated value controls, and Rename
and Delete actions. These actions apply to existing as well as newly added
dynamic keys. Rename opens a dialog initialized with the current name. Validate
as the proposed name changes, show errors in the dialog, and disable Rename
while errors exist or renaming is prohibited. Revalidate on submission. Cancel
leaves the key/value unchanged; successful rename atomically preserves the value
under the validated new key and refreshes its applicable editor/schema.

Use the same name and collision rules as the object contract. With restrict
(the shared option, not strict), Delete must respect minProperties and required
keys; Rename must not remove a required key or create a disallowed name. Counts
include declared and dynamic keys. Readonly/disabled state prevents all mutations.
Action handlers must enforce these rules as well as the visible button state.

**Clearing a value is not deleting its property.** Dynamic rows are derived from
keys present in data. Therefore, a delegated renderer editing a dynamic property
must preserve that key when the user empties the input or activates its clear X.
For a string, both operations store an empty string instead of undefined:

``` json
{ "customNote": "" }
```

The customNote row remains available for further editing. It disappears only
when the explicit Delete action removes the key (or an explicit enclosing
operation replaces/removes the containing data). Required/minLength and other
schema errors may still be displayed; key preservation is not a validation bypass.
Do not substitute a nonempty schema default for a string the user intentionally
emptied. Do not assign undefined, since core update handling or JSON serialization
can remove the property and its dynamic editor.

The rendering integration must communicate dynamic-property context to delegated
value controls, including clear-button handlers and ordinary input-to-value
conversion. Until centralized, each renderer must honor this distinction. A
shared context-aware clear-value/conversion helper is preferred so StringRenderer
and other controls use a consistent policy. This context is runtime metadata,
not a new authored UI-schema option and not related to $dynamic resolution.
Apply it to the dynamic property's own value; nested declared properties retain
their normal semantics rather than inheriting key preservation indiscriminately.

Other value types must use an explicitly defined, JSON-representable clear value
for their editing mode while retaining the key; do not silently choose null or
zero as a universal replacement. Where no suitable empty value exists, retain
the key and current committed value with a local empty draft/validation state
until the value can be committed. Keep the row editable and use Delete for key
removal. These rules specialize the shared clear-control contract in dynamic
property context.

### Project extended renderer catalog

The following are project extensions, not capabilities claimed for the official
JSON Forms renderer sets: **AG Grid array control**, **Code editor (Monaco)**,
and the composite-cell enhancement above. Color, Duration, File, Null, Action
button, and Split layout entries remain separately reviewable. Package location
alone does not establish whether a behavior originated upstream.

#### AG Grid array control

Selection: `Control` targeting an array with `options.variant: "ag-grid"`.
This encoding selects the AG Grid extension alongside Monaco in the project
catalog. Ordinary editable tables have their own selection conventions.

The renderer generates property columns for object items and a value column
for supported primitive items. Object/array-valued cells use composite detail
editing when the corresponding cell renderer is registered. Nested item
properties must not force this explicitly selected grid into ListWithDetail
or expandable-item presentation. Item-shape support, including tuple arrays,
must be declared; the broad array tester alone does not prove full support.

| Option | Default / effect shared by inspected implementations |
| --- | --- |
| `variant: "ag-grid"` | Explicitly selects this extended renderer. Exact rank is renderer-specific. |
| `agGridOptions` | AG Grid configuration adapted by the renderer; not an unrestricted replacement for JSON Forms data binding. Global `config.agGridOptions` supplies defaults; per-control `options.agGridOptions` overrides them. |
| `agGridOptions.columnDefs` | Overrides matched to generated property columns by `field`; does not imply arbitrary extra columns, column groups, or replacement of schema-generated columns. |
| `agGridOptions.defaultColDef` | Defaults include sorting, filtering, and resizing enabled; supported overrides customize these behaviors. |
| `cells.<property>` | JSON Forms cell options, including composite `summary` and `detail`. Property-specific options override inherited array cell options. Grid-only options should not be interpreted as nested form options. |
| `gridHeight` | Default `400px`; document accepted dimension types for each adapter. |
| `gridWidth` | Default `100%`; document accepted dimension types for each adapter. |
| `showSortButtons` | Requests stored-array reordering through a drag-handle column in this renderer, not necessarily literal up/down buttons. An existing column with `rowDrag` avoids a duplicate handle column. |
| `agGridOptions.suppressRowDrag` | Can suppress dragging. Dragging is also suppressed when disabled, sorted, or filtered. |
| `restrict` | Applies array-size prevention, including the resulting size after removing multiple selected rows. |
| `hideArraySummaryValidation` | Hides the child-error summary without disabling validation. |

Form data remains the source of row data. The adapter owns row identity,
source-index mapping, cell dispatch, and mutation integration; user rowData
must not replace form data. Native AG Grid editing is not the default editing
path: generated data columns dispatch JSON Forms cells. Document protected
properties, event composition, and supported component overrides per adapter.

Sorting and filtering change the view, not the stored array order. Cell edits
and deletion must target the original source row after sorting/filtering.
Explicit row dragging changes stored order and is unavailable under sorting
or filtering to avoid ambiguous reorder semantics. Runtime identity must not
be serialized into application data or UI schema.

Resolve AG Grid configuration by recursively merging option objects from
`config.agGridOptions` and then `uischema.options.agGridOptions`, with local
values taking precedence. Arrays, including `columnDefs`, replace the global
array as a whole; do not merge them by index. Preserve explicit false values
and do not mutate either source object. Renderer-owned binding and mutation
properties remain protected after this merge.

The existing Svelte/Vuetify option names agree; adapter-specific callback/data
shapes must not be assumed identical. Function
callbacks are in-memory platform escape hatches, not portable JSON values.
Grid configuration support is bounded by the chosen AG Grid version and
installed capabilities.

#### Duration control

Selection: a string Control with schema `format: "duration"`. Provide masked
text entry plus a duration-component picker. Store a duration string, not a
number of seconds or a date/time. The baseline supports non-negative integer
years, months, days, hours, minutes, and seconds, or a separate weeks-only
representation. Fractional/negative duration support must be declared explicitly.
Do not imply that calendar months/years have a fixed conversion to seconds.

``` json
{
  "schema":{"type":"string","format":"duration"},
  "uischema":{
    "type":"Control","scope":"#",
    "options":{"showActions":true}
  }
}
```

| Option / behavior | Default and effect |
| --- | --- |
| `showActions` | True: stage picker changes until OK; Cancel discards the draft and preserves committed data. False: commit picker edits immediately. |
| `okLabel`, `cancelLabel` | Translated confirmation labels; default OK and Cancel. |
| `placeholder`, `focus`, `clearable` | Shared entry hint, focus, and clear behavior. |
| Weeks mode | Cannot be combined with the other duration components in this baseline. |
| Zero duration | Serialize zero as `P0D`; clearing is a separate operation. |

Examples of committed values: `P2W`, `P2D`, and `PT1H30M`. Support direct
entry of the duration string as well as the picker, with a syntax-aware mask
or equivalent guided editing. This assistance is part of the duration
interaction contract, not a portable `mask` option. It must accommodate all
supported valid duration forms rather than excluding valid values because
of an overly narrow mask.

During typing, allow partial prefixes such as `P` or `PT1` as local drafts so
users can complete, delete, and correct the value. Strive to prevent invalid
characters and component sequences, including pasted input, without silently
changing their meaning. Commit only completed values accepted by the supported
duration grammar; an incomplete or invalid nonempty draft must not overwrite
the last committed value or be replaced with zero. Clearing remains a separate
operation subject to ordinary empty-value and required validation.

Existing invalid form data must remain visible with a duration-validation
error, allowing correction through either text or picker; do not mask away,
normalize, or replace it on mount. Uncommitted invalid drafts must participate
in the shared diagnostic/validity integration, even when the previous stored
value is valid. Typed input and picker input share the same storage contract.
This guidance parallels date/time text assistance without changing their
separately specified options or constraint behavior. Do not assume temporal
formatMinimum/formatMaximum comparison can order calendar durations without
a separately defined comparison policy.

#### Color control

Selection: a `Control` targeting a string with schema `format: "color"` OR
UI `options.format: "color"`. Schema format alone is sufficient for
schema-driven/generated UI selection when the color renderer is registered.
No application-authored regex is required merely to request this control.

Schema-driven example:

``` json
{
  "schema":{"type":"string","format":"color"},
  "uischema":{"type":"Control","scope":"#"}
}
```

UI-driven example without a schema format:

``` json
{
  "schema":{"type":"string"},
  "uischema":{"type":"Control","scope":"#","options":{"format":"color"}}
}
```

The presentation combines color text entry and a color picker. Color syntax,
parsing, serialization, and validator registration form one coherent contract.
`color` is a project-defined format; each implementation must register a
compatible format definition with its validator. The renderer's emitted
representations must be accepted by that definition when schema format is
present. UI-driven selection on a plain string must still use the renderer's
color parser, although it does not add a format constraint to the schema.

| Setting | Effect |
| --- | --- |
| Schema `format: "color"` | Selects color editing and requests the registered color-format validation. |
| UI `format: "color"` | Selects color editing without changing the schema. |
| UI `colorSaveFormat` | `hex` (default), `hex3`, `rgb`, or `hsl`; selects serialization after an edit, independently of renderer selection. |
| `placeholder` | Entry hint; it must reflect the configured representation. |
| `focus`, `clearable` | Shared focus and clearing behavior. |

The registered color validator must accept every representation in the supported
profile, regardless of the selected save format. Typed input may use any of
these supported representations; successful text or picker edits serialize to
`colorSaveFormat`. Do not normalize existing data solely by mounting the control
or changing this option.

| colorSaveFormat | Opaque output | Output with transparency |
| --- | --- | --- |
| `hex` (default) | `#RRGGBB` | `#RRGGBBAA` |
| `hex3` | `#RGB` | Unsupported; never silently discard alpha. |
| `rgb` | `rgb(r, g, b)` | `rgba(r, g, b, a)` |
| `hsl` | `hsl(h, s%, l%)` | `hsla(h, s%, l%, a)` |

Retain input compatibility with `#RGB`, `#RRGGBB`, and `#RRGGBBAA` in either
hexadecimal letter case. The default `hex` output uses the full six/eight-digit form.
The initial functional syntax uses comma-separated RGB/HSL forms as shown.
RGB channels are integers from 0 to 255; saturation/lightness are percentages
from 0 to 100; alpha ranges from 0 to 1. Hue is expressed in degrees with a
documented normalization policy. Fully opaque output omits alpha. Named colors,
additional CSS color spaces, and other CSS color syntaxes are outside the
initial profile. Define shared conversion/rounding vectors before claiming
cross-platform serialization conformance; do not assume different libraries
emit identical text or precision.

Three-digit output is an explicit serialization choice, not inferred from the
initial value. With `colorSaveFormat: "hex3"`, quantize each 8-bit RGB channel
to `round(channel / 17)` and emit its lowercase hexadecimal digit. Thus
`#ed5050` becomes `#e55`, representing `#ee5555`. This deliberately selects
the nearest representable color from the 4,096-color short-hex palette; it is
not a lossless abbreviation of every six-digit color. The picker preview must
reflect the rounded, saved color. Apply the same conversion to successful
opaque text edits, including fully opaque eight-digit input.

Do not rewrite existing values on mount or when this option changes. Existing
transparent colors remain visible; in this mode, disable RGB-only picker edits
that would discard their alpha and show localized guidance to enter an opaque
color or clear the value. Reject transparent text edits without committing an
opaque replacement. The guidance can be translated using
`color.hex3Transparency`. There is no alpha editing in this output mode.

Example for a receiving system that accepts only three-digit hex:

``` json
{
  "schema": {
    "type": "string",
    "format": "color",
    "pattern": "^#[0-9a-fA-F]{3}$"
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": {"colorSaveFormat": "hex3"}
  }
}
```

The schema pattern enforces the receiving system's narrower representation;
the UI option controls serialization. A preloaded value outside that pattern
remains available for correction rather than being silently normalized.

Example selecting HSL output for a color property:

``` json
{
  "schema":{"type":"string","format":"color"},
  "uischema":{
    "type":"Control","scope":"#",
    "options":{"colorSaveFormat":"hsl"}
  }
}
```

For a plain string schema, add `options.format: "color"` to select the same
renderer. Additional schema constraints still apply to the serialized value.

A picker that exposes only RGB must preserve an existing alpha component
across RGB edits or provide an alpha-capable editing path; it must not silently
make the color opaque. Document conversion precision limits, including alpha
quantization in eight-digit hex. Invalid or unsupported incoming values remain
visible with errors rather than being replaced by the picker's fallback color.

#### File control

This project extension selects a `Control` targeting a string with schema
`contentEncoding: "base64"`, `format: "byte"`, or `format: "binary"`.
The widget selects one local file, checks supported constraints before reading
it, and converts an accepted file into the representation stored at the scope.
This describes local file attachment, not an implicit network upload.

| Schema keyword / UI option | Behavior |
| --- | --- |
| Schema `contentEncoding: "base64"` or `format: "byte"` | Selects the file renderer; the ordinary storage path writes the base64 payload. |
| Schema `format: "binary"` | Existing project storage convention: a data URL including an encoded filename. This is not a general JSON Schema definition of binary serialization. |
| UI `accept` | Explicit file-dialog filter, taking precedence over schema-derived filtering. Supports platform filter syntax such as MIME types and file extensions. |
| Schema `contentMediaType` | Fallback source for the file-dialog filter when UI accept is absent; use it when a meaningful platform filter can be derived. |
| Schema `formatMinimum`, `formatMaximum` | Inclusive lower/upper limits on original file size in bytes in this renderer contract. |
| Schema `formatExclusiveMinimum`, `formatExclusiveMaximum` | Exclusive lower/upper limits on original file size in bytes. |
| Corresponding UI format-bound options | Existing fallback when the corresponding schema-side size bound is absent. Prefer schema bounds when provided; intersect applicable bounds rather than discarding a tighter constraint. |
| UI `restrict` | Enables preventive file-size enforcement according to section 15. Size validation and error reporting remain active when restriction is disabled. |
| UI `clearable`, `focus` | Shared clear-action and focus behavior. |

Use finite non-negative byte counts for size bounds. Existing adapters also
accept numeric strings; portable examples use numbers. These format-bound
names are extension keywords, not built-in standard JSON Schema keywords.
Here the renderer supplies the file-size interpretation. Validator support for
such keywords on an encoded string must not be assumed: it would require
compatible keyword definitions and decoding/size semantics. Do not claim that
ordinary temporal format comparison validates attachment size.

Example schema for an attachment (the numeric bound uses this renderer's
file-size extension contract):

``` json
{
  "type":"string",
  "contentEncoding":"base64",
  "contentMediaType":"application/pdf",
  "formatMaximum":5242880
}
```

UI schema:

``` json
{
  "type":"Control",
  "scope":"#",
  "options":{"accept":".pdf,application/pdf","restrict":true}
}
```

Resolve the picker filter as explicit UI accept first, then a filter derived
from contentMediaType, otherwise no additional filter. An explicitly empty
accept means no filter; do not treat it as absent and restore the schema
fallback. These hints alter picker behavior without asserting that file
contents have been validated. MIME metadata, file extensions, and chooser
filters alone do not establish content conformance.

Use the selected file's byte-size metadata (File.size on web) before reading
or encoding it. This measures original bytes, not the length of the base64 or
data-URL string. With restriction enabled, reject size-invalid selections
immediately: do not invoke conversion or write the rejected file to form data.
Keep the previous committed value unchanged on rejection, clear the rejected
native selection, and expose the error so the form does not appear valid
merely because its previous value passed validation. With restriction disabled,
conversion may proceed, but the size error still contributes to validity.

Publish renderer-detected size/read/conversion failures through the combined
additionalErrors integration, not solely local control display text. Own errors
per control instance, preserve host errors, and display one localized summary
beneath the control. Include constraint/limit information in params as useful.
Remove stale owned errors on successful replacement, explicit clear, or cancel.
Pending reads and errors must participate in the same command-validity
integration described for Monaco; ordinary schema rules do not acquire this
dependency automatically.

**Cancelling the file chooser leaves no selected file and clears the scoped
form value**, including when a previous attachment was present. Apply the same
empty-value contract as the explicit Clear action; required validation may
then report an error. Aborting an in-progress attachment also leaves no
selection or stored attachment. Distinguish cancellation from an invalid-file
rejection as described above. Platform adapters must detect cancellation where
possible and document limitations rather than silently claiming this behavior
while retaining stale data. Stale asynchronous reads must not restore a cleared
or cancelled value. All mutations remain subject to readonly/enabled state.

Previously stored encoded values may lack file metadata. Do not advertise
size validation for those values unless a validator/decoder actually provides
it; selection-time checks are a distinct capability. No conversion is needed
to determine the size of a newly selected file.

#### Code editor (Monaco)

This is a project extended control selected by `options.format: "code"`
with a resolvable storage mode. It edits the value at the Control's scope;
it does not convert the entire form unless that scope is the root.

Determine the requested storage mode from explicit boolean `options.convertJson`
first, otherwise from the target schema after reference resolution. The table
below also supplies language defaults when no language is supplied; JSON-value
mode is available only when the final resolved language is `json`.

| Resolved schema / override | Storage mode | Default language when omitted |
| --- | --- | --- |
| `convertJson: true` | Parse editor text as JSON and commit the parsed value. | `json` |
| `convertJson: false` | Commit editor text as a string. | `plaintext` |
| `type: "string"` or a type union containing only string and null | Text mode. | `plaintext` |
| Explicit type or type union excluding string | JSON-value mode, including object, array, number, integer, boolean, or null. | `json` |
| No determinable type, or a union containing string and a non-null non-string type | Explicit convertJson required; do not guess from current data. | Determined after mode selection. |

A schema admitting null alongside strings still defaults to text mode; use
explicit JSON-value mode when users need to enter JSON null or quoted JSON
strings directly. Type inference must not guess from property names, current
values, or syntax language. Combinators without a determinable type require
an explicit mode. If mode remains ambiguous, report a diagnostic and fall
back to ordinary rendering instead of committing with an assumed conversion.

Explicit mode overrides do not alter the schema. A text override on an object
schema produces a string and may therefore fail schema validation; it does not
make strings valid objects. Existing explicit convertJson documents remain
supported.

Resolve the effective language, including `$dynamic.options.language`, before
activating JSON-value editing. **Only resolved `language: "json"` supports
serialization of the scoped value into JSON editor text and parsing the edited
text back into form data**, whether requested through schema inference or
`convertJson: true`.

Other languages support ordinary string/code editing; do not parse their
contents as JSON. If schema inference or an explicit conversion request calls
for JSON-value mode but the resolved language is not json, the combination is
inapplicable: report a diagnostic and preserve the scoped value rather than
silently serializing it as a string. Use an appropriate ordinary renderer as
a fallback. A dynamic language change must re-evaluate applicability without
committing a draft or converting existing data.

Conversely, JSON syntax highlighting alone does not require conversion. A
string schema with language json still stores source text by default; explicit
`convertJson: true` enables JSON-value editing for that schema as well.

| Option | Meaning |
| --- | --- |
| `format: "code"` | Selects code-oriented editing with the other applicability conditions. |
| `language` | Editor syntax/language support; static or supplied by `$dynamic.options.language`. Resolved json is required for JSON-value mode; language alone does not request conversion. |
| `convertJson` | Boolean override: true requests JSON parsing, available only with resolved JSON language; false stores text. When omitted, infer the mode using the schema rules above. |
| `propagateErrors` | Boolean, default true. Publishes editor error summaries and pending language validation into combined form validity. False keeps language diagnostics local to Monaco; schema and host validation remain active. |
| `monaco.rows`, `minRows`, `maxRows`, `autoGrow` | Editor height and growth controls; exact supported defaults belong to the renderer-family contract. |
| `monaco.options` | Underlying Monaco configuration; data binding, model ownership, and readonly constraints remain controlled by the adapter. |
| `monaco.initActions` | Actions invoked during editor initialization; platform-specific behavior. |

Text example: a string property stores the source text directly.

``` json
{
  "schema": {"type":"object","properties":{"source":{"type":"string"}}},
  "uischema": {
    "type":"Control",
    "scope":"#/properties/source",
    "options":{"format":"code","language":"javascript"}
  }
}
```

JSON-value example: the object schema selects JSON-value mode and JSON
language automatically. Explicit `convertJson: true` may also request this
mode. The editor operates on the settings object, not a JSON string containing
that object.

``` json
{
  "schema": {
    "type":"object",
    "properties":{
      "settings":{
        "type":"object",
        "properties":{"retries":{"type":"integer","minimum":0}}
      }
    }
  },
  "uischema": {
    "type":"Control",
    "scope":"#/properties/settings",
    "options":{"format":"code"}
  }
}
```

Entering `{"retries":3}` commits an object at `settings`; it does not commit
`"{\"retries\":3}"`. The rest of the form data is unaffected. Parse errors
remain local editable text and must not overwrite the last committed value.
JSON syntax validity and schema validity are distinct: a successful parse does
not establish that the resulting value satisfies the target schema. Null,
empty text, and invalid drafts must have explicit renderer behavior; empty
text is not implicitly equivalent to JSON null.

Use the common dynamic mechanism for language selection:

``` json
{
  "type":"Control",
  "scope":"#/properties/source",
  "options":{"format":"code","language":"plaintext"},
  "$dynamic":{"options":{"language":{"bind":"data.editorLanguage"}}}
}
```

The static language is a fallback when dynamic resolution is disabled or
unresolved. Existing extension-specific dynamic-language encodings belong to
compatibility handling, not the portable authoring model. Resolution occurs
before tester dispatch as specified in section 11. Changing syntax language
must not silently convert the stored value or commit an invalid draft.

##### Monaco schema association and diagnostic integration

In JSON-value mode, configure Monaco's JSON language service with the schema
for the value at the Control's scope. Editing `settings` must validate the
settings value, not expect the entire form object. Preserve reference bases,
`$id`, and access to root definitions so references inside the selected
subschema still resolve correctly. Associate the schema with that editor's
model URI; multiple editor instances must not overwrite each other's schema
associations or unrelated host language-service configuration.

Monaco schema validation assists editing; the form's configured validator
remains authoritative for committed data. Monaco may not implement the same
schema dialect, custom formats/keywords, `$data`, or cross-field constraints.
Document these limits rather than promising identical validators. Whole-form
validation must still run after a scoped edit. In string-storage mode, do not
apply the enclosing string schema to the parsed JSON document: the form
schema validates the stored source text, while the language service validates
its syntax unless a separate source-document schema is explicitly provided.
Monaco supports URI-based schema association through its
[JSON diagnostics options](https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages_features_json_register.DiagnosticsOptions.html).

With effective `options.propagateErrors` true (the default), language services
SHOULD publish error-level diagnostics into the form's additional-error
integration, including JSON syntax errors and diagnostics
for other supported languages. Syntax highlighting alone does not establish
that language validation is available. Unsupported language diagnostics must
not be described as a successful language validation.

`propagateErrors` is a project extension controlling publication, not language
validation or storage mode. With false, keep diagnostics and markers available
inside Monaco, but publish no editor-owned additionalError and do not let that
editor's pending language analysis block combined form validity. Do not remove
schema errors, host additionalErrors, or errors owned by other controls.
Changing the effective option to false clears only this editor's published
summary/pending contribution; changing it back republishes current diagnostics
and relevant pending state, without requiring a data edit.

In string-storage mode, commit source text even when the language service reports
errors. For example, a form collecting deliberately invalid JavaScript can use:

``` json
{
  "schema": { "type": "string" },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": {
      "format": "code",
      "language": "javascript",
      "propagateErrors": false
    }
  }
}
```

The host receives that text in form data and ordinary JSON Schema validation
still applies. In JSON-value mode, publication opt-out does not make malformed
JSON parseable: invalid drafts remain local and the last committed value remains
unchanged. To collect malformed JSON text in form data, use a string schema and
text storage (`convertJson: false`) with language json. A valid-form guard with
propagation disabled assesses committed data, not the validity or commit status
of a local JSON draft.

The wrapper should maintain renderer-owned diagnostics separately from
host-owned `additionalErrors`, then combine the published errors without
mutating or replacing the host list. When propagation is enabled, publish **at most one summary
additionalError per editor instance**, regardless of the number of blocking
diagnostics. Publish none when that editor has no error-level diagnostics.
Warnings, informational messages, and hints stay inside Monaco; they do not
contribute to the summary count or block form validity through this bridge.

Use a localized summary such as "Code contains 12 errors. Review the marked
locations in the editor." An AJV-compatible representation is:

``` json
{
  "instancePath":"/settings",
  "schemaPath":"",
  "keyword":"editor.language",
  "message":"Code contains 12 errors. Review the marked locations in the editor.",
  "params":{
    "source":"monaco",
    "language":"json",
    "errorCount":12
  }
}
```

`instancePath` is the JSON Pointer to the edited value in form data, not its
UI-schema scope or a text position. Keep model identity, diagnostic identity,
document version, individual messages, and source ranges in the renderer-owned
registry and Monaco markers. Do not copy hundreds of diagnostics into the
summary message or params. Nested snippet diagnostics aggregate at the owning
Control path rather than creating additionalError entries for each child.

Deduplicate equivalent diagnostic reports when computing the editor error
count. If all editor diagnostics duplicate schema errors already presented by
the form validator, the integration may suppress the redundant summary while
preserving invalidity. Any independent language or draft error still requires
the editor summary. Keep published summaries stable when their path, language,
count, and message are unchanged.

Refresh diagnostics when text, language, schema, or the edited path changes;
discard stale asynchronous results by model/version. Remove only that editor's
errors when diagnostics are resolved or its instance is disposed. With propagation enabled, invalid JSON
drafts must produce blocking errors even while the last committed data remains
schema-valid. Parsing failure can supply an immediate error while language
analysis is pending; it contributes to the same summary and is replaced or
deduplicated when language diagnostics arrive. When propagation is enabled, pending asynchronous validation is a distinct
state and must not briefly appear as confirmed validity during submission.

The integration must expose combined validity from schema errors, host
additional errors, and published editor errors, plus pending validation from
editors with propagation enabled. Notify
consumers when that state changes even if form data does not change. When propagation is enabled, display
one editor summary beneath the editor, with individual errors available through
language-service markers.
Use the standard additional-error presentation contract, and document that
JSON Forms validationMode does not itself suppress additional errors; see
[JSON Forms validation](https://jsonforms.io/docs/validation).

A submit/command guard intended to require a valid form must consume this
combined state and prevent activation while blocking errors or relevant
validation are pending. Ordinary JSON Forms schema-based rules evaluate data;
adding additionalErrors alone does not make such rules depend on editor
validity. Use host/integration-provided command enabled state or a separately
specified extension for that dependency. Do not inject validity flags into
business data or pretend an ordinary schema rule observes additionalErrors.
See [JSON Forms rules](https://jsonforms.io/docs/uischema/rules).

Diagnostic publication is controlled by `propagateErrors`, independently of `restrict`.
Restriction governs supported preventive editing behavior; disabling it does
not make invalid code valid or hide editor errors. Do not introduce a renderer
`strict` option for this purpose. This bridge includes only error-level language diagnostics; warnings and hints
do not become blocking additional errors.

### Renderer selection examples and behavioral options

The examples below use complete root-value schemas and `scope: "#"` so each
pair can be used independently. For an object property, place the schema under
`properties` and change the Control scope accordingly. A matching example
makes a renderer eligible; actual selection also depends on registration and
competing tester ranks. Options listed as pending are not promises of current
support. Detailed behavior and defaults are specified in the preceding entries.

For schema-driven controls, omitting the UI schema lets JSON Forms generate
controls; renderer registration and tester applicability still determine the
presentation. A UI-only request such as `multi`, `slider`, or `autocomplete`
cannot be inferred from these example schemas alone.

#### Existing JSON Forms conventions and reviewed adaptations

In the following table, UI entries with `type: "Control"` all use `scope: "#"`.
The options column lists behavior changes beyond the selection example.

| Suggested renderer | JSON Schema | UI schema | Options / behavior changes |
| --- | --- | --- | --- |
| String control | `{"type":"string"}` | `{"type":"Control","scope":"#"}` | `suggestion`: offer free-text suggestions; `restrict` + `maxLength`: limit length; `placeholder`, `focus`, `clearable`: shared interaction. |
| Number control | `{"type":"number"}` | `{"type":"Control","scope":"#"}` | `step`: stepping increment; never makes a string schema numeric. Min/max widget handling requires per-family declaration. |
| Integer control | `{"type":"integer"}` | `{"type":"Control","scope":"#"}` | `step`: stepping increment; integer-preserving entry, schema bounds, and clear behavior follow the numeric contract. String schemas remain ineligible. |
| Multiline string control | `{"type":"string"}` | `{"type":"Control","scope":"#","options":{"multi":true}}` | `multi: true` selects multiline entry; rows defaults to 3 and resizable to true. Layout height constraints take precedence; see the multiline contract. |
| Boolean control | `{"type":"boolean"}` | `{"type":"Control","scope":"#"}` | Default boolean presentation; `toggle: true` requests the switch control. |
| Boolean switch control | `{"type":"boolean"}` | `{"type":"Control","scope":"#","options":{"toggle":true}}` | Switch interaction; no new variant. False is a real stored value. |
| Slider control | `{"type":"number","minimum":0,"maximum":100,"default":50,"multipleOf":5}` | `{"type":"Control","scope":"#","options":{"slider":true}}` | Schema bounds set track limits; `multipleOf` sets increments. Existing tester requires default and both bounds. |
| Password control | `{"type":"string","format":"password"}` | `{"type":"Control","scope":"#"}` | Alternative: plain string + `options.format: "password"`. Reveal/hide follows the project password interaction contract; neither path imposes complexity rules. |
| Date control | `{"type":"string","format":"date"}` | `{"type":"Control","scope":"#"}` | Alternative: plain string + `options.format: "date"`. `dateFormat`, `dateSaveFormat`, `views`, `mask`, actions, and restrictive format bounds; see temporal tables. |
| Time control | `{"type":"string","format":"time"}` | `{"type":"Control","scope":"#"}` | Alternative: plain string + `options.format: "time"`. `timeFormat`, `timeSaveFormat`, `ampm`, `mask`, actions, restrictive bounds. |
| Date-time control | `{"type":"string","format":"date-time"}` | `{"type":"Control","scope":"#"}` | Alternative: plain string + `options.format: "date-time"`. `dateTimeFormat`, `dateTimeSaveFormat`, `ampm`, `mask`, actions, boundary-day bounds. |
| Enum choice control | `{"type":"string","enum":["Engineering","Finance"]}` | `{"type":"Control","scope":"#"}` | `autocomplete` chooses searchability; `format: "radio"` chooses radio presentation; absence preserves family defaults. |
| Named choice control | `{"type":"string","oneOf":[{"const":"eng","title":"Engineering"},{"const":"fin","title":"Finance"}]}` | `{"type":"Control","scope":"#"}` | Labels come from branch titles/i18n; values remain constants. `autocomplete` and radio presentation as above. |
| Autocomplete choice control | `{"type":"string","enum":["Engineering","Finance"]}` | `{"type":"Control","scope":"#","options":{"autocomplete":true}}` | False requests a non-searchable selector; search text does not authorize new values. |
| Radio choice control | `{"type":"string","enum":["Standard","Express"]}` | `{"type":"Control","scope":"#","options":{"format":"radio"}}` | Also applicable to supported constant-based oneOf. vertical defaults false; true stacks choices. Shared radio layout and clear behavior apply. |
| Suggested string control | `{"type":"string"}` | `{"type":"Control","scope":"#","options":{"suggestion":["Engineering","Finance"]}}` | Suggestions aid entry without restricting membership; pattern/length constraints still validate stored text. |
| String-or-enum control | `{"anyOf":[{"type":"string","enum":["Engineering","Finance"]},{"type":"string"}]}` | `{"type":"Control","scope":"#"}` | Schema supplies suggestions; other strings are permitted by the second branch. Other anyOf forms need separate applicability review. |
| Masked string control | `{"type":"string","pattern":"^[0-9]{6}$"}` | `{"type":"Control","scope":"#","options":{"mask":"###-###","returnMaskedValue":false}}` | `returnMaskedValue`, `tokens`, `tokensReplace`, `eager`, `reversed`, `placeholder`, `restrict`; see mask entry. |
| Enum array / checkbox group | `{"type":"array","uniqueItems":true,"items":{"type":"string","enum":["Email","SMS"]}}` | `{"type":"Control","scope":"#"}` | `vertical` arranges choices in inspected Svelte/Vuetify; `restrict` applies minItems/maxItems prevention. Alternative constant-based item oneOf is supported by the reviewed testers. |
| Object control | `{"type":"object","additionalProperties":{"type":"string"}}` | `{"type":"Control","scope":"#"}` | Nested detail form and extended dynamic-property editing; detail, allowAdditionalPropertiesIfMissing, name/value schemas, and count restrictions as specified above. |
| Array table control | `{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"quantity":{"type":"integer"}}}}` | `{"type":"Control","scope":"#"}` | Flat-row example; `showSortButtons`, `cells`, `restrict`, summary validation. Explicit nested table request is an extension below. |
| Expandable array detail control | `{"type":"array","items":{"type":"object","properties":{"address":{"type":"object","properties":{"city":{"type":"string"}}}}}}` | `{"type":"Control","scope":"#"}` | Nesting normally favors item forms. `detail`, `elementLabelProp`, `initCollapsed`, `collapseNewItems`, `showSortButtons`, `hideAvatar`, `hideArraySummaryValidation`, `restrict`; see expandable array-item forms. |

A schema containing only `type: "string"` must not select Number or Integer
control, even if current data is `"12"`. Generic arbitrary oneOf/anyOf must
not be assumed to select a named-choice or string-or-enum control.

#### Structural renderers and unbound elements

These renderers are selected primarily by UI type. `{}` below indicates that
no data shape is needed for the element itself; child controls still require
compatible schemas. Proposed portable representations must not be confused
with already implemented renderer names.

| Suggested renderer | JSON Schema | UI schema | Options / behavior changes |
| --- | --- | --- | --- |
| Horizontal layout | `{}` | `{"type":"HorizontalLayout","elements":[]}` | Layout sizing, gap, wrap, alignment, and child participation in sections 6–7. |
| Vertical layout | `{}` | `{"type":"VerticalLayout","elements":[]}` | Natural height by default; definite-height weight and other layout options in sections 6–7. |
| Group | `{}` | `{"type":"Group","label":"Contact","elements":[]}` | Project options collapsible, effective collapsed with change synchronization, and showDataIndicator; see section 8. |
| Categorization | `{}` | `{"type":"Categorization","elements":[{"type":"Category","label":"Contact","elements":[]}]}` | Tabs without a variant; established stepper/showNavButtons and vertical orientation; project accordion and initial category as specified in section 8. |
| Label | `{}` | `{"type":"Label","text":"Contact details"}` | i18n and proposed interpolate/markup/textParams behavior in sections 9–10. |
| List with detail | `{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"}}}}` | `{"type":"ListWithDetail","scope":"#"}` | Item label, detail form, reorder actions, restrict, validation summary; family-specific defaults. |

#### Project extension selection examples

These examples describe the inspected project encodings or explicitly marked
portable proposals, not official JSON Forms support. Remaining option audits
continue one renderer at a time.

| Suggested renderer | JSON Schema | UI schema | Options / behavior changes |
| --- | --- | --- | --- |
| Explicit table with composite cells | `{"type":"array","items":{"type":"object","properties":{"address":{"type":"object","properties":{"city":{"type":"string"}}}}}}` | `{"type":"Control","scope":"#","options":{"table":true,"cells":{"address":{"summary":{"type":"Control","scope":"#/properties/city"},"detail":{"type":"Control","scope":"#"}}}}}` | Keeps nested properties as columns; summary/detail configure composite-cell summaries and live dialogs. |
| Tuple control (preferred capability) | `{"type":"array","items":{"type":"number"},"minItems":2,"maxItems":2}` | `{"type":"Control","scope":"#","options":{"variant":"tuple","vertical":false}}` | Positional schemas select automatically without a variant. Fixed fields, optional additional-items section, defaults for missing preceding positions, and complex-value dialogs; see Tuple control. |
| AG Grid array control | `{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"}}}}` | `{"type":"Control","scope":"#","options":{"variant":"ag-grid"}}` | agGridOptions, cells, gridHeight/gridWidth, showSortButtons, restrict; see complete AG Grid entry. |
| Code editor (Monaco), current encoding | `{"type":"string"}` | `{"type":"Control","scope":"#","options":{"format":"code","language":"javascript"}}` | Language controls editor syntax support; convertJson or schema inference selects scoped JSON-value editing only with resolved JSON language. propagateErrors controls participation in combined form validity. See the Monaco entry for dynamic language and storage semantics. |
| Color control, current encoding | `{"type":"string","format":"color"}` | `{"type":"Control","scope":"#"}` | Also selected by UI format color on a plain string. colorSaveFormat selects hex (default), hex3, rgb, or hsl; see Color entry. |
| Duration control, current encoding | `{"type":"string","format":"duration"}` | `{"type":"Control","scope":"#"}` | Guided masked text/component picker; showActions defaults true. No portable mask toggle. See Duration entry. |
| File control, current encoding | `{"type":"string","contentEncoding":"base64"}` | `{"type":"Control","scope":"#"}` | Alternative schema format binary or byte; UI accept overrides contentMediaType filtering. Byte-size bounds, cancellation, storage, and additionalErrors are described in the File entry. |
| Null control, current encoding | `{"type":"null"}` | `{"type":"Control","scope":"#"}` | Dedicated null representation; no additional value-conversion options established here. |
| Split layout, current encoding | `{}` | `{"type":"HorizontalLayout","elements":[],"options":{"variant":"splitter"}}` | Also accepts VerticalLayout; project extension using the shared variant convention. Layout type determines direction. |
| Action button | `{}` | `{"type":"Button","label":"Submit","action":"submit"}` | params, color, icon, action/script and pending behavior in section 14. |
| ImageView | `{}` | `{"type":"ImageView","src":"/images/logo.png","alt":"Company"}` | Project extension; top-level src/alt, scope fallback, dynamic effective values, and URL policy in section 13. |
| Separator | `{}` | `{"type":"Separator"}` | Project extension; options.vertical selects horizontal (false/default) or vertical (true). Display-only separation, with no resizing; see section 13. |
| Spacer | `{}` | `{"type":"Spacer","size":16}` | Project extension; intrinsic size defaults to 32, with direction and optional parent sizing as specified in section 7. |
| Link, portable proposal | `{}` | `{"type":"Link","label":"Help","href":"/help"}` | target/rel, URL policy, and text behavior in section 13. |

Composite cells are selected within the cell registry, not by a new top-level
Control type. Registering them is necessary for the explicit-table and AG Grid
examples to obtain dialog editing. Refer to the complete nested employee
example above for property-relative detail scopes.

#### Array choices and tokens

**Origin:** Automatic enum-array checkbox selection is an existing JSON Forms
renderer convention. `options.variant: "multi-select"` and
`options.variant: "chips"` are project extensions. An editor entry named
"Checkbox group" emits the existing enum-array schema and an ordinary Control,
without a presentation variant.

| Suggested renderer name | Matching schema and UI schema | Behavior-changing inputs |
| --- | --- | --- |
| EnumArrayRenderer | Control for an array with uniqueItems true and string items with enum, or item oneOf branches each defining const; no variant required. | vertical arranges checkboxes in supporting families; restrict applies minItems/maxItems prevention. |
| MultiSelectControlRenderer | Control with variant multi-select for the same finite, unique array-choice shapes. Explicit selection takes precedence over automatic checkboxes. | Compact dropdown/list supporting multiple selections; schema choices supply values and labels. No free-entry values. |
| ChipsControlRenderer | Control with variant chips for homogeneous string items, optionally limited by enum or string-valued oneOf/const choices. | Free token entry when unconstrained by finite choices; finite choices restrict token values. uniqueItems controls duplicate allowance. |

Examples of the two extension encodings:

``` json
{
  "schema": {
    "type": "array",
    "uniqueItems": true,
    "items": { "type": "string", "enum": ["Email", "SMS"] }
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "variant": "multi-select" }
  }
}
```

``` json
{
  "schema": {
    "type": "array",
    "items": { "type": "string", "minLength": 1 }
  },
  "uischema": {
    "type": "Control",
    "scope": "#",
    "options": { "variant": "chips" }
  }
}
```

For finite-choice chips, use the first example's schema with variant chips.
The schema determines whether entry is free or choice-limited; no separate
free-entry option is introduced. Item constraints apply to each stored value,
not the joined display text. Preserve choice value types and constant titles
rather than storing display labels. Chips in this contract store strings;
numeric/object token conversion is not implied.

Apply the common restrict contract to additions/removals and batch changes:
minItems/maxItems bound the array size. With uniqueItems true, prevent creating
duplicate selections; otherwise free-entry chips may retain repeated strings.
Remove the selected occurrence when duplicates exist. Do not silently deduplicate,
coerce, or discard invalid incoming values. Preserve existing value order when
rendering and removing entries; append new selections/tokens in interaction order.
Partial token input remains a local draft until explicitly committed. Validation
of item constraints remains active independently of restrict; token presentation
does not itself imply a mask or automatic prevention for every schema keyword.
Disabled/read-only controls must prevent additions and removals. Provide accessible
selection and token-removal controls. Component-specific styling/search props are
not additional portable options in this contract.

#### Multi-choice identity, applicability, and safe removal

**Origin:** shared typed-choice and mutation requirements applied to existing
JSON Forms multi-choice renderers. This introduces no new option and does not
require every choice widget to support every JSON value type.

A renderer's tester must match only choice value types that its selection,
addition, and removal logic supports. Recognizing item oneOf branches containing
const is not by itself evidence of support for object or array constants. When
a shape is unsupported, leave it eligible for an appropriate alternative renderer
rather than selecting a widget that cannot edit it correctly.

Use consistent value identity across selected-state display, duplicate prevention,
and removal. Preserve distinctions such as numeric 1 versus string "1"; false
and zero are actual choices, not removal signals or absent values. Translated
labels and string-coerced widget identifiers do not establish stored-value identity.
If structured constants are supported, compare their JSON contents consistently
with schema value equality rather than relying on object reference identity.

A removal request for a value that is no longer present must not change unrelated
items. Recheck the target against current data before dispatching or applying the
mutation. Never interpret a failed lookup as an array index identifying another
item. In presentations allowing repeated values, removal must identify the intended
occurrence under the existing token/array identity contract.

For example, a finite choice with const {"code":"eng"} must recognize an existing
selected value with the same JSON contents even if it was loaded as a different
object instance. If the user then removes it, remove that matching value; if it
has already disappeared through another update, do not remove the last item or
another choice instead. A renderer unable to provide these semantics must not
claim structured-constant support.

General editable arrays remain subject to uniqueItems validation, but checkbox-
style duplicate prevention must not be presumed to cover arbitrary object forms.
Document any preventive uniqueness support separately for those renderers. Do
not silently deduplicate, reorder, or discard existing array data to satisfy
uniqueItems. Preserve invalid incoming duplicates for correction under the shared
editing and validation contracts.

#### Renderer-specific choice styling

Exclusive radio choices retain the existing `options.format: "radio"`
encoding. A renderer may offer joined-button/segmented styling through its
own documented presentation options; no additional portable variant or styling
option is defined here. An editor may expose that visual choice only when the
selected renderer advertises the necessary capability, retaining the radio
encoding and adding that renderer's documented styling option. Additional
portable visual options can be considered separately if needed.

### Shared placeholder hints

**Origin:** options.placeholder is an existing renderer convention in supporting
JSON Forms integrations, including inspected Svelte and Vuetify controls. It is
not a JSON Schema keyword or a universally core-managed feature. The following
contract applies to controls with a meaningful input or empty-selection hint;
support must be declared per renderer.

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "placeholder": "Enter your full name"
  }
}
```

The string placeholder supplies presentation text only. It never initializes a
value, becomes stored data, or changes validation. An explicit empty string
suppresses the renderer's fallback placeholder. Without a supplied placeholder,
the renderer may use its documented fallback, such as the effective display
format for temporal inputs or a localizable empty-selection prompt.

Replacing a date/time placeholder does not change parsing, masking, or saved
representation. Authors should keep the hint consistent with the actual input
format. A placeholder supplements the label and description; it must not replace
the control's accessible label or be the only persistent source of essential
instructions.

The supplied text is not implicitly a translation key. Existing support does
not establish a universal placeholder lookup under the control's i18n prefix.
Hosts may supply localized text, including changing text through the generic
$dynamic.options.placeholder mechanism. Renderers receive the resulting ordinary
option without interpreting dynamic descriptors. This adds no new translation
syntax; renderer-provided fallback prompts should be localizable.

Only controls with an appropriate hint presentation need display this option.
Passing placeholder to a widget without such presentation, such as a checkbox,
does not establish meaningful placeholder support. Updating the hint must not
change the value, selection, or input focus.

### Input composition and Unicode string length

**Origin:** JSON Schema string-length semantics and platform text-input behavior.
The following shared editing requirements extend the restrictive-input contract;
they introduce no new UI-schema option.

Input-method editors may compose text through intermediate stages before a user
accepts the completed input. Preserve that composition session. Masks,
normalization, reactive rendering, and delayed updates must not overwrite the
active draft or prematurely treat it as a finalized value. Apply completed-edit
restrictions without preventing valid text from being composed. An action that
consumes form data must not mistake an unfinished composition for a completed
edit; coordinate it with the pending-edit contract below. Underlying widget
support may satisfy these requirements without renderer-specific event handlers.

Restrictive string-length handling must measure the stored string using the
selected validator's supported JSON Schema length semantics. JSON Schema strings
are sequences of Unicode code points; HTML maxlength measures UTF-16 code units.
A direct mapping is therefore not equivalent for all valid input. See
[JSON Schema string model](https://json-schema.org/draft/2020-12/json-schema-core)
and [HTML maxlength](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength).

For example:

```json
{ "type": "string", "maxLength": 1 }
```

The value "😀" contains one Unicode code point but two UTF-16 code units. A
native maxlength of 1 can prevent this schema-valid value. Do not equate string
length in UTF-16 code units with schema length, or silently substitute the number
of visually perceived characters: combining sequences can contain multiple code
points. Declare validator compatibility limitations rather than silently changing
schema semantics.

When restrict is enabled, check supported completed edits consistently across
typing and paste. Do not split Unicode characters when enforcing a limit. For
masked or formatted inputs, distinguish display characters from the stored
representation to which the schema constraint applies. A native input attribute
may assist editing only where its behavior is compatible with that contract.

Preserve invalid incoming data for correction; do not truncate it automatically
on rendering. Allow correction toward validity under the existing restrictive
editing policy, and retain validation errors for values that remain invalid.
Composition handling must preserve the user's editing position and must not
introduce duplicate or stale commits when composition ends.

### Pending edits, commit timing, and cancellation

**Origin:** renderer integrations may debounce ordinary edits. The following is
an extended behavioral contract, not an existing core-managed queue or a new
UI-schema debounce option. No universal debounce delay is imposed.

Distinguish the visible input draft, committed form data and its validation
results, and the snapshot delivered to host change listeners. These can update
at different times. A renderer edit delay occurs before dispatch; a host
notification delay can occur after core state and validation have updated.
Neither delay makes validation of an earlier value proof that the latest draft
is valid.

Blur should flush a pending committable ordinary edit before presenting its
resulting validation errors. An action that consumes form data must resolve
pending committable edits and use the resulting current data and validation
state before proceeding. Do not rely solely on blur: keyboard-triggered actions
may run without moving focus, and host listeners may still hold an older
snapshot after dispatch. Apply the action's existing validity policy after
synchronization; this does not make every action require a valid form.

Flushing does not force incomplete numeric/temporal drafts into the data model,
bypass input restrictions, or accept edits explicitly staged until OK. Preserve
existing draft, validation, and picker Cancel contracts. An unresolved draft
must not silently be treated as a committed value by a consuming action; use
the applicable pending/error policy and make that state available to the host.

Clear must supersede earlier queued edits so an old callback cannot restore the
cleared value. Whether an ordinary change is immediate or debounced, its empty
value follows the shared clearing and dynamic-property contracts. This section
does not change the representation of cleared values.

Cancel or invalidate queued work whose target was removed, rebound, or superseded.
Guard against writes to an obsolete array index after reorder/deletion, a former
control path, or data replaced by the host. Distinguish external replacement from
normal host feedback of the just-committed data. Data replacement policy must
not silently let an outdated draft overwrite the replacement.

Disposal must leave no stale write callback active. Do not blindly flush on
unmount: it can recreate deleted data or write into a different item. Where
navigation should preserve an ordinary draft, coordinate its permitted commit
before disposal; where an operation discards or supersedes it, cancel it. Recheck
current mutation permissions and target identity before delayed commits; a queued
edit must not bypass a later readonly/disabled state or applicable restriction.

For example, typing into item 0 can queue an edit. If that item is deleted and
the former item 1 moves to index 0, the old edit must not update the new item 0.
The path alone is insufficient evidence that the original target still exists.
Likewise, Clear followed by a late typing callback must not restore old text.

Implementations may coordinate pending edits in a shared integration service,
with registration, flush, cancellation, and target-lifecycle handling. This is
one possible approach, not a prescribed public API or a claim that JSON Forms
core provides a form-wide flush operation. Keep runtime queue state outside the
authored UI schema and business data. Async file reads and other completion
callbacks need equivalent stale-target protection through their own lifecycle
mechanisms; canceling a debounce timer alone does not cover them.

### Shared initial focus

**Origin:** options.focus is an existing JSON Forms renderer option convention,
including Material and Vuetify and supporting Svelte controls. It is not a
project-specific option or a JSON Schema keyword. JSON Forms core does not
universally implement focus on behalf of every renderer; the renderer must
connect the option to its primary input. The lifecycle rules below define the
shared target behavior without claiming identical existing platform behavior.

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "focus": true
  }
}
```

The boolean focus option defaults to false. True requests initial focus on the
primary input when the control mounts and is visible and focusable. It does not
override disabled state or platform focus constraints. Readonly does not itself
imply that an otherwise focusable input cannot receive focus.

Ordinary data updates, validation results, and rerenders must not repeatedly
reclaim focus. The request must not automatically reveal a hidden category,
expand a collapsed panel, or open a picker or dialog. Do not interpret initial
focus as an instruction to navigate to a currently unavailable control.

The generic $dynamic mechanism may supply the effective options.focus value;
the renderer still receives an ordinary option. Changing that value is not an
imperative "focus now" command and does not introduce a continuous focus binding.
Actual remounting and platform/widget autofocus behavior require integration
coverage, particularly for conditionally rendered controls and repeated items.

When several controls request initial focus, there is no portable guaranteed
winner. Authors should identify one intended initial target per active view.
Dialog focus management and returning focus after closing an editor remain
separate interaction responsibilities.

### Shared descriptions and required markers

**Origin:** existing JSON Forms options used by mature renderer families.
Resolve per-control options over the corresponding global config defaults; these
established names do not belong under jsonformsExtended.

| Option | Default | Behavior |
| --- | --- | --- |
| `showUnfocusedDescription` | false | Show the applicable schema description while the control is focused. True also shows it when unfocused. No description is shown for a hidden control or when no description exists. |
| `hideRequiredAsterisk` | false | True hides the visual required asterisk without changing required validation or accessible required-state information. |

``` json
{
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Enter your full name." }
    },
    "required": ["name"]
  },
  "uischema": {
    "type": "Control",
    "scope": "#/properties/name",
    "options": {
      "showUnfocusedDescription": true,
      "hideRequiredAsterisk": true
    }
  }
}
```

Here the description remains visible when unfocused and the asterisk is hidden,
but the property is still required. Determine required status from the applicable
schema and form binding, not from the displayed marker. Expose that status to
assistive technology independently of the asterisk.

Description visibility must not suppress validation errors that the active
validation-display contract requires showing. Description and error text may
appear together. Associate visible help and errors with their input accessibly.
Renderer-specific wrapper suppression must preserve accessible naming and error
associations rather than silently discarding them. This section does not define
or revise the behavior of label: false; that remains a separate review topic.

### Required properties, markers, and clearing

**Origin:** JSON Schema required-property validation and the existing JSON Forms
parent-schema required-state mapping. The required marker is presentation; it
is not the authoritative validation result. Do not introduce a UI required: true
option as an alternative validation mechanism.

For example:

```json
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": { "type": "string" }
  }
}
```

The containing object's required array requires the name key to exist. Here
{"name":""} is valid, while {} is not. Add minLength: 1 to the string schema
when an empty string must also be rejected. Required presence does not itself
require a truthy value or permit a value of the wrong type. See
[JSON Schema required properties](https://json-schema.org/understanding-json-schema/reference/object#required).

The existing core mapper derives a control's required flag by resolving its
parent schema and checking that parent's required array. This is not a complete
evaluation of every conditional or composed requirement. For example:

```json
{
  "type": "object",
  "properties": {
    "contactByEmail": { "type": "boolean" },
    "email": { "type": "string", "minLength": 1 }
  },
  "if": {
    "properties": { "contactByEmail": { "const": true } },
    "required": ["contactByEmail"]
  },
  "then": {
    "required": ["email"]
  }
}
```

With {"contactByEmail":true}, validation requires email, although a simple
parent-required lookup does not infer that active requirement for the marker.
With contactByEmail false or absent, this conditional does not require email.
If email is present, its string/minLength constraints still apply. The required
entry inside if ensures that an absent contactByEmail does not activate then.
This example uses a dialect supporting if/then.

Validation errors must remain available even when a renderer cannot infer the
corresponding required marker. Document conditional/composed required-state
coverage rather than claiming uniform support. Hiding the asterisk does not
change validation or the accessible required state supplied by the binding.

Ordinary required value controls remain clearable under the shared clearing
contract; clearing may produce a required or other validation error. This does
not override structural restrictions on array removal or dynamic-key deletion.
In a dynamic additional-property context, clearing a string retains its key with
an empty string value; it does not implicitly delete that property. Explicit
Delete or Rename must obey the applicable required-key restrictions when restrict
is enabled. Retaining a key satisfies presence only, not constraints such as
minLength. Existing readonly/enabled guards apply to all these operations.

### Shared clear-control behavior

Editable value controls, including string, integer/number, temporal, choice, and
oneOf dropdown controls, support `options.clearable`, default true. False opts
out of the clear affordance. Disabled/read-only controls must not expose an
operable clear action. Required status alone does not remove clearing: the cleared
value can produce a required or other schema-validation error.

Show the clear X icon only when the control has a value to clear and either the
control contains keyboard focus or the pointer hovers over the control. Keep the
icon available while focus or the pointer moves onto the clear button. Hide it
when there is no value, or neither condition applies. Presence is not truthiness:
false and zero are values. This uses the control's storage/empty-value contract,
not the Group's recursive data-presence indicator. A selected oneOf branch is
also clearable even when its branch fields are empty.

The clear button must have a localized accessible name and keyboard activation;
focus within the control makes it available without requiring hover. Clearing
uses the renderer/host clear-value contract and normal change dispatch, rather
than applying a schema default or selecting the first available choice. It must
not silently turn an absent value into JSON null unless that is the established
storage contract. Existing mutation restrictions still apply where relevant.

For a oneOf dropdown, clearing returns the selector to **no selection** and
removes the selected branch form. When branch data would be discarded, use the
same confirmation and cancellation behavior as a branch switch. Preserve values
of properties declared in the enclosing schema under the oneOf preservation
contract; clear the branch-specific value without initializing another branch.
If there are no enclosing properties to preserve, clear the scoped value using
the normal clear-value contract. Clearing must not immediately trigger automatic
selection of the first or a fitting branch. The clear icon disappears once there
is no selection; preserved enclosing properties remain editable independently.

### Common JSON Forms options

If an option is established by at least one mature JSON Forms renderer
and has useful semantics---such as date display/save formats---new
renderer implementations SHOULD consider supporting it where appropriate
rather than silently discarding it. React Material's documented
date/time options are concrete examples. citeturn0search0

### Renderer enhancements

Useful behavior connected to an underlying UI library---such as honoring
date-related schema bounds, validation presentation, locale-aware
pickers, or array constraints---SHOULD be captured in the renderer spec.
A future Kotlin/Dart renderer can then reproduce the semantic benefit
even though it does not use the same UI library.

### Escape hatches

Underlying component props may be exposed under a
renderer-contract-specific namespace. The namespace identifies the
actual renderer contract, not merely the visual library brand. A
non-matching renderer preserves and ignores it.

## 19. Honest rendering of invalid/out-of-domain data

A renderer MUST NOT silently replace existing form data with a different
allowed value merely because the current value is not in
enum/oneOf/available choices.

If server-provided/current data is outside the allowed choice set,
preserve the underlying value until the user explicitly changes it.

UI strategies may include: - show the unknown value in an
invalid/unknown state; - show the control unselected while displaying
the actual value and validation message; - add a specially marked
non-valid current-value presentation; - use a library custom-value
facility without implying validity.

The renderer MUST NOT select the first valid option as a substitute.

General rule: **the UI represents actual form data; it does not invent
nearby valid data to make the widget look valid.**

## 20. Optional editor and tooling capability catalogs

Capability catalogs describe available presentations for editors and other
tooling. They are not part of the serialized form UI model and are not
required for runtime rendering or portable-model conformance. Runtime
selection continues through the ordinary JSON Forms tester/renderer registry;
catalog metadata does not constrain or replace that registry.

For example, tooling may identify a capability as `textarea` and record
that it emits `options.multi: true`. That identifier is metadata, not a
`variant` value. The actual form UI schema contains only the established
encoding:

``` json
{
  "type": "Control",
  "scope": "#/properties/notes",
  "options": { "multi": true }
}
```

Editor design consideration (non-normative): expose schema format separately
from UI presentation. A schema-format edit changes the data contract; a
presentation edit writes UI options. Selecting a widget should not silently
add, remove, or change schema format. An Automatic presentation can omit the
UI format and let schema-driven selection apply. The editor should make
conflicting schema/UI formats and incompatible save formats visible. Exact
controls and conflict-resolution UX belong in the separate tooling design.

Tooling may display friendly names while emitting the existing encodings.
These names do not introduce additional runtime options:

| Editor display name | Emitted UI options |
| --- | --- |
| Password | `{"format":"password"}` |
| Multiline text | `{"multi":true}` |
| Switch | `{"toggle":true}` |
| Radio choices | `{"format":"radio"}` |
| Slider | `{"slider":true}` |
| Masked text | `{"mask":"###-###"}` (user-configured pattern) |
| Searchable choices | `{"autocomplete":true}` |
| AG Grid | `{"variant":"ag-grid"}` |
| Code editor (Monaco) | `{"format":"code","language":"javascript"}` (user-selected language) |

Applicability and schema-driven alternatives still follow the renderer entries;
choosing an editor display name must not silently rewrite the data schema.

The catalog's metadata interfaces, applicability matching, and editor-facing
option schemas belong in a separate optional tooling specification. They
are outside this portable runtime specification. Renderer behavior
specifications remain responsible for documenting actual supported options,
JSON Schema keywords, defaults, and limitations, whether or not a tooling
catalog is provided.

## 21. Diagnostics

Runtime resolver/renderer diagnostics SHOULD have stable
machine-readable codes. Reference shape:

``` ts
interface UIDiagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}
```

Examples: - layout.multipleSizingModes - layout.spanUnsupported -
layout.spanClamped - dynamic.invalidBinding - dynamic.pathNotFound -
dynamic.forbiddenPath - dynamic.invalidTemplate - variant.inapplicable -
variant.unsupported - i18n.missingKey - i18n.missingParameter -
categorization.initialNotFound - action.unhandled -
script.evaluationDisabled - script.evaluationFailed

How a future visual editor displays diagnostics is out of scope.

## 22. Runtime state

Runtime interaction state MUST NOT mutate UI schema: - selected
tab/category - current step - accordion expansion - Group expansion -
splitter position - Button pending state - focus/hover -
renderer-internal widget state

Applications may persist runtime state separately.

## 23. Reserved portable names

Portable/reserved concepts include:

``` text
variant
layout
span
weight
width
height
gridColumns
gap
wrap
minItemWidth
resizable
rows
align
justify
collapsible
collapsed
showDataIndicator
interpolate
markup
textParams
initial
responsive
name
size
$dynamic
```

Renderer-specific namespaces MUST NOT redefine these with incompatible
meanings.

## 24. Business-friendly examples requirement

A separate example catalog MUST be produced after this model spec is
accepted.

Examples MUST use understandable business domains, realistic names,
labels, descriptions, data and constraints; no meaningless `aProp`, `x`,
`z`.

Recommended domains: - Person/contact - Employee onboarding - Customer
profile - Product/order - Appointment - Project/task - Invoice/payment -
Item/insurance - Application/review workflow

Each example should include JSON Schema, UI Schema, realistic data,
English and Bulgarian dictionaries, validation constraints, expected
variant/renderer behavior, fallback, visual/usability description, and
stable example ID.

The catalog must cover multiple representations of the same schema
shape, e.g. array enum as chips vs multi-select vs automatic checkboxes, and
invalid server data outside the allowed set.

## 25. Conformance suites

Portable implementations MUST share machine-readable conformance
vectors.

Required areas: - path grammar and bracket access - forbidden prototype
paths - dynamic recursive overlay - undefined/null/false/zero/empty
behavior - template escaping/invalid templates - URL encoding/policy -
ICU core subset - Markdown profiles/security - span formula - mixed
sizing - Vertical Auto - wrap/auto-fit - hidden effective children -
Spacer sizing/gaps - splitter initial sizing - variant
applicability/fallback - out-of-domain value preservation -
interpolation capability/fallback

Security conformance---prototype protection, URL policy,
script-evaluation gating, Markdown sanitization---is REQUIRED.

## 26. Normative requirements summary

Implementations MUST: - preserve unknown options/extensions and renderer
namespaces; - preserve actual form data rather than substituting
valid-looking alternatives; - protect against prototype pollution; -
apply URL policy to static/dynamic URL-bearing values and Markdown
URLs; - gate string script evaluation; - sanitize Markdown; - resolve
dynamic values before testers; - keep structural fields/name/canonical
variant static; - keep runtime state out of UI schema; - honor effective
visible-child layout semantics; - provide safe fallbacks; - provide
platform-appropriate accessibility for interactive variants; - treat
visibility as presentation, not authorization.

Implementations SHOULD: - support applicable canonical variants; -
preserve useful established JSON Forms options; - reproduce mature
renderer enhancements where semantically useful; - publish renderer
behavior specs; - support business-friendly
example/conformance coverage.

## 27. Verification before implementation handoff

Verify against exact targeted JSON Forms/renderer versions: - actual
core type names/inheritance; - RuleEffect and readonly behavior; -
mapping of the specified config.restrict policy to renderer mutation paths; - Material/Vanilla/Vuetify
native option names/testers; - date/time display/save options; -
date/time schema constraints such as supported
formatMinimum/formatMaximum behavior; - native Categorization
vertical/stepper encoding and showNavButtons; - Translator/i18n key conventions and
textParams integration; - unknown `$dynamic` tolerance; - resolver
coverage for nested/detail/generated schemas; - effective-element
caching/identity; - CSP behavior for string script evaluation; - ICU
implementation syntax/CLDR behavior; - Markdown parser/sanitizer
behavior.

## 28. Renderer-specification roadmap

After this portable model is accepted, produce separate renderer
behavior specifications for the renderer sets of interest, including
official/known JSON Forms renderer sets and project-specific
Svelte/Vue/React renderer families.

Those specifications are the place to define: - exact native options
such as `dateSaveFormat`; - UI-library-specific schema behavior; - exact
visual differences among variants; - renderer-contract escape-hatch
namespaces; - accessibility and invalid-data rendering; -
renderer-specific examples.

This enables a future Kotlin Multiplatform or Dart renderer to reproduce
good semantic behavior from mature React/Vue renderer sets without
copying their framework-specific implementation details.
