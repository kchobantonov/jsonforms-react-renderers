# JSON Forms Extended UI Model — Consolidated Specification

**Status:** consolidated normative specification.\
**Scope:** portable UI-model semantics and runtime/renderer behaviour layered
on JSON Forms.\
**Out of scope:** visual-editor UX, palette/inspector design, editor
migrations, editor design mode, and renderer-specific implementation
specifications themselves.

## About this document

This is a single self-contained specification. It merges three previously
separate documents — the portable UI-model specification, the container
validation indicator proposal, and a register of amendments, narrowings and
added rules accumulated during implementation — into one normative text.

Nothing here is tied to a vendor, a product, a renderer family or a business
domain. Where the source material named a specific implementation, package or
company, this document states the underlying rule instead. Where it reported
implementation status, that reportage has been dropped: a specification says
what conforming behaviour is, not who has achieved it.

**How to read a rule.** Requirements use MUST / MUST NOT / SHOULD / MAY in
the usual sense. Many rules are followed by the reasoning that produced them.
That reasoning is not decorative: most of these rules exist because the
obvious alternative was tried and failed in a way that was silent, and the
explanation is what stops the alternative being reintroduced.

## 1. Purpose and portability

This specification defines a portable extension model for JSON Forms, for web
renderer sets and for non-web implementations such as Kotlin Multiplatform or
Dart.

The normative contract is the **serialized UI-model shape and behavioural
semantics**. TypeScript declarations appearing in this document are reference
representations only; other languages may model the same semantics
differently.

The model SHOULD require no changes to JSON Forms core. A wrapper or
resolution layer MAY preprocess extended UI-schema elements before ordinary
tester dispatch.

### 1.1 Portability classes

| Class | Portable? | Example | Other implementations |
| --- | --- | --- | --- |
| Portable model semantic | Yes | `$dynamic`, `variant: "chips"`, span/weight | MUST reproduce semantics |
| Common JSON Forms behaviour | Desired | `multi`, `dateFormat`, `dateSaveFormat` | SHOULD support when applicable |
| Renderer enhancement | Desired behaviour | Schema-aware date limits | SHOULD strive to reproduce semantics |
| Renderer-contract escape hatch | No | Underlying component props | Preserve; interpret only for the matching renderer contract |
| Platform integration | No | Web `$el: Element` | May define an equivalent, or omit |
| Runtime escape hatch | No | JavaScript `script` | Preserve; execute only when supported and permitted |

A UI-library brand alone does not uniquely identify an escape-hatch contract.
Two renderer families built on the same design system but different frameworks
may share visual intent while exposing entirely different component props.
Each renderer specification therefore declares a sufficiently unique
namespace. Unknown renderer namespaces MUST be preserved and ignored by
non-matching renderers.

### 1.2 Configuration namespacing

The global configuration bag is shared by every extension that reads it, so
placement of a key is decided by **where the option comes from**:

| Origin | Placement in global `config` |
| --- | --- |
| JSON Forms core, or an established convention of a widely used renderer family | **Top level**, under its established name |
| A portable extension — defined in this specification, but not upstream | Under the **`jsonformsExtended`** namespace |
| Implementation-specific, not in this specification at all | Under a **vendor namespace** chosen by that implementation |

The middle tier exists for collision avoidance: an option defined here today
must not clash with an option upstream defines tomorrow under the same name.

The third tier keeps portable extensions separable from things that exist only
because of one product. Anything under a vendor namespace is by definition
outside the portable model and carries no expectation that another
implementation reproduces it. This document does not name any vendor
namespace; an implementation chooses its own and declares it.

**Per-element `options` are not namespaced.** Only the global `config` bag is.
Three reasons, each independently sufficient:

1. **Some names cannot move.** `variant` is a reserved portable name and a
   dispatch input; `type`, `scope`, `elements`, `rule`, `label`, `src`, `alt`
   and `href` are element fields rather than options. A blanket "namespace
   everything" rule is not expressible for them.
2. **The collision risk is already managed for options.** §23 reserves the
   portable option names, and §1.1 requires unknown renderer namespaces to be
   preserved and ignored. The global `config` bag has no equivalent
   protection, which is exactly why it is the one that needs a namespace.
3. **Tester inputs read element options directly.** Renderer selection reads a
   flat option; moving a selection-bearing option into a nested object would
   break dispatch.

Where an extension needs both forms, mirror the confirmation shape: element
`options.<name>` flat, global `config.jsonformsExtended.<name>`.

**Established names that stay at the top level**, whatever their origin looks
like, because this specification places them explicitly:
`showUnfocusedDescription`, `hideRequiredAsterisk`, `disableAdd`,
`disableRemove`, `restrict`.

**Blocks that live under `jsonformsExtended`:** `layoutDefaults`,
`dynamicValues`, `security`, `markup`, `confirmation`.

A worked shape:

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
      "markup": {
        "markdown": { "enabled": true, "profile": "basic" },
        "typography": true
      },
      "confirmation": { "default": "always" },
      "showValidationIndicator": true
    }
  }
}
```

**Namespace keys are literals on the wire.** An implementation may refer to
them through constants in code, but authored UI schemas, configuration
documents, examples and fixtures spell them out. Renaming a namespace is
therefore a breaking change to authored documents and requires a migration,
not merely a constant edit.

**Relocating an existing key** follows a sequence, because authored documents
already use the old spelling: read the namespaced location first and fall back
to the flat one; emit a deprecation diagnostic when only the flat location
resolves; update examples and fixtures; drop the fallback in a release that
says so. New options adopt the correct tier immediately and need no fallback.

## 2. Reference type declarations

A TypeScript implementation may import the model's base types from JSON Forms
core: `BaseUISchemaElement`, `Internationalizable`, `JsonFormsI18nState`,
`JsonSchema`, `Layout`, `Translator`, `UISchemaElement`.

These are reference declarations, not requirements on other platforms.

```ts
export type NamedUISchemaElement = UISchemaElement & {
  name: string;
};
```

### 2.1 `name` belongs to the element model

`name` is a **portable element field**, not an option, and not a renderer
concern. It exists so that one element can refer to another — a
Categorization's initial selection naming a Category, a template addressing a
child — and those references are resolved by the model, before any renderer
sees the element.

Three consequences follow, and each has been got wrong:

- **`name` is not `options.name`.** An option is presentation the renderer
  reads; `name` is identity the model reads. Placing it in `options` puts it
  behind the option-resolution order, where a global config default could
  silently rename an element.
- **`name` is not the element's label.** A label is translated and may change
  with the locale; a name is a stable identifier and MUST NOT be translated.
  Deriving one from the other makes references break when the language
  changes.
- **Uniqueness is scoped to the referencing construct**, not to the document.
  Two Categorizations may each contain a Category named `summary`. A reference
  resolves within its own construct; a duplicate *within* one construct is a
  configuration error and MUST be diagnosed rather than resolved by position.

## 3. Runtime context and the action contract

A reference web context:

```ts
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

A web-specific action event:

```ts
export type ActionEvent = {
  action: string;
  callback?: (event: ActionEvent) => void | Promise<void>;
  context: FormContext;
  params: Record<string, unknown>;
  $el: Element;
  element?: UISchemaElement;
};
```

`$el` and the DOM `Element` type are explicitly web-specific. Missing optional
action parameters are normalized to `{}` when constructing the event.

## 4. Reuse before adding types

New element types are a last resort. Each of these UI concepts has an existing
representation, and an implementation MUST use it rather than inventing a
parallel one:

| UI concept | Representation |
| --- | --- |
| Editable or viewable data | `Control` |
| Horizontal or vertical structure | Existing layouts |
| Bounded section | `Group` |
| Collapsible section | `Group` + `collapsible` |
| Tabs, stepper, accordion | `Categorization`; `variant` for stepper and accordion |
| Chips, multi-select, table, switch, slider, code editor | `Control` + options |
| Interpolated rich text | Internationalizable element + text options |
| Image | `ImageView` |
| Visual divider | `Separator` |
| Whitespace or flexible push | `Spacer` |
| Command | `Button` |
| Navigation | `Link` |

Deferred, and deliberately not specified here: progress indicators, explicit
breakpoint overrides, grid `start`, validation-gated wizard semantics, and
richer divider features.

## 5. Established presentation options and canonical variants

Existing JSON Forms conventions MUST be retained where they already express
the intended presentation. This model uses **one** encoding per presentation
and does not introduce equivalent variant aliases.

| Presentation | UI-schema encoding | Applicability |
| --- | --- | --- |
| Multiline text | `options.multi: true` | string |
| Masked string | `options.mask` containing a mask pattern | string |
| Boolean switch | `options.toggle: true` | boolean |
| Radio choices | `options.format: "radio"` | supported enum/oneOf choices |
| Searchable choices | `options.autocomplete: true` | supported finite choices |
| Slider | `options.slider: true` | number or integer satisfying the family's range tester |
| Colour | `options.format: "color"` | string; schema `format: "color"` also selects |
| Password | `options.format: "password"` | string; schema `format: "password"` also selects |
| Date | `options.format: "date"` | string; schema `format: "date"` also selects |
| Time | `options.format: "time"` | string; schema `format: "time"` also selects |
| Date and time | `options.format: "date-time"` | string; schema `format: "date-time"` also selects |

A new variant MUST add a documented capability beyond renaming an established
option.

### 5.1 Schema-driven and UI-driven format selection

Schema `format` and UI `options.format` have distinct responsibilities. Schema
format **describes the data**; UI format **requests a presentation** without
changing the data schema. Supporting both is intentional and does not justify
a third encoding through `variant`.

Password, date, time and date-time controls MUST retain schema-driven
selection, including when the host supplies no UI schema and one is generated.
They MUST also support the corresponding UI `options.format` on a string
schema that has no format.

`password` is a presentation convention, not a JSON Schema validation format.
Password-content constraints are expressed separately from the obscured
presentation.

Display format, stored format and renderer selection are three separate
concerns. A plain string schema may use `options.format: "date"` with a save
format of `YYYY-MM` to edit a month, without claiming the stored value
satisfies JSON Schema's full-date format. **UI options MUST NOT rewrite the
schema or disable its validation.** Where the schema does specify a format, a
custom save format MUST remain compatible with it.

Where schema and UI formats conflict, renderer specifications MUST document
the competing tester ranks and the fallback. No universal conflict policy is
imposed here.

### 5.2 Provenance, and why it must be recorded

Every renderer or option declares one of these origins, because a reader
cannot otherwise tell a portable guarantee from a local convention:

- **Core** — element structure or semantics provided by JSON Forms itself.
- **Renderer convention** — behaviour implemented by a named renderer family,
  not necessarily understood by core or by every family.
- **Extension** — behaviour added by this model.
- **Proposal** — a target contract awaiting implementation or review.

Source availability in a neighbouring fork is **not** proof of upstream
support. Unverified provenance MUST be labelled unverified rather than
attributed to upstream.

`variant` is already used by renderer families and is **not** a core dispatch
mechanism with universally defined values. Use `variant` when it selects one
presentation *mode*, and booleans for independent behaviour *within* that
mode — a splitter selects a split-pane layout, while `resizable` controls
whether its dividers can be dragged. Never provide two equivalent selection
encodings for the same presentation.

### 5.3 Global defaults, local options, and tester selection

For supported renderer options, global config supplies defaults and
UI-schema options override them:

```json
{
  "config": { "showUnfocusedDescription": true },
  "uischema": {
    "type": "Control",
    "scope": "#/properties/name",
    "options": { "showUnfocusedDescription": false }
  }
}
```

The control keeps the local `false`. **Explicit `false`, `0` and `""` are
meaningful overrides** wherever the option accepts those values;
truthiness-based fallback MUST NOT replace them with a global default.

**Renderer selection has a separate input contract.** Testers read UI-schema
options; config is exposed to tester context separately but is not merged into
the element. `config.multi: true` therefore does not select a multiline
renderer, even though a renderer later receives `multi` among its applied
options. Author `format` and `variant` selection in the UI schema unless a
tester explicitly documents config-based selection.

Do not assume one merge policy for every structured option. Each structured
option MUST document its own merge behaviour. Source config and authored
UI-schema objects MUST be preserved rather than mutated during merging.

Dedicated contracts take precedence over this general description — read-only
sources follow their documented precedence, confirmation uses its namespaced
defaults, and validator construction settings are not renderer options.
Listing an option in global config neither establishes support in every
renderer nor authorizes it as a selection key.

### 5.4 Additional presentation variants

| Element | Variant | Applicability | Intended UI | Fallback |
| --- | --- | --- | --- | --- |
| Control | `chips` | array of string values | Removable tokens | Automatic array |
| Control | `multi-select` | array + finite choices | Multiple-choice dropdown | Automatic array |
| Categorization | `stepper` | Categorization | Ordered steps | Family default |
| Categorization | `accordion` | Categorization | Expandable sections | Family default |

Renderer specifications MAY add variants but MUST NOT rename canonical ones.
`variant: "auto"` is not canonical output. A canonical variant is **static**;
established options may be dynamic and can affect tester selection.

**The two array-choice variants outrank the automatic checkbox group**, because
explicit selection takes precedence over automatic presentation.

What separates chips from a multi-select is **the item schema, not an
option**: finite items make the adder a chooser, free string items make it a
text box. No separate free-entry option is introduced. `uniqueItems` is
required for `multi-select` and optional for chips, where its absence is
precisely what permits repeated tokens.

**Repeated tokens force an implementation constraint.** Where an array admits
duplicates, removal MUST take the occurrence that was acted on. A component
that keys its tokens by *value* cannot express this — two equal tokens become
one entry and removing either removes both — so a conforming chips
presentation identifies tokens by **position**. A failed lookup MUST return
the array untouched and MUST NOT be reinterpreted as an index identifying
another item.

**Distinct values remain distinct choices even when their translated labels
are identical.** Choices MUST therefore be keyed by value, never by label: two
values whose titles translate to the same string in some locale must still
render as two choices.

### 5.5 Choice searchability

A family MUST document its default for `options.autocomplete`; no universal
default is imposed. Only `true` enables searching, so an element `false`
overrides a config `true`, and absence behaves as `false`.

The consequence is worth stating plainly: **a UI schema written against a
family that defaults to searching renders a plain dropdown in a family that
does not.** `autocomplete` is portable; its absence is not.

A searchable renderer MUST define how displayed choices respond to the query:

- **Labels, not stored values.** A case-insensitive substring of the displayed
  label. For a constant-based `oneOf` that is the branch title, so searching
  for the stored constant finds nothing.
- **Locale follows the labels**, because they come from the translator.
- **Empty results** show a localized empty-result message.
- **Searching filters and never creates.** A search query is not itself a new
  permitted value.

### 5.6 Orientation of choice groups

`options.vertical` is the **only** orientation encoding for a choice group,
and behaves identically on radio groups and checkbox groups:

| | Behaviour |
| --- | --- |
| Absent or `false` | Choices in a row, wrapping when the row runs out of space |
| `true` | Choices stacked in a column |
| Announced | `aria-orientation` matches what is drawn |
| Not introduced | No `horizontal` alias, no `variant` for orientation, no per-family divergence |

Only an explicit `true` stacks; a missing option is horizontal, not
indeterminate. A group that renders individual controls rather than a grouping
component MUST still declare a grouping role, or there is nothing for the
orientation to describe.

## 6. Layout types and sizing

```ts
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

Validation: `gridColumns` and `span` are positive integers; `weight` is finite
and greater than zero; dimensions are non-negative where appropriate. On web a
numeric `Dimension` means CSS pixels; other platforms define equivalent
logical units.

### 6.1 Two halves, on two different elements

This distinction makes the rest readable, and confusing the two is the most
common authoring error:

| Where | Configures | Shape |
| --- | --- | --- |
| `options.layout` on a **child** | How that child participates in its parent | `span`, `weight`, `width`, `height`, `minWidth`/`maxWidth`, … |
| Flat `options` on the **layout** | The container itself | `gap`, `wrap`, `align`, `justify`, `minItemWidth`, `gridColumns` |

### 6.2 Modes and precedence

Primary modes: **Auto, Span, Weight, Fixed**. Conflict precedence is
**Fixed > Span > Weight > Auto**. Min and max are constraints, not modes.

Horizontal Auto behaves as weight 1. Vertical Auto means natural content
height. Vertical weight distributes remaining height **only when the parent's
height is definite or resolvable**.

That qualifier is load-bearing and asymmetric. Mapping weight to a zero main
basis on both axes satisfies it in a row and breaks it in a column: a zero
basis in a column collapses the child to nothing whenever the parent's height
is indefinite, which is the ordinary case for a form on a page. A conforming
column therefore starts each child at its **content height** and divides only
the remainder — nothing when the height is indefinite, the leftover when it is
definite. A row keeps the zero basis, where the qualifier does not apply.

### 6.3 The span formula

For usable row width `W`, `G` grid columns and gap `g`:

```text
c = (W - (G - 1) * g) / G
spanWidth(n) = n * c + (n - 1) * g
```

Clamp a span above `gridColumns` and diagnose. Span widths are deterministic;
cross-row column positions align only for pure-span rows.

Where the layout engine cannot measure `W`, the same formula rearranges to one
that does not need it:

```text
spanWidth(n) = (n / G) * W - g * (G - n) / G
```

which a percentage-of-row expression states exactly, because the percentage is
of `W`.

### 6.4 Resolution order for a mixed row

Effective children → gaps and chrome → Fixed → Span against the complete
logical grid → Weight and Auto over the remainder → min/max redistribution.

The final step MAY be delegated to the platform's own layout engine where that
engine performs the same redistribution; computing it explicitly would mean
measuring the row and re-running on every resize to reach the same answer.

### 6.5 Only effective visible children participate

Hidden children **leave layout entirely**. They do not hold a column or its
gap open. Visibility MUST be resolved *before* sizing, and the count that
feeds the arrangement is the count of children that remain.

Comments, framework markers, fragments and placeholders MUST NOT affect
sizing, gaps or splitters.

Structural layouts have **no implicit outer padding**. Gap applies only
between effective visible immediate children, so deep single-child nesting
does not accumulate whitespace.

Unsupported hints are ignored with a diagnostic — a `span` under a Group or
VerticalLayout does not create a horizontal grid.

### 6.6 Options excluded from the portable model

Two encodings are **not** part of this model, and an element carrying either
MUST draw a diagnostic rather than be silently ignored — a form that renders
at the wrong size with nothing to explain it is the worst outcome:

- **A boolean "narrow this control" option.** Controls are full width;
  narrowing is the layout's job, through `options.layout.width` or `maxWidth`.
- **An integer column count on the child** against a fixed grid. The portable
  equivalent is `options.layout.span` against a configurable `gridColumns`.

The second exclusion has a real cost worth recording: a family that reads a
fixed column count and a family that implements this model **do not agree on
layout authoring**, and a UI schema written for one sizes wrongly in the
other. Conformance here is a deliberate choice of this model over the older
convention, not an oversight. An implementation MAY keep the older renderer
available for a host that wants it, but MUST NOT register it at a rank that
outranks the conforming layout — at a higher rank the sizing model could never
take effect.

## 7. Wrap, defaults, splitter and Spacer

### 7.1 Defaults and their resolution order

- `gridColumns`: explicit → `jsonformsExtended.layoutDefaults.gridColumns` →
  family default → **16**.
- `wrap`: explicit → `jsonformsExtended.layoutDefaults.wrap` → **false**.
- `gap`: explicit → `jsonformsExtended.layoutDefaults.gap` → **family
  default**.

The recommended fallback gap is **0 unless a family documents another portable
default** — and a family whose controls carry no horizontal margin of their own
SHOULD document one, because zero makes two controls placed side by side share
an edge.

Such a default MUST be **direction-dependent**, and this is not a detail. A
family whose controls already carry vertical rhythm — a bottom margin on each
field — adds a column gap *on top of* spacing that is already there, so a
single non-zero number double-spaces every vertical form. A row may need a
gutter while a column needs none.

The reason to document a non-zero row default at all: **no UI schema written
for another family sets `gap`**, because those families space children
themselves. A fallback of zero therefore makes every ported UI schema render
with its rows touching, and it reads as the author's mistake rather than the
family's. `gap: 0` at either level restores edge-sharing exactly, so nothing is
taken away.

### 7.2 Wrapping

Wrapping uses resolved fit and minimum constraints. Weight and Auto children
shrink first. With wrap enabled, non-fitting children move to the next row;
without wrap, Span and Fixed children may shrink to their minimum and then
overflow or scroll.

`minItemWidth` is the parent's default minimum. Auto-fit requires `wrap: true`.
Fixed children remain fixed subject to constraints; flexible Span and Weight
arrangements may degrade to equal flexible shares and wrap.

`justify` addresses the main axis; `align` the cross axis.

### 7.3 Splitter

Split-pane selection uses `options.variant: "splitter"` on a HorizontalLayout
or VerticalLayout; the layout type determines the direction.

- Initial sizes come from **normal sizing**, not equal shares.
- **`span` SHOULD NOT be used.** A pane asking for one falls back to Auto
  rather than being sized against a grid a draggable pane does not have.
- Dragged sizes are **runtime state**, not authored data.
- Vertical splitters require a definite height.
- **`wrap` with a splitter is unsupported** and MUST draw a diagnostic: panes
  divide a single axis with separators between neighbours, so there is no
  second row to wrap onto.
- `resizable` defaults to **true**. `false` leaves the separator in place as a
  visual boundary but makes it neither focusable nor draggable.
- Hidden panes leave layout, as elsewhere.

Interactive splitters require platform-appropriate keyboard, focus and
separator accessibility.

### 7.4 Spacer

```ts
interface SpacerElement extends BaseUISchemaElement {
  type: 'Spacer';
  size?: Dimension;
}
```

A Spacer matches on `type` alone; no JSON Schema type or data binding is
required. Top-level `size` supplies intrinsic spacing independently of parent
layout support, defaults to **32**, and uses the shared non-negative
`Dimension` type.

**`size` applies to the parent's main axis** — width in a row, height in a
column — and it is the **parent layout that resolves which**, reading the
Spacer's top-level `size` as a Fixed main-axis dimension. Having the Spacer
ask its parent instead would couple the two in the wrong direction. Where
there is no recognized directional parent, the axis falls back to height,
which is the standalone case.

A Spacer is an ordinary visible layout child, so surrounding gaps apply
normally. It is non-interactive, hidden from assistive technology, and neither
reads nor modifies form data. `options.layout.weight` still applies, so a
Spacer can be a flexible push:

```json
{ "type": "Spacer", "size": 0, "options": { "layout": { "weight": 1 } } }
```

Top-level `size` describes the Spacer itself; `options.layout` controls its
participation in a supporting parent.

### 7.5 Reserved and delegated

`options.layout.start` and `options.layout.responsive` are **reserved**: they
are accepted and ignored, and defined here only so a document carrying them
does not look like a mistake.

## 8. Group and Categorization

### 8.1 Group

An ordinary Group presents related controls as a labelled section. Its default
visual treatment belongs to the renderer family and requires no variant.

| Option | Default | Behaviour |
| --- | --- | --- |
| `collapsible` | `false` | Enables an accessible disclosure control |
| `collapsed` | `false` | Initializes expansion and synchronizes it when the effective boolean changes. Ignored unless `collapsible` is true |
| `showDataIndicator` | `false` | Shows a data-presence indicator when at least one bound descendant contains data |
| `showValidationIndicator` | `false` | Shows an aggregated descendant-error indicator. See §8.3 |

```json
{
  "type": "Group",
  "label": "Additional contact details",
  "options": { "collapsible": true, "collapsed": true, "showDataIndicator": true },
  "elements": [
    { "type": "Control", "scope": "#/properties/alternatePhone" }
  ]
}
```

Collapsible groups preserve field data and validation when closed.

Renderer families may have their own presentation options for a Group. Those
are family conventions, not additional portable variants, and belong in that
family's own specification.

### 8.2 The data-presence indicator

Data presence is defined over descendant Controls' **bound values**, including
Controls nested in structural layouts. Resolve each scope in the current data
context, including the current item path when the Group occurs inside an
array. Unrelated form data does not count.

**What counts as data:** `false` and `0` count. Missing and `null` values,
empty or whitespace-only strings, and recursively empty arrays and objects do
not. A container counts if any nested value counts.

**Hidden descendant Controls participate.**

The indicator means **only that data is present**. It does not imply validity,
completion, required-field satisfaction, or unsaved changes — and the wording
must not claim otherwise. "Contains data" is correct; "contains edits" is not,
because the marker is computed from current data and therefore appears for
server-supplied values nobody has touched. An "edited since load" indicator is
a *different* indicator needing a baseline to compare against, and MUST NOT be
built by relabelling this one.

The indicator MUST carry a **localized accessible name**; a visual marker
alone is insufficient. One string serves both the accessible name and any
tooltip, so the two cannot drift apart.

### 8.3 The container validation indicator

An aggregated descendant-error indicator on a container's header. It is a
**navigation aid** — "there is something to fix in here" — not a replacement
for the messages themselves.

| Option | Type | Default | Behaviour |
| --- | --- | --- | --- |
| `showValidationIndicator` | boolean | per container type, below | True shows the aggregated indicator; false hides it |
| `showValidationIndicatorCount` | boolean | `true` | False shows the marker without a number, and skips computing one |

The second exists because the two cost different amounts: presence is an index
lookup, a count needs a pass over the errors.

**Resolution order:** the element's own `options.showValidationIndicator` →
global `config.jsonformsExtended.showValidationIndicator` → the container
type's default. An explicit `false` at a more specific level overrides `true`
at a less specific one.

**Defaults differ per container type, deliberately:**

| Container | Default | Why |
| --- | --- | --- |
| Array toolbars (table, expandable items, list-with-detail, data grid) | `true` | Matches the existing "show unless hidden" convention for array summaries |
| Array item header | `true` | Item error indication is already required |
| Tuple complex-position summary | `true` | Already required |
| Group | `false` | No indicator existed; a `true` default would change every existing form's appearance |
| Category, tab and step headers | `false` | As above |

A single uniform default would either remove an indicator that is required, or
add indicators to every Group and tab in every existing form. An author who
wants uniformity sets the option once in global config, which is the case this
option exists to serve.

**Applicability.** Any container that renders a header, label row or
navigation entry capable of carrying an indicator. It does **not** apply to
ordinary Controls, which follow the shared control error presentation, nor to
layouts without a header, which have nowhere to put it and MUST NOT grow one.

**What belongs to a container.** An error belongs to a container when its
normalized instance path identifies a descendant of that container's data
scope, **by path segment, not by textual prefix**: `employees.10.name` MUST
NOT count as an error for `employees.1`. For a structural container with no
data scope of its own, resolve each descendant Control's scope in the current
data context — the same resolution the data-presence indicator uses. Mapped
additional errors participate on the same terms as schema errors.

**Setting it to `false` hides only the aggregated indicator.** It MUST NOT
remove or hide the container's **own** errors, hide field-level error text on
descendants, change validation execution or form validity, or affect array
restrictions, mutation guards or any data.

**Hidden descendants count.** Hiding an element preserves its data and does not
exempt it from validation, and eligible errors must remain discoverable
without forcing hidden controls visible merely to show them. An indicator on
the enclosing container is one of the few places such an error can surface.

**Interaction with display policies:**

- Under a validate-and-hide mode, schema errors are hidden from ordinary
  control presentation and the indicator follows; it does not reveal them.
  Under a no-validation mode there are no computed schema errors to aggregate.
  Host-supplied additional errors remain available in all modes.
- Where pre-touch filtering suppresses a keyword before touch, the indicator
  suppresses the same errors — and MUST **recompute** as descendants become
  touched rather than latching its initial state.
- A locale change refreshes the accessible name and any count without a data
  edit.
- A shown count counts the errors the indicator is permitted to represent
  after filtering, not the raw validator error count.

### 8.4 Computing container indicators

This is specified because the obvious implementation does not scale and the
correct one is also the fastest.

**Never scan the error list per container.** That is O(containers × errors) on
every render. Measured over 242 containers in an 880-field form, a per-container
scan costs 3.7 ms at 200 errors and 9.0 ms at 1000 — over half a frame — while
an index stays at 0.067 ms and 0.334 ms.

**Build an ancestor index once per validation.** Walk each error's instance
path and add every ancestor prefix to a set:

```text
error at /emergencyContact/phone
  ->  add ''  ,  'emergencyContact'  ,  'emergencyContact.phone'
```

A container's check becomes a single set lookup. Building costs
O(errors × depth), and depth is three to five in practice.

**Correctness falls out of the shape.** An ancestor set gives the
segment-boundary rule for free: `employees.10.name` inserts `employees`,
`employees.10` and `employees.10.name`, never `employees.1`. A prefix-string
test is exactly where that bug otherwise lives, and there is no prefix test
here.

**Share the index** across containers, keyed on the identity of the errors
array, which validation replaces wholesale. Rebuilding it per container is
worse than the scan it replaces.

**Scope-less containers collect their descendants once**, cached by UI-schema
element identity — the collection depends only on the UI schema and does not
belong in a per-render path at all. One traversal serves both the data-presence
and the validation indicator, which ask different questions of the same set of
bound paths.

### 8.5 Runtime expansion is not UI-schema state

Runtime expansion MUST NOT mutate the UI schema. A renderer initializes
expansion from the effective `collapsed` option and synchronizes when that
boolean changes, whether it came from static configuration or dynamic
resolution.

Header interaction may change local expansion between those updates.
Unrelated re-renders, or replacement UI elements carrying the same effective
boolean, MUST NOT reset the user's local expansion.

Dynamic resolution of `collapsed` is **one-way**. Header interaction does not
write back to the source property: after the bound value becomes true the user
may reopen the Group locally while it remains true, and a later change of the
effective boolean synchronizes expansion again. The header remains an
accessible disclosure control reflecting the current local state.

Undefined resolution falls back to the ordinary static value; an absent
effective `collapsed` defaults to false. **A non-boolean value, including
`null`, is invalid and produces a configuration diagnostic — with no
truthiness coercion.** Disabling dynamic resolution leaves ordinary static
values, subject to the same synchronization behaviour.

### 8.6 Categorization

Ordinary Categorization selects tabs without a variant.

| Option | Default and behaviour |
| --- | --- |
| `variant: "stepper"` | Ordered step presentation |
| `variant: "accordion"` | Vertically stacked disclosures, one open at a time |
| `showNavButtons` | False when absent; true shows Previous/Next actions for the stepper |
| `vertical` | False when absent; true requests vertical category or step presentation |
| `initial` | Optional direct Category `name`; fallback below |

`vertical` is the single Categorization orientation encoding.

Previous and Next operate on **visible** categories and stop at the first and
last visible one. Visibility rules MUST NOT leave navigation pointing at a
hidden or missing category. Hiding the navigation buttons does not itself
require linear navigation or disable header navigation. **Neither stepper
presentation nor `showNavButtons` implies any requirement to validate the
current step before moving.** These actions change runtime selection, not form
data and not the UI schema.

`options.initial` references a direct Category `name`. Sibling names SHOULD be
unique. A missing target falls back to the first visible category **with a
diagnostic** — reported to the author, not rendered to the person filling in
the form, who can do nothing about it.

### 8.7 Container visibility and hidden children

A container's own visibility follows its rule and the applicable rendering
context; it is **not** inferred from how many descendants are visible. A
hidden ancestor suppresses its subtree even where a descendant's own rule
would show it.

A rule on a child hides only that child. To hide a whole Category, put the
rule on the Category element. A Category needs no data scope of its own; its
rule evaluates in the current rendering context.

Hidden immediate children consume no layout space or gaps. **A visible Group
or Category retains its heading, container presentation and navigation entry
even when all its children are hidden.** Such containers MUST NOT be hidden
automatically, and no "hide when empty" option is introduced — this also
preserves categorization for presentation-only sections with no data-bound
controls.

When the selected category becomes hidden, select an available visible
category per the navigation contract. If none remain visible there is no
active category and no stale active panel. A visible but empty category
remains eligible for selection. Visibility and navigation changes preserve
data and do not suspend validation.

### 8.8 Accordion categorization

Matches a Categorization with direct Category children and
`variant: "accordion"`; this explicit match takes precedence over the generic
Categorization renderer. Selection has no JSON Schema type requirement, no
Control scope and no array binding — categories are structural sections and
may contain unbound content or be used with an empty data object. Expandable
array item forms remain a separate, data-bound presentation.

**Exactly one visible category is open whenever any are visible.** Initially
open the one named by `initial`, otherwise the first visible one; an
unavailable named target produces a diagnostic. Opening another closes the
previous. Activating the already-open header leaves it open. No multiple-open
or all-closed mode is defined. If the active category becomes hidden or is
removed, open the first remaining visible one; when none are visible, no panel
is open. **Preserve the selected category's identity across reordering.**

`initial` sets initial selection only. Expansion is runtime UI state and
modifies neither data nor UI schema. Closing a category preserves its data and
validation.

Accordion panels are stacked vertically; the `vertical` orientation option and
the stepper-only `showNavButtons` do not alter this presentation.

## 9. Internationalizable text

```json
{
  "type": "Label",
  "text": "Welcome, {firstName}",
  "i18n": "profile.welcome",
  "options": {
    "interpolate": true,
    "markup": "plain",
    "textParams": { "firstName": "there" }
  },
  "$dynamic": {
    "options": { "textParams": { "firstName": { "bind": "data.firstName" } } }
  }
}
```

Use `textParams`, never action `params`. `interpolate` defaults to `false`;
`markup` is `plain` or `markdown`, default `plain`.

Static `textParams` and expression evaluation work **even when dynamic
resolution is disabled**; only the dynamic namespaces are gated, and only a
parameter's value can reach them (§9.1).

### 9.1 One expression language, and two scopes

Placeholders are **expressions**, and they use the grammar and the language of
§11 rather than a second one of their own. A single `{` opens a placeholder,
`{{` emits a literal `{`, `}}` emits a literal `}` — which is inverted from
the most widely known templating convention, so `{{data.firstName}}` is
literal text and an implementation SHOULD warn when it sees that shape.

**There is one interpolation language in this model, not two.** A text
placeholder and a §11.4 `template` leaf are the same grammar evaluated the
same way; the only difference is where the string comes from and what happens
when it fails (§9.5). An implementation MUST NOT introduce a separate message
syntax for text: a second set of braces with a different escape rule is the
defect this rule exists to prevent.

**The text and the parameters see different things, and that is the point.**

| | may reference |
| --- | --- |
| a `textParams` **value** | `data`, `item`, `config`, `context` (§11.2), subject to the gate; `locale` |
| the **text** | the declared `textParams`, and `locale` |

A translated string MUST NOT be able to name a data path. `{data.customerName}`
written in the text resolves to nothing and is reported, however open the gate
is. The reason is translation, not security: a catalog that names data paths is
coupled to the schema, so renaming a field invalidates every translation in
every language, and a translator is shown a path instead of a name for the
thing being talked about. `You are subscribed to {product}.` is the unit of
translation; `product` is declared once, in the UI schema, where knowledge of
the data model belongs.

Expressions still work **in the text**, over those parameters. That is what
keeps a plural in the catalog, where each language writes its own
(`{seats == 1 ? "seat" : "seats"}`), rather than in the UI schema where only
the authoring language can reach it.

**Where an expression belongs follows from one test: does its shape differ by
language?**

| | belongs in |
| --- | --- |
| a plural or gender conditional | the **text**, because each language branches differently |
| reading data, looking a key up, formatting a number or a date | the **parameter**, because the call is identical in every language |

`{translate("plan." + plan)}` and `{currency(amount, "EUR")}` are the same
expression in English and in Bulgarian, so they belong on the right-hand side.
Put them in the text and every translator has to reproduce them correctly in
every language — and one who drops the `translate(...)` wrapper silently
renders the untranslated key. A catalog entry should carry the words and the
grammar, not the plumbing.

Parameters see the namespaces and **not each other**; a reference from one
parameter to another would need an evaluation order and a cycle check for a
capability an extra parameter already covers.

`interpolate` governs the whole feature: with it, the text is a template and
parameter values are expressions; without it the text is literal and
`textParams` are inert. A parameter value with no placeholder is simply a
literal, so static parameters need nothing extra.

An expression MUST NOT be able to act: no assignment, no statements, no host
function calls beyond those the implementation registers (§9.3), and
own-property lookup only, exactly as §11.3 requires. An implementation whose
evaluator satisfies this needs **no script-evaluation gate**, because there is
nothing to execute. One that compiles expressions into host code does need it,
and is gated like a template engine (§13).

### 9.2 Plural and gender are written by hand

An expression language is not a message format, and the difference is a real
cost that a specification should name rather than hide.

**Plural and gender selection are written as a conditional:**

```
{seats} {seats == 1 ? "seat" : "seats"}
```

This is adequate for languages with two plural categories and inadequate for
languages with more, where the conditional grows a branch per category and the
author must know the rules. Because the whole string including its expression
lives in the **catalog**, each language writes its own test — which is the
mechanism that makes this workable, and the reason a translated string is the
unit of translation rather than a set of parameters.

An implementation MAY instead use a message format such as ICU for text. If it
does, it MUST still not introduce a second placeholder grammar: the message
format's own syntax then applies to text, and §11.4's grammar applies to
templates, and the two are documented as distinct surfaces.

### 9.3 Locale-aware formatting is supplied as functions

A locale decides more than which words are shown. `148.5` is `148,50 €` in
German and `€148.50` in English; `2026-10-01` is `Oct 1, 2026` in English and
`1.10.2026 г.` in Bulgarian.

An implementation MUST make locale-aware number, currency and date formatting
reachable from an expression, and SHOULD do so as **functions the author
calls** rather than by formatting values implicitly on their way into the
text. An implicit rule cannot tell a price from an order number, a year or an
identifier — it would render `2026` as `2,026` — and there is no way to opt
out of it. There is nothing to opt out of with a function.

These functions are part of the implementation's published contract: a
catalog string containing `{currency(amount, "EUR")}` depends on them, and
removing one breaks that string in every language.

A date-only value is a **calendar date**. Formatting it in the viewer's time
zone renders the previous day for readers west of the meridian, which is a
one-day error that appears for some readers only; such a value MUST be
formatted as UTC.

### 9.4 Substitution, escaping and order

**Pipeline:** effective `textParams` → translation and message lookup →
expression evaluation → escaping → safe markup rendering.

The last two are ordered and both are required when the result will be parsed
as markup:

- **Substituted values MUST be escaped before parsing.** A value containing
  `[click](javascript:…)` renders as those characters, never as a link.
- **Only the substituted values are escaped**, never the surrounding text. The
  author's own markup has to keep working, and escaping the finished string
  breaks it.

Escaping after parsing is too late; escaping everything is too much. An
implementation that cannot distinguish the two has not split the template into
literal and expression segments, which is the structure this requires.

URL-bearing positions get no protection from value escaping, because the
destination is the author's own markup. The URL policy (§12) is what covers
them, and it applies to a resolved destination exactly as to a static one.

### 9.5 Absent data is not an authoring error

Two failures look alike and are not:

- **An authoring error** is wrong however the form is filled in — a name the
  text does not declare, a namespace that does not exist, a function that does
  not exist, a type mismatch. It MUST be reported.
- **Absent data is normal.** An optional field nobody has filled in, an empty
  list, an object not yet created: the expression is correct and the value is
  not there *yet*. It MUST render as empty text and MUST NOT be reported.

A form being filled in is mostly empty, so reporting absence would put a
developer-facing message beside much of a fresh form, and a diagnostic that
appears when nothing is wrong is one people learn to ignore.

The line is drawn at the **namespace**: the root of an expression must
resolve — `data`, `item`, `config`, `context`, or a declared parameter — and
anything reached *through* it may be missing without complaint, at any depth,
including an index past the end of a list.

Text and templates still differ in what they do with the result:

- **Text** renders the rest of the string, the unresolved placeholder
  contributing empty text.
- **A `template` leaf** (§11.4) makes the **whole value** undefined, which
  falls back to the static value. A half-resolved `href` is a broken link, not
  a partial one.

An implementation MUST NOT throw out of either path. An expression resolving
to an object or a list has no text form; that is an authoring error, not
`[object Object]`.

### 9.6 Host functions are registered, never passed in

An expression may call only functions the implementation **registers**. A
function placed in `context`, or anywhere else in the data, MUST NOT be
callable — and SHOULD NOT even be readable.

This is what keeps §9.1's "an expression cannot act" true in practice. If a
callback in the data were callable, every host that exposed one would widen
the sandbox without meaning to, and the guarantee would depend on what each
host happened to put in `context` rather than on the model. It is also why
§11.2 says `context` carries **values, not functions**.

Registering a translator is recommended, because a value out of the data is
often a key rather than a word — a plan or a status is the same string in
every language. With `translate` available, a catalog entry can localize such
a value itself, without the UI schema knowing the set of possible values.

### 9.7 A property named `constructor`

Any string is a legal JSON property name, including names that mean something
to the host language. An implementation MUST read such a property like any
other, and MUST NOT let its presence affect the readability of its siblings.

Worth stating because it is easy to fail by accident: an evaluator that
identifies a plain object by inspecting `value.constructor` is defeated by a
data property of that name, and typically rejects the **whole object** rather
than the one field — so an unrelated field becomes unreadable because a
sibling was called `constructor`.

### 9.8 Renderer-owned strings

**No renderer renders a user-visible literal in any single language.** Every
string a renderer produces *itself* — tooltips, dialog buttons, accessible
names, placeholders, empty-state text, index markers — resolves through the
form's translator with a documented default as its fallback.

This covers only strings the **renderer** owns. Labels, descriptions and
titles authored in the UI schema or JSON Schema have their own precedence
(element `i18n`, then schema `i18n`, then the path-derived prefix), and an
unbound element needs an explicit `i18n` prefix because none can be derived.

**Keys, not text, are the lookup.** A key is a dotted identifier in a
namespace. Looking a string up by its own English text makes the catalog key
change whenever the wording does, and gives translators nothing stable to key
against. A renderer set's complete default set SHOULD live in one place, so it
is enumerable and a missing translation degrades to a sensible default rather
than an empty element.

**Interpolation belongs to the translator.** Core performs none: a default
like `Delete {name}` renders literally unless the translator substitutes. A
message showing a raw placeholder to the user is the symptom of a renderer
that skipped this.

**Always supply the default message.** A translator that returns `undefined`
for an absent key renders an empty control. A renderer MUST therefore pass its
documented default with every lookup, never a bare key.

### 9.9 A missing translation falls back to the locale, then to the default

Routing strings through the translator is only half of the problem. If the
fallback is a single table in one language, a form switched to another
language keeps that language wherever its own catalog does not carry the key —
which is **most** keys, because a form's catalog is authored for the form's own
labels, not for the renderer set's internal strings.

Resolution is therefore three-deep:

| Source | When it answers |
| --- | --- |
| The form's catalog | Whenever it carries the key |
| A **locale bundle** for the renderer set's own strings | The form's catalog does not, and that language is carried |
| The documented default | Neither of the above |

The ordering MUST NOT be re-implemented by inspection. The bundle's string is
handed to the translator **as its default message**, so the precedence falls
out of the translator's own contract. A locale falls back to its language —
a regional tag uses the base language's bundle — because reverting to the
default language over a region nobody translated separately is worse.

**Whatever supplies the default message decides the language.** A call site
that passes its own hard-coded default *does* call the translator and looks
correct, while pinning the string to that default in every language whose
catalog lacks the key. This is the single most common way the rule above is
violated while appearing to be followed.

**A test that supplies a translator answering every key cannot detect it.**
Such a guard returns the marker and the site passes. The guard that finds it
renders with a locale and **no translator at all**, which is what a form with
no catalog actually is.

Whether these bundles load synchronously or asynchronously is a family
decision, but strings that are on screen the moment a control mounts SHOULD
resolve synchronously: an asynchronous load shows one language and replaces it
in front of the user.

## 10. Markdown policy

The **basic** profile supports paragraphs and line breaks, bold, italic,
strikethrough, inline code, links, and ordered and unordered lists.

Basic **excludes** raw HTML, images, media, iframes, tables, blockquotes,
headings and fenced code. An implementation MAY offer an extended profile
adding headings, blockquotes, tables and fenced code while retaining every
security rule below.

- All Markdown output MUST be sanitized **after** parsing.
- Markdown link targets MUST pass the URL policy (§12).
- Images and raw HTML are **independently gated**, and HTML remains sanitized
  even when enabled.

**No unsanitized markup may reach the page**, which is what the first rule is
for. An implementation whose parser exposes a token stream MAY build its
output from that stream directly rather than rendering to markup and
sanitizing; doing so satisfies the requirement, because nothing unsanitized is
produced. The set of elements that can be drawn is then an explicit allowlist,
and attributes other than link targets are dropped.

**Excluding a construct means excluding its grammar, not filtering its
output.** In a profile without headings, `# Title` renders as those
characters. Parsing the heading and then discarding the node consumes the `#`
and silently promotes the line to a paragraph, which hides an authoring
mistake instead of showing it. A caveat implementations should not promise
around: excluding one construct can leave its characters to a different rule —
with fenced code excluded, a fence is typically claimed by the inline-code
rule rather than surviving as literal backticks.

**The URL policy is authoritative for link targets.** Markdown parsers
commonly carry a scheme allowlist of their own. Where one does, it MUST NOT be
left in front of the URL policy: two checks in series make the effective
policy their intersection, so a host that widens `allowedSchemes` silently
gets nothing for the schemes the parser dislikes, and a target refused before
parsing produces no node and therefore no diagnostic. A refused target keeps
its text and loses its link.

### 10.1 Requesting markup, and being refused

`options.markup` is set on the element whose text it governs; it is an
**option**, never a distinct element type. An unknown option is preserved and
ignored (§1), so a renderer set without this capability still shows the text;
an unknown *type* renders nothing at all, and the same document would lose its
text entirely.

A request that cannot be honoured — an unknown `markup` value, or Markdown
switched off by the host — MUST report a diagnostic **and** still render the
text. This is deliberately unlike a refused template (§22), which renders its
diagnostic alone: a template is a program whose output is the content, while
text is the content, and is readable unparsed.

Markdown MAY default to enabled, unlike the gates of §12. Those admit
something that acts — a compiler, a data-path resolver, an inline payload that
bypasses the host's CSP. A profile-restricted parser admits only a grammar.

### 10.2 Typography

`options.typography`, defaulting to the host-wide
`jsonformsExtended.markup.typography` and then to `true`, controls whether
rendered text is wrapped in the host UI library's own text components so it
inherits the theme. It MUST be switchable, because those components carry
their own margins, which collide with a form's own spacing (§7). It governs
the wrapper only: turning it off still parses.

A library's text component MUST be told whether it is being handed block
content or a single run. One that renders a true `<p>` cannot wrap block
content, since `<p>` accepts phrasing content only.

### 10.3 Configuration

```json
{
  "jsonformsExtended": {
    "markup": {
      "markdown": { "enabled": true, "profile": "basic" },
      "typography": true
    }
  }
}
```

`profile` is `basic` or `extended`. An unrecognized value falls back to
`basic` without a diagnostic: a profile name is a host setting rather than an
authored one, so there is no author on the page to tell, and the safe
direction for an unknown one is the smaller grammar.

## 11. Dynamic values and path grammar

`$dynamic` recursively overlays static values on a UI element.

A leaf is **exactly** `{ "bind": "..." }` or `{ "template": "..." }` — one
key, string value. Extra descriptor keys are invalid.

**Only `undefined` means no override.** `null`, `false`, `0` and the empty
string are real overrides. Objects overlay recursively; **arrays replace whole
values**. The source UI schema is never mutated.

Resolution occurs **before testers** and covers nested children, array detail
and generated schemas, and all dispatch paths.

### 11.1 What may not be dynamic

Static denylist: `type`, `scope`, `elements`, `rule`, `i18n`, `name`,
`$dynamic`, and the canonical `options.variant`.

These determine identity and dispatch.

A second, narrower restriction is on the **leaf kind** rather than the
property: translated text may be supplied by `bind` but never by `template`
(§9). The denylist above is about what may not be dynamic at all; this is
about which of the two leaves may supply it. Note that resolution happens before
testers and testers are re-evaluated when values change, so an option that
*participates in selection* can still change which renderer wins. An
implementation SHOULD keep options that dynamic values supply out of tester
inputs, so an arriving value updates a renderer rather than replacing it —
replacing it discards focus and any local state.

### 11.2 Namespaces

`data`, `item`, `locale`, `config`, `context`.

`item` is the nearest enclosing array-detail item, otherwise undefined.
`context` is safe host-exposed values, **not** arbitrary host functions.
`config` MUST NOT expose the `jsonformsExtended` namespace.

### 11.3 Path grammar

```text
data.customer.name
data.items.0.price
data.items[0].price
data.metadata['some key']
data.metadata["field.with.dots"]
context['help host']
locale
```

`.length` is allowed for arrays and strings. **Own-property lookup only.**
`__proto__`, `prototype` and `constructor` are forbidden. **No calls, no
operators, no method invocation.**

That last restriction is what makes `$dynamic` safe without a permission:
nothing is compiled, so enabling dynamic values is **not** permission to
execute anything (§13).

Two consequences an author meets immediately:

- **A path is a fixed string.** Indexing by a form value — a lookup table
  keyed on another field — is not expressible. Host context must be resolved
  per session rather than exposed as a table to index.
- **A binding reads; it cannot derive.** A boolean that depends on a
  comparison cannot be written here. That is what **rules** are for. The
  division is: `$dynamic` reads, rules decide.

### 11.4 Template grammar

The template parser is quote-aware. `{{` emits a literal `{` and `}}` a
literal `}`; a **single** `{` starts a placeholder ending at the matching `}`
outside quoted bracket content.

**This is inverted from the most widely known templating convention**, so
`{{data.firstName}}` is literal text rather than a binding, and an
implementation SHOULD emit a development warning when it sees that shape.

An invalid or unresolved placeholder makes the **whole template** undefined —
not partial — which then falls back to the static value.

`template` uses the **same grammar and the same expression language** as §9's
text interpolation — there is one of each in this model. What differs is the
source and the failure policy: a template's string is authored in the UI
schema and is never translated, and an unresolved placeholder makes the whole
value undefined (§9.3).

It therefore MUST NOT be used for translated text. A template writes a
finished string onto the element, so the catalog is never consulted and the
form shows one language everywhere. For anything a reader sees as a message,
use `i18n` with `interpolate`; `template` is for strings that are not
messages — a URL, an image source, a placeholder.

### 11.5 Reactivity

The resolution layer supplies each renderer with its **effective UI element**
through ordinary reactive properties and updates it when resolved values
change. Renderers consume ordinary effective properties; they **do not**
inspect `$dynamic` descriptors and cannot distinguish a static value from a
resolved one.

There is therefore nothing for a renderer to subscribe to. Three obligations
follow:

1. **Effective identity MUST remain stable while values are unchanged.** This
   reads like a performance note and is not: an implementation that returns a
   fresh element on every pass defeats memoization, re-runs every tester in
   the form on every keystroke, and re-renders every subtree.
2. **Renderers derive from properties during render.** Capturing a value at
   construction — an initializer that runs once, an effect with no
   dependencies — silently ignores every later change. A renderer that
   performs work from a resolved value MUST key that work on the value, and
   discard results that arrive out of order.
3. **The integration updates and rebinds nested dispatches as well as
   top-level ones**, without remounting unchanged renderer selections or
   discarding unrelated local state.

Binding resolution never implies write-back to its source.

## 12. URL and extension security configuration

Recommended configuration:

```json
{
  "restrict": true,
  "jsonformsExtended": {
    "layoutDefaults": { "gridColumns": 16, "gap": 0, "wrap": false },
    "dynamicValues": {
      "enabled": false,
      "namespaces": {
        "data": true, "item": true, "locale": true,
        "config": false, "context": false
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
        "enabled": true, "profile": "basic",
        "allowImages": false, "allowHtml": false
      }
    }
  }
}
```

**Defaults when extension config is absent:** `restrict` true unless explicitly
false; dynamic values disabled; script evaluation disabled; schemes
https/http/mailto; relative URLs allowed; image data URLs disallowed; Markdown
enabled on the basic profile with images and HTML off; 16 grid columns, gap 0,
no wrap.

`restrict` resolves from element `options.restrict`, then global
`config.restrict`, then this model's preferred default of **true**. It is not
duplicated under the extension namespace, is unrelated to any validator's own
strict mode, and no separate renderer `strict` option is introduced.

**URL-bearing targets:** `Link.href`, `ImageView.src` including
scope-resolved sources, and Markdown links and images.

For URL templates, data, item and locale substitutions MUST use
**percent-encoding equivalent to `encodeURIComponent`**. Permitted config and
context substitutions are host-provided URL components. The final URL MUST
pass policy.

**A declared flag must be consulted.** An option such as `allowImageDataUrls`
that appears in the policy type but is read by nothing is worse than an absent
one: setting it produces no effect and no error. Image data URLs, when
enabled, accept image MIME types only; SVG data URLs are blocked by default
unless the host explicitly opts into a stricter SVG-safe policy.

## 13. ImageView, Separator, Link and templates

```ts
interface ImageViewElement extends BaseUISchemaElement, Internationalizable {
  type: 'ImageView';
  src?: string;
  scope?: string;
  alt: string;
}

interface SeparatorElement extends BaseUISchemaElement {
  type: 'Separator';
  options?: BaseUISchemaElement['options'] & { vertical?: boolean };
}

interface LinkElement extends BaseUISchemaElement, Internationalizable {
  type: 'Link';
  label?: string;
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
}
```

### 13.1 ImageView

A display-only element, not an editable Control. `src`, `scope` and the
required string `alt` are **top-level fields**, not options.

At least one of `src` or `scope` MUST be supplied; both may coexist. If the
effective `src` is defined it is used — **including an empty string, which
intentionally displays no image**. Otherwise `scope` resolves against the
current schema and data context using Control scope semantics, including the
current array-item path.

- The scoped schema must permit strings.
- Empty or missing source data displays no image.
- A non-string value produces a **diagnostic**, and is never coerced to a URL.
- An invalid defined `src` does **not** silently fall through to `scope`.
- `alt: ""` explicitly denotes a decorative image.

Dynamic resolution may override top-level `src` or `alt`; `scope` remains
static under the denylist. Undefined resolution retains the static `src`
fallback if supplied, otherwise `scope` is used. **The URL policy applies
equally to direct, dynamically resolved and scope-bound sources** — no source
precedence depends on how the effective property was produced.

### 13.2 Separator

A display-only element that visually separates sections without reading or
modifying form data. No JSON Schema type or scope is required.

`options.vertical` defaults to false. Parent layout sizing determines the
available extent; a vertical separator requires usable height from its layout
context. It is static: no dragging, resizing or keyboard interaction. Expose
separator semantics and orientation where applicable.

### 13.3 Link

`href` is the static fallback. An **empty `href` is allowed** and renders
non-navigating plain semantics rather than inventing a destination.
`target="_blank"` MUST enforce `noopener` and SHOULD add `noreferrer`
according to host policy.

**Every URL-bearing attribute passes the policy**, not merely the one a
renderer happens to think of as "the link". A refused URL renders as plain
text rather than as a navigable target.

### 13.4 Template and Slot

Template and Slot compose UI-schema elements **structurally**. They are
distinct from the restricted `$dynamic.template` interpolation grammar, and
structural composition alone requires no script permission.

- **Template** resolves a reusable named UI schema from the registry. The
  top-level `name` is required; the lookup finds the first registry entry
  whose name matches. **This is name lookup, not ranked tester selection** —
  testers are not evaluated for it. Duplicate names SHOULD be avoided and
  diagnosed. A missing template renders no substituted content and SHOULD
  produce a diagnostic.
- **Slot** dispatches supplied named content, or a fallback, in the current
  template context.

`Template.elements` supplies named slot contents, merged over inherited
contents with local names taking precedence. Named reuse **preserves the
caller's schema and data path** and does not create a new data object.
Recursive named references MUST be guarded against unbounded expansion.

The same registry also serves ordinary ranked detail selection, combinator
branches and mixed-type forms; these lookup modes MUST NOT be conflated.

### 13.5 TemplateLayout

`template` is the required source string; `elements` contains child UI-schema
elements; optional top-level `lang` selects the engine.

Resolve the language from explicit `lang`, then a configured default, then the
default web profile. **An unknown or unsupported language MUST be diagnosed**
rather than interpreted as another engine.

| Profile | Scope |
| --- | --- |
| A shared web profile | Available independently of the surrounding renderer family's own framework |
| A framework-specific web profile | Uses that framework's template syntax and registered components; not portable across all web renderer sets |
| Native or other profiles | Require a separately declared engine and contract. Web template strings are not directly portable to native renderers. Preserve unsupported documents and report unsupported capability |

A profile exposes to the template: whole-form `data`, core schema `errors`,
`context`, `elements` and `translate`. These are **engine bindings**, not new
core condition fields. `context` may expose additional errors and application
capabilities; **`errors` alone MUST NOT be described as combined validity.**
Live data, error and context changes MUST refresh the bindings without leaving
stale slot editors.

**Children are addressed by name.** Each named child is available to the
template as a placeholder that mounts its delegated renderer. Unnamed children
receive their decimal index as a fallback name; explicit names are recommended.

Two requirements that are easy to satisfy incorrectly:

- **A name collision must not silently steal a slot.** An index fallback MUST
  NOT take a name another child declared, and a child that cannot be addressed
  MUST be reported rather than silently left off the form.
- **A placeholder resolves to the child element itself.** Wrapping it in a
  descriptor object and handing that to the engine breaks any binding that
  iterates the children.

TemplateLayout delegates children **at the original schema and data path** and
preserves normal validation, rules, enabled and read-only behaviour, and
dynamic resolution. Mount and unmount slot content cleanly as template
structure changes, retain correct ownership for repeated placeholders, and
release engine resources on disposal. Report compilation and rendering errors
accessibly — and **distinguish a failure to load the engine from a failure to
render the template**, because they send the reader to entirely different
places.

Template-local UI state MUST NOT inadvertently become form data.

**Markup and executable template profiles are runtime escape hatches**, not
the sanitized Markdown profile and not a security sandbox. Where JavaScript
string compilation or execution is involved they follow the host's trust
policy and the script-evaluation permission. **Enabling `$dynamic` MUST NOT be
treated as permission to execute templates.** Profiles MUST document their
expression, event, raw-HTML and data-write capabilities, and engine two-way
binding MUST NOT bypass read-only, `restrict`, or normal change dispatch.

## 14. Button, actions and script

```ts
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

**Every one of these is a top-level field, not an option.** A renderer that
reads them from `options` leaves a conformant button with no action name and —
worse — **no `params` at all**, because that field has no option spelling.
`params` is what lets one command serve several buttons:

```json
{ "type": "Button", "label": "Deutsch", "action": "setLocale", "params": { "locale": "de" } }
```

Without it, two languages require two action names and the host grows a branch
per language. An implementation MAY additionally read `options.action` and
`options.label` below the top-level fields, for documents already authored
that way.

`action` and `script` are mutually exclusive. **Where an element carries both,
`action` wins** — it is the portable half, and the one a host can intercept.
Carrying both is an authoring error, and a diagnostic SHOULD say so.

Button invokes commands; Link performs navigation. A renderer may offer a
link-like Button appearance through its documented styling options while
preserving button semantics, keyboard activation, disabled behaviour and
pending handling. No portable Button variant is defined for that appearance,
and an action MUST NOT be turned into navigation merely to obtain a visual
treatment.

**Colour names are semantic, not literal.** Each family maps them to its own
palette, which is the point of naming them this way rather than by colour.

### 14.1 The action path

A Button action calls the context's action-firing function and **awaits it**.
It does not call a host handler directly.

- **Pending covers the complete promise**, not the dispatch.
- **Duplicate activation SHOULD be prevented while pending.** The guard must
  not be the pending *state*: a second activation can arrive before the
  re-render that records it, leaving a window in which both get through. A
  synchronous flag, reset in a `finally`, is what closes it.
- **Rejection clears pending and propagates** through ordinary platform error
  handling. It MUST NOT be swallowed.

### 14.2 The script path

`script` is a string containing an **async function body**, with top-level
`await` supported. It is invoked with the action event as `this`, so the body
reads `this.context`, `this.params`, and the platform fields. No positional
argument or wrapper function expression is required.

String evaluation requires `security.allowScriptEvaluation: true`. Enabling it
means the host treats the UI schema as **trusted executable code**. A platform
content-security policy may prohibit runtime evaluation; a renderer MUST NOT
weaken that policy and MUST instead report evaluation-disabled behaviour.

Await completion using the same pending and duplicate-activation rules as
actions.

**A function-valued script is a build-time convenience outside the wire
format.** A platform MAY accept one. Where it does, two rules are forced by
experience:

- **Pass the event as an argument *and* as `this`.** Binding only `this`
  is a trap, because a lambda's `this` is lexical and cannot be bound — such a
  script compiles, runs, and reads the wrong thing with no diagnostic. Passing
  both means neither idiom can be got wrong and a body moved over from the
  string form keeps working.
- **The script permission gates the string form only.** A function the build
  already compiled needs no evaluation permission, and requiring one would be
  theatre.

A function-valued script MUST NOT be stringified into a function body. Doing
so turns a closure expression into something created and immediately
discarded: the button is clicked, nothing happens, and nothing is reported.

Script is a last-resort, non-portable runtime escape hatch. Other platforms
may define another representation, or ignore and preserve unsupported scripts.

### 14.3 Shared destructive-change confirmation

Confirmation is **separate from mutation permission and from validation**. It
never bypasses `restrict`, read-only, disabled state or schema constraints.
Ordinary typing, navigation, adding a new value, and selecting the
already-selected type or branch do not prompt. Picker staging is a separate
interaction contract.

| Policy | Behaviour |
| --- | --- |
| `always` | Confirm covered destructive actions against existing values. No prompt where there is no value to discard. **`false`, `0`, empty strings and empty containers are existing values.** |
| `never` | Perform the otherwise-permitted action without prompting |
| `complex` | Confirm when the value being discarded is a non-empty object or array. **Inspect the old value, not the destination type.** |

**Covered operations:** `typeChange` (mixed-type selection), `branchChange`
(combinator selection), and `delete` (removing a property, item or subtree).
Clearing a mixed type follows `typeChange`; clearing a combinator selection
follows `branchChange`. Ordinary input clearing follows the shared clear-value
contract and does **not** become a confirmation on every edit.

For batches, one confirmation covers the operation, and `complex` applies if
any discarded value qualifies. Evaluate the data **actually discarded**,
excluding enclosing properties preserved during a branch change. A non-empty
object has at least one own key; a non-empty array has at least one item,
independently of whether its nested values are empty.

**Resolution order:**

1. Element `options.confirmation[operation]`
2. Config `jsonformsExtended.confirmation.renderers[catalogId][operation]`
3. Config `jsonformsExtended.confirmation.default`
4. Documented fallback: mixed type change uses `complex`; other covered
   operations use `always`

**Catalog IDs are stable semantic identifiers, not component names.** For a
delete or rename control hosted inside another renderer, use the **owner of
the action** — a dynamic-property delete belongs to the additional-properties
catalog even when drawn inside a tree.

Cancellation leaves committed data, selection and expansion unchanged.
Confirmation performs the operation **once**, after rechecking mutation guards
and its target. A stale confirmation MUST NOT be applied to an unrelated
replacement item. Dialog text is localized and action-specific, with
accessible focus handling.

The runtime resolves configuration into one shared policy; individual UI
libraries MUST NOT give these values different meanings.

## 15. Read-only, restrict and mutation constraints

### 15.1 Read-only sources and precedence

| Source | Spelling and role |
| --- | --- |
| Component property | `readonly: true` establishes form-wide read-only state; element settings cannot override it |
| Global config | `readonly` or `readOnly` supplies a default, subject to core precedence. **Not** an unconditional form-wide lock |
| UI-schema options | Prefer `options.readonly`; accept `options.readOnly` as a compatibility spelling. Requests read-only behaviour independently of schema annotation |
| JSON Schema | `readOnly` is the standard spelling. Lowercase is **not** the schema keyword |

JSON Schema `readOnly` is an **annotation**. Standard validation does not
compare previous and new values, nor enforce immutability because the
annotation is present. The rendering integration enforces editing
restrictions.

Precedence, preserving core's own resolver: form-wide `readonly: true` wins
first, then applicable read-only rules, then explicit UI options, then
explicit config values, then schema `readOnly: true`, then inherited renderer
read-only. Within options or config, the lowercase spelling is checked before
the camel-case one. **An explicit `false` at an earlier level overrides a
later source, including schema and inherited annotations — but cannot override
form-wide `readonly: true`.** Avoid authoring both spellings together.

`separateReadonlyFromDisabled` distinguishes effective read-only state from
enabled state. With the compatibility default `false`, read-only sources
participate in disabling controls. With `true`, the integration and renderer
MUST honour read-only separately from enabled, **including guarding
mutations**. Setting it alone does not prove every renderer supports
inspection without disabling. A family that does not support the separation
MUST declare the capability unsupported rather than let it be assumed.

Do not conflate a disabled widget with a different precedence for read-only
sources, and do not infer precedence from how a widget visually represents
read-only state.

### 15.2 Rules and effective state

| Effect | Condition matches | Condition does not match |
| --- | --- | --- |
| `SHOW` | Visible | Hidden |
| `HIDE` | Hidden | Visible |
| `ENABLE` | Enabled | Disabled |
| `DISABLE` | Disabled | Enabled |
| `READONLY` | Read-only | Writable |
| `WRITABLE` | Writable | Read-only |

`READONLY` and `WRITABLE` are **two-way decisions**, not conditional additions
to an underlying value. They take precedence over element, config and schema
read-only settings; a form-wide `readonly: true` still wins.

**An enabled state does not grant permission to mutate a separately read-only
value.** Read-only and enablement remain distinct wherever the integration
supports separate state.

`failWhenUndefined: true` makes an unresolved condition value fail explicitly.
Without it, the condition schema is validated against the resolved value
**including `undefined`** — so missing data does not necessarily make every
schema condition false.

**Schema-based conditions evaluate data**, not collected additional errors and
not pending editor validation state. A valid-form command guard MUST use the
combined-validity integration rather than assuming a rule observes those
errors.

Hiding an element preserves its data, does not remove its schema constraints,
and does not exempt it from validation. Rule evaluation mutates neither data
nor the authored UI schema.

**Conditional validation and conditional presentation are separate
mechanisms.** A schema condition does not itself define a show or hide rule,
and an implementation MUST NOT infer conditional layouts from validator
support for `if`/`then`/`else` or dependency keywords.

### 15.3 Validation execution and error visibility

| Mode | Automatic schema validation | Schema-error display |
| --- | --- | --- |
| `ValidateAndShow` | Runs; default | Show the errors |
| `ValidateAndHide` | Runs and retains results | Hide schema errors in ordinary control presentation |
| `NoValidation` | Does not compute results | Nothing automatically computed to display |

**Additional errors remain available in all three modes.** `ValidateAndHide`
does not suppress host-supplied additional errors or participating renderer
summaries. Renderer-owned publication options control their own contribution
independently; the validation mode is **not** a universal switch for external
or language-service validation.

Schema-based rules still validate their condition schemas independently of the
mode. A separate validation invocation is not evidence that automatic
validation is enabled.

**An empty error array under `NoValidation` does not prove the form passed.**
Consumers of cached validity MUST distinguish unvalidated, pending, stale,
valid and invalid. Error *visibility* does not determine validity either:
`ValidateAndHide` may retain failures while showing none.

`restrict` remains independent. `NoValidation` does not disable preventive
constraints, mutation guards or action permissions; `restrict: false` does not
disable schema validation. Changing the mode MUST update presentation and
notify integrations **without requiring the user to edit data**.

### 15.4 Change events, context errors and combined validity

| Interface | Error information |
| --- | --- |
| Base change event | Data and core schema errors. **Does not automatically include additional errors** |
| Extended form context | Separate `errors` and `additionalErrors` collections |
| Control error selectors | Combine applicable schema errors and additional errors for that control, subject to display policy. **Mapped display text is not an authoritative validity collection** |

Supporting additional errors for display and context access does **not** imply
the change event's `errors` field includes them.

A host checking only the change event's error count can therefore observe no
schema errors while a renderer-published error still blocks validity. **A host
requiring complete validity MUST consider** current schema results, host and
renderer additional errors, and participating pending validation. Presentation
filtering, hidden messages and translated control strings MUST NOT become the
validity source.

**Notify combined-validity consumers when additional errors or pending state
change, even without a data edit.** Do not rely on a data-change event, and do
not assume an additional-error update triggers one.

### 15.5 Additional-error ownership and changing data paths

Associate renderer-generated errors with their **owning editor and logical
data target**, not with the current array index. Keep ownership and version
metadata in runtime state, outside business data and the authored UI schema.
Publish the instance path using the current pointer to that target. No
business-data identifier is required merely to support ownership.

Where an owner's target moves — deleting an earlier array item shifts the rest
— update the published path. **Leaving the old path associates the error with
another item.** Deleting the owning target removes its owned errors. Identity
MUST NOT be inferred from an index or a display label alone.

Discard asynchronous results for obsolete targets or data versions. Where a
target cannot be reliably matched after external replacement, invalidate stale
renderer-owned results and evaluate the current target rather than guessing a
relocation. **Clear only errors belonging to the affected owner**; preserve
unrelated renderer and host errors.

Host-supplied errors remain under their producer's ownership. Renderers MUST
NOT rewrite arbitrary host error paths, nor clear host errors merely because
their own target moved.

Core data updates recalculate schema errors but **do not** automatically
relocate or remove additional errors.

Participating asynchronous validation MUST expose pending state to validity
consumers during reassociation. **Do not report confirmed validity solely
because stale errors were removed while their replacements are pending.**

### 15.6 Renderer-published additional errors

A renderer that discovers a problem the schema cannot express — a syntax error
inside an embedded editor, an unreachable resource — may publish an additional
error against its own path.

Three requirements make this usable rather than a source of collisions:

1. **Publication is opt-in per renderer**, through a documented option
   resolved per element then per config. A renderer that finds a problem does
   not thereby acquire the right to invalidate the form.
2. **Each published error is uniquely owned.** Several renderers, and several
   instances of the same renderer, may target one path; an owner clearing its
   own error MUST NOT remove another's. Ownership is per instance, not per
   renderer type.
3. **An owner's errors are cleared when its subject changes**, and the
   mechanism must survive the host replacing the whole error collection.

**A renderer cannot publish by itself.** Additional errors are a form-level
input, and a renderer has no channel to it. A conforming integration provides
one — a store the renderers write to and the form reads. Two failure modes are
worth naming because both look correct:

- **Observing changes without re-dispatching them does nothing.** A passive
  observer of the form's own updates is never invoked when a renderer
  publishes, because publishing is not a form update.
- **Re-dispatching the whole core state from a stale snapshot reverts
  edits.** A renderer publishes during render, before the enclosing
  component's change handler has run, so a dispatch carrying that render's
  data overwrites the newer value. The publication must be merged into the
  form's state, not replayed over it.

Where no such integration is present, a publishing renderer MUST report the
absence as a diagnostic rather than fail silently.

### 15.7 Pre-touch error filtering

| Option | Default and behaviour |
| --- | --- |
| `enableFilterErrorsBeforeTouch` | False when absent. True enables filtering |
| `filterErrorKeywordsBeforeTouch` | A non-empty array names keywords to suppress before touch. When filtering is enabled, an absent or empty array suppresses **all** otherwise displayable control error text before touch. Ignored when filtering is disabled |

**Touch is blur, not focus.** Receiving focus alone is insufficient, and
leaving the control counts even if the user changed nothing. Touch state is
runtime interaction state, not form data and not an authored value.

**The form remains invalid while a required error is hidden.** Filtering MUST
NOT remove structured errors, suspend validation, modify data, or alter the
collections used by validity consumers. It does not make a rule observe errors
it would not otherwise inspect. Disabling the filter restores ordinary
presentation subject to the validation mode; it does not force errors to
appear under a hiding or non-validating mode.

Apply filtering to the **complete** set of errors eligible for the control,
including mapped additional errors. A non-matching additional error MUST NOT
be lost merely because a matching schema error was suppressed. Matching
additional errors may have their text suppressed; their structured entries and
validity contribution are unchanged.

**A summary that claims the same behaviour must track child touch state** and
MUST NOT permanently suppress a matching error simply because filtering
remains enabled after the child is touched. A family that does not implement
summary participation MUST document that rather than let it be assumed.

### 15.8 Read-only interaction and restrictive editing

Read-only prevents mutation of form data but does not disable every
application command. Renderer-owned mutation actions — add, remove, move,
clear — MUST obey read-only and enabled state.

With `restrict` enabled, supported interactions **prevent** invalid committed
edits rather than reporting them afterwards. Explicit `false` disables
prevention without disabling schema validation or read-only rules.

| Control family | Constraints enforced through interaction |
| --- | --- |
| Arrays, checkbox groups, multi-selects, chips | `minItems` and `maxItems` govern removal and addition |
| Additional-properties editor | `minProperties` and `maxProperties`, counting **all** properties including declared ones |
| Date, time, date-time | Supported inclusive and exclusive bounds constrain picker selection and completed typed commits |
| String input | Supported `maxLength` prevents excess entry, accounting for displayed versus stored representation |

**This is a renderer-aware policy, not a promise to turn every schema keyword
into an input filter.** A `pattern` does not imply a mask. Each catalog entry
identifies preventive support separately from validation-only support.

For arrays with restriction enabled:

- Disable or reject additions that would exceed `maxItems`, including add
  buttons, new selections and token creation.
- Disable or reject removals that would fall below `minItems`, including
  deselection, token removal, and clearing a non-empty array.
- **Evaluate batch edits against their resulting size.** A replacement
  preserving the count MUST NOT be blocked merely because the array sits at a
  boundary.
- Apply the same checks to mutation handlers as to visible action state;
  keyboard interaction MUST NOT bypass them.

**Already-invalid data must remain visible and repairable**, never truncated,
padded or rewritten on mount. Allow repairs toward validity in both
directions. Moving an item does not change array size and is not blocked by
count constraints alone.

The same applies to property counts. Renaming without changing the count is
not prohibited by count constraints alone; name and value constraints remain
separate.

For temporal entry, keep partial text as a **local draft** so it can be
completed or corrected. When restricted, do not commit a completed value that
violates a supported bound through typing, pasting, picking or confirmation.
**Provide feedback without silently clamping or replacing the user's input.**
With restriction disabled, out-of-range edits may be committed and reported by
validation. Masking guides syntax independently of `restrict`.

Renderer specifications MUST declare which constraints and interaction paths
support prevention. Validation remains necessary for external data,
unsupported constraints and cross-field conditions.

## 16. Adaptive behaviour

This model supports **adaptive layout**, not separate arbitrary UI-schema
branches per device class.

Portable mechanisms: horizontal and vertical layouts; the span, weight and
fixed sizing model; `wrap`; `minItemWidth` auto-fit; natively responsive
widgets; and documented family capability behaviour.

A renderer on a small screen SHOULD use platform-appropriate controls while
preserving semantic intent — a date Control may present a platform date picker
on one device and a desktop picker on another; both are the same Control.

Deeply nested structural layouts remain spacing-neutral.

Explicit named breakpoint overrides are deferred. Renderer specifications may
provide platform-specific enhancements, but portable documents SHOULD rely on
content- and container-driven layout first.

A host MAY select a different UI schema where a product genuinely requires a
substantially different workflow. That is **composition outside the portable
element language**, not a hidden automatic branch inside a Control.

## 17. External context, visibility and security

Rules remain the portable mechanism for data-driven visibility and enablement.

External application state — role, feature flags, entitlements, workflow mode
— may influence which UI schema, config or context the host supplies. A host
may also expose safe values through the permitted dynamic `context` namespace
for non-sensitive presentation options.

> **UI visibility is never an authorization boundary.**

An administrative UI may include controls a restricted UI omits, but the
service MUST independently reject unauthorized operations. Hiding a Button or
Control is presentation, not enforcement.

Recommended patterns, in order:

1. The host selects or composes the authorized UI schema for the current user.
2. Ordinary rules handle conditions based on form data.
3. Safe external context may drive non-structural dynamic values.
4. Renderer and platform escape hatches are **not** an authorization system.

This model does not define portable dynamic replacement of structural fields
such as `elements`, `rule`, `name` or `variant`. Where authorization requires
structural differences, compose or select the UI schema outside the resolver.

## 18. Renderer behaviour specifications

The portable model defines semantics. Each renderer set SHOULD carry its own
behaviour specification documenting: canonical variants supported; established
options and their encodings; schema keywords honoured; default and fallback
behaviour; visual and usability behaviour; accessibility; invalid and
out-of-domain data behaviour; read-only, enabled and constraint behaviour;
internationalization support; useful underlying-library enhancements; and its
escape-hatch namespace.

### 18.1 Catalogue structure and provenance

A catalogue entry describes **runtime behaviour**. Suggested renderer names
are descriptive identifiers, not new serialized types or variants.

Every entry MUST state its provenance (§5.2), including option-level
exceptions to the entry's own origin, and MUST identify:

- Suggested name, visual presentation and interactions.
- Exact selection conditions, including selection with a **generated** UI
  schema, tester rank, and competing renderers.
- Supported options with types, defaults and precedence — **separating
  selection, display, storage and underlying-component properties**.
- Schema keywords used for selection, widget constraints and validation.
  **Validator support alone does not establish widget support.**
- Missing, null, invalid, read-only, disabled and fallback behaviour.
- Applicability per family and version.

Entries MUST include a concrete schema and UI-schema selection example, and at
least one **incompatible-schema** example where selection could otherwise
mislead. Examples supplement applicability rules; they do not replace them.

**A feature present in one family MUST NOT be described as supported by all.**
Package membership and upstream provenance are separate facts.

### 18.2 Separating the effects of a keyword

Every entry must separate these. A keyword may have more than one effect, and
listing it as "supported" is insufficient:

| Effect | What must be explained | Example |
| --- | --- | --- |
| **Selection** | Eligible types, resolved scope, required schema/UI combinations, competing presentations | A date control accepts a string with a schema or UI date format |
| **Presentation** | Changes to the visible widget or available interactions | A meridiem option changes time-picker interaction |
| **Input restriction** | Which edits are prevented, and on which input path | A format bound limits picker choices and completed typed commits when restricted |
| **Conversion and commit** | Parsing, formatting, stored value, and when edits reach form data | A save format changes serialization; staged actions defer commits |
| **Validation only** | Errors reported without changing the interaction | A `pattern` does not imply a mask or character filter |

### 18.2a Temporal pickers and `views`

`options.views` names the panels a temporal control offers. It is **not
date-only**: a date control takes calendar views, a time control takes time
columns, and a date-time control takes both.

| Control | Admissible views |
| --- | --- |
| Date | `year`, `month`, `day` |
| Time | `hours`, `minutes`, `seconds` |
| Date-time | all six |

The **finest date view named** is where the calendar lands. The time views
name the columns drawn.

Two rules make it safe to author:

- **`views` never changes the save format.** A year/month picker storing a
  full date is a legitimate request, and asking for hours and minutes does not
  stop seconds being stored. An implementation MUST NOT infer one from the
  other — inferring picker granularity from the stored format makes storage
  decide the interaction, which is backwards.
- **An array naming no view of a kind the control uses leaves that half to the
  display format**, rather than blanking it. This matters because a date-time
  control's natural default array contains date views that a time panel must
  not read as "no columns".

A view the control cannot use is accepted and ignored.

**A separate option for whether selecting a value closes the picker is not
introduced.** Some renderer families spell that as its own boolean; here it is
the staging behaviour of `showActions`, and two encodings for one presentation
are forbidden (§5.2).

### 18.3 Shared control behaviours

These apply across the catalogue and are specified once.

**Placeholder hints.** `options.placeholder` supplies a hint shown in an empty
control. It is a hint, never a value, never a default, and never a substitute
for a label.

**Input composition and string length.** Text entry MUST NOT break
composition-based input methods. String length constraints operate on the
**stored representation**; a displayed representation may differ, and a
grapheme is not necessarily one code unit.

**Initial focus.** `options.focus` requests initial focus. At most one element
should claim it; where several do, the first in document order wins and a
diagnostic SHOULD report the rest.

**Descriptions and required markers.** `showUnfocusedDescription` controls
whether a description is visible when the control is unfocused.
`hideRequiredAsterisk` hides the visual required marker **without changing
required validation or accessible required-state information** — a renderer
MUST NOT implement it by removing the accessible required state.

**Clear affordance.** Where a control offers clearing, clearing writes the
shared empty representation and is subject to read-only, enabled and
`restrict`. Clearing is an ordinary edit and does not prompt the destructive
confirmation policy.

### 18.4 Pending edits, commit timing and cancellation

A renderer integration may debounce ordinary edits. This is a behavioural
contract, not a core-managed queue and not a debounce option.

Distinguish the **visible draft**, the **committed data and its validation**,
and the **snapshot delivered to host listeners**. These update at different
times. Neither delay makes validation of an earlier value proof that the
latest draft is valid.

- **Blur SHOULD flush** a pending committable edit before presenting its
  validation errors.
- **An action that consumes form data MUST resolve pending edits** and use the
  resulting data and validation state before proceeding. Do not rely on blur
  alone: keyboard-triggered actions may run without moving focus.
- **Flushing does not** force incomplete drafts into the data model, bypass
  input restrictions, or accept edits explicitly staged until confirmation.
  An unresolved draft MUST NOT silently be treated as committed.
- **Clear supersedes queued edits**, so an old callback cannot restore the
  cleared value.

**Disposal must leave no stale write callback active**, and there are three
ways a queued write outlives its target — only one of which is disposal:

1. **The control is disposed.** Cancel — **do not flush**: flushing on
   disposal can recreate deleted data or write into a different item.
2. **The control is rebound to another path.** The queued write still carries
   the old path and must be cancelled.
3. **The path stays and what it points at changes.** This is the case
   implementations miss: deleting an array item shifts the rest, and a list
   keyed by path does not unmount or rebind the control at that index — it
   re-renders with a different item's data. Neither of the first two
   mechanisms fires.

**The path alone is insufficient evidence that the original target still
exists.** The evidence for the third case is the value arriving from outside,
which MUST be distinguished from **normal host feedback of the
just-committed data** — otherwise the guard cancels ordinary typing, because
a commit lands mid-word and returns as a property while later keystrokes are
still queued. Recording the value last written is sufficient to tell them
apart.

Recheck mutation permissions and target identity before a delayed commit: a
queued edit MUST NOT bypass a later read-only state or restriction.

### 18.5 Choice and suggested-string controls

All use `Control`; these are suggested renderer names, not element types.
**Searchable finite choices and free-text suggestions have different data
semantics even where their widgets look alike.**

| Suggested name | Schema applicability | Presentation |
| --- | --- | --- |
| Enum choice | Resolved schema defines `enum`; `const` is the single-choice case | Select one permitted value. Supported value types declared per family |
| Named choice | Supported `oneOf` with `const` per branch; branch `title` supplies the label | Select a label, store its constant. **Arbitrary `oneOf` schemas are not finite-choice lists** |
| Autocomplete choice | As above, with searchable presentation | Filter permitted choices, then select. **Search text is not itself a new allowed value** |
| Suggested string | String schema with `options.suggestion` | Free-text entry with suggestions; other values remain permitted if the schema accepts them |
| String-or-enum | Supported `anyOf` with a string enum branch and a non-enum string branch | Offer the enum values as suggestions while allowing values the other branch accepts |

The string-or-enum presentation MUST NOT be generalized to every `anyOf`. A
family declares the branch shapes it accepts and falls back to ordinary
combinator rendering otherwise.

| Option or keyword | Effect |
| --- | --- |
| `autocomplete: true` | Requests searchable finite-choice selection |
| `autocomplete: false` | Requests a non-searchable selector. Does **not** request radio buttons or a platform-native select |
| `autocomplete` absent | The family's documented default (§5.5) |
| `format: "radio"` | Requests visible radio choices |
| `suggestion` | An array of suggested strings. **Adds no enum constraint and authorizes no value the schema forbids** |
| `placeholder` | Hint only; never a stored value |
| `clearable` | Exposes a clear action, subject to enabled and read-only state. Clearing may produce a validation error |
| Schema `enum` / `const` | Supplies permitted stored values, affecting both choice construction and validation |
| Branch `title` and i18n metadata | Supplies labels **without changing stored values** |
| `pattern`, `minLength`, `maxLength` | Validate the stored string. Suggestions do not replace these |

A combobox-shaped widget is not evidence of search support. Remote lookup and
asynchronous suggestions are not implied by `autocomplete`.

**Radio choices.** One group label with a label beside each radio, preserving
schema choice order. Preserve original value types; labels and internal widget
strings MUST NOT become stored values. **Missing data starts with no
selection; mounting MUST NOT choose the first option.** Activating the
selected radio does not clear it — clearing uses the shared clear action.
Invalid or out-of-domain data remains available for correction and MUST NOT
silently map to an unrelated choice. `format: "radio"` determines the
presentation; `autocomplete` has no effect on it.

**Choices are keyed by value, never by label** (§5.4).

### 18.6 Shared detail UI-schema selection

For object controls, array item forms, list-with-detail and any renderer using
the shared mechanism, select the form description in this order:

1. If `options.detail` is an **inline UI-schema element with a `type`**, use it.
2. If `options.detail` is the literal `"GENERATE"`, generate the fallback form
   and **bypass registered UI schemas**. Emit the uppercase spelling; matching
   SHOULD be case-insensitive.
3. Otherwise use the **highest-ranked applicable registered** UI schema.
4. If none matches, generate the fallback form.

Do not invent another registered-form selection string, and do not treat
arbitrary detail strings as registry identifiers.

**Scopes inside a detail form are relative to its object or item schema**, and
the original item data path and root schema reference context are preserved.
UI-schema registry testers select a *form description*; renderer testers
select *components* for the resulting elements. These are separate registries
and separate steps, and MUST NOT be conflated.

Inline, registered and generated detail forms all pass through dynamic
resolution and normal nested dispatch. **Rendering a generated form MUST NOT
initialize or overwrite data.**

**Registry testers** have a different signature from renderer testers. They
MUST be synchronous and side-effect-free, may run more than once during
selection, and MUST NOT mutate data or schema or depend on invocation count.
Return the not-applicable constant to reject; otherwise a finite non-negative
rank, highest wins, first registered wins ties.

**A registry entry that matches an object's own schema can be dispatched back
to itself**, producing an infinite tree that exhausts memory on first render
with nothing thrown — an infinitely deep tree is legal. An implementation
using this registry MUST guard against re-entering the same entry for the same
schema and path, and the guard belongs in the object-rendering path rather
than in any one renderer.

### 18.7 Array add-item initialization

Explicit **Add** initializes a new value. This is separate from validator
default assignment and from provisional display fallbacks.

| Item schema | Initial value |
| --- | --- |
| Explicit default | A **deep copy**, including `false`, `0` or `null` |
| String without a temporal format | Empty string |
| Number or integer | `0` |
| Boolean | `false` |
| Array | Empty array |
| Object without an explicit object default | Populated from declared property defaults; properties without defaults are **not** filled with placeholders |
| Null | `null` |
| String with schema format date, time or date-time | A current temporal value serialized for that format |

**These are initial values, not a guarantee that the item schema is
satisfied.** A missing required property remains an error until supplied;
initializing a number to `0` does not satisfy a minimum of 10.

The temporal case is **schema-driven**. Selecting a date renderer through UI
options alone does not give a plain string schema that initialization
behaviour.

With `restrict` enabled, Add obeys structural constraints, read-only and
enabled state, and the add guard. **A newly added item may still require
completion** — full item validity is not a prerequisite for inserting an
editable item, and this exception does not authorize bypassing ordinary edit
guards or changing existing invalid values.

**Rendering an existing item MUST NOT repeat initialization or replace its
data.** Object and array defaults MUST NOT share mutable instances between new
items, and MUST NOT mutate the schema. Initialization is not a satisfiability
solver: for combinators, do not assume the first usable branch produces a
value valid against the whole schema.

### 18.8 Errors without a rendered target

Schema errors can apply to an object, or to a property with no available
control. Delegating object content to a generated or registered layout does
**not** imply every error can be displayed by a child control.

Provide accessible feedback for object-level errors **near the object
editor**, and make the failure clear even where no corresponding input can be
focused.

Retain field-specific feedback beside available controls. Avoid duplicating
every message at every enclosing level; implementations may combine local
explanations, summary indicators and accessible error lists.

**Hiding a control does not discard its errors or exempt its data from
validation.** Eligible errors must remain discoverable without forcing hidden
controls visible merely to show them.

**Never silently delete, rename or rewrite invalid data to remove an error
that has no rendered target.**

### 18.9 Array-level errors and item summaries

Errors at the array's own path are distinct from descendant errors. A summary
requiring structured array-level errors MUST obtain them from the appropriate
error selector, **not reconstruct them from display text**, and MUST NOT
assume the integration supplies a separate structured array-level property.

Provide an accessible explanation of array-level errors near the array,
**including when it has no items** — `minItems` can fail for an empty array
while a missing property inside an item belongs to that item's detail.

An option that suppresses the child-error summary does **not** suppress the
array's own error explanation. Where a combined summary is used, retain an
appropriate array-level presentation when the summary is hidden.

**Item badges and summaries associate errors by path segment.** An error
belongs to an item when its normalized path identifies that item or a
descendant, not merely a textual prefix: `employees.10.name` MUST NOT count
for `employees.1`. Mapped additional errors follow the same rules. Targeting
must remain accurate after reorder and deletion.

**An indicator that shows only a count communicates nothing to a screen
reader.** Where a marker carries a number, the accessible name carries the
explanation.

### 18.10 Matching constraints: `contains`

`contains` requires matching entries; `minContains` and `maxContains`
constrain **how many entries match**, not the array's total length. Without
`minContains`, `contains` requires at least one match. The count keywords have
no effect without `contains` and require a dialect that supports them.

These constraints do **not** select a renderer, replace items, or prescribe a
schema for every item. They apply across the complete array, including a
tuple's fixed prefix and additional items, without changing positional field
selection. Expose violations through the array-level error contract, including
for an empty array — no item need exist for the error to be discoverable.

Under `restrict`, a family SHOULD prevent a discrete deletion that would take
a satisfied minimum below its required value, **where matching can be
evaluated reliably**. Evaluate against current data and the validator's own
dialect semantics **without mutating data** through default assignment or
transforms. Where reliable evaluation is unavailable, retain validation
feedback and document the limitation rather than guessing which entries match.

This does not require blocking every intermediate edit: incomplete edits and
transferring a status between entries may temporarily violate counts. **Never
automatically add matches, change item values, or delete excess matching
entries.**

### 18.11 Tuple control: positional array fields

A **Control bound to array data**, not a layout whose children come from UI
schema elements.

| Schema / UI schema | Selection |
| --- | --- |
| Array with positional schemas | Automatically eligible; no variant necessary |
| Array with one item schema and **equal explicit** `minItems` / `maxItems` | Ordinary array selection unless tuple presentation is explicitly requested |
| The same fixed-length array with `variant: "tuple"` | Render that many positions using the shared item schema. Bounds must be equal non-negative integers |
| Missing or unequal bounds with `variant: "tuple"`, or a non-array schema | **Unsupported. Report a configuration diagnostic rather than guessing a positional count** |

**A family declares the schema dialects it recognizes.** Where both a
prefix-style and a tail-style positional spelling exist, **the newer spelling
MUST be checked first**: in one dialect a tuple's item schema is the *tail* and
in the other it is the *prefix*, so a schema carrying both, read in the wrong
order, turns one tail schema into the whole list of positions — a silent
misreading rather than a failure. What a renderer recognizes is separate from
what the host's validator understands.

`options.vertical` defaults to false. Labels derive from each positional
schema's title with a localized position fallback. **Delegate each value using
its positional schema, its array-index data path, and the original root schema
for reference resolution** — never a single item schema where the schema
declares different schemas by index.

There are **no Add, Delete or Reorder actions** for declared positions. Equal
bounds alone do not change the presentation of existing uniform arrays.

**Labels.** The parent Control's label describes the tuple as a whole and MUST
NOT be copied onto every delegated field. Per field: the delegated Control's
explicit label, else the positional schema title, else a localized position
label. **Visible numbering is one-based; data paths remain zero-based.**

**A tuple is one value, so writing one position writes the whole array.** An
edit at a missing position must fill the positions before it and commit the
filled prefix and the edited value **together, without creating sparse
arrays**. A delegated control knows only its own path, so writing index 2 of a
one-element array would produce a hole — which the contract forbids. The
enclosing control must therefore intercept writes from its positional subtrees
rather than letting each write its own index.

**Presentation.** `options.showBorder` defaults to `true`: one subtle boundary
enclosing the heading, the fixed positions, the additional-items section and
array-level errors. Additional items form an inner section rather than a
separate card. `showBorder: false` removes the outer border and padding for
compact embedding **without removing labels, errors or grouping semantics**.

Array-level validation highlights the tuple heading and error area, not the
valid positions. Child controls retain their own field-level feedback.

### 18.12 Shared array action options

`disableAdd` and `disableRemove` are booleans, both **false** by default,
resolved from element options over global config, and retained at the **top
level** of config.

| Option | Effect |
| --- | --- |
| `disableAdd` | Prevents inserting items, independently of current array size |
| `disableRemove` | Prevents deleting items, independently of current array size |

These leave existing item values editable unless another rule disables editing,
and **neither disables reorder**. A `false` value merely removes this option's
prohibition; it cannot override read-only or disabled state, core-derived
action restrictions, or count prevention under `restrict`.

**Hide or disable the affordance *and* guard the handler.** Apply the policy to
toolbar actions, row actions, keyboard shortcuts, context menus, duplication,
paste-driven insertion and deletion, and batch operations. **Recheck
permissions after any confirmation** — a confirmation never grants permission
to add or remove.

### 18.13 Composite cell detail editing

Where a cell's value is an object or array, the cell shows a **summary** and
offers a detail editor. A summary descriptor is a scoped element, not a format
string.

**Editing is transactional:**

- Opening creates a **private draft** carrying the original root schema and
  path context.
- **Apply** commits once. **Cancel, Escape, the close control and dismissal**
  discard it.
- A nested dialog's acceptance updates only its **enclosing draft** until that
  outer dialog is accepted.
- **Opening and cancelling emit no form-data changes.** An unchanged Apply also
  emits none.
- **Flush pending debounced input before Apply**, and cancel it on dismissal or
  an explicit clear, so delayed edits cannot restore discarded contents.
- **Discard late updates from unmounted draft editors.**
- **Do not overwrite an externally changed target with a stale draft** —
  require reopening.
- Preserve validation feedback, enabled and read-only state, and focus
  restoration. **Apply is not automatically gated on whole-form validity.**

| Option | Default | Meaning |
| --- | --- | --- |
| `showEmptyButton` | `false` | Show a clear action inside the dialog |
| `showRemoveButton` | `false` | Show a remove action **only where the containing context permits removal**. Never enables removing a tuple position |
| `okLabel` / `cancelLabel` / `emptyLabel` / `removeLabel` | Apply / Cancel / Clear / Remove | Text or translation key |

**Clear means emptying contents; Remove means unsetting the property.** Both
are opt-in and remain subject to contextual restrictions. An explicit label is
**translated as a key, falling back to that same string** as literal text.

Each action carries a localized tooltip available on hover **and keyboard
focus**.

**Two implementation constraints the transactional contract forces:**

- **Clone the whole validation context, not just the value at the path.**
  References into the root schema and rules reading other parts of the data
  must still resolve inside the draft.
- **Apply must read the flushed draft directly.** Flushing dispatches into the
  draft in the same tick, which re-rendered state cannot reflect; reading
  state instead drops the last keystrokes.

A debounced control that does not register with the flush mechanism will lose
its final input on Apply.

### 18.14 Cells render through one frame

A cell dispatches through the **cell registry**, not the renderer registry.
Dispatching a renderer would select the object renderer and inline an entire
detail form inside a table cell.

Scalar cells are bare inputs that draw no field chrome, so anything shown
around a cell comes from a shared **cell frame**: compact validation state —
an error indication and a message reachable by hover **and** by assistive
technology — and deliberately **no label and no inline message**, because a
column header already labels the cell and an explanation under it grows the
row.

Where a cell is produced by a grid's own cell factory rather than a connected
component, the frame must look its errors up explicitly. Wiring such a slot to
a frame that only carries display mode compiles and renders while silently
losing every cell's validation state.

A hover-only tooltip is unreachable by a screen reader once the inline message
is suppressed, so the message MUST also be on the accessible name.

Cell display mode has no effect on a scalar cell, which draws no chrome for it
to suppress. It matters for a **control** dispatched inside a cell, and for a
detail dialog leaving cell mode — so a test asserting "no label" against a
grid of scalar columns passes whether or not the mechanism works.

### 18.15 Combinator controls

| Suggested renderer | Default UI | Data and validation semantics |
| --- | --- | --- |
| **oneOf** | A selector of branch labels with the selected branch's form below | Explicit branch changes may replace branch data after confirmation. Exactly one branch must validate |
| **anyOf** | Views selecting which branch form to display **over the same bound value** | Navigation alone preserves data; one or more branches may validate. **These are editor views, not checkboxes enabling schema branches** |
| **allOf** | The enclosing properties followed by all branch forms in schema order, with no selector | All editors address the same value; every branch constraint applies |

Branch titles supply labels through the normal translation machinery, with
generated labels when titles are absent. Branch forms use registered or
generated UI schemas **at the same scoped data path**. Outer properties are
presented independently of branch content. **The validator evaluates the full
schema, not merely the visible branch.**

**The enclosing properties must be rendered.** An `allOf` or similar
composition whose sibling properties are skipped leaves a declared property
with no input anywhere on the form, and nothing reports it.

**Initialization and data preservation.** Opening selects a suitable editor for
the existing value **without replacing it with defaults**. If the value matches
a later branch, display that branch. If none matches, a fallback branch may be
shown alongside validation errors while retaining the incoming data for
correction. If several match, selecting one for display does not resolve the
validation error. With no value, the selector may start with no selection.
**Mounting, remounting or choosing an initial view MUST NOT write generated
defaults into form data.**

**Explicit branch changes** apply the shared confirmation policy before
discarding values. Once permitted, initialize from the selected branch's
generated defaults but **preserve existing values of properties declared in
the enclosing schema's own properties**, which take precedence over generated
defaults. Replace other branch-specific data; **do not infer preservation
merely because two branches contain the same property name**. Cancel preserves
both data and the previous selection. Selecting the already-selected branch
must not reset it.

**A branch selection derived once does not follow its discriminator.** Where
the branch shown is computed from the data, it must be recomputed when that
data changes, or a discriminated composition displays the wrong branch's
fields after its discriminator is edited.

**A composition describing a single scalar editor gets one input**, not a
branch selector. A failed composition provides localized feedback beside that
input, presenting the *alternative-match* failure rather than displaying both
branches' bounds as simultaneous requirements. **Do not publish duplicate
additional errors solely to restore visible feedback**, and do not mutate the
original errors while projecting them for display.

### 18.16 Object controls and dynamic properties

**Any character is permitted in a dynamic property name. Only the schema
refuses one.**

Some names cannot be **addressed**, which is a different problem from not
being allowed. Data paths are dotted and the grammar has no escape, so a
property literally containing a dot has no path, and an empty name composes
away to its parent's path. Such names MUST NOT be refused — refusing them
would refuse legal JSON, and data containing them arrives from elsewhere
whether or not this form can create it. They are instead **routed to an editor
that uses no path at all**.

**A name is checked against the schema, not against a regular expression.**
Where `propertyNames` is declared, the schema decides. An implementation MUST
NOT add character restrictions of its own beyond those forced by addressing.

**Clearing a value is not deleting its property.** Dynamic rows are derived
from the data, so emptying an input must not remove the row the user is typing
in.

`allowAdditionalPropertiesIfMissing` controls **availability of the editor**,
not validation. `allowEmptyPropertyNames` governs whether an empty name may be
created; an exactly empty draft name must not be shown as an error before the
user has committed it.

Property-count constraints are enforced per §15.8: creation beyond the maximum
and deletion below the minimum are blocked, handlers are guarded, and
initially invalid objects remain repairable. **Renaming without changing the
count is not prohibited by count constraints alone.**

### 18.17 Selection that writes versus selection that displays

A control that selects among alternatives must state whether selection
**writes data** or only **changes what is displayed**:

- **Writes:** a oneOf branch change, a mixed-value type change. These discard
  or replace data and are subject to the confirmation policy, read-only state
  and mutation guards.
- **Displays only:** an anyOf view change, a tab or step change, expanding a
  section. These change runtime selection and **never** touch data.

Conflating the two is how a navigation action becomes destructive. A selection
that only displays MUST NOT be routed through the confirmation policy, and a
selection that writes MUST NOT bypass it.

**An array element's type cannot be cleared.** Where a control offers a type
selector for values inside an array, clearing the type would leave an element
of no type in a typed list; the selector offers the permitted types and no
empty option.

### 18.18 Extended renderer catalogue

These are project extensions. A family that does not implement one preserves
the document and reports unsupported capability.

#### 18.18.1 Data grid array control

A grid presentation for arrays, selected by `variant: "ag-grid"` or an
equivalent documented value. It shares the array contracts above — action
options, item errors, restrict prevention — and adds its own column model.

**Reordering by drag is offered only while the visible order still matches the
data order.** Once a column is sorted or filtered, drag reordering is disabled
and a drop that arrives anyway is ignored: the visible position no longer
identifies the data index, and acting on it moves the wrong row.

Where the grid's own cell factory produces cells, the shared cell frame must
be wired explicitly (§18.14).

#### 18.18.2 Duration control

Selection: a string Control with schema `format: "duration"`. **Store a
duration string**, not a number of seconds and not a date-time. Do not imply
that calendar months or years convert to a fixed number of seconds.

The baseline supports non-negative integer years, months, days, hours, minutes
and seconds, or a separate weeks-only representation. Fractional and negative
support must be declared explicitly.

| Option | Default and effect |
| --- | --- |
| `showActions` | True stages picker changes until confirmation; Cancel discards the draft. False commits immediately |
| `okLabel`, `cancelLabel` | Translated confirmation labels |
| `placeholder`, `focus`, `clearable` | Shared behaviours |
| Weeks mode | Cannot be combined with other components in this baseline |
| Zero duration | Serialize zero as the canonical zero form; clearing is a separate operation |

**Components are quantities, not clock fields.** The grammar bounds none of
them: values far above 59 minutes, 23 hours or 11 months are valid durations
and MUST be accepted. A picker that caps them like a time-of-day widget is
wrong twice over — it rejects valid data, and where the cap is enforced by
clamping it **destroys what the user typed with no message**. The only real
bound is the range in which an integer remains exact.

**Equivalent spellings are not the same data.** Ninety minutes and one hour
thirty are the same length but different stored values, and a zero written in
the weeks form is a legal value distinct in text from a zero written any other
way. **Existing data MUST NOT be normalized merely because the renderer
mounted, or because a picker was opened and confirmed without an edit.** The
canonical form says what to write when the user *means* a value, not what to
do with an equivalent one that arrived from elsewhere. Leading zeros are
likewise valid and MUST survive an unedited round trip.

Support direct text entry as well as the picker, with syntax-aware guided
editing that accommodates **all** valid forms rather than excluding some
through an overly narrow pattern. This assistance is part of the duration
contract, not the portable `mask` option.

Allow partial prefixes as local drafts. **An incomplete or invalid non-empty
draft MUST NOT overwrite the last committed value or be replaced with zero.**
Existing invalid data remains visible with a validation error and correctable
through either text or picker.

Uncommitted invalid drafts participate in the shared diagnostic and validity
integration, even where the stored value is valid. Do not assume temporal
minimum and maximum comparisons can order calendar durations without a
separately defined comparison policy.

#### 18.18.3 Colour control

Selection: a string Control with schema `format: "color"` **or**
`options.format: "color"`.

The **stored serialization** is an explicit option, separate from the picker's
internal model and from what is displayed. A renderer MUST NOT change the
stored format because the picker's internal representation differs.

**A format that cannot carry transparency must say so** rather than silently
discarding an alpha channel: where the selected output cannot represent the
edit, report it and leave the value for the user to resolve.

Text entry accepts the documented notations for the configured output and
keeps an incomplete entry as a local draft. Clearing follows the shared clear
contract.

#### 18.18.4 File control

Selection follows the documented content-encoding or format conventions for
binary string data.

- **A refused selection names the file it refused.** The previously committed
  attachment is still listed, so a bare reason reads as an error about *that*
  file.
- Size bounds, read failures and conversion failures participate in the
  shared diagnostic and validity integration; a control that reports them only
  through its own callback leaves the form appearing valid.
- Cancellation is distinguished from rejection.
- Image preview via data URLs is subject to the URL policy and its independent
  image gate (§12).

#### 18.18.5 Code editor

An embedded editor for string values, selected by a documented option.

- The editor's language may be fixed or supplied per element.
- **Publication of the editor's own diagnostics as additional errors is
  opt-in**, defaults to off, and follows §15.6: one owned error per editor
  instance, unique per instance so it cannot collide with another's on the
  same path, cleared by its owner when the underlying problem clears.
- The editor's accessible name falls back to a translated default where the
  control has no label.
- Loading the editor is asynchronous: **distinguish failure to load the editor
  from failure within it**, and report both accessibly.

#### 18.18.6 Masked string control

`options.mask` selects masked entry for a string. The mask guides syntax; it
is **not** a validation replacement and does not imply a schema `pattern`.

A family documents its token grammar, whether the stored value is the masked
or unmasked form, and how paste and composition input behave. Masking applies
independently of `restrict`.

## 19. Honest rendering of invalid and out-of-domain data

A renderer MUST NOT silently replace existing form data with a different
allowed value merely because the current value is not among the available
choices.

Where supplied data falls outside the allowed set, **preserve the underlying
value until the user explicitly changes it.** Acceptable presentations
include: showing the unknown value in an invalid state; showing the control
unselected while displaying the actual value with a validation message; adding
a marked non-valid current-value entry; or using a custom-value facility
without implying validity.

**The renderer MUST NOT select the first valid option as a substitute.**

> The UI represents actual form data. It does not invent nearby valid data to
> make the widget look valid.

The same rule governs repair: existing invalid data stays visible and
editable, never truncated, padded, normalized or rewritten on mount.

## 20. Optional editor and tooling capability catalogues

Capability catalogues describe available presentations for editors and
tooling. They are **not part of the serialized model** and are not required
for runtime rendering or conformance. Runtime selection continues through the
ordinary tester and renderer registry; catalogue metadata neither constrains
nor replaces it.

Tooling may display friendly names while emitting the established encodings —
"Multiline text" emitting `options.multi: true`. Such an identifier is
metadata, **not** a `variant` value, and choosing a display name MUST NOT
silently rewrite the data schema.

Non-normative editor guidance: expose schema format separately from UI
presentation. A schema-format edit changes the data contract; a presentation
edit writes UI options. Selecting a widget should not silently add, remove or
change a schema format. Conflicting schema and UI formats, and incompatible
save formats, should be made visible.

### 20.1 Authoring the model in a typed language

Where a model document is authored in a statically typed language rather than
as JSON, the types can check what the documents themselves cannot: that a
`scope` addresses a property the schema declares.

This is a development-time aid over an **unchanged** document — the output is
an ordinary UI schema, indistinguishable to a renderer — so it may be adopted
per form and never becomes a portability requirement.

Three rules are decisions about the **model**, not about any language, and any
implementation offering this must make them:

- **A dotted property name has no scope, so it must be refused rather than
  mis-addressed.** The path grammar has no escape (§11.3), so a property
  containing a dot yields a pointer that is well-formed, resolves to nothing,
  and reports no error. Refusing it at authoring time is the only honest
  answer; the name remains legal and its data valid (§18.16).
- **Pointer-reserved characters are escaped, not refused.** A property name
  containing `/` or `~` *is* addressable once escaped per the JSON Pointer
  rules, so it stays available. The general rule: **where a correct pointer
  exists, produce it; where none can, refuse.**
- **A property named like a keyword is unremarkable.** A property called
  `properties`, `items` or `type` addresses correctly, because the keyword and
  the property name occupy different positions in the pointer.

Where such types are **narrower** than the model — a curated set of CSS
lengths, say — the usual risk inverts: a false rejection turns a correct
document into a build failure. Those types must be calibrated deliberately and
kept testable.

## 21. Diagnostics

Runtime diagnostics SHOULD carry stable machine-readable codes:

```ts
interface UIDiagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}
```

Representative codes: `layout.multipleSizingModes`, `layout.spanUnsupported`,
`layout.spanClamped`, `dynamic.invalidBinding`, `dynamic.pathNotFound`,
`dynamic.forbiddenPath`, `dynamic.invalidTemplate`, `variant.inapplicable`,
`variant.unsupported`, `i18n.missingKey`, `i18n.missingParameter`,
`categorization.initialNotFound`, `action.unhandled`,
`script.evaluationDisabled`, `script.evaluationFailed`.

**Diagnostics address the author, not the person filling in the form.** A
misconfigured element is not something the user can act on, so a diagnostic is
reported to the author rather than rendered into the form — with the exception
of failures that leave visible content missing, which need an accessible
explanation in place as well.

**A declared diagnostic that nothing emits is worse than none**, because the
condition it names then appears to be handled.

## 22. Runtime state

Runtime interaction state MUST NOT mutate the UI schema: selected category,
current step, accordion and Group expansion, splitter position, pending action
state, focus and hover, and renderer-internal widget state.

Applications may persist runtime state separately. Template-local and
editor-local state MUST NOT become form data.

## 23. Reserved portable names

```text
variant   layout    span      weight    width     height
gridColumns         gap       wrap      minItemWidth
resizable rows      align     justify   collapsible
collapsed showDataIndicator   interpolate
markup    textParams          initial   responsive
name      size      $dynamic
```

Renderer-specific namespaces MUST NOT redefine these with incompatible
meanings.

## 24. Examples requirement

An example catalogue MUST accompany this model.

Examples MUST use understandable business domains with realistic names,
labels, descriptions, data and constraints. Placeholder identifiers such as
`aProp`, `x` or `z` are not acceptable.

Recommended domains: person and contact records, employee onboarding, customer
profiles, products and orders, appointments, projects and tasks, invoices and
payments, applications and review workflows.

Each example should include a JSON Schema, a UI schema, realistic data,
dictionaries in at least two languages, validation constraints, the expected
renderer behaviour, fallback behaviour, a description of the intended visual
and usability result, and a stable identifier.

The catalogue must cover **multiple representations of the same schema shape**
— an array of choices as tokens, as a multi-select and as automatic checkboxes
— and must include invalid supplied data outside the allowed set.

**Every specified behaviour carries a worked example.** An example is not
illustration: writing one is how a contract is discovered to be unimplementable,
ambiguous or already broken. An example that cannot be made to work is a
finding about the specification, not a failure of the example.

## 25. Conformance suites

Portable implementations MUST share machine-readable conformance vectors.

Required areas: path grammar and bracket access; forbidden prototype paths;
recursive dynamic overlay; undefined, null, false, zero and empty behaviour;
template escaping and invalid templates; URL encoding and policy; the expression core
subset; Markdown profiles and security; the span formula; mixed sizing;
vertical Auto; wrap and auto-fit; hidden effective children; Spacer sizing and
gaps; splitter initial sizing; variant applicability and fallback;
out-of-domain value preservation; and interpolation capability and fallback.

**Security conformance is REQUIRED**: prototype protection, URL policy,
script-evaluation gating and Markdown sanitization.

## 26. Normative requirements summary

Implementations **MUST**:

- preserve unknown options, extensions and renderer namespaces;
- preserve actual form data rather than substituting valid-looking
  alternatives;
- protect against prototype pollution;
- apply the URL policy to static, dynamic and Markdown URL-bearing values;
- gate string script evaluation;
- sanitize Markdown;
- resolve dynamic values before testers, with stable effective identity;
- keep structural fields, `name` and canonical `variant` static;
- keep runtime state out of the UI schema;
- honour effective-visible-child layout semantics;
- provide safe fallbacks;
- provide platform-appropriate accessibility for interactive variants;
- treat visibility as presentation, never as authorization.

Implementations **SHOULD**:

- support applicable canonical variants;
- preserve useful established options;
- reproduce mature renderer enhancements where semantically useful;
- publish renderer behaviour specifications;
- support business-friendly example and conformance coverage.

## 27. Verification before implementation

Verify against the exact targeted core and renderer versions: core type names
and inheritance; rule effects and read-only behaviour; how the `restrict`
policy maps to renderer mutation paths; native option names and testers;
date and time display and save options; supported temporal schema
constraints; native Categorization orientation and stepper encodings;
translator and key conventions and `textParams` integration; tolerance of
unknown `$dynamic`; resolver coverage for nested, detail and generated
schemas; effective-element caching and identity; content-security-policy
behaviour for string script evaluation; the expression dialect and its locale
data; and
Markdown parser and sanitizer behaviour.

**Verify empirically rather than by inference.** Several rules in this
document exist because a plausible reading of an upstream contract turned out
to be wrong in a way that was silent.

## 28. Renderer-specification roadmap

Each renderer set of interest should have its own behaviour specification,
defining: exact native options; library-specific schema behaviour; exact
visual differences among variants; the escape-hatch namespace; accessibility
and invalid-data rendering; and renderer-specific examples.

This lets a future implementation on another platform reproduce good semantic
behaviour from mature renderer sets without copying framework-specific
implementation details.
