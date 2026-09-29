# React + antd renderer implementation gaps

> **Actionable subset:** open defects and work items are tracked in
> [TODO.md](TODO.md). This document is the full specification-coverage review.

This document tracks the distance between the portable
[JSON Forms Extended UI Model Specification][spec] and what the React + antd
renderer packages in this repository actually implement. It is the React
counterpart of the Svelte repository's
[implementation-gaps document][svelte-gaps].

It is **not normative**. The specification defines the target contract; this
document records source-level findings, names the work still to do, and flags
places where the implementation has taken a different (sometimes deliberate)
route.

It was written without changing any renderer. One change has been made since:
the Group data-presence indicator now carries a translated tooltip, per
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). Findings elsewhere
in this document still describe the code as reviewed.

[spec]: https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md
[svelte-gaps]: #the-svelte-review-document

## Outstanding gaps at a glance

What is still open, in one line each. A **gap** here means one of four things:
a renderer or feature that ships without a worked spec example; a defect; the
JSON Forms UI model unsupported or supported wrongly; or JSON Schema
unsupported or supported wrongly. Anything resolved is struck through in place
below rather than listed here.

**Defects in shipped renderers**

| Gap | Where |
| --- | --- |
| An error at an object's own path is never displayed — the form can be invalid with nothing on screen | [§6.1](#61-object-control-and-additional-properties--partial), [TODO 1](TODO.md) |
| Blur does not flush a pending edit before its errors are presented | [§3.10](#310-pending-edits-commit-timing-and-cancellation-18--partial) |
| An error inside a composite cell's value does not surface at that cell (exact-path filter) | [§6.2](#62-array-table-control--partial) |
| The array **table** ignores `restrict`, so the two array presentations disagree with each other | [§6.2](#62-array-table-control--partial) |
| Array table column headers are not translated | [§6.2](#62-array-table-control--partial) |
| ~~Colour and duration columns in an array render as plain text — both controls existed only in the renderer registry, and a column dispatches through the cells registry~~ — **fixed** via `antdExtendedCells`; see [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) | [§6.2](#62-array-table-control--partial) |

**JSON Forms UI model — unsupported or incomplete**

| Gap | Where |
| --- | --- |
| `$dynamic` resolution (§11) — no resolution layer, path grammar or gating. The largest single item, and five design decisions are open before it can start — including whether §11.4's template grammar survives at all, or ICU becomes the one interpolation language | [§3.1](#31-dynamic-resolution-11--missing-entirely), [TODO 6](TODO.md) |
| Supplying a control's **choices** from outside the schema — `$dynamic` overlays the UI element, never the schema, so there is no portable spelling for a dropdown whose list is fetched or host-supplied | [§3.1a](#31a-what-11-does-not-cover-and-a-renderer-set-will-need-anyway) |
| Markup and interpolation on elements **other than** `Label` — a control's `description`, a Group's label and a `Button` label read plain text only. Markdown and interpolation are both implemented for `Label` | [§3.7](#37-markdown-and-interpolation-910--partial-was-missing) |
| `UIDiagnostic` shape and stable codes (§21); diagnostics are ad-hoc console warnings and DOM attributes | [§3.9](#39-diagnostics-21--missing) |
| `separateReadonlyFromDisabled` (§15) read nowhere; read-only is collapsed into disabled | [§3.11](#311-read-only-separation-15--not-exercised) |
| Renderer-published `additionalErrors` beyond Monaco — the file control and an invalid duration draft do not participate in validity | [§3.5](#35-renderer-published-additionalerrors--partial-was-missing) |
| Pre-touch error filtering does not cover array or tuple summaries | [§3.4](#34-pre-touch-error-filtering-15--implemented-for-controls), [TODO 4](TODO.md) |
| `hideRequiredAsterisk` is honoured on array labels only, not on ordinary controls | [§9.1](#91-hiderequiredasterisk), [TODO 3](TODO.md) |
| `hideArraySummaryValidation` | [§6.2](#62-array-table-control--partial) |

**JSON Schema — unsupported or incomplete**

| Gap | Where |
| --- | --- |
| `/#` current-form schema reference | [§3.6](#36-extended-validator-profile-15--partial-was-missing-for-react) |
| A tester resolves a scope only for object schemas — an upstream core defect, patched around here | [TODO 2](TODO.md) |
| No conformance vectors for any of §25's required areas (path grammar, prototype protection, URL policy, ICU subset, Markdown profiles, span formula, mixed sizing, wrap/auto-fit, hidden effective children, Spacer sizing, out-of-domain preservation) | [§10](#10-test-and-example-coverage) |

**Worked spec examples**

Every renderer in both catalogs now has one — see [§10](#10-test-and-example-coverage).
The outstanding item is wording, not coverage: **12 of the 27 examples still
use any one customer’s industry vocabulary**,
which the house rule excludes. They are `additional-properties`,
`array-choices`, `choice-controls`, `destructive-confirmation`, `group-layout`,
`layout-sizing`, `mixed-control`, `object-control`, `pre-touch-errors`,
`split-layout`, `string-controls` and `tuple-control`.

---

## Specification ownership

The current portable contract is [specification](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
Its schemas, examples, and TypeScript authoring helpers live in that project.
Use the [renderer/demo guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/renderer-and-demo.md)
and [migration audit](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/audit.md)
for maintained design requirements and the status of historical sources.
This repository keeps renderer implementation gaps, [actionable TODOs](TODO.md),
and [shared React architecture](renderer-common.md).

Historical adjustment references now link to the maintained portable contract.
The findings below describe this renderer implementation and its remaining gaps.

### The Svelte review document

The Svelte renderer set's own gap analysis,
`docs/jsonforms-svelte-implementation-gaps.md`, lives in the `jsonforms-svelte`
repository and is deliberately **not** copied here: it records findings against
the Svelte families and is maintained there. References to it below are for
comparison only.

## Review baseline

- Specification reviewed in full (§1–§28), including the two renderer catalogs
  in §18 and the shared behavioral contracts in §15 and §18.
- Implementation reviewed by source inspection of:
  - [jsonforms-react-antd-renderers](../packages/jsonforms-react-antd-renderers) — the base antd renderer set
  - [jsonforms-react-extended-renderers](../packages/jsonforms-react-extended-renderers) — framework-agnostic extended renderers
  - [jsonforms-react-antd-extended-renderers](../packages/jsonforms-react-antd-extended-renderers) — antd bindings for the extended set
  - [jsonforms-react-antd-webcomponent](../packages/jsonforms-react-antd-webcomponent), [jsonforms-react-demo-common](../packages/jsonforms-react-demo-common)
- `@jsonforms/core` / `@jsonforms/react` peer dependency is pinned at
  **3.9.0-alpha.1**, the version the Svelte families use. 3.9 replaced lodash's
  `set`/`unset` in the core reducer with a path walker that treats every segment
  as a plain property name, which is what makes brackets and digits usable in a
  dynamic property name — see
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). The legacy Vue 2
  packages stay on 3.7 and resolve their own copy.
- Findings are from reading source, not from browser verification. Where a
  behavior depends on an antd component's internals it is marked as such.
- Provenance is not re-litigated here; the specification already separates
  JSON Forms core, renderer conventions, and project extensions.

## How to read this document

Each finding carries a status:

| Status | Meaning |
| --- | --- |
| **Missing** | No implementation exists. Needs to be built. |
| **Partial** | Selected and rendered, but one or more contracted behaviors are absent. |
| **Divergent** | Implemented with a different encoding or semantics than the spec defines. |
| **Unspecified** | Implemented here, with no corresponding specification entry. The spec needs an entry, or the behavior needs a decision. |
| **Deliberate** | A documented, intentional departure. No work implied. |

---

## 1. Renderer coverage against the specification catalogs

### 1.1 JSON Forms conventions and reviewed adaptations (§18, "Existing JSON Forms conventions")

| Spec entry | Implementation | Status |
| --- | --- | --- |
| String control | `TextControl` / `AntdInputText` | Partial |
| Number control | `NumberControl` / `AntdInputNumber` | Partial |
| Integer control | `IntegerControl` / `AntdInputInteger` | Partial |
| Multiline string control | `AntdInputText`, `options.multi` branch | Partial |
| Boolean control | `BooleanControl` / `AntdCheckbox` | Partial |
| Boolean switch control | `BooleanToggleControl` / `AntdToggle` | Partial |
| Slider control | `SliderControl` / `AntdSlider` | Partial |
| Password control | `PasswordControl` / `PasswordCell`, plus `PasswordOtpControl` for `variant: "otp"` | Implemented |
| Date control | `DateControl` / `AntdDatePicker` | Partial |
| Time control | `TimeControl` / `AntdTimePicker` | Partial |
| Date-time control | `DateTimeControl` / `AntdDateTimePicker` | Partial |
| Enum choice control | `EnumControl` / `AntdSelect` | Partial |
| Named choice control | `OneOfEnumControl` | Partial |
| Autocomplete choice control | `AntdSelect` `options.autocomplete`, default off | Implemented |
| Radio choice control | `RadioGroupControl`, `OneOfRadioGroupControl` | Partial |
| Suggested string control | `AntdInputText` `options.suggestion` → antd `AutoComplete` | Partial |
| String-or-enum control | `AnyOfStringOrEnumControl` | Partial |
| Masked string control | `AntdMaskControl` / `AntdMaskInput`, on maska | Implemented |
| Enum array / checkbox group | `EnumArrayRenderer` | Partial |
| Object control | `ObjectRenderer` + `AdditionalProperties` | Partial |
| Array table control | `ArrayControlRenderer` / `TableControl` | Partial |
| Expandable array detail control | `ArrayLayoutRenderer` / `ArrayLayout` | Partial |

### 1.2 Structural renderers and unbound elements

| Spec entry | Implementation | Status |
| --- | --- | --- |
| Horizontal layout | `HorizontalLayout` (base, rank 2) and `HorizontalColumnsLayoutRenderer` (extended, rank 3) | Divergent |
| Vertical layout | `VerticalLayout` | Partial |
| Group | `GroupLayout` + `useGroupState` | Partial |
| Categorization (tabs) | `CategorizationLayout` | Partial |
| Categorization stepper | `CategorizationStepperLayout` | Partial |
| Categorization accordion | `CategorizationAccordionLayout` | Implemented |
| Label | `LabelRenderer` | Partial |
| List with detail | `ListWithDetailRenderer` | Partial |

### 1.3 Project extension catalog (§18, "Project extended renderer catalog")

| Spec entry | Implementation | Status |
| --- | --- | --- |
| Explicit table with composite cells | `ArrayControlRenderer` forced-table tester, `AntdCompositeCell`, `CompositeDetailDialog` | Partial |
| Tuple control | `TupleControl`, at rank 25 | Implemented |
| AG Grid array control | `AgGridControlRenderer.impl` + `AntdAgGridControlRenderer` | Partial |
| Code editor (Monaco) | `MonacoControlRenderer.impl` + `AntdMonacoControlRenderer` | Partial |
| Color control | `AntdColorControlRenderer` + `colorFormat` | Complete apart from the validator format and `hsl` output |
| Duration control | `AntdDurationControlRenderer` + `useDurationControl` | Partial |
| File control | `FileControl` / `AntdFile` | Partial |
| Null control | `AntdNullControlRenderer` | Complete for the spec's single-row entry; demonstrated by the `null-control` spec example |
| Split layout | `SharedSplitLayoutRenderer` (rank 4), `AntdSplitLayoutRenderer` (rank 5) | Partial |
| Action button | `ButtonRenderer` / `AntdButtonRenderer` | Partial |
| ImageView | `ImageViewRenderer` | Divergent |
| Separator | `SeparatorRenderer` | Partial |
| Spacer | `SpacerRenderer` | Divergent |
| Link | `LinkRenderer` | **Implemented** |
| Mixed-value control | `MixedRenderer` + `complex/mixed/*` | Partial |
| Combinators (oneOf / anyOf / allOf) | `OneOfRenderer`, `AnyOfRenderer`, `AllOfRenderer` | Partial |
| Additional-properties editor | `AdditionalProperties` | Partial |
| Template / Slot | `TemplateRenderer`, `SlotRenderer` | Matches the spec |
| TemplateLayout | `TemplateLayoutRenderer` (Sucrase/JSX) | Divergent |
| **Chips control (`variant: "chips"`)** | none | **Missing** |
| **Multi-select control (`variant: "multi-select"`)** | none | **Missing** |

---

## 2. Renderers that still need to be built

These have a specification entry and no implementation at all.

### 2.1 Password control — **Implemented**

`PasswordControl` (rank 4) and `PasswordCell` select a string with **either**
`formatIs('password')` or `optionIs('format', 'password')`, so the UI-driven
path works on a plain string — the gap it used to have, shared with the Svelte
families.

The reveal toggle is a real focusable `<button>` with a localized accessible
name stating the action it will perform (`password.show` / `password.hide`),
and a tooltip carrying the same wording — antd renders none on its own reveal
icon, so the clear button beside it was the only named one. Toggling changes
presentation only: reveal state is component state and never reaches form data.
Reveal and clear remain separate controls with separate names and hit targets.

The field is a plain `Input` with `type` switched, **not** `Input.Password`. In
antd 6 that component's `iconRender` wrapper is itself `role="button"`,
focusable and labelled from antd's locale, so the button carrying our name sat
nested inside another button: two tab stops for one action, and two names for
it. See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

`PasswordCell` exists because the shared table-cell contract requires masking
to survive delegation to a cell; without it a password column fell through to
`TextCell` and printed the value.

The `schema.format === 'password'` branch has been removed from
`AntdInputText`, which no longer needs to know about passwords.

**The three trailing affordances are laid out, not stacked.** Reveal, clear and
the `Form.Item` error icon all want the same corner, and the shared clear button
is normally positioned over the control — so an invalid password showed all
three on top of one another. `Input` differs from `InputNumber` here: it
*composes* its `suffix` with the feedback icon
(`<>{suffix}{hasFeedback && feedbackIcon}</>`) rather than replacing it, so
`AntdClearableInput` now accepts a function child that hands the clear button
back for a control to place in that slot, and `AntdClearValueButton` grows an
`inline` mode that drops the absolute positioning. No offset constant would
have worked: the feedback icon is only present while the value is invalid, so
an offset that clears it leaves a gap when it is not.

**`options.variant: "otp"`** adds a fixed-length, one-character-per-box editor
for verification and backup codes — a project addition, not in the spec; see
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). It is a *variant*
rather than a new format because the value is still a password: same schema,
same storage, same masking and reveal contract. `PasswordOtpControl` ranks 5,
above the plain control, and is selected only when the schema sets **both**
`minLength` and `maxLength`; failing that it falls back to the ordinary password
field rather than guessing a box count. The editor commits partial input as it
is typed, because antd's `onChange` fires only on a complete code and would
otherwise leave the data disagreeing with the screen. Masking passes a mask
**character** and an explicit `type`: antd's `mask={true}` draws the real
character in its overlay, and its own `type` is spread away, so the obvious
spelling left the code readable. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Covered by `test/passwordControl.test.tsx` and
`test/passwordOtpControl.test.tsx`; demonstrated by the `password-control` spec
example.

### 2.2 Autocomplete choice control — **Implemented**

`options.autocomplete` is honored by `AntdSelect`, so every single-value choice
control inherits it. **This family's documented default is off**, which section
18 permits and which differs from Material — see
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). Only `true` enables
it, so an element `false` overrides a config `true`.

The query filters on the **label**, case-insensitively — the branch title for a
constant-based `oneOf`, not the stored constant — and an empty result shows a
localized `enum.noMatches`. Searching never creates a value.

Covered by `test/autocompleteChoice.test.tsx`; demonstrated by the
`choice-controls` spec example, which shows the same property with and without
the option.

### 2.2a Chips and multi-select variants — **Implemented**

`variant: "multi-select"` and `variant: "chips"` are in `MultiSelectControl` and
`ChipsControl`, both at rank 6 so an explicit variant beats the automatic
checkbox group at 5.

Chips render their own `Tag`s rather than using antd's tags-mode `Select`,
because a select keys tags by value: two equal tokens would be one entry and
closing either would remove both, where §18 requires removing the occurrence
that was clicked. Tokens are identified by position.

**Both match string choices only.** §18 requires a tester to "match only choice
value types that its selection, addition, and removal logic supports", so
numeric enums and object/array constants are left unmatched rather than given a
widget that renders them as text.

Covered by `test/arrayChoices.test.tsx`; demonstrated by the `array-choices`
spec example.

### 2.3 Masked string control — **Implemented**

`options.mask`, `returnMaskedValue`, `tokens`, `tokensReplace`,
`maskReplacers`, `eager` and `reversed` are all honored, with the token grammar
from the spec's table. The engine is
[maska](https://github.com/beholdr/maska) — the same library the inspected
Vuetify and Svelte families use, so the grammar the spec normatively states is
identical by construction rather than by re-reading. Only its pure `Mask` class
is used; its DOM binding assigns `input.value` directly and announces the result
with a non-bubbling `CustomEvent`, both of which a React controlled input does
not survive, and it normalizes the field on attach, which the spec forbids. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Selection requires `options.mask` to carry an actual **pattern**. The
neighbouring families select on the option's presence, so a temporal control
writing `"mask": false` to disable *its own* format-derived mask became eligible
for the generic masked renderer — the spec names this case ("a boolean temporal
option must not by itself request a generic masked field") and those families'
gap review records it as open. A string whose `format` names its own editor
keeps that editor.

Two further corrections to the inherited behaviour, both defects their own
review records:

- **`eager` and `reversed` mean what they say.** Those families compute them as
  `option === false`, so an explicit `true` produces false and only an explicit
  `false` turns the behaviour on.
- **`restrict` and `maxLength` count the stored string, in code points.** They
  forward `schema.maxLength` to the input's `maxlength`, which counts displayed
  characters: with `maxLength: 6` and `###-###` the field shows seven characters
  for six stored digits, so the sixth digit cannot be typed at all. No DOM
  `maxlength` is set here; an edit is checked after masking against what would be
  stored.

A value the mask cannot carry is shown **verbatim** and left alone until edited,
per §19 and "preserve invalid incoming data for correction". Composition is
preserved — nothing is masked between `compositionstart` and `compositionend` —
which neither maska's own binding nor those families handle.

This does **not** cover the temporal controls' boolean `mask`, which is a
different option: they still derive no input mask from their display format —
see [§6.5](#65-temporal-controls--partial).

Source:
[maskFormat.ts](../packages/jsonforms-react-antd-extended-renderers/src/util/maskFormat.ts),
[AntdMaskInput.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdMaskInput.tsx),
[maskControls.ts](../packages/jsonforms-react-extended-renderers/src/util/maskControls.ts).
Covered by `test/maskFormat.test.ts` and `test/maskControl.test.tsx`;
demonstrated by the `string-controls` spec example.

### 2.4 Tuple control — **Implemented**

Positional arrays are rendered by `TupleControl` at rank 25, above the mixed
control at 20 and every array renderer below it. **Both dialects** are
recognized, which this entry previously asked to be declared: draft-07's
positional `items` with `additionalItems`, and draft 2020-12's `prefixItems`
with `items`. `prefixItems` is read first, because 2020-12 uses `items` for the
*tail* and reading it as the prefix would silently turn one schema into every
position.

**The renderer understands more than the validator does**, and this is the
sharpest case of it in the set. JSON Forms configures a **draft-07** Ajv, which
has never heard of `prefixItems`:

| Spelling | Renders the positions | Validates them |
| --- | --- | --- |
| `items: [ … ]` + `additionalItems: false` | yes | **yes** |
| `prefixItems: [ … ]` | yes | **no** — ignored, a bad value passes |
| `prefixItems: [ … ]` + `items: false` | yes | **rejects every element** |

The third row is the spelling 2020-12 actually recommends, and to a draft-07
validator `items: false` reads "no items at all" — so a correct 2020-12 tuple
can never be valid and nothing explains why. Verified directly against the
validator. The remedy is a host-supplied Ajv built from `ajv/dist/2020`;
`createFormsAjv` deliberately does not switch meta-schema, since that changes
how every existing draft-07 schema here is read.

Implemented: labels from positional schema titles with a localized
`Item {position}` fallback, `variant: "tuple"` for uniform fixed-length arrays,
`vertical`, `showBorder` (default `true`), the Additional items section with
`restrict`/`disableAdd`/`disableRemove`, the missing-position initialization
contract, the clearing contract, positional versus array-level validation
placement, and complex-position summaries reusing the composite dialog. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Beyond the specification: `options.detail` on a tuple places the fixed
positions, scoped against the tuple (`#/items/N`, or `#/items/N/...` to reach
inside a position) — the same rule every other container control's `detail`
follows. Not `options.layout`, which §6 reserves for child participation in the
parent. A tuple-wide `detail` is no longer forwarded into the position lookup,
which is a narrow divergence from "explicit tuple-wide detail retains the
existing JSON Forms detail lookup precedence"; position dialogs come from the
registry instead. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Two things are worth knowing before changing it:

- **A position replaces `dispatch` for its subtree.** An edit at a missing
  position has to fill the positions before it and commit them together; a
  delegated control knows only its own path, so writing `order.2` of a
  one-element array would punch a hole in it. The position catches writes
  inside itself, rebuilds the array whole and dispatches one update for it.
- **The tester deliberately claims configurations it cannot render.** A
  `variant: "tuple"` that no schema can support still matches, because §18
  requires a configuration diagnostic and something has to draw it. Falling
  through would hand the control to an array renderer and lose the request.

`AgGridControlRenderer.impl` still takes `props.schema.items[0]` when `items` is
an array, i.e. it treats a tuple as a uniform array of the first position's
schema — but a tuple control now outranks it, so that path is only reached when
the grid renderer is selected explicitly.

Source:
[tuple.ts](../packages/jsonforms-react-antd-renderers/src/util/tuple.ts),
[TupleControlRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/TupleControlRenderer.tsx),
[TupleField.tsx](../packages/jsonforms-react-antd-renderers/src/complex/TupleField.tsx),
[TupleAdditionalItems.tsx](../packages/jsonforms-react-antd-renderers/src/complex/TupleAdditionalItems.tsx).
Covered by `test/tupleControl.test.tsx`; demonstrated by the `tuple-control`
spec example.

### 2.5 Categorization accordion (`variant: "accordion"`) — **Implemented**

[`CategorizationAccordionLayout`](../packages/jsonforms-react-antd-renderers/src/layouts/CategorizationAccordionLayout.tsx)
matches `uiTypeIs('Categorization')` with direct `Category` children and
`optionIs('variant','accordion')` at **rank 3**, above the stepper at 2 and the
generic tabs renderer at 1 — the precedence §8 requires of an explicit match.
~~`variant: "accordion"` fell through to the tabs renderer, silently ignoring
the request.~~

It implements **at most one open**, which is a deliberate divergence from §8's
*exactly* one: activating the open header closes it, so a reader can collapse a
long form to its outline. Two open at once remains impossible. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md), which also
explains why antd's `Collapse accordion` prop is still not used even though its
behaviour now matches — it swaps the disclosure roles for an unimplemented tabs
pattern, and a `tablist` cannot express "nothing selected".

Section 8's navigation contract is now shared by all three presentations, in
[`categoryState.ts`](../packages/jsonforms-react-antd-renderers/src/util/categoryState.ts):
visibility, `options.initial` (previously **unimplemented everywhere**),
selection identity across a reorder, and reselection when the current category
is hidden. Two defects surfaced while sharing it:

- the **tabs** renderer used `defaultActiveKey`, so when a rule hid the selected
  category the tab strip kept pointing at that slot and showed a different
  category's panel;
- the **stepper** indexed `categories[active]` unguarded, so a Categorization
  with every category hidden threw instead of rendering nothing.

Both container indicators now appear on a tab, step or accordion header through
one shared `CategoryIndicators` — at the end of the bar on an accordion, as on
a collapsible Group, and beside the label on a tab or step, which has no
trailing edge; `useGroupState` also gained the
`jsonformsExtended` lookup it was missing, so the two indicators are configured
the same way. See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

**Not implemented:** `categorization.initialNotFound` as a rendered message —
an unmatched `initial` warns on the console and falls back to the first visible
category (Adjustment 10.5).

### 2.6 Link element — **Implemented**

[`LinkRenderer`](../packages/jsonforms-react-extended-renderers/src/renderers/LinkRenderer.tsx)
matches `uiTypeIs('Link')` at rank 1, beside the other unbound §13 elements.
Top-level `label`, `href`, `target` and `rel`; `target="_blank"` gains
`noopener` and `noreferrer` without discarding an author-supplied `rel`; an
empty href renders plain, non-navigating text rather than inventing a
destination; and the label translates through an explicit `i18n` prefix, since
a Link has no scope (§9.9).

It also brought the **URL policy** with it — see §3.8.

### 2.7 Chips and multi-select array variants — **cleared**

Was a duplicate of [§2.2a](#22a-chips-and-multi-select-variants--implemented),
recorded before those two renderers were built and never reconciled with it.
Nothing to carry: §2.2a holds the finding that matters elsewhere, which is that
chips must be identified by **position** rather than by value.

---

## 3. Cross-cutting contracts that are absent

These are not individual renderers, but shared mechanisms that many catalog
entries depend on. Each one blocks several renderer-level items.

### 3.1 `$dynamic` resolution (§11) — **Missing entirely**

Grep for `$dynamic` and `dynamicValues` across all React packages returns
**no matches**. There is no resolution layer, no path grammar, no namespace
gating, no prototype-pollution guard, and no template parser.

(The `jsonformsExtended` namespace itself now exists and is read — by
`layoutDefaults`, `security.urlPolicy`, `security.allowScriptEvaluation`,
`markup` and `confirmation`, through
[`util/configNamespaces.ts`](../packages/jsonforms-react-antd-renderers/src/util/configNamespaces.ts)
and [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). It is only
`dynamicValues` and the resolution it gates that are absent.)

Consequences, in spec order:

- Group `collapsed` cannot be driven from data (§8's worked example).
- `ImageView.src`/`alt` cannot be overridden dynamically (§13).
- `Label` `textParams` cannot be bound (§9).
- Monaco `language` has no portable dynamic path — the implementation instead
  uses a project-specific `options[':language']` data-path convention, see
  [§7.1](#71-code-editor-monaco--partial).
- `options.placeholder`, `options.focus`, `options.timezone` and every other
  option the spec lists as dynamically supplyable are static only.

Of the configuration blocks the spec expects to gate all of this, only
`jsonformsExtended.dynamicValues.enabled` is still missing; the rest
(`security.urlPolicy`, `security.allowScriptEvaluation`, `markup.markdown`,
`layoutDefaults`) are implemented and read.

**Work:** this is the single largest missing piece and should be scheduled
before the renderer-level items that depend on it. It must resolve before tester
dispatch and cover nested/detail/generated dispatch paths (§11).

#### 3.1a What §11 does not cover, and a renderer set will need anyway

Found while designing the port against a real requirement — a Camunda
deployment whose form must offer a dropdown of assignable users, where the
list is neither in the schema nor in the deployed UI schema. Recorded here
because none of it is an implementation gap: it is the specification's scope,
and any family implementing §11 will meet the same wall.

| Needed | §11 | Consequence |
| --- | --- | --- |
| Fetch remote data | **No I/O at all.** The grammar has no calls and no async | `$dynamic` cannot obtain data, only read what is already present. Remote lookups need an element or a host, not a binding |
| Supply choices | **Nothing.** Choices come from the schema's `enum`/`oneOf`, or `options.suggestion` (strings only) | `$dynamic` overlays the **UI element**, never the schema, so there is no portable spelling for "these are the options" |
| Scope for a provider's rows | Namespaces are a closed list: `data`, `item`, `locale`, `config`, `context` | An element supplying scope to its children — structurally what `item` already is — has nowhere to put it |
| Project a row into a choice | **Nothing** | `EnumOption` is `{label, value}`; a fetched row is not. A composite label (`firstName + ' ' + lastName`) has no expression to build it |
| Index by a form value | Paths are fixed strings | `context.rates[data.currency]` is **not expressible**. Host context must be resolved per session, not exposed as a lookup table |
| Derive a boolean | No operators | `readonly` when `status === 'closed'` cannot be written. That is what **rules** are for; `$dynamic` reads, rules decide |

The first four are why the legacy Vue 2 stack grew a `DataProvider` element and
a `data-provider-select` renderer beside it
([`packages/legacy/common/src/renderers/`](../packages/legacy/common/src/renderers/)).
Two things in that design should **not** be carried across:

- **Its templates compile JavaScript.** `url`, `item-text` and `item-value`
  are lodash templates evaluated with `imports`, so `{{ … }}` is a JS
  expression and `constructor.constructor` is reachable. Under the current
  model that lands squarely under `security.allowScriptEvaluation`. §11's path
  grammar exists precisely to avoid needing it, and §13 says so: "do not
  silently treat enabling `$dynamic` as permission to execute templates".
- **It never refetches.** `DataProvider.vue` fetches in `created()`, so when
  the templated URL recomputes — the user picks a different group — the
  component is not re-created and the list silently goes stale. Live defect,
  and the clearest argument for writing the reactivity contract down.

**What makes the reuse work, and is easy to miss:** core's
`mapStateToEnumControlProps` already prefers externally supplied options over
the schema —

```ts
const options: EnumOption[] = ownProps.options || props.schema.enum?.map(…) || …
```

— so every stock enum renderer (`EnumControl`, `OneOfEnumControl`,
`RadioGroupControl`, `MultiSelectControl`) can take its choices from outside
the schema **today**, unchanged. What is missing is only a UI-schema-level way
to fill `ownProps.options`. That is one bridge, not a bespoke renderer per
lookup, which is what the legacy family ended up with.

#### 3.1b The reactivity contract, which §11 states in one sentence

> Effective identity SHOULD remain stable when values are unchanged.

It reads as a performance nicety and is load-bearing. In this stack
`TestAndRender` is a `React.memo` with **shallow** comparison, and the tester
result is memoised on `props.uischema` **by identity**:

```ts
const renderer = useMemo(
  () => maxBy(props.renderers, (r) => r.tester(props.uischema, …)),
  [props.renderers, props.uischema, props.schema, testerContext]
);
```

A resolution layer that returns a fresh object each pass therefore re-runs
**every tester in the form on every keystroke** and re-renders every subtree.
Returning the previous object when the resolved values are equal turns the
same machinery into the opposite: unchanged elements do not even re-run their
tester.

Three clauses follow, and the third is an addition to §11 rather than a
reading of it:

1. **Resolution layer** — stable identity when values are unchanged.
2. **Renderers** — read from props during render; key effects on the resolved
   value, not on mount; discard out-of-order async results. There is no
   notification and there is nothing to subscribe to: the effective element
   arrives as an ordinary prop, which is what "renderers consume ordinary
   effective properties" means.
3. **Option design** — anything `$dynamic` can supply should stay **out of
   testers**. §11 pins only `type` and canonical `options.variant`, but any
   option that participates in selection can change the chosen component when
   a value arrives, and React then unmounts the old one. The difference is
   between "the list appeared" and "the control was rebuilt and lost focus
   mid-typing".

The open design decisions are in [TODO 6](TODO.md).

### 3.2 Layout sizing model (§6–§7) — **Implemented**

The model is implemented in
[layoutSizing.ts](../packages/jsonforms-react-antd-renderers/src/util/layoutSizing.ts)
and applied by both layout renderers: per-child `options.layout`
(`span`, `weight`, `width`/`height` and the min/max constraints), flat
container options (`gap`, `wrap`, `minItemWidth`, `align`, `justify`,
`gridColumns`), the Fixed > Span > Weight > Auto precedence, the span-width
formula with the gap accounted for, the `gridColumns`/`wrap`/`gap` resolution
chains through `jsonformsExtended.layoutDefaults`, and hidden children leaving
layout. Invalid or unsupported hints draw a diagnostic rather than being
ignored silently.

**Two options were removed**, and the second is a deliberate divergence from
the sibling renderer families rather than from the specification:

- `trim`, which the contract explicitly excludes;
- `columns`, which the contract does not define — but which **Svelte reads**,
  with the identical encoding. `HorizontalColumnsLayoutRenderer` is no longer
  registered (at rank 3 it outranked the base layout, so the model could never
  apply) though it is still exported.

**Not everything in §6–§7 is implemented.** The remainder is small and
deliberate — the two `reserved` item options, min/max redistribution delegated
to flex, no scroll container on a non-wrapping row — and each is listed with
its reason in
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md), so the distance
is a decision rather than an unknown.

**The fallback gap was 0, and that made every foreign uischema look broken.**
§7 recommends 0 "unless renderer capability documents another portable
default", and 0 is right for a family whose controls carry their own margins.
antd's do not, horizontally: two controls side by side share an edge. No
uischema written for another family says otherwise, because none of them set
`gap` at all — Material and Vuetify space children themselves — so the
upstream JSON Forms examples all rendered here with their rows touching.

The default is now **16px for a row and 0 for a column**, and it has to be
direction-dependent: antd's `Form.Item` already carries
`marginBottom: token.marginLG`, so a non-zero column default double-spaces
every vertical form. `gap: 0` at either level restores the old behaviour. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Worth carrying across: this is the kind of default that looks like a styling
preference and is really a portability defect. A renderer family that adopts
the recommended 0 without asking whether its own controls space themselves
will render every ported uischema wrongly, and it will read as the author's
fault rather than the family's.

See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

### 3.3 Shared destructive-change confirmation (§14) — **Implemented**

`jsonformsExtended.confirmation` is resolved in
[confirmation.ts](../packages/jsonforms-react-antd-renderers/src/util/confirmation.ts)
— `always` / `never` / `complex`, per-element `options.confirmation`, per-renderer
config entries by catalog id, a global default, and the documented fallback
(`complex` for mixed type changes, `always` for everything else). Every covered
operation routes through it.

| Operation | Catalog id | Fallback |
| --- | --- | --- |
| Array table row delete | `arrayTable` | `always` |
| `ArrayLayout` item delete | `arrayLayout` | `always` |
| `ListWithDetail` item delete | `listWithDetail` | `always` |
| AG Grid selected-row delete | `agGrid` | `always` |
| Mixed tree node delete | `mixed` | `always` |
| Mixed type change and clear | `mixed` | `complex` |
| `oneOf` branch change and clear | `oneOf` | `always` |
| Dynamic property delete | `additionalProperties` | `always` |

Two corrections worth noting. The array table used to confirm unconditionally —
which agreed with the fallback but could not be switched off, so an element
`never` did nothing. And `oneOf` confirmed on lodash's `isEmpty`, which reports
`0` and `false` as empty where §14 counts them as existing values, so a branch
holding `0` changed without asking.

**The AG Grid entry crosses a package boundary.** That renderer is in the
framework-agnostic package, which must not depend on the antd set, so it takes a
policy-free `useRemoveConfirmation` seam and the antd side supplies the dialog
and the catalog id. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Covered by `test/confirmation.test.tsx`; demonstrated by the
`destructive-confirmation` spec example.

**Still open:** the `anyOf` tab change, which per
[§5.5](#55-anyof-renderer--implemented-was-partial) should not mutate data at all — a fix there
is a change to the renderer, not a confirmation.

### 3.4 Pre-touch error filtering (§15) — **Implemented for controls**

`enableFilterErrorsBeforeTouch` and `filterErrorKeywordsBeforeTouch` are read by
every control that prints its own errors, using the same algorithm as the
Vuetify and Svelte renderer families. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) and the worked
example
[pre-touch-errors](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/pre-touch-errors/README.md).

**Still missing:** array and tuple summary participation. The specification
asks for summaries to account for child touch state, and leaves the behaviour
per-renderer to be documented rather than assumed; this set does not claim it,
and neither does the Svelte family. A child control inside an item form filters
normally.

### 3.5 Renderer-published `additionalErrors` — **Partial** (was Missing)

No renderer publishes an `additionalError`. The spec requires it for at least
three renderers, and requires a combined-validity integration on top:

- ~~**Monaco** — one summary error per editor instance, gated by
  `propagateErrors`…~~ — **done**, with two things to know: the effective
  default here is **`false`**, not the specification's `true`
  ([portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md)), and
  publication needs a host that combines what renderers publish, because
  `additionalErrors` is a `<JsonForms>` prop with no renderer-facing action.
  Pending language validation feeding combined validity is still missing.
- **File control** — size/read/conversion failures. Today they are surfaced
  through antd's `Upload` `onError` callback only, so the form appears valid.
- **Duration control** — an invalid uncommitted draft must participate in
  diagnostic/validity. ~~Today it renders a local English string.~~ The string
  is now a translated `duration.invalid`, but it is still **local**: it is
  returned from `useDurationControl` and drawn under the control, and no
  `additionalError` is published, so the form is still reported valid while
  the picker shows a complaint.

Consequently §18's "Additional-error ownership and changing data paths" (owner
tracking, path relocation after reorder/delete, stale asynchronous result
discard) has nothing to apply to, and the §15 combined-validity contract that a
submit guard would consume does not exist.

### 3.6 Extended validator profile (§15) — **Partial** (was Missing for React)

~~The Ajv profile the spec describes … exists only in the **legacy** Vue 2
stack, in `packages/legacy/common/src/core/`. None of the React packages
declares or ships a validator integration.~~

**`createFormsAjv` now ships one**
([`core/ajv.ts`](../packages/jsonforms-react-extended-renderers/src/core/ajv.ts)),
used by the web component and the demo:

| Part of the profile | Status |
| --- | --- |
| `useDefaults`, `$data`, `discriminator` | **Done** |
| `color` format | **Done** |
| Caller-supplied extra formats | **Done** |
| ajv-errors (`errorMessage`), ajv-keywords, ajv-i18n | **Done** — ported from the Vue 2 `common` package, including the extended `transform` and the extra `dynamicDefaults`. See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) |
| `duration` format | **Done** — `ajv-formats` supplies it, and it is what makes §7.4's unbounded components checkable. Verified against `PT90M`, `P400D`, `PT1H591212M` and `P0W` |
| `password` format | Not validated, and correctly so: JSON Schema treats it as an annotation, and `strictSchema: false` lets it through without constraining the value |
| `/#` current-form schema reference | Still missing |

**`$data` is the item to check first in another renderer set**, because it does
not degrade. Ajv throws `formatMinimum value must be ["string"]` at **compile**
time, inside `coreReducer` while the JSON Forms store initialises — so one
schema using the canonical date-range idiom takes the *whole application* down
at mount, with a stack that names Ajv and never mentions the schema. A
per-fixture test cannot catch it; `specExamplesCompile.test.ts` compiles every
registered example the way the app does, which can.

The Svelte family's `core/validate.ts` makes the same three option choices,
which is a useful check that this is the profile these renderers expect.

The remaining entries below are still open:

Direct consequences:

- ~~The `color` format … is not registered for React~~ — **fixed**.
- `duration` and `password` custom formats are likewise unregistered.
- ~~The `formatMinimum`/`formatMaximum` family … has no validator-side
  counterpart in React.~~ — **fixed**: `ajv-formats` supplies the comparison
  and the temporal pickers now apply the bounds; see §6.5d.
- ~~`errorMessage` (ajv-errors) and `error.errorMessage.<key>` translation are
  unavailable.~~ — **fixed**, including the unwrapping without which the
  messages land on the enclosing object instead of the fields.
- ~~Validator message localization (ajv-i18n, with the bg-BG → bg subtag
  fallback) is unavailable.~~ — **fixed**, opt-in by locale set, with the
  Bulgarian catalogue ajv-i18n does not ship carried here.
- The `/#` current-form schema reference (§15, "Rule data scopes and
  current-form schema references") is not registered, so the spec's
  `{"$ref":"/#"}` submit-enable rule cannot be authored.

~~**Work:** bring the three plugins across to `createFormsAjv`…~~ — **done**.
What remains here is the `duration` and `password` formats and the `/#`
self-reference.

One thing found while doing it, worth carrying to any renderer set: JSON
Forms' factory sets **`strictSchema: false`**, so a validator without these
keywords does not reject a schema that uses them — it **silently ignores**
them. A form authored against the extended profile and validated by a plain
Ajv compiles, validates less than it claims, and leaves `transform` values
untransformed, with nothing thrown and nothing logged. That is the argument
for the keywords defaulting on rather than being opt-in.

### 3.7 Markdown and interpolation (§9–§10) — **Partial** (was missing)

~~`interpolate`, `markup` and `textParams` are read nowhere. There is no ICU
MessageFormat pipeline, no Markdown parser, no sanitizer, and therefore none
of §10's security rules.~~ — **Markdown is implemented**; ICU interpolation
and `textParams` are not.

`options.markup: "markdown"` on a `Label` routes it to
[`MarkupLabelRenderer`](../packages/jsonforms-react-extended-renderers/src/renderers/MarkupLabelRenderer.tsx)
at rank 3, which parses with the profile in
[`util/markdown.tsx`](../packages/jsonforms-react-extended-renderers/src/util/markdown.tsx).
Both §10 profiles are implemented, link targets go through the §12 URL policy,
and the host gate and `typography` option are read from
`jsonformsExtended.markup`. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) and the
[`markup-label`](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/markup-label/)
example.

Four findings worth carrying to another implementation, all recorded in
Adjustment 35:

- **There is no sanitizer, and that is the point.** The token stream is walked
  into UI elements, so no markup string is produced and §10's "sanitize after
  parsing" has nothing to act on. What can be drawn is an allowlist.
- **The parser's own scheme check had to be switched off**, not layered in
  front of the URL policy — otherwise the effective policy is the
  intersection of the two, and a refusal raises no diagnostic.
- **The Markdown gate defaults open**, unlike every §12 gate. The criterion:
  a gate defaults closed when what it opens can *act*.
- **A refusal shows the diagnostic and the text**, unlike a refused template.

~~Still outstanding: ICU interpolation and `textParams` (§9).~~ —
**interpolation is implemented**, with CEL rather than ICU, so §9 and §11.4
share one grammar and one evaluator. The tester now claims an element asking
for either markup or interpolation. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) and the
[`label-interpolation`](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/label-interpolation/)
example.

Still outstanding:

- **Markup and interpolation on elements other than `Label`.** A control's
  `description`, a Group's label and the `Button` label read plain text only.
- **Plural and locale-aware formatting.** An expression language has no
  `plural`/`select` and no number or date formatting; a plural is a
  hand-written conditional. Adjustment 37.2 records the trade and the
  mitigation.
- **`$dynamic` resolution (§11)** still does not exist, so the `template`
  leaf has nothing to share the evaluator with yet.
- **Images and raw HTML inside Markdown** remain excluded. §10 permits them
  behind independent gates; neither gate exists, so neither can be opened.

#### 3.8 URL policy (§12) — **Partial**

[`util/urlPolicy.ts`](../packages/jsonforms-react-extended-renderers/src/util/urlPolicy.ts)
implements the §12 default profile — `https`/`http`/`mailto`, relative allowed,
data URLs refused — read from
`config.jsonformsExtended.security.urlPolicy`. It strips control characters
before resolving a scheme, so `java\nscript:` is refused, and treats
protocol-relative `//host` as absolute.

**`Link.href` goes through it.** A refused URL renders as plain text rather
than an anchor.

~~Still outstanding: `ImageViewRenderer` renders `<img src={...}>` with **no**
policy check and ignores `allowImageDataUrls`.~~ — **fixed**. Worth carrying
across: `allowImageDataUrls` was **declared in the policy type and consulted by
nothing**, so setting it had no effect and no error. Images now go through
`isAllowedImageUrl`, which adds `data:image/…` to the allowed set when the flag
is on — images only, so the flag cannot open a `data:text/html` document. The
policy applies equally to a direct `src` and to one resolved from `scope`.

~~Still outstanding: Markdown does not exist~~ — Markdown link targets now go
through the same policy; see §3.7. Still outstanding: there is no
`encodeURIComponent`-equivalent encoding of substituted URL components, which
only matters once `$dynamic` lands.

### 3.9 Diagnostics (§21) — **Missing**

No `UIDiagnostic` shape and no stable codes. The nearest thing is
`data-columns-diagnostic` in `HorizontalLayoutRenderer`, a DOM attribute
carrying an English sentence. Every "report a diagnostic rather than guessing"
requirement in the spec is currently either silent fallback or nothing.

### 3.10 Pending edits, commit timing and cancellation (§18) — **Partial**

[useDebouncedChange](../packages/jsonforms-react-antd-renderers/src/util/debounce.ts)
plus `PendingChangesProvider` implements the dialog half of the contract well:
`flush`/`cancel` registration, Apply flushing, Cancel cancelling, and the
`draftRef` mirror in `CompositeDetailDialog`. That part matches the spec's
required lifecycle and is already described in the repository's `CLAUDE.md`.

Three requirements outside the dialog are not met:

1. ~~**Clear does not supersede queued edits.**~~ **Fixed.** `onClear` now calls
   `debouncedUpdate.cancel()` before writing, so a keystroke made inside the
   300 ms window cannot land afterwards and restore the cleared text. Covered
   by `test/debouncedClear.test.tsx`, including clear/retype/clear.
2. **Blur does not flush.** The spec asks for a pending committable edit to be
   flushed on blur before its validation errors are presented.
3. ~~**Unmount leaves the timer live.**~~ **Fixed**, and the fix is larger
   than the heading was. §18 names three ways a queued write outlives its
   target, and only one is an unmount:

   - **The control is disposed.** A cleanup cancels — never flushes, since
     "flushing on unmount can recreate deleted data or write into a different
     item".
   - **The control is rebound to another path.** The debounced function is
     keyed on `path`, so a rebind makes a new one and the cleanup cancels the
     old, which still closes over the old path.
   - **The path stays and what it points at changes.** This is the spec's own
     worked example, and **neither of the first two fires for it**:
     `ArrayLayout` keys rows by path (`key={childPath}`), so deleting item 0
     re-renders the control at `items.0` with the former item 1's data rather
     than unmounting it. "The path alone is insufficient evidence that the
     original target still exists."

   The evidence for the third is the value arriving from outside, which the
   spec asks to be told apart from "normal host feedback of the just-committed
   data". `useDebouncedChange` records what it last wrote: data equal to that
   is its own commit returning, anything else is a replacement and cancels the
   queue. **Without that distinction the guard eats ordinary typing** — a
   commit lands mid-word, returns as a prop, and the keystrokes queued since
   would be cancelled with it.

   Covered by `test/debouncedDisposal.test.tsx`, which fails on all three
   counts when the guard is removed.

### 3.11 Read-only separation (§15) — **Not exercised**

`separateReadonlyFromDisabled` is read nowhere. Renderers consume `enabled` and,
in a few places, `readonly` (`MixedRenderer`, `ObjectRenderer`,
`AntdColorControl`, `AntdDurationControl`, Monaco), but there is no consistent
treatment, and read-only is generally collapsed into disabled. That matches the
compatibility default (`false`), so it is not wrong — but the capability should
be declared as unsupported rather than assumed.

`READONLY` / `WRITABLE` rule effects depend on the core integration; their
availability needs verification before being claimed.

---

### 3.12 The UI library's own locale (§9) — **Implemented**

Worth a checklist entry precisely because it is easy to miss: JSON Forms
carries a locale and translates the strings the **renderers** own. antd owns a
second set nobody authored — month and weekday names, "Today", "OK", a
select's empty text, a table's sort tooltips — and they stayed English however
the form was configured. That reads as a translation gap in the form rather
than a setting nobody had connected.

`useAntdLocale` resolves a language tag to an antd locale and sets **dayjs**
alongside it: antd supplies the widget chrome, dayjs the formatted date. Both
the web component's `ConfigProvider` and the demo's wrapper use it.

Two details to carry across:

- **Loaders, not imports.** antd ships 75 locales and dayjs 143. Each entry is
  a function whose `import()` becomes its own chunk — verified as 28 chunks of
  ~4–5 KB in the demo build — so the registry *is* the build-time selection of
  supported languages and only the one in use is downloaded. The specifiers
  must be literal: a computed `import(path)` cannot be analysed statically, and
  a bundler answers that by emitting either nothing or all 75.
- **`dayjs.locale()` is global and must be re-applied every time a locale
  becomes active**, not once per fetch. Applying it inside the loader looked
  right and left the most recently *loaded* language formatting dates, so
  returning to an already-cached locale showed the wrong one.

A tag the build does not carry, and a chunk that fails to load, both fall back
to antd's own default, which is English.

### 3.13 The renderer set's own strings did not follow the locale — **fixed**

[§3.12](#312-the-ui-librarys-own-locale-9--implemented) connected antd's
chrome to the locale. The strings **this project** owns were the other half of
the same hole, and stayed English: the fallback for every one of them was a
single English table per package (`util/i18nDefaults.ts`, 95 keys). A form's
catalog is authored for the form's own labels, so it defines almost none of
them, and a form switched to another language kept English buttons, units,
tooltips and accessible names.

Fixed with per-locale bundles, the direct counterpart of antd's own: resolution
is **form catalog → locale bundle → English**, and the ordering is not
re-implemented, because the bundle's string is handed to the translator as its
*default message*. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Three things to carry across, each of which cost something here:

- **Whatever supplies the default message decides the language.** Twenty-two
  call sites across eight files translated as
  `translate(key, i18nDefaults[key])` — the cells, the composite dialog and
  summary, the container indicators, the select, the file control. They *do*
  call the translator, so they look correct; handing in the English string as
  the default pins them to English anyway. Any renderer set with a
  `Translator` threaded as a prop will have this shape somewhere.
- **A marking translator cannot detect it.** The guard that replaces every
  known key with a marker answers `translate(key, English)` with the marker,
  so the site passes. The test that finds it renders with a locale and **no
  translator at all**, which is what a form with no catalog actually is.
- **Synchronous, unlike the chrome.** The chrome is loaded through `import()`
  because antd ships 75 locales; these are ~100 short strings that are on
  screen the moment a control mounts, so an async load would show English and
  swap it out in front of the user.

The symptom that surfaced it: a Group's data-presence dot, in a form with no
catalog, under a Bulgarian locale, still captioned "Section contains data".

---

## 4. Per-renderer findings: strings, numbers, booleans

### 4.1 String control — **Partial**

Source:
[AntdInputText.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdInputText.tsx).

| Spec requirement | Status |
| --- | --- |
| `placeholder`, `focus`, `clearable` (default true) | Implemented |
| `suggestion` → free-text suggestions | Implemented via antd `AutoComplete` |
| `restrict` + `maxLength` limits entry | **Divergent** — `maxLength` is passed to the input unconditionally; `restrict` is never consulted, so `restrict: false` still prevents entry |
| Unicode code-point length semantics | **Missing** — antd's `maxLength` and `count.max` measure UTF-16 code units, so `{"maxLength":1}` rejects `"😀"`, which the spec names as the exact failure case |
| Invalid incoming data preserved, not truncated on render | Needs verification: antd may clip an over-length incoming value |
| Input-method composition preserved | Not handled explicitly; relies on antd/React behavior |
| `mask` | Not handled by this control; a mask pattern selects the masked string control instead — see [§2.3](#23-masked-string-control--implemented) |

### 4.2 Multiline string control — **Partial**

The `options.multi` branch hard-codes its sizing:

```tsx
specificProps.rows = 5;
specificProps.autoSize = { minRows: 5, maxRows: 5 };
inputStyle.resize = 'vertical';
```

- **`rows` is ignored.** The spec defines `rows` as a positive integer with
  default **3**; this is fixed at 5 and `autoSize` pins min and max to 5, so the
  textarea cannot grow either.
- **`resizable` is ignored.** The spec defines it as boolean, default `true`,
  with `false` removing the affordance. `resize: 'vertical'` is unconditional.
- There is an `appliedUiSchemaOptions.trim` reference in the width calculation.
  `trim` is explicitly **excluded** from the portable contract ("The portable
  contract excludes the trim sizing option"). It is read in six controls. See
  [§9.2](#92-trim--removed-and-diagnosed-rather-than-ignored).

### 4.3 Number and integer controls — **Partial**

Sources:
[AntdInputNumber.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdInputNumber.tsx),
[AntdInputInteger.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdInputInteger.tsx).

| Spec requirement | Status |
| --- | --- |
| `options.step` | **Missing** — number hard-codes `step={0.1}`; integer passes no step at all |
| `multipleOf`-derived stepping | **Missing** — the spec's resolution order is `options.step` → `schema.multipleOf` → `0.1` (number) / `1` (integer) |
| Fractional explicit integer step diagnosed | **Missing** |
| `minimum`/`maximum` guard step actions and typed commits under `restrict` | **Missing** — no `min`/`max` reaches antd's `InputNumber` |
| `exclusiveMinimum`/`exclusiveMaximum` preserved in input handling | **Missing** |
| Parse the complete input before committing | **Fixed.** Both controls use `toCommittableNumber`, which parses with `Number`: `1.9` stays `1.9`, `1e3` becomes `1000`, and a numeric prefix like `12abc` is refused rather than silently becoming `12`. A fractional entry in an integer field is committed as typed so validation can report "must be integer" — rounding would be the same silent substitution in another disguise |
| Never commit NaN / ±Infinity | **Fixed.** `toCommittableNumber` commits nothing unless `Number.isFinite` passes. Emptiness is tested first, since `Number('')` is `0` and would otherwise turn clearing into committing a zero |
| Declare supported numeric range and precision; detect silent precision loss | **Missing, and not detectable where it stands** — antd's `InputNumber` converts the text to a JavaScript number before the renderer sees it, so `9007199254740993` has already become `...992`. Catching it needs antd's `stringMode` |
| Incompatible-value hint (`numeric.incompatibleValue` / `numeric.clearValue`) | **Missing** — the §18 rename-into-a-different-value-schema contract has no hint icon or tooltip |

### 4.4 Slider control — **Partial**

Source:
[AntdSlider.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdSlider.tsx).

```tsx
value={Number(data || schema.default) as any}
```

- ~~**Zero is replaced by the default.**~~ **Fixed.** `resolveSliderValue`
  type-checks rather than testing truthiness, so a committed `0` keeps the thumb
  at zero instead of jumping to `schema.default` - the data said 0 while the
  knob sat at 10. The fallback chain is data → `schema.default` →
  `schema.minimum` → `0`, each link checked rather than trusted, since the range
  tester requires a default to exist but not that it is a number.
- ~~**No "Not set" indication.**~~ **Partially fixed.** An uncommitted value is
  announced as "Not set" rather than as a committed number. The *visible*
  marking the spec also asks for is still missing.

  Worth carrying across: the first fix set `aria-valuetext` **as an attribute
  on the control**, and antd does not forward it to the handle that carries
  `aria-valuenow` — so it never reached the DOM at all and the announcement
  was still the bare number. It goes through antd's own
  `ariaValueTextFormatterForHandle`. Any renderer set wrapping a composite
  slider widget should check that its accessible text lands on the element
  that carries the value, not on the wrapper; nothing warns, and the attribute
  simply disappears.
- ~~`Number(null)` is `0` and `Number("abc")` is `NaN`~~ — both now fall back
  rather than being coerced. A numeric string still positions the thumb, but an
  empty one falls back instead of becoming `Number('')` = 0.
- `multipleOf` is used as the step, which matches the spec, but integer schemas
  with a fractional `multipleOf` are not protected.
- `exclusiveMinimum`/`exclusiveMaximum` are ignored for the track range.
- No clear affordance; the spec puts sliders under the shared clear contract.
- `marks` come from `schema.minimum`/`schema.maximum` directly; a missing bound
  produces an `undefined` key in the marks object.

### 4.5 Boolean checkbox and switch — **Partial**

Sources:
[AntdCheckbox.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdCheckbox.tsx),
[AntdToggle.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdToggle.tsx).

- ~~**Truthiness interpretation of invalid values.**~~ **Fixed.** Both controls
  now check `typeof data === 'boolean'`: only a real `true` is checked, and
  anything that is not a boolean renders indeterminate (checkbox) or off with an
  accessible explanation (switch), alongside its validation error. `!!"false"`
  is `true`, which made the spec's named counter-example render as checked, and
  `0`, `''` and `{}` look like deliberate answers.
- **Checkbox indeterminate:** implemented (`data === undefined || data === null`)
  and matches the spec's preferred representation of an unanswered value.
- ~~**Switch has no unanswered representation.**~~ **Fixed.** A switch without a
  committed boolean carries an accessible `boolean.notSet` ("Not set"), or
  `boolean.invalid` when the value is not a boolean at all, composed into
  `aria-describedby` alongside the control's own help text.
- **No clear affordance** on either. The spec puts booleans under the shared
  clear contract, including the rule that `false` counts as a present value and
  that clearing in dynamic-property context retains the key.
- Required semantics: the controls do not impose a true-only constraint, which
  is correct.

---

## 5. Per-renderer findings: choices and combinators

### 5.1 Enum / named choice controls — **Partial**

Source:
[AntdSelect.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdSelect.tsx).

- `autocomplete` — see [§2.2](#22-autocomplete-choice-control--implemented).
- `clearable` is not read; `allowClear={enabled}` is unconditional, so
  `clearable: false` cannot opt out.
- `placeholder` falls back to the translated `enum.none`, which is a sensible
  localizable empty-selection prompt and matches §18's shared placeholder
  contract.
- Choice identity: `<Option value={optionValue.value} key={optionValue.value}>`
  uses the value as the React key. Structured constants (object/array `const`
  branches) would collide or stringify. The spec requires a renderer to declare
  its supported enum value types and to keep numeric `1` distinct from string
  `"1"`; that declaration does not exist and antd's `Select` value handling has
  not been verified for it.
- Out-of-domain existing values: antd renders an unmatched value as its own
  label. That satisfies §19's "do not substitute" rule, but the spec's
  requirement to mark it as an invalid/unknown state is unmet.
- Choice-label translation via core's `i18n` mapping is inherited from
  `withJsonFormsEnumProps`; locale refresh has not been verified.

### 5.2 Radio choice controls — **Partial**

Source:
[AntdRadioGroup.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdRadioGroup.tsx).

- ~~**`options.vertical` is not read.**~~ **Fixed.** Both choice groups now
  honour it identically and announce `aria-orientation`; see
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
- ~~**`enabled` is not consumed.**~~ **Fixed.** `Radio.Group` now receives
  `disabled={!enabled}`, and the change handler is guarded as well, so neither
  a keyboard path nor a caller-supplied `inputProps.disabled` override can
  commit a change to a read-only control.
- `value={data ?? ''}` maps absence to the empty string, which would spuriously
  select an enum choice whose value *is* `''`.
- ~~`key={option.label}` collides when two distinct values share a translated
  label~~ **Fixed.** Keyed by value, so distinct values stay distinct choices.
- No clear affordance; the spec requires the shared clear action, with
  focus/hover visibility and dynamic-property clear semantics.

### 5.3 Enum array (checkbox group) — **Partial**

Source:
[EnumArrayRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/EnumArrayRenderer.tsx).

- `vertical` implemented.
- **`restrict` is not applied.** `minItems`/`maxItems` do not disable further
  selection or prevent unchecking below the minimum, which §15 lists as a
  required restrictive-interaction target for checkbox groups.
- `uniqueItems` duplicate prevention is structural (checkbox model), which is
  fine, but the §18 "safe removal" requirement — rechecking the target against
  current data before dispatching a removal — is not implemented.

### 5.4 oneOf renderer — **Partial**

Preservation and branch derivation are fixed; clearing through the select's own
affordance and the composition summaries remain.

Source:
[OneOfRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/OneOfRenderer.tsx).

- ~~**Enclosing properties are not preserved across a branch change.**
  `openNewTab` calls `handleChange(path, createDefaultValue(branchSchema, root))`,
  discarding the whole value. The spec's worked example requires `name`
  (declared in the enclosing `properties`) to survive a switch from Email
  contact to Phone contact. Today it does not.~~ — **fixed**: `branchChangeData`
  in `util/combinators.ts` applies §18's rule, and the confirmation now weighs
  only what is actually discarded. See
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
- ~~**The displayed branch is derived once, at mount.**~~ — **fixed**, and
  worth checking in any renderer set: a *discriminated* `oneOf` went stale the
  moment its discriminator changed, leaving the previous branch's fields on
  screen. Since branch selection is the only way a schema alone decides which
  fields exist, this broke that mechanism entirely. The branch now follows
  `indexOfFittingSchema` until the user selects one; a value fitting no branch
  leaves the display alone. See
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
- ~~Confirmation is unconditional when `!isEmpty(data)`~~ — **fixed**: branch
  changes and clears now resolve through the shared policy, so `0` and `false`
  count as existing values and the prompt is configurable. See
  [§3.3](#33-shared-destructive-change-confirmation-14--implemented).
- **Clearing the selector bypasses both rules.** `allowClear` →
  `handleTabChange(null)` → `openNewTab(null)` → `handleChange(path, undefined)`,
  with no confirmation and no preservation of enclosing properties. §18's shared
  clear-control contract requires clearing a oneOf to use the same confirmation
  and preservation behavior as a branch switch.
- Initial selection falls back to index `0` when nothing fits and data is
  non-empty, which matches "a fallback branch may be displayed alongside
  validation errors".
- `composition.multipleMatches` / `composition.noMatch` summary fallbacks:
  **missing**.

### 5.5 anyOf renderer — **Implemented** (was Partial)

Source:
[AnyOfRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/AnyOfRenderer.tsx).

- ~~**Tab changes mutate data.** `handleTabChange` calls `openNewTab` (which
  writes `createDefaultValue(...)`) whenever `typeof data` differs from the
  target branch's default. §18 is explicit: "Switching tabs does not delete
  email or phone… the active tab is presentation state only." For anyOf, the
  tab is a view, not a branch commitment. This is a behavioral contradiction,
  not just a missing option.~~ — **fixed**: navigation writes nothing at all,
  and the "Clear form?" prompt is gone with it.

  **The reason this is safe is worth carrying to another renderer set**, because
  it is not obvious. An object branch shown over a string value has inputs bound
  to paths that do not exist, which looks like it must swallow every keystroke -
  the very thing the seeding was there to avoid. It does not: JSON Forms'
  `update` builds the containers along the path, so a child write of `note`
  against `"a plain note"` yields `{"note":"hello"}`. Verified directly against
  `coreReducer`, and pinned by a test, because if core ever stops doing that
  every other assertion becomes a silent data loss. See
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
- ~~**The selected tab is re-derived from the data on every change.**~~ —
  **fixed**: emptying the value while on a chosen tab left *no* tab selected and
  the panel blank, mid-edit. §22 counts the selected tab as runtime state, so
  the choice is the user's once they have made it.

### 5.6 allOf renderer — **Implemented**

Source:
[AllOfRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/AllOfRenderer.tsx).

Renders every branch form in schema order, with a registered UI schema taking
precedence. That matches the spec's default presentation.

### 5.6a The enclosing properties were not rendered — **fixed**

~~`AllOfRenderer` renders the branch forms only.~~ §18 requires "the enclosing
properties followed by all branch forms in schema order", and the enclosing
half was missing entirely: a property declared beside an `allOf` had **no input
anywhere on the form** and no way to be edited.

**Check this one against any renderer set.** The shared piece is
`CombinatorProperties`, which generates a UI schema from the schema minus the
combinator keyword and dispatches it. `oneOf` and `anyOf` both used it;
`allOf` never imported it. Two details make the omission easy to repeat:

- the component is easy to read as "the *selector's* enclosing properties",
  and `allOf` has no selector — but the properties are the enclosing object's,
  not the selector's, and are just as real without one;
- its `combinatorKeyword` prop was typed `'oneOf' | 'anyOf'`, so a renderer set
  copying the type would find `allOf` rejected by the compiler and conclude it
  did not apply.

The symptom is silence. Nothing renders, nothing validates differently, and
the data keeps whatever value the property already had — so it survives a
round trip and only shows up when someone tries to edit that field.

### 5.6b The scalar-composition single-editor contract — **fixed**

~~**Missing: the scalar-composition single-editor contract.** §18 requires that
when a composition describes one unambiguous scalar editor, it renders once and
preserves the outer Control's label, description, i18n, options and data path.
The spec's worked example is the draft-07 meta-schema's
`nonNegativeIntegerDefault0` (`allOf: [{$ref: nonNegativeInteger}, {default: 0}]`)
rendering as a single "Min Length" integer input. Today that produces two
dispatched branch forms, one of which is an annotation-only branch, and the
outer label is lost.

The same is true for the validation-only `anyOf`/`oneOf` scalar cases
(`anyOf: [{maximum:10},{minimum:20}]`, `oneOf: [{multipleOf:3},{multipleOf:5}]`),
which currently render branch selectors instead of one integer input.~~

Implemented as `scalarCompositionTester` at rank 4 — above the three combinator
renderers, below the finite-choice renderers at 5. What it looked like before:
`{"type":"integer","anyOf":[{"maximum":12},{"minimum":50}]}` rendered a **tab
strip labelled `anyOf-0` and `anyOf-1`** over a single integer, and the `oneOf`
form added a branch dropdown plus a duplicate copy of the control.

Three findings to carry across:

- **`allOf` branches are folded into the input; `oneOf`/`anyOf` bounds are
  dropped.** `allOf` is an intersection so its constraints all apply, which is
  what makes the meta-schema example an integer input with minimum 0.
  Alternatives are not, and §18 is explicit that copying either branch's bound
  onto the input excludes values the other permits.
- **A tester receives the schema the dispatch started from, not the schema at
  the control's scope.** Testing the argument directly never matches for a
  top-level control; `schemaMatches` resolves the scope first, which is why
  every core combinator tester uses it.
- **Core never gives a control a composition error.** `oneOf`, `anyOf` and
  `allOf` are all in core's `filteredErrorKeywords`, so §18's "visible
  scalar-composition errors" requirement cannot be met by the delegated input
  whatever schema it is handed — the renderer that knows about the composition
  has to draw the message itself. The branch errors underneath stay suppressed,
  which is what the section wants.

See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

---

## 6. Per-renderer findings: temporal, file, object, arrays

### 6.1 Object control and additional properties — **Partial**

Sources:
[ObjectRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/ObjectRenderer.tsx),
[AdditionalProperties.tsx](../packages/jsonforms-react-antd-renderers/src/complex/AdditionalProperties.tsx).

Implemented and matching the spec:

- `options.detail` via `findUISchema`, with generated fallback.
- `allowAdditionalPropertiesIfMissing`.
- `propertyNames` validation of proposed names, including `$ref` resolution,
  validated through Ajv on both Add and Rename — as a **whole schema**, so
  `minLength`, `enum`, `not` and the rest apply, not only `pattern`.
- `patternProperties` admission when `additionalProperties: false`.
- **Any character is permitted in a name.** `items[0]`, `2024`, `a$b`, `a/b`
  and `sdf.sdf` are all ordinary keys; only the schema refuses one. A name a
  data path cannot address - empty, or containing a dot - is routed to an
  isolated editor rather than rejected. See
  [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
- `restrict` gating on `minProperties` / `maxProperties`, counting all keys.
- Required keys protected from deletion under `restrict`.
- Rename with collision rejection and value preservation.

Gaps:

| Spec requirement | Status |
| --- | --- |
| `allowEmptyPropertyNames` (default `false`, UI option overrides config, including `false` over `true`) | **Implemented** — see [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) |
| Preserve names exactly; trimming is only a blankness check | **Implemented** — `trim()` decides blankness and nothing else, on both Add and Rename |
| Empty add-name draft must not show inline errors on load or after reset | **Implemented** — the message is suppressed while the box is exactly empty; Add still consults the validation result |
| Empty-name blank-label presentation | **Implemented** — a blank label, never the literal `""`, with Rename/Delete kept above the value input |
| Literal dotted / empty key isolated editors | **Implemented** — a key a data path cannot address is edited in a form rooted at its value and written back under its exact key, with the schema rebundled so local `$ref`s still resolve. Such names can also be **created**, not only preserved. **Limitation:** that form validates its own value, so those errors are not part of the containing form's error list |
| Every matching `patternProperties` schema applies conjunctively (strongest bounds) | **Partial** — `matchingSchemas` is collected, but the combination policy for overlapping scalar constraints needs verification against the spec's `price_total` example |
| Delete confirmation | **Implemented** through the shared policy — see [§3.3](#33-shared-destructive-change-confirmation-14--implemented) |
| Object-level errors (e.g. `minProperties` on `{}`) shown near the object editor | **Missing** — `ObjectRenderer` renders no `errors` prop at all. Which errors this actually loses depends on where core maps each one: a `dependencies` failure is mapped onto the missing property and *does* display, while `additionalProperties` (mapped onto a key the dynamic-property editor renders without errors) and `minProperties` (mapped onto the object itself) show nowhere. Worked through in the [object-control example](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/object-control/README.md) |
| Clearing a dynamic property's value retains the key | **Implemented** — `PRESERVE_DYNAMIC_PROPERTY_OPTION` + `clearedDynamicPropertyValue` in `InputControl` |

### 6.2 Array table control — **Partial**

Sources:
[ArrayControlRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/ArrayControlRenderer.tsx),
[TableControl.tsx](../packages/jsonforms-react-antd-renderers/src/complex/TableControl.tsx).

- Forced-table selection (`table: true` / `format: 'table'` at rank 5 over the
  detail renderer's rank 4) is implemented as the spec describes, with
  `cells.<property>` driving composite columns.
- Delete confirmation via `DeleteDialog` using core's `ArrayTranslations` keys.
- `showSortButtons` (plus the legacy `showArrayTableSortButtons` alias),
  `disableAdd`, `disableRemove` implemented.

Gaps:

| Spec requirement | Status |
| --- | --- |
| `restrict` → `minItems`/`maxItems` prevention | **Missing** — only `disableAdd`/`disableRemove` are honored. `ArrayLayout` *does* implement this, so the two array presentations disagree |
| `hideArraySummaryValidation` | **Missing** |
| Column header labels translated | **Missing** — `schema.properties[prop].title ?? startCase(prop)`, no translator |
| Cell error association for nested/composite columns | **Partial** — `ctxToDataCellProps` filters with `(p) => p === path`, an exact match, so an error inside a composite cell's value does not surface at that cell. §18 requires discoverable feedback at the affected cell |
| Array-level errors presented near the array, including an empty array | **Implemented** via `ArrayLayoutToolbar`/`TableToolbar`. The icon rendered only a **count**, with the messages in a hover-only tooltip and no accessible name, so a screen reader announced "2" and nothing else; §18 asks for an *accessible* explanation, so the icon is now named with the messages — the same fix `util/cellMode.tsx` already carried. Covered by `arrayLevelErrors.test.tsx` |
| Edits target the original source row after sorting/filtering | Not applicable — the antd table is not sortable here |

### 6.3 Expandable array-item forms (`ArrayLayout`) — **Partial**

Source:
[ArrayLayout.tsx](../packages/jsonforms-react-antd-renderers/src/layouts/ArrayLayout.tsx).

| Option | Status |
| --- | --- |
| `detail` | Implemented (`findUISchema`, including `GENERATE`) |
| `elementLabelProp` | Implemented (plus legacy `childLabelProp`), preserving `0`/`false` |
| `showSortButtons` | Implemented |
| `restrict` (`minItems`/`maxItems`) | Implemented |
| `disableAdd` / `disableRemove` | Implemented |
| `initCollapsed` | **Implemented** — the first item opens by default ([portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md)) |
| `collapseNewItems` | **Implemented** — a newly added item opens unless set |
| `hideAvatar` | **Implemented** — the marker goes, the index stays readable |
| `hideArraySummaryValidation` | **Implemented** — hides the child summary, keeps the array's own errors |
| Delete confirmation | **Implemented** through the shared policy ([§3.3](#33-shared-destructive-change-confirmation-14--implemented)) |
| Per-item error indication in the header | **Missing** |
| Expansion tracks the logical item through reorder | **Missing** — expansion state is the array index (`key: String(index)`), so a move transfers expansion to whatever item now occupies that index |
| Choice-aware item labels (oneOf/`const` title resolution) | **Missing** — `elementLabelProp` resolves the raw data value only; §18's "Shared array item labels" requires the enum/oneOf label helper |
| Readable localized item fallback ("Item 1") | **Divergent** — falls back to the bare index string `` `${index}` `` |

The `avatarStyle` turns the index badge red while any panel is expanded
(`if (expanded) style.backgroundColor = 'red'`). That appears to be a stray
debugging artifact rather than intended styling.

### 6.4 List with detail — **Partial**

Source:
[ListWithDetailRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/additional/ListWithDetailRenderer.tsx).

`elementLabelProp` and `detail` are honored, and `hideRequiredAsterisk` is
applied to the array label. Missing: `showSortButtons`, `restrict`,
`hideArraySummaryValidation`, and delete confirmation. Selection reconciliation
after reorder/deletion (the spec requires the selected *logical* item to survive
a delete of an earlier item) needs verification.

### 6.5 Temporal controls — **Partial**

Sources:
[AntdDatePicker.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdDatePicker.tsx),
[AntdTimePicker.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdTimePicker.tsx),
[AntdDateTimePicker.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdDateTimePicker.tsx).

This is the largest per-renderer gap after the layout model.

| Spec option / behavior | Status |
| --- | --- |
| Schema-format **and** UI `options.format` selection | **Implemented** — the core `isDateControl`/`isTimeControl`/`isDateTimeControl` testers accept both |
| `dateFormat`, `timeFormat`, `dateTimeFormat` | Implemented |
| `dateSaveFormat`, `timeSaveFormat`, `dateTimeSaveFormat` | Implemented — but see **the defaults** below |
| **Default save formats produce values the selecting `format` rejects** | ~~**Broken**~~ — **fixed** |
| Localized `L` / `LT` / `L LT` display defaults | **Divergent** — hard-coded `'YYYY-MM-DD'`, `'HH:mm'` (or `'hh:mm a'`), `'YYYY-MM-DD HH:mm'`. The spec's default profile is the localized token with those as *fallbacks* |
| `ampm` | Implemented (time and date-time) |
| **`formatMinimum` / `formatMaximum` / `formatExclusiveMinimum` / `formatExclusiveMaximum`** | ~~**Missing entirely** — no `disabledDate`, `disabledTime` or `minDate`/`maxDate` is passed.~~ **Fixed** — see §6.5d |
| **`showActions`** (stage picker edits until OK) | **Missing** |
| **`okLabel` / `cancelLabel`** | **Missing** (no confirmation actions exist) |
| **`mask`** | **Missing** — no format-aware input mask, so no `mask: false` opt-out either. This is the temporal boolean, not the generic pattern of [§2.3](#23-masked-string-control--implemented), which is implemented |
| **`views`** | ~~**Divergent** — the picker mode is *inferred* from `saveFormat`.~~ **Fixed** — `datePickerMode` reads the explicit array and keeps the inference only as a fallback. The divergence is worth checking elsewhere: inferring granularity from the save format lets storage decide interaction, and makes "a month picker that stores a full date" inexpressible |
| **`pickerIcon`** | **Missing** |
| **`timezone` / `saveTimezone`** | **Missing** (the spec marks this section PROVISIONAL, so it is not yet a firm obligation) |
| **Draft feedback** (`dateTime.outOfRange`, explaining a rejected or unappliable edit) | **Missing** |
| `clearable` | **Missing as an option** — `allowClear={enabled}` is unconditional |
| `placeholder` defaulting to the effective display format | **Partial** — `options.placeholder` is honored; the format-derived fallback is not supplied |
| `focus` | Implemented |
| Mounting/locale change/picker open preserves the stored value exactly | Likely satisfied (`value` is derived, not written back), but not verified for offset spelling and hidden-precision preservation |

#### 6.5a The default save formats were invalid — **fixed**

The worst bug in this area, and the kind that only a round-trip test finds.
A temporal control is selected **by** the schema's `format` keyword, so the
value it writes has to satisfy that same keyword. It did not:

| Option | Was | §18 says | `HH:mm:ss` example | Accepted by `format: "time"` |
| --- | --- | --- | --- | --- |
| `timeSaveFormat` | core's `HH:mm:ss` | `HH:mm:ssZ` | `17:04:09` | **no** |
| `dateTimeSaveFormat` | `YYYY-MM-DD HH:mm` | `YYYY-MM-DDTHH:mm:ssZ` | `2026-10-13 17:00` | **no** |
| `dateSaveFormat` | `YYYY-MM-DD` | `YYYY-MM-DD` | — | yes |

JSON Forms' `createAjv` validates formats in **full** mode, where RFC 3339
`time` and `date-time` both require seconds *and* a timezone offset. So a time
control put the form into an error state the moment anyone touched the picker
— and using the picker again could not repair it, because every value it could
produce was invalid. That is what makes this worth checking elsewhere: the
symptom is an error the user cannot clear by any means the form offers.

The Svelte family (`jsonforms-svelte-skeleton`) already defaults to
`'HH:mm:ssZ'` and `'YYYY-MM-DDTHH:mm:ssZ'`, which is what the section names and
what this now uses. Guarded by `temporalSaveFormats.test.tsx`, which validates
what the picker commits with the same Ajv the form uses.

#### 6.5b Offset-bearing values are displayed in the viewer's timezone

Newly visible, because offsets only started appearing in stored values with the
fix above. `09:30:45+02:00` displays as `03:30` in a UTC−4 browser, and editing
it writes the browser's offset, discarding the entered one.

For a `date-time` that is defensible. For a bare `time` it is more doubtful: a
time of day carrying an offset is arguably meant to be read as written. The
Svelte implementation's `parseTemporalText` goes out of its way here —
"offset-bearing values must be compared in their entered offset, not the
browser's local timezone" — which suggests the same ground has been walked.

Left as-is: §18 marks `timezone` / `saveTimezone` PROVISIONAL and neither is
implemented, so there is no option to express an intent yet. Recorded so it is
a decision rather than an accident, and so the temporal example's tests assert
the *shape* of a displayed time rather than a wall clock.

#### 6.5d Format bounds — **fixed**

`util/temporalBounds.ts` resolves the four keywords into antd's `disabledDate`
and `disabledTime`, closely following the Svelte family's `schemaBounds`.
Exclusivity is stepped at the **picker's** precision, a bare time is placed on
a reference day so two clock values compare, and date-time bounds narrow the
hours on the boundary days only. Contradictory bounds report an empty range.

**A bound never rewrites stored data** — the section's "does not authorize
clamping existing data". An out-of-range value stays and is reported.

#### 6.5e `restrict` cannot reach its specified default through the flat config — **fixed here, open elsewhere**

The finding that made the bounds above appear not to work at all, and the one
most worth checking in another renderer set.

§15 says "`restrict`: shared preferred default **true**". JSON Forms core's
`configDefault` sets `restrict: false`. A renderer that does
`merge({}, config, uischema.options)` and then asks `restrict !== false`
therefore gets `false` for **every** form that does not explicitly opt in: once
merged, core's seed cannot be told from an author's choice, so the specified
default is unreachable.

The temporal controls now use `effectiveRestrict`, which resolves element
`options.restrict` → `config.jsonformsExtended.restrict` → `true`, skipping the
flat key entirely. That is the only ordering in which "on", "off" and
"unspecified" are all expressible.

**Still open everywhere else.** `AdditionalProperties`, `MixedRenderer`,
`ChipsControl`, `MultiSelectControl` and `TupleAdditionalItems` all use the
merged-config idiom and are therefore restrict-off by default, contrary to
§15. Changing them together deserves its own pass, since it alters mutation
guards across the array, mixed and dynamic-property renderers at once.

#### 6.5c Worth porting from the Svelte family

Read alongside `packages/jsonforms-svelte-skeleton/src/lib/`:

| There | Here |
| --- | --- |
| `expandLocaleFormat('LT')` / `('L LT')` for display defaults, via dayjs `localizedFormat` + `localeData` | Hard-coded `HH:mm` / `YYYY-MM-DD HH:mm`. This is the "localized `L`/`LT` defaults" divergence above. |
| `schemaBounds` driving picker min/max from `formatMinimum` / `formatMaximum` | Missing entirely. |
| `useSeconds = timeFormat.includes('s')` deriving seconds interaction from the **display** format | Not derived; the picker's granularity comes from the save format instead. |
| `parseTemporalText` comparing in the entered offset | No equivalent. |
| `maska` tokens for the temporal `mask` option | Missing. |

There is also a **second, competing date/time renderer**:
[NativeControl.tsx](../packages/jsonforms-react-antd-renderers/src/controls/NativeControl.tsx),
`rankWith(2, or(isDateControl, isTimeControl))`, which renders a bare
`<Input type={format}>`. The picker renderers are rank 4, so the pickers win
under the default registry — but `NativeControl` is registered *before* them in
`antdRenderers` and is exported publicly, so a consumer assembling a partial
registry can get the native input unexpectedly. It has no specification entry
(see [§8](#8-implemented-without-a-specification-entry)).

### 6.6 File control — **Partial**

Source:
[AntdFile.tsx](../packages/jsonforms-react-antd-renderers/src/antd-controls/AntdFile.tsx).

Implemented well:

- Selection on `contentEncoding: "base64"`, `format: "byte"`, `format: "binary"`.
- Byte-size bounds from `formatMinimum`/`formatMaximum` and their exclusive
  variants, with the spec's UI-option fallback when the schema side is absent.
- Size is checked against `File.size` **before** reading/encoding, and the
  rejected file is not written — matching the spec.
- The `format: "binary"` data-URL-with-encoded-filename convention.
- Error messages routed through `getI18nKey` with `limit`/`limitText` params.

Gaps:

| Spec requirement | Status |
| --- | --- |
| UI `accept` takes precedence over `contentMediaType` | **Missing** — only `schema.contentMediaType` reaches antd's `accept`. An explicitly empty `accept` (meaning "no filter") is likewise unsupported |
| Bounds are *intersected* when both schema and UI supply them | **Divergent** — `getFileSize` returns the schema bound and only falls back to the UI bound, discarding a tighter UI constraint |
| `restrict` gates *prevention*; validation stays active when disabled | **Missing** — enforcement is unconditional, and `restrict: false` cannot allow the conversion to proceed |
| Errors published through `additionalErrors` | **Missing** — `onError` is antd-local, so the form reports itself valid. See [§3.5](#35-renderer-published-additionalerrors--partial-was-missing) |
| Rejection clears the previous committed value | ~~Divergent, data loss~~ **Fixed.** Size is now checked in `beforeUpload`, which returns `Upload.LIST_IGNORE`, so the file is never added to the list, `customRequest` never runs, nothing is read or converted, and the committed value is left alone. The rejection is shown in a `role="alert"` message beneath the control, **naming the rejected file** (`file.rejected`): the kept attachment is still listed above it, so a bare "size should be less than 1 MB" would read as an error about *that* file. A failed *read* of a new file no longer discards the committed value either |
| Chooser cancellation clears the scoped value | **Missing** — antd's `Dragger` does not surface cancellation |
| Rejected native selection cleared | **Implemented** — `Upload.LIST_IGNORE` keeps the rejected file out of the list entirely |
| `clearable`, `focus` | **Missing** |
| Zero-valued minimum bound | `if (minFileSize)` skips a bound of `0`; harmless but inconsistent with `toNonNegativeNumber` accepting it |
| `format: "uri"` branch in `toBase64` | **Unspecified** — not in the spec's file-control entry |

---

## 7. Per-renderer findings: project extensions

### 7.1 Code editor (Monaco) — **Partial**

Sources:
[MonacoControlRenderer.impl.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/MonacoControlRenderer.impl.tsx),
[editorControls.ts](../packages/jsonforms-react-extended-renderers/src/util/editorControls.ts).

Implemented: lazy loading, theme adaptation without touching Monaco's global
theme registry, maximize/restore, `monaco.rows`/`minRows`/`maxRows`/`autoGrow`,
`monaco.options`, `monaco.initActions`, `options.focus`, read-only propagation,
and an explicit `convertJson: true` JSON-value mode.

| Spec requirement | Status |
| --- | --- |
| **Storage mode inferred from the resolved schema** | **Missing** — `const convert = language === 'json' && options.convertJson === true`. An object/array/number schema with `{"format":"code"}` never enters JSON-value mode, and the tester (`monacoControlTester`) will not even select it: it requires `isStringControl && hasLanguage`, or `language === 'json' && convertJson === true`. The spec's whole inference table is unimplemented |
| Ambiguous mode reported as a diagnostic and falls back to ordinary rendering | **Missing** |
| JSON-value mode requires resolved `language: "json"`; otherwise inapplicable with a diagnostic | **Partial** — the conjunction is enforced, but silently (a non-json language with `convertJson: true` just stores text) |
| **Monaco JSON schema association** (scoped schema on the model URI, preserving `$id`/reference bases, per-instance isolation) | **Missing entirely** |
| **`propagateErrors`** (default `true`) | **Missing** — the option is read nowhere |
| One summary `additionalError` per editor instance, with `keyword: "editor.language"`, `errorCount` in params, at the value's `instancePath` | **Missing** |
| Pending asynchronous validation exposed to combined validity | **Missing** |
| Stale-result discard by model/version | Not applicable yet |
| Dynamic language via `$dynamic.options.language` | **Divergent** — implemented as `options[':language']`, a data path resolved by `resolveEditorLanguage`. The spec calls this shape "compatibility handling, not the portable authoring model" |
| Invalid drafts stay local and do not overwrite the last committed value | **Implemented** — `lastCommitted` ref plus the focused re-sync guard |
| Empty text vs. JSON null behavior defined | **Divergent** — `encodeEditorValue` maps `null`/`undefined` to `''` and `decodeEditorValue` in text mode maps `''` to `undefined`. The spec requires explicit, documented behavior for null, empty text and invalid drafts, and says empty text is not implicitly JSON null |

### 7.2 AG Grid array control — **Partial**

Sources:
[AgGridControlRenderer.impl.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/AgGridControlRenderer.impl.tsx),
[AntdAgGridControlRenderer.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdAgGridControlRenderer.tsx).

Implemented and matching the spec:

- `variant: "ag-grid"` selection; form data remains the row source, with
  `getRowId` mapping to the source index.
- Generated property columns for object items and a `value` column for
  primitives; cells dispatch through the **cells registry**, not the renderer
  registry.
- `cells.<property>` composite summary/detail.
- `agGridOptions.columnDefs` matched to generated columns by `field`.
- `showSortButtons` → a drag-handle column, suppressed when a column already
  declares `rowDrag`.
- Dragging suppressed while sorted, filtered, disabled, or by
  `agGridOptions.suppressRowDrag`.
- `restrict` prevention on add, and on multi-row removal evaluated against the
  **resulting** size.

Gaps:

| Spec requirement | Status |
| --- | --- |
| **`gridHeight`** (default `400px`) | **Divergent** — the code reads `options.height ?? 400` |
| **`gridWidth`** (default `100%`) | **Missing** |
| Recursive merge of `config.agGridOptions` under `options.agGridOptions`, arrays replaced whole | **Missing** — `{ ...props.config, ...props.uischema.options }` is a shallow spread, so a local `agGridOptions` replaces the global one entirely rather than merging object members |
| `agGridOptions.defaultColDef` overrides honored | **Missing** — `defaultColDef` is written as a JSX prop *after* `{...gridOptions}`, so a user-supplied `defaultColDef` is discarded |
| `hideArraySummaryValidation` | **Missing** |
| Tuple item shapes declared | **Divergent** — `props.schema.items[0]` silently treats a tuple as uniform. The spec requires item-shape support to be declared rather than assumed |
| Delete confirmation | **Deliberate** — the spec records that Svelte's grid deletes without confirming and treats confirmation as per-renderer policy |

### 7.3 Color control — **Implemented**, apart from the validator format and `hsl` output

Sources:
[AntdColorControlRenderer.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdColorControlRenderer.tsx),
[colorFormat.ts](../packages/jsonforms-react-antd-extended-renderers/src/util/colorFormat.ts).
Example:
[color-control](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/color-control/README.md).
Amendments: [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

| Spec requirement | Status |
| --- | --- |
| Schema `format: "color"` selection | Implemented |
| UI `options.format: "color"` selection | Implemented — the registry now registers the shared `extendedColorTester`, which carries both paths. ~~Missing: `antdColorControlTester` was `rankWith(3, and(isStringControl, formatIs('color')))`~~. **The same defect remains for duration and null** |
| `colorSaveFormat: "hex"` (default) | Implemented |
| `colorSaveFormat: "hex3"` with `round(channel / 17)` quantization | Implemented, matching the spec's `#ed5050` → `#e55` vector |
| `colorSaveFormat: "rgb"` | Implemented. ~~Missing — an unrecognized value silently fell through to hex~~. An unrecognized value now falls back to `hex` explicitly |
| **`colorSaveFormat: "hsl"`** | **Deliberately not implemented** — antd's picker has no HSL panel, and a save format the editor cannot display means editing one model while storing another. `hsl` stays **accepted as input**; authoring it as a save format falls back to `hex`. See Adjustment 8.1 |
| `colorSaveFormat: "hsb"` | Implemented — an addition, not in the spec's four, and the model the picker actually edits in; see Adjustment 8.1 |
| The picker panel opening on the stored format | Implemented — controlled and reset on each opening; `defaultFormat` alone reopened on whichever tab was left selected. See Adjustment 8.2 |
| Accepting every supported representation as typed input, whatever the save format | Implemented — `#RGB`/`#RRGGBB`/`#RRGGBBAA`, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `hsb()`/`hsba()` |
| Serializing successful text edits to `colorSaveFormat` | Implemented, on blur rather than per keystroke; see Adjustment 8.4 |
| Alpha handling: `#RRGGBBAA` output for hex, never silently discarding alpha | Implemented. ~~Partial — `toHex3`'s regex captured an alpha pair and dropped it~~. A transparent edit under `hex3` is now refused with the localized `color.hex3Transparency` guidance |
| Existing transparent values not made opaque by picker edits | Implemented — alpha survives every format that can carry it, and `hex3` refuses rather than flattening |
| `placeholder` | Implemented. ~~Missing — hard-coded `'#RRGGBB'`~~. An authored hint wins; otherwise it is the syntax of the configured representation |
| `focus` | Implemented. ~~Missing~~ |
| `clearable` as an opt-out | Implemented. ~~Partial — `clearable: false` was not honored~~. It now removes the input's affordance and the picker panel's |
| Clearing from inside the picker | Implemented — the only affordance when text entry is off; see Adjustment 8.6 |
| `colorTextEntry` (picker without the text field) | Implemented — a project addition; see Adjustment 8.5 |
| Existing values not normalized on mount | Implemented |
| Invalid values kept visible rather than replaced by the picker's fallback | Implemented — parsing is decidable rather than delegated to the picker's color object, which cannot fail; see Adjustment 8.3 |
| Registered `color` format on the validator | **Missing** — see [§3.6](#36-extended-validator-profile-15--partial-was-missing-for-react). A value outside the profile is refused by the control but reported by nothing |

Covered by `test/colorFormat.test.ts` (encoding, 24 cases) and
`test/colorControl.test.tsx` (the control, 38 cases).

### 7.4 Duration control — **Partial**

Sources:
[AntdDurationControlRenderer.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdDurationControlRenderer.tsx),
[useDurationControl.ts](../packages/jsonforms-react-extended-renderers/src/util/useDurationControl.ts).

Implemented: ISO 8601 parse/format for years/months/days/hours/minutes/seconds
and the exclusive weeks mode, `P0D` for a zero duration, `showActions`
defaulting to true with Cancel discarding the draft, a picker showing only the
units in play with an add control for the rest, `placeholder`, `focus`, and the
shared clear affordance. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

| Spec requirement | Status |
| --- | --- |
| **Syntax-aware mask or equivalent guided text editing** | **Missing** — the text field is a plain `Input`; every keystroke commits directly via `handleChange` |
| Partial prefixes (`P`, `PT1`) kept as local drafts, never overwriting the last committed value | **Divergent** — typing commits the partial string immediately |
| Invalid characters and pasted input prevented where possible | **Missing** |
| Invalid uncommitted drafts participate in diagnostics/validity | **Partial** — ~~the error is a hard-coded English string~~; it is translated now, but still local to the control, and no `additionalError` is published. See [§3.5](#35-renderer-published-additionalerrors--partial-was-missing) |
| `okLabel` / `cancelLabel` translated as keys with literal fallback | ~~**Divergent**~~ — **fixed**; an explicit label is translated as a key first and used literally if it does not resolve |
| Field labels localized | ~~**Missing**~~ — **fixed**; the units, the mode switch and the add/remove actions are keys, and follow the locale bundles of [§3.13](#313-the-renderer-sets-own-strings-did-not-follow-the-locale--fixed) |
| Fractional/negative duration support declared | **Missing** (the baseline non-negative integer support matches the spec; the declaration does not exist) |

**The components were capped as if they were clock fields — fixed, and the
one most worth checking elsewhere.** The picker bounded months at 11 and
hours, minutes and seconds at 23 or 59. A duration's components are
**quantities**: ISO 8601 bounds none of them, and `PT90M`, `PT3600S`, `P18M`,
`P400D`, `PT25H`, `P1Y13M` and `PT1H591212M` are all valid — Ajv's `duration`
format accepts every one.

Two things made it worse than a display limit:

- The cap was enforced by **clamping**, so a typed 90 in Minutes silently
  became 59. The data the user entered was destroyed without a message.
- `PT90M` and `PT1H30M` are the same length but **not the same data**, so
  normalising one into the other is a silent rewrite of a value that arrived
  from elsewhere — the same rule that protects `P0W` and leading zeros like
  `PT011H591212M` (valid: `1*DIGIT` admits them). What protects all of these
  is that nothing reformats a value the user did not edit.

A renderer set that models a duration on a time-of-day widget will inherit
both. The only real bound is the exact-integer range. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

### 7.5 Split layout — **Partial**

Sources:
[SplitLayoutRenderer.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/SplitLayoutRenderer.tsx) (rank 4),
[AntdSplitLayoutRenderer.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdSplitLayoutRenderer.tsx) (rank 5).

`variant: "splitter"` on either layout type is implemented, direction follows
the layout type, and the shared version has proper separator semantics
(`role="separator"`, `aria-orientation`, `aria-valuenow`, arrow-key resizing) —
which satisfies the spec's accessibility requirement better than the antd
version, whose accessibility depends on antd's `Splitter`.

| Spec requirement | Status |
| --- | --- |
| **`resizable`** (default `true`; `false` disables dragging) | **Implemented** in the shared renderer — the separator stays as a boundary but is no longer focusable or draggable |
| Initial sizes use normal layout sizing | **Implemented** — `initialSplitSizes` divides by `options.layout.weight`, so equal shares are what Auto produces rather than a rule; `span` is ignored, as the spec advises |
| Hidden children leave layout | **Implemented** in the shared renderer |
| `splitter` + `wrap` unsupported | Not applicable (no `wrap` support) |
| Dragged sizes are runtime state, not UI schema | Implemented |
| Vertical splitters require definite height | Implemented via `options.height` with a `20rem` fallback |

### 7.6 Action button — **Implemented** (was Partial)

Sources:
[ButtonRenderer.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/ButtonRenderer.tsx),
[actionContext.ts](../packages/jsonforms-react-extended-renderers/src/renderers/actionContext.ts),
[AntdButtonRenderer.tsx](../packages/jsonforms-react-antd-extended-renderers/src/renderers/AntdButtonRenderer.tsx).

The column on the right is what each item **was**; every one marked fixed is
kept here so it can be checked against another renderer set.

| Spec field / behavior | Was | Now |
| --- | --- | --- |
| Top-level `label` | **Partial** — read, but `options.label`/`options.text` take precedence, and `uischema.text`/`uischema.name` are additional undocumented fallbacks | **Fixed** — top level first, then i18n, then the legacy `options` fallbacks |
| Top-level `action` | **Divergent** — read from `options.action` first, then **invented** from `uischema.name ?? label`. The spec has no such fallback; an unnamed Button should not dispatch a command derived from its visible text | **Fixed** — the label fallback is gone; `name` remains |
| Top-level `params` | **Missing** — never populated on the emitted event; the spec requires missing params to be normalized to `{}` | **Fixed**, including the `{}` normalization |
| `icon` | **Missing** | Accepted and passed on; no icon set is wired up, so nothing is drawn |
| `color` | **Missing** — the antd binding hard-codes `type: 'primary'` | **Fixed** — the six semantic names, mapped by the renderer set |
| **`script`** as a string | **Missing entirely** | **Fixed** — async function body, `this` = ActionEvent, gated on `allowScriptEvaluation` |
| **`script`** as a function | Silently swallowed — stringified into an `AsyncFunction` body, where `() => {…}` is a discarded closure | **Fixed** — run with the event as **argument and `this`**, and **not** gated: the permission is about compiling a *string* |
| `action` and `script` mutually exclusive | Not applicable yet | **Fixed** — the type forbids both; at runtime **`action` wins**, with a warning |
| Awaits the complete promise | **Missing** — `handleAction?.(...)` is fire-and-forget | **Fixed** |
| Pending/loading state | **Missing** | **Fixed** |
| Duplicate activation prevented while pending | **Missing** | **Fixed** |
| Rejection clears pending and propagates | **Missing** | **Fixed** |
| `ActionEvent` shape (`context`, `$el`, `element`, `callback`) | **Partial** | `context` added; `$el` and `callback` remain absent — they belong to the web-component round trip |

`options.disabled` is an additional, unspecified input, and is retained. Note
the spec's guidance that a link-like appearance may be offered through
documented styling options while preserving button semantics — no such option
exists today.

**Three things to carry to another renderer set.**

`.call()` **cannot bind an arrow function's `this`** — it is lexical. A
renderer set that follows the specification's `this`-binding for a
*function*-valued script gives every idiomatic `() => this.context` a silent
`undefined`. Passing the event as an argument as well costs one word and makes
the mistake unreachable.
 The `action`-from-`label`
fallback is worse than it reads: once labels are translated, the action name
**changes with the form's language**, so a host answering `setLocale` in
English silently stops recognising it in Bulgarian. And the duplicate-activation
guard has to be a **ref, not the pending state** — a second click can arrive
before React has re-rendered, so state alone leaves a window in which both
activations get through.

See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

### 7.7 ImageView — **Implemented** (was Divergent)

Source:
[ImageViewRenderer.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/ImageViewRenderer.tsx).

~~- **Reads `options.src` / `options.alt`, not the spec's top-level `src` / `alt`.**
  A spec-conformant `{"type":"ImageView","src":"/logo.png","alt":"Company"}`
  renders nothing.
- **No `scope` resolution.** The spec requires at least one of `src` or `scope`,
  with `scope` resolved against the current schema/data context including the
  current array-item path.
- `alt` is required in the spec; here it silently defaults to `''`, which
  declares every image decorative.
- No URL policy — see [§3.8](#38-url-policy-12--partial).
- Non-string source values are coerced away rather than diagnosed.~~

**All fixed.** The first item is the one to check elsewhere: the failure mode
is an element that renders **nothing at all** — not a broken image, no element
— so a conformant document looks like an authoring mistake rather than a
renderer gap.

`options.src` / `options.alt` are retained as a fallback beneath the top-level
fields, since forms here were authored against them. A missing `alt` is now
reported (`image.missingAlt`) **and the image still renders**: withholding
content over a missing annotation helps nobody, while defaulting silently to
`""` declares every image decorative.

Also fixed while here: **`allowImageDataUrls` was declared in the URL policy
and read by nothing**, because `isAllowedUrl` never consulted it. ImageView now
goes through `isAllowedImageUrl`, which accepts `data:image/…` when the flag is
set and nothing else — a `data:` URL of any other media type stays refused, so
the flag cannot become a way to smuggle in a document.

See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

### 7.8 Separator — **Implemented** (was Partial)

Source:
[SeparatorRenderer.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/SeparatorRenderer.tsx).

~~A bare `<hr />`. `options.vertical` is not read, and orientation is not exposed
to assistive technology (an `<hr>` has an implicit `separator` role but no
`aria-orientation`).~~ — **fixed**. Both halves matter: an `<hr>`'s implicit
`separator` role defaults to **horizontal**, so a vertical one that does not
declare `aria-orientation` has a screen reader describing side-by-side sections
as stacked. The extent comes from the layout, as §13 requires — the rule
stretches to its row and sets no height of its own.

### 7.9 Spacer — **Implemented**

Source:
[SpacerRenderer.tsx](../packages/jsonforms-react-extended-renderers/src/renderers/SpacerRenderer.tsx).

- Reads the spec's **top-level `size`**, with `options.height` still honoured
  as the superseded spelling so existing forms do not shift.
- The axis follows the parent — width in a `HorizontalLayout`, height in a
  `VerticalLayout` or at the top level. The **layout** applies it, by reading
  the Spacer's `size` as a fixed main-axis dimension; see Adjustment 21.6 for
  why it is not a context.
- `options.layout.weight` participates, so a Spacer can be the flexible push.
- The default of 32 and `aria-hidden` are unchanged.

### 7.10 Mixed-value control — **Partial**

Sources:
[MixedRenderer.tsx](../packages/jsonforms-react-antd-renderers/src/complex/MixedRenderer.tsx),
[complex/mixed/](../packages/jsonforms-react-antd-renderers/src/complex/mixed/).

This is the most complete extension in the set. Implemented: type selection over
a union schema, per-type rendering-schema derivation, the object/array
navigation workspace with a resizable splitter, a searchable tree, the
"Show primitives" toggle, breadcrumb ancestor navigation, View drill-in, tree
rename with parent-schema name validation, delete with selection
reconciliation, `restrict` against parent `minItems`/`minProperties`, and
ancestor `readOnly` inheritance.

| Spec requirement | Status |
| --- | --- |
| Selection on the **resolved** schema | **Implemented** — the tester used to judge the enclosing schema, so a union-typed *declared property* never reached this renderer and fell through to the plain text control; a `["string","number"]` field became a text box and a number typed into it was stored as a string. Covered by `test/mixedSelection.test.tsx` |
| **`options["<type>-detail"]`** (e.g. `object-detail`, `array-detail`) | **Missing** |
| `typeChange` confirmation (fallback `complex`) | **Missing** |
| Tree `delete` confirmation (fallback `always`) | **Missing** |
| Literal dotted / empty key tree identity and isolated editors | **Partial** — the additional-properties control creates and edits both through an isolated editor; the mixed renderer's own tree has not been given the same treatment |
| Search text and primitive-visibility preserved across navigation, rename and type change | Needs verification |
| Selection retained when the active filter hides its row | Needs verification against the spec's `customer` → `client` example |
| Tree search and toggle labels localized | **Missing** — `'Search value tree'`, `'Search tree...'`, `'Show primitives'`/`'Hide primitives'` are hard-coded English |

Demonstrated by the `mixed-control` spec example, whose README names the three
gaps above as deliberately not shown.

### 7.11 Composite cells and the detail dialog — **Partial**

Sources:
[AntdCompositeCell.tsx](../packages/jsonforms-react-antd-renderers/src/cells/AntdCompositeCell.tsx),
[CompositeDetailDialog.tsx](../packages/jsonforms-react-antd-renderers/src/cells/CompositeDetailDialog.tsx),
[util/cellFrame.tsx](../packages/jsonforms-react-antd-renderers/src/util/cellFrame.tsx),
[util/compositeActions.ts](../packages/jsonforms-react-antd-renderers/src/util/compositeActions.ts),
[util/i18nDefaults.ts](../packages/jsonforms-react-antd-renderers/src/util/i18nDefaults.ts).

This area is close to the spec. Implemented:

- Cells dispatch through the cells registry; `CellFrame` supplies cell mode and
  compact validation state with the message on the feedback icon's
  `aria-label` as well as its tooltip.
- Transactional dialog: a cloned core, a scoped `dispatch`, Apply/Cancel,
  `draftRef`, pending-change flush on Apply and cancel on dismissal/unmount,
  and refusal to apply over an externally changed target
  (`composite.applyConflict`).
- `showEmptyButton` → Clear, with `preventsEmpty` checking `required`,
  `minProperties`, `minItems`, and `contains`/`minContains`.
- `okLabel` / `cancelLabel` / `emptyLabel` translated as keys with literal
  fallback.
- The full `composite.*` translation key set including the tooltip keys.
- Summary semantics: item counts, up-to-two scalar previews with
  `(+N more)`, and `composite.summary.unset`.
- A dedicated edit-icon button, with selectable summary text separate from it.

| Spec requirement | Status |
| --- | --- |
| `showRemoveButton` / `removeLabel` / `composite.removeTooltip` in the dialog footer | **Deliberate omission** — recorded in the repository's `CLAUDE.md`: removing a composite value is the cell's own hover action, so the footer is Clear / Cancel / Apply. The spec makes both opt-in, so this is a narrowing, not a contradiction |
| Destructive styling on Remove | Not applicable |
| Nested dialog Apply writes only to the enclosing draft | Needs verification |
| `restrict: false` allows emptying and reports errors | **Implemented** — `CompositeDetailDialog` gates `preventsEmpty` behind `options.restrict !== false` |

---

## 8. Implemented without a specification entry

These exist in the React packages and have no corresponding catalog entry. Each
needs either a spec entry or a decision to drop it.

| Item | Where | Note |
| --- | --- | --- |
| `options.columns` horizontal sizing | `horizontalLayout.ts` | A complete alternative to §6's `options.layout` model. Highest-priority reconciliation item |
| `options.trim` | `AntdInputText`, `AntdInputNumber`, `AntdInputInteger`, `AntdSelect`, `OneOfRenderer`, `NativeControl`, `InputControl` | The spec **explicitly excludes** the trim sizing option from the portable contract |
| `NativeControl` | `controls/NativeControl.tsx` | A second date/time renderer at rank 2 rendering `<Input type="date">`. No spec entry; competes with the picker controls |
| `OneOfTabRenderer` | `complex/OneOfTabRenderer.tsx` | Exported but **not registered** in `antdRenderers`. The spec records `options.variant: "tab"` for oneOf as a Vuetify-specific alternative, not portable |
| `NumberFormatCell` | `cells/NumberFormatCell.tsx` | No spec entry for a formatted-number cell |
| `showArrayTableSortButtons` / `showArrayLayoutSortButtons` | `TableControl`, `ArrayLayout` | Legacy aliases for `showSortButtons`; the spec defines only the one name |
| `childLabelProp` | `ArrayLayout`, `ListWithDetailRenderer` | Legacy alias for `elementLabelProp`; the spec says not to introduce an additional authoring alias |
| `options[':language']` | `editorControls.ts` | Monaco dynamic language as a data path. The spec assigns this to compatibility handling, with `$dynamic` as the portable path |
| `options.theme` / `options.mode` | Monaco | Editor appearance override; no spec entry |
| `options.width` / `options.height` on Monaco | Monaco | Coexists with the spec's `monaco.rows`/`autoGrow` sizing |
| `options.height` on AG Grid | AG Grid | Should be `gridHeight` |
| `options.disabled` on Button | `ButtonRenderer` | No spec entry; `rule`-driven enablement is the specified mechanism |
| TemplateLayout profiles | `TemplateLayoutRenderer` (jsx), `RactiveTemplateLayoutRenderer` (ractive) | **Resolved.** Both profiles are implemented and selected per element by their own testers: explicit `lang`, then `config.defaultTemplateLang`, then `ractive`. An unknown language is diagnosed rather than interpreted as another engine, and both engines are gated on `allowScriptEvaluation` — Ractive compiles each `{{ }}` through `new Function` too. `lang: vue` remains unimplemented. See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) |
| `format: "uri"` in the file control | `AntdFile` | Third storage convention alongside base64 and the `binary` data URL |
| `AntdCompositeCell` as a rank-1 fallback for any object/array cell | `cells/AntdCompositeCell.tsx` | Reasonable, and consistent with the spec's "Detail omitted → dispatch `{Control, scope:"#", label:false}`", but the fallback ranking itself is a local decision |

---

## 9. Shared behaviors: smaller findings

### 9.1 `hideRequiredAsterisk`

Honored only on array labels (`ArrayLayout`, `ListWithDetailRenderer`, via
`computeLabel`). Ordinary controls pass `required` straight to antd's
`Form.Item` through `ControlFormItem`, so the asterisk cannot be hidden on the
controls where authors most likely want it.

§18 defines it as a shared option resolved per control over a **top-level**
`config.hideRequiredAsterisk`, and states that these established names "do not
belong under jsonformsExtended". The same holds for
`showUnfocusedDescription` (§9.3). Both are Material/Vuetify conventions, so
Adjustment 1 of the adjustments register leaves them at the top level too. Our
`merge({}, config, uischema.options)` call in each control already reads them at
that flat position, so the resolution shape is right where the option is
honored at all.

Options that are *not* inherited conventions follow a different rule — see
[§9.9](#99-config-key-placement).

### 9.2 `trim` — **removed**, and diagnosed rather than ignored

~~Read in seven places to choose between `width: '100%'` and no width.~~
**Decided: removed** in favour of the shared sizing options, which is what the
portable contract intends — `options.layout.width` and `maxWidth` express the
same thing and compose with the rest of the model, where `trim` was a boolean
that could only mean one of two widths.

What remains is deliberate and is the part worth copying:

- **The option is still recognised, and reported.** `legacySizingDiagnostics`
  emits "`trim` is excluded by the portable contract; use
  `options.layout.width` or `maxWidth`" against any element that carries it.
  Deleting the check would make `trim` *silently* ignored, which is worse than
  unsupported: a form carrying it would lay out differently with nothing said.
  A family removing an option someone's schemas may already use should leave
  this behind.
- **It stays in the published JSON Schemas**, described as reserved and
  diagnosed rather than applied, so its absence is explicit rather than an
  oversight.

The same treatment covers `columns`, which the contract does not define and
Svelte does read.

### 9.3 `showUnfocusedDescription`

Implemented consistently through `isDescriptionHidden` in `InputControl`,
`NativeControl`, `OneOfRenderer` and `EnumArrayRenderer`. Matches the spec.

Note that these renderers show `errors` **or** `description`, never both. The
spec permits both together and requires that description visibility not suppress
errors — the current precedence (errors win) satisfies the requirement, but the
combined presentation the spec allows is not available.

### 9.4 Group data indicator

`useGroupState` implements `collapsible`, `collapsed` with re-synchronization
when the effective boolean changes, and `showDataIndicator` with the spec's
exact presence rules (false and zero count; missing, null, blank strings and
recursively empty containers do not).

The indicator's tooltip and localization, required by
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md), are **implemented**:
the marker is wrapped in a `Tooltip` triggered by hover and focus, is focusable,
and resolves `group.dataIndicator` through the translator, with one string
serving both the tooltip and the accessible name.

Its per-render cost has also been fixed: scope strings are split once per
element instead of per render, the item context is resolved once for the whole
subtree instead of once per Control, and the result is memoized on the data.
Measured 7.3x faster over 40 groups and 4.2x over 200 array items. See
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

One gap remains: **a non-boolean `collapsed` is coerced** by `=== true` rather
than producing a configuration diagnostic.

### 9.5 Categorization selection

`CategorizationLayout` filters categories by visibility, but:

- `safeCategory` compares `activeCategory` against
  `categorization.elements.length` (the **unfiltered** count) while indexing
  into the filtered `categories` array, so a hidden category can leave the index
  pointing past the end of the visible list.
- antd's `Tabs` receives `defaultActiveKey`, i.e. it is uncontrolled, so the
  computed `safeCategory` cannot actually drive the selection after the first
  render. The spec requires reselecting an available visible category when the
  active one becomes hidden.
- `options.initial` (a named `Category`) and `options.vertical` are not read in
  either the tabs or the stepper renderer.
- `CategorizationStepperLayout` indexes `categories[activeCategory].elements`
  without a bounds guard, which throws if visibility removes the active
  category.
- Next/Previous button text is hard-coded English rather than translated.

### 9.6 Shared initial focus

`options.focus` reaches `autoFocus` on most controls. The spec's lifecycle rules
(no repeated reclaiming on rerender, no revealing a hidden category or expanding
a collapsed panel) are inherited from React's `autoFocus` semantics and have not
been verified, particularly for repeated array items.

### 9.7 Shared clear-control behavior

`useClearAffordance` implements the spec's visibility contract well: the icon
appears only when there is a value **and** the control is hovered or focused,
with the two-flag arrangement keeping it visible when the pointer leaves while
focus remains. It is used by the color and duration controls and by
`AntdClearableInput`.

Gaps: `options.clearable` is only honored in `AntdInputText`,
`AntdInputNumber` and `AntdInputInteger` (`!== false`). The temporal pickers,
`AntdSelect`, `OneOfRenderer`, the checkbox and the toggle all use
`allowClear={enabled}` or no clear at all, so the option cannot opt out and the
hover/focus visibility rule does not apply there either.

### 9.8 Container validation indicators

`hideArraySummaryValidation` is unimplemented (recorded in §6.2, §6.3, §6.4 and
§7.2). `ValidationIcon` renders unconditionally in both
[ArrayToolbar.tsx](../packages/jsonforms-react-antd-renderers/src/layouts/ArrayToolbar.tsx)
and
[TableToolbar.tsx](../packages/jsonforms-react-antd-renderers/src/complex/TableToolbar.tsx).

One trap when implementing it: both toolbars receive `errors`, which in core's
array mapping is the **array's own** combined message, not `childErrors`.
Gating that icon on the option would suppress exactly what the specification
requires to stay visible — the option "suppresses the optional child-error
summary, not the array's own error explanation". Doing this correctly means
surfacing descendant errors as a separate summary first, which no React
renderer does today.

**Group and Category now have one.** `showValidationIndicator` is implemented
in `GroupLayout`, `CategorizationLayout` and `CategorizationStepperLayout`,
defaulting to off, using the shared ancestor index of
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) and the same subtree
traversal as the data indicator. See
[the indicator spec](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

Still missing for arrays: the option itself, `hideArraySummaryValidation`, and
the separation of the array's own errors from descendant errors that both
depend on. Pre-touch filtering is ignored by the implemented indicator, since
no touch state exists (§3.4).

### 9.9 Config key placement

Every config key the React renderers read today is a flat top-level key, via
`merge({}, config, uischema.options)`. Nothing reads a `jsonformsExtended`
block, which is consistent with §3.1: none of the namespaced configuration the
specification defines is implemented.

[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) sets the rule for
where a key belongs: core/Material/Vuetify conventions stay top level, portable
project extensions go under `jsonformsExtended`, and JSON Forms React Renderers-only settings go
under `jsonforms-react-renderers`. Per-element `uischema.options` stay flat in all three cases.

`JSONFORMS_EXTENDED_CONFIG_KEY`, `JSONFORMS_CONFIG_KEY` and the
`resolveExtendedOption` helper are implemented in
[configNamespaces.ts](../packages/jsonforms-react-extended-renderers/src/util/configNamespaces.ts).
Nothing consumes them yet.

The options this affects are classified in Adjustment 1 §1.6. The ones in the
`jsonforms-react-renderers` tier are the same entries listed in §8 of this document, and most are
candidates for removal rather than relocation. Relocating any key that authored
documents already use is a breaking change and needs the fallback sequence in
Adjustment 1 §1.7.

---

## 10. Test and example coverage

Existing coverage is substantial for the areas that were most recently built:

- **Well covered:** composite cells and their i18n, the composite dialog's
  action semantics, cell mode, cell error tooltips, AG Grid cells and reorder,
  the grid detail dialog, Monaco dynamic language and theming, the color
  control, `groupState`, forced tables, the additional-properties editor, the
  mixed tree, and a per-renderer contract suite.
- **Spec examples** now exist for 27 areas, each a folder under
  `@chobantonov/jsonforms-extended-spec/examples/` with a README
  naming the sections it covers and a test file asserting the behaviour it
  claims. Several of the fixes recorded above were found by writing one.
- **Demo examples** exist for collapsible groups, extended controls, file,
  horizontal sizing, presentation renderers, split layout and template layout.

Uncovered areas that correspond to the gaps above:

- No tests for `restrict` prevention on the table renderer, checkbox groups, or
  numeric bounds.
- ~~No tests for temporal schema bounds~~ — **fixed**: `temporalBounds.test.ts`
  and the calendar assertions in `temporalSaveFormats.test.tsx`. Still no tests
  for `showActions`, `views`, or the temporal `mask` toggle —
  `PickerInteraction.test.tsx` covers interaction, not constraints. (The
  generic masked string control is covered; see §2.3.)
- ~~No tests for the pending-edit contract outside the dialog (clear superseding
  a queued edit…)~~ — partly fixed: `debouncedClear.test.tsx` covers clear.
  Disposal, rebinding and external replacement are covered by
  `debouncedDisposal.test.tsx`. Blur flush remains untested **and**
  unimplemented; see
  [§3.10](#310-pending-edits-commit-timing-and-cancellation-18--partial).
- Twelve of the 27 spec examples still use item-hauling vocabulary, which
  the house rule excludes. Named in [the summary at the top](#outstanding-gaps-at-a-glance).
- ~~No tests for combinator data preservation (the oneOf enclosing-properties case
  and the anyOf tab-change case are both currently wrong and untested).~~ —
  **fixed**: `combinators.test.tsx` and `combinatorsExample.test.tsx`.
- No conformance vectors for any of §25's required areas (path grammar,
  prototype protection, URL policy, ICU subset, Markdown profiles, span
  formula, mixed sizing, wrap/auto-fit, hidden effective children, Spacer
  sizing, out-of-domain value preservation).

---

## 11. Suggested order of work

Grouped by what unblocks the most, rather than by renderer.

### Tier 1 — foundations other items depend on

1. Decide the layout model ([§3.2](#32-layout-sizing-model-67--implemented)):
   adopt `options.layout` or specify `columns`. Everything authored against
   §6–§7 depends on this.
2. `$dynamic` resolution layer and the `jsonformsExtended` configuration block
   ([§3.1](#31-dynamic-resolution-11--missing-entirely)).
3. A React-side validator integration ([§3.6](#36-extended-validator-profile-15--partial-was-missing-for-react)),
   including the `color`, `duration` and `password` formats and the `/#` alias.
4. ~~`additionalErrors` publication~~ — done for Monaco; the combined-validity integration
   ([§3.5](#35-renderer-published-additionalerrors--partial-was-missing)).

### Tier 2 — correctness defects in shipped renderers

5. ~~Slider zero-versus-default truthiness fallback~~ — done ([§4.4](#44-slider-control--partial)).
6. ~~Integer/number parsing truncation and the NaN guard~~ — done ([§4.3](#43-number-and-integer-controls--partial)).
7. ~~Boolean truthiness display of invalid values~~ — done ([§4.5](#45-boolean-checkbox-and-switch--partial)).
8. anyOf tab changes writing defaults ([§5.5](#55-anyof-renderer--implemented-was-partial)).
9. oneOf branch change discarding enclosing properties ([§5.4](#54-oneof-renderer--partial)).
10. ~~File control clearing the committed value on rejection~~ — done ([§6.6](#66-file-control--partial)).
11. ~~`onClear` not cancelling the pending debounce~~ — done ([§3.10](#310-pending-edits-commit-timing-and-cancellation-18--partial)).
12. ~~Radio group ignoring `enabled`~~ — done ([§5.2](#52-radio-choice-controls--partial)).

### Tier 3 — missing renderers

13. ~~Password control and password cell~~ — done.
14. Autocomplete choice control.
15. Categorization accordion.
16. ~~Link~~ — done.
17. ~~Chips and multi-select variants~~ — done.
18. ~~Masked string control~~ — done.
19. ~~Tuple control~~ — done.

### Tier 4 — option coverage on existing renderers

20. Temporal schema bounds, `showActions`, `views`, `mask`, `clearable`.
21. Monaco schema inference, schema association, and `propagateErrors`.
22. ~~Array option coverage: `initCollapsed`, `collapseNewItems`, `hideAvatar`,
    `hideArraySummaryValidation`~~ — done; table `restrict` remains.
23. ~~The shared confirmation policy~~ — done.
24. Numeric `step`, bounds and the incompatible-value hint.
25. Spacer `size`, Separator `vertical`, ImageView top-level fields and `scope`,
    Button `params`/`icon`/`color`/`script`/pending.
26. ~~Pre-touch error filtering~~ — done for controls; array/tuple summary
    participation remains. `hideRequiredAsterisk` on ordinary controls,
    Markdown and interpolation, diagnostics.

---

## 12. Reading this document after a fix

Entries are **struck through and marked fixed rather than deleted**. This file
is the checklist for reviewing a *different* renderer set — Svelte, Vue, a
native one — and a gap that has been closed here is exactly the gap most likely
to be open there. The strikethrough says "this was real, and here is what it
looked like"; the note after it says what the fix turned out to depend on.

**Status lives in the heading, so changing it breaks inbound anchors.** Five
links had already gone stale this way before anyone noticed — `#54-oneof-renderer--partial`
still pointing at a heading that now says something else. After re-titling an
entry, re-check the in-page links that point at it; GitHub's slug is the lowercased heading with
punctuation dropped and **one dash per space**, so `— **Implemented**` becomes
`--implemented`.

The ones most worth re-checking elsewhere, because each was silent:

| Finding | Symptom in a renderer set that has it |
| --- | --- |
| [§5.6a](#56a-the-enclosing-properties-were-not-rendered--fixed) `allOf` skips `CombinatorProperties` | A property declared beside an `allOf` has no input anywhere. Nothing errors. |
| [§7.7](#77-imageview--implemented-was-divergent) ImageView on `options.src` | A conformant element renders **no DOM at all**. |
| [§3.8](#38-url-policy-12--partial) `allowImageDataUrls` consulted by nothing | Setting the flag does nothing, and says nothing. |
| [§5.4](#54-oneof-renderer--partial) oneOf branch derived once | A discriminated `oneOf` shows the wrong branch's fields after its discriminator changes. |
| [§7.6](#76-action-button--implemented-was-partial) action derived from the label | The action name changes with the form's language. |
| [§3.6](#36-extended-validator-profile-15--partial-was-missing-for-react) `$data` unsupported | **Not** silent — it throws during store init and the whole application fails to mount, naming Ajv and not the schema. |
| [§2.4](#24-tuple-control--implemented) `prefixItems` under a draft-07 validator | A correct 2020-12 tuple either validates nothing or can never be valid. |
| [§3.12](#312-the-ui-librarys-own-locale-9--implemented) UI library locale never set | Month names and "Today" stay English; reads as a gap in the form's own translations. |
| [§5.6b](#56b-the-scalar-composition-single-editor-contract--fixed) scalar composition | A tab strip labelled `anyOf-0` over a single integer. |
| [§6.5a](#65a-the-default-save-formats-were-invalid--fixed) temporal save formats | A picker writes a value its own `format` rejects, and cannot repair it. |
| [§6.5e](#65e-restrict-cannot-reach-its-specified-default-through-the-flat-config--fixed-here-open-elsewhere) `restrict` default | Every preventive constraint silently off, because core seeds the flat config to `false`. |
| [§3.13](#313-the-renderer-sets-own-strings-did-not-follow-the-locale--fixed) renderer strings pinned to English | Every string the *renderer* owns stays English in every language, while the form's own labels translate. A guard that supplies a translator for every key cannot see it. |
| [§3.2](#32-layout-sizing-model-67--implemented) fallback `gap` of 0 | Every uischema ported from another family renders with its horizontal rows touching, and it reads as the author's mistake. |
| [§7.4](#74-duration-control--partial) duration components capped at 59 | A valid `PT90M` is clamped to `PT59M` as the user types it. The data is destroyed, silently. |
| [§4.4](#44-slider-control--partial) `aria-valuetext` on the wrapper | The attribute never reaches the DOM and the borrowed default position is announced as a committed number. Nothing warns. |
| [§3.10](#310-pending-edits-commit-timing-and-cancellation-18--partial) queued write outliving its target | An edit typed into a deleted array item lands on the item that took its place. Cancelling on unmount does **not** fix it: rows keyed by path are not unmounted when a sibling is deleted. |

## 13. Open questions

1. ~~**Core version.**~~ **Resolved:** the React packages now pin
   `3.9.0-alpha.1`, matching the Svelte families. Bracketed and numeric dynamic
   property keys work as a result, and dotted and empty keys are created and
   edited through an isolated editor — see
   [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
2. **`columns` versus `options.layout`.** Which encoding is authoritative for
   this renderer family? If both, which wins?
3. **antd's default choice searchability.** The spec notes Material defaults to
   autocomplete. What should antd default to when `options.autocomplete` is
   absent?
4. ~~**TemplateLayout profile.**~~ Resolved — both `jsx` and `ractive` ship,
   selected per element, and both are gated. See Adjustment 22. The original
   question was: Should the JSX/Sucrase profile be declared in the
   specification as a React profile (`lang: "jsx"`), replaced by a Ractive
   implementation, or removed? Either way, runtime compilation needs to be
   gated behind `allowScriptEvaluation`.
5. ~~**`trim`.**~~ **Resolved: removed**, in favour of the shared sizing
   options. The option is still *recognised* and reported through
   `legacySizingDiagnostics`, so a form carrying it is told what to use
   instead rather than having it silently ignored. See
   [§9.2](#92-trim--removed-and-diagnosed-rather-than-ignored).
6. **`NativeControl`.** Retain as a documented fallback, or remove now that
   picker-based temporal controls exist?
7. **Timezone options.** §18's timezone section is marked PROVISIONAL. Confirm
   it is out of scope for the current round before anyone implements it.
8. **Container validation indicators.** Should the shared option proposed in
   [jsonforms-container-validation-indicator-spec.md](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md)
   be adopted, extending header error indicators to Group and Categorization
   with a global switch, or should we implement only the array-scoped
   `hideArraySummaryValidation` the portable specification already defines?

## Reference adapter audit transferred from the spec project

These findings record the original audit state, not a fresh certification of
the current implementation. Reconcile them with fixes recorded above.

### Implementation differences

| Finding | Evidence and consequence |
| --- | --- |
| Config namespace consumption is uneven | The follow-up audit removed unconsumed namespace declarations. Published config paths now identify actual readers. Namespaced equivalents remain a possible adapter change, not a current feature. |
| Core read-only support exceeds adapter verification | Core `mappers/util.ts` and `mappers/cell.ts` use `separateReadonlyFromDisabled`. Several renderer paths rely on enabled state; mutation guards and presentation need adapter tests before enabling separation throughout a form. |
| Restrict resolution differs by control | Core seeds flat `restrict: false`. Array/property controls read flat merged settings; temporal `effectiveRestrict` ignores the flat key and resolves local options, then `jsonformsExtended.restrict`, then true. Both actual inputs are documented. The portable uniform contract still requires host/adapter work. |
| Vendor settings are intentionally open | Monaco's `options` and AG Grid's option bag are third-party APIs, not a complete portable schema vocabulary. This audit does not certify each vendor property or callback. |
| Unknown options remain accepted | `additionalProperties: true` preserves extension interoperability. Passing validation does not prove a misspelled or unrecognized option works. |
| Dynamic overlays and pending integration remain incomplete | See [TODO.md](TODO.md); retained design text is not evidence of current implementation. |

No source renderer implementation was changed by this audit. These runtime gaps
are recorded instead of treating schema acceptance as proof of support.


### Configuration property review

The first audit inferred too much from a renderer merging `config` with local
options. A merge does not establish that later code reads a particular key,
and a single specialized consumer does not establish a shared global default.
This follow-up traces **all 113 previously declared paths**, including nested
objects and Monaco members. It removes 30 declarations and adds 9 confirmed
paths at their consumed location, leaving 92 declared paths. These counts include
container properties, not just scalar settings.

The complete evidence record is
[config-consumption.json](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/conformance/config-consumption.json). Its evidence paths
are relative to the source checkout identified above. A coverage test requires
every published named config path to have a record, and checks that removed paths
are no longer declared. Unknown extension keys remain accepted; absence from the
vocabulary does not mean `additionalProperties` has become false.

### Field-specific options

- `elementLabelProp`: local in ArrayLayout; ListWithDetail exceptionally reads
  a merged default. Author the data path on the control.
- `childLabelProp`: local ArrayLayout fallback only.
- `detail`: core lookup and composite cells read local options. Tuple position
  layout exceptionally reads merged options. A detail UI schema belongs to the
  control whose schema its scopes address.
- `summary`: local tuple/composite-cell options.
- `cells`: local in the base table; the grid exceptionally reads merged options.
  Keep column-specific overrides on the array control.

### Merge behavior

The scalar precedence claim needs care for compound values. Base renderers often
use `lodash.merge`, which merges arrays by index; an empty local suggestions,
views or pre-touch-keyword list does not necessarily clear a global list. Monaco
and AG Grid use shallow spreads: a local `monaco` or `agGridOptions` object replaces
the global bag wholesale. The previously advertised recursive grid merge is not
the current implementation. The intended portable merge contract remains adapter
work; these schemas describe the actual accepted shapes and locations.

### Every reviewed path

`Consumed` means a traced reader exists; it does not mean every renderer uses the
setting. `Core` means core consumes it but renderer support varies. `Core default
only` identifies legacy `trim`. Removed paths have their local or alternate
location explained in the evidence record.

| Config path | Source finding | Declared now |
| --- | --- | --- |
| `config.:language` | Consumed | Yes |
| `config.agGridOptions` | Consumed | Yes |
| `config.allowAdditionalPropertiesIfMissing` | Consumed | Yes |
| `config.allowEmptyPropertyNames` | Consumed | Yes |
| `config.ampm` | Consumed | Yes |
| `config.autocomplete` | Consumed | Yes |
| `config.cancelLabel` | Consumed | Yes |
| `config.childLabelProp` | Local only | No |
| `config.clearable` | Consumed | Yes |
| `config.collapseNewItems` | Consumed | Yes |
| `config.convertJson` | Consumed | Yes |
| `config.dateFormat` | Consumed | Yes |
| `config.dateSaveFormat` | Consumed | Yes |
| `config.dateTimeFormat` | Consumed | Yes |
| `config.dateTimeSaveFormat` | Consumed | Yes |
| `config.defaultTemplateLang` | Consumed | Yes |
| `config.detail` | Renderer specific | No |
| `config.disableAdd` | Consumed | Yes |
| `config.disableRemove` | Consumed | Yes |
| `config.elementLabelProp` | Renderer specific | No |
| `config.enableFilterErrorsBeforeTouch` | Consumed | Yes |
| `config.filterErrorKeywordsBeforeTouch` | Consumed | Yes |
| `config.focus` | Consumed | Yes |
| `config.height` | Consumed | Yes |
| `config.hideArraySummaryValidation` | Consumed | Yes |
| `config.hideAvatar` | Consumed | Yes |
| `config.hideRequiredAsterisk` | Consumed | Yes |
| `config.initCollapsed` | Consumed | Yes |
| `config.jsonformsExtended` | Container | Yes |
| `config.jsonformsExtended.accept` | Unsupported location | No |
| `config.jsonformsExtended.agGridOptions` | Unsupported location | No |
| `config.jsonformsExtended.allowAdditionalPropertiesIfMissing` | Unsupported location | No |
| `config.jsonformsExtended.allowEmptyPropertyNames` | Unsupported location | No |
| `config.jsonformsExtended.cancelLabel` | Unsupported location | No |
| `config.jsonformsExtended.cells` | Unsupported location | No |
| `config.jsonformsExtended.collapsed` | Consumed | Yes |
| `config.jsonformsExtended.collapsible` | Consumed | Yes |
| `config.jsonformsExtended.colorSaveFormat` | Consumed | Yes |
| `config.jsonformsExtended.colorTextEntry` | Consumed | Yes |
| `config.jsonformsExtended.confirmation` | Consumed | Yes |
| `config.jsonformsExtended.confirmation.default` | Consumed | Yes |
| `config.jsonformsExtended.confirmation.renderers` | Consumed | Yes |
| `config.jsonformsExtended.confirmation.renderers.*.branchChange` | Consumed | Yes |
| `config.jsonformsExtended.confirmation.renderers.*.delete` | Consumed | Yes |
| `config.jsonformsExtended.confirmation.renderers.*.typeChange` | Consumed | Yes |
| `config.jsonformsExtended.convertJson` | Unsupported location | No |
| `config.jsonformsExtended.defaultTemplateLang` | Consumed | Yes |
| `config.jsonformsExtended.dynamicValues` | Consumed | Yes |
| `config.jsonformsExtended.dynamicValues.enabled` | Consumed | Yes |
| `config.jsonformsExtended.emptyLabel` | Unsupported location | No |
| `config.jsonformsExtended.height` | Unsupported location | No |
| `config.jsonformsExtended.initial` | Unsupported location | No |
| `config.jsonformsExtended.language` | Unsupported location | No |
| `config.jsonformsExtended.layoutDefaults` | Consumed | Yes |
| `config.jsonformsExtended.layoutDefaults.gap` | Consumed | Yes |
| `config.jsonformsExtended.layoutDefaults.gridColumns` | Consumed | Yes |
| `config.jsonformsExtended.layoutDefaults.minItemWidth` | Unsupported location | No |
| `config.jsonformsExtended.layoutDefaults.wrap` | Consumed | Yes |
| `config.jsonformsExtended.markup` | Consumed | Yes |
| `config.jsonformsExtended.markup.markdown` | Consumed | Yes |
| `config.jsonformsExtended.markup.markdown.enabled` | Consumed | Yes |
| `config.jsonformsExtended.markup.markdown.profile` | Consumed | Yes |
| `config.jsonformsExtended.markup.typography` | Consumed | Yes |
| `config.jsonformsExtended.monaco` | Unsupported location | No |
| `config.jsonformsExtended.monaco.autoGrow` | Unsupported location | No |
| `config.jsonformsExtended.monaco.initActions` | Unsupported location | No |
| `config.jsonformsExtended.monaco.maxRows` | Unsupported location | No |
| `config.jsonformsExtended.monaco.minRows` | Unsupported location | No |
| `config.jsonformsExtended.monaco.options` | Unsupported location | No |
| `config.jsonformsExtended.monaco.rows` | Unsupported location | No |
| `config.jsonformsExtended.okLabel` | Unsupported location | No |
| `config.jsonformsExtended.propagateErrors` | Consumed | Yes |
| `config.jsonformsExtended.resizable` | Unsupported location | No |
| `config.jsonformsExtended.restrict` | Consumed | Yes |
| `config.jsonformsExtended.security` | Consumed | Yes |
| `config.jsonformsExtended.security.allowScriptEvaluation` | Consumed | Yes |
| `config.jsonformsExtended.security.urlPolicy` | Consumed | Yes |
| `config.jsonformsExtended.security.urlPolicy.allowImageDataUrls` | Consumed | Yes |
| `config.jsonformsExtended.security.urlPolicy.allowRelative` | Consumed | Yes |
| `config.jsonformsExtended.security.urlPolicy.allowedSchemes` | Consumed | Yes |
| `config.jsonformsExtended.showActions` | Unsupported location | No |
| `config.jsonformsExtended.showBorder` | Unsupported location | No |
| `config.jsonformsExtended.showDataIndicator` | Consumed | Yes |
| `config.jsonformsExtended.showEmptyButton` | Unsupported location | No |
| `config.jsonformsExtended.showValidationIndicator` | Consumed | Yes |
| `config.jsonformsExtended.showValidationIndicatorCount` | Consumed | Yes |
| `config.jsonformsExtended.table` | Unsupported location | No |
| `config.jsonformsExtended.width` | Unsupported location | No |
| `config.language` | Consumed | Yes |
| `config.mode` | Consumed | Yes |
| `config.monaco` | Consumed | Yes |
| `config.monaco.autoGrow` | Consumed | Yes |
| `config.monaco.initActions` | Consumed | Yes |
| `config.monaco.maxRows` | Consumed | Yes |
| `config.monaco.minRows` | Consumed | Yes |
| `config.monaco.options` | Consumed | Yes |
| `config.monaco.rows` | Consumed | Yes |
| `config.multi` | Consumed | Yes |
| `config.okLabel` | Consumed | Yes |
| `config.placeholder` | Consumed | Yes |
| `config.propagateErrors` | Consumed | Yes |
| `config.readOnly` | Core | Yes |
| `config.readonly` | Core | Yes |
| `config.resizable` | Consumed | Yes |
| `config.restrict` | Consumed | Yes |
| `config.separateReadonlyFromDisabled` | Core | Yes |
| `config.showActions` | Consumed | Yes |
| `config.showArrayLayoutSortButtons` | Consumed | Yes |
| `config.showArrayTableSortButtons` | Consumed | Yes |
| `config.showBorder` | Consumed | Yes |
| `config.showNavButtons` | Consumed | Yes |
| `config.showSortButtons` | Consumed | Yes |
| `config.showUnfocusedDescription` | Consumed | Yes |
| `config.suggestion` | Consumed | Yes |
| `config.summary` | Local only | No |
| `config.theme` | Consumed | Yes |
| `config.timeFormat` | Consumed | Yes |
| `config.timeSaveFormat` | Consumed | Yes |
| `config.trim` | Core default only | Yes |
| `config.vertical` | Consumed | Yes |
| `config.views` | Consumed | Yes |
| `config.width` | Consumed | Yes |
