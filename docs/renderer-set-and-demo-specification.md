# Renderer Set and Demo Application Specification

## 1. Purpose

This document is the implementation and acceptance specification for every
renderer set and renderer demo in this repository. It is intended to make a
new UI-library integration predictable: the JSON Forms behavior and demo
features remain consistent, while the visual language and component APIs come
from the selected UI library.

The specification has two distinct contracts:

1. The **demo application contract** defines the common application structure,
   navigation, editors, settings, responsive behavior, and React/Web Component
   switching.
2. The **renderer contract** defines how JSON Schema, UI Schema, data,
   validation, and configuration must map to controls from a UI library.

The UI library is the source of truth for component appearance, interaction,
and API usage. Existing JSON Forms demos, especially the Svelte Shadcn demo,
are reference implementations for feature coverage and overall information
architecture; they are not a reason to replace native library components with
generic imitations.

## 2. Normative language

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** describe requirements:

- **MUST**: required for acceptance.
- **MUST NOT**: prohibited.
- **SHOULD**: expected unless a documented UI-library limitation prevents it.
- **MAY**: optional behavior.

## 3. Core principles

### 3.1 UI-library fidelity

- Renderers MUST use the actual components and documented composition patterns
  of the selected UI library.
- Components copied or generated from an upstream component repository, such
  as Shadcn components, MUST remain recognizable upstream components.
- A renderer set MUST NOT substitute native HTML controls or a simplified
  internal component set when the UI library provides the corresponding
  component. This includes date, time, date-time, select, dialog, popover,
  tabs, buttons, checkboxes, and similar controls.
- Thin integration code is allowed where JSON Forms and the UI library have
  different event or value contracts. Such integration belongs in the
  renderer that needs it or in a clearly named utility. It MUST NOT become a
  parallel, simplified UI component library.
- The UI library's accessibility model, focus behavior, keyboard behavior,
  variants, sizing, theming, and portal behavior SHOULD be preserved.

### 3.2 File ownership and structure

- Every renderer MUST have its own file.
- Every reusable UI component MUST have its own file.
- Unrelated renderers or UI components MUST NOT be collapsed into a single
  component-set or adapter file.
- Index files MAY contain exports and registry entries only. They MUST NOT hide
  renderer implementations.
- Shared behavior MAY be placed in focused utility files when it is genuinely
  shared and has tests.

### 3.3 Behavioral parity

- All renderer sets MUST interpret the same schema, UI Schema, configuration,
  and data with equivalent semantics.
- Visual presentation SHOULD follow the UI library, but switching renderer
  sets MUST NOT change the data shape.
- Rendering MUST NOT initialize a value with the wrong JSON type. For example,
  an `allOf` object MUST NOT be treated as an array merely because it has no
  direct `type` property.
- React and Web Component modes MUST render the same renderer registry and
  expose the same form behavior.

## 4. Workspace architecture

Each UI integration SHOULD have four independently owned projects:

```text
packages/
  jsonforms-react-<ui>-renderers/
  jsonforms-react-<ui>-extended-renderers/
  jsonforms-react-<ui>-webcomponent/
apps/
  jsonforms-react-<ui>-demo/
```

The shared and aggregate projects are:

```text
packages/jsonforms-react-demo-common/       Shared demo state and contracts
packages/jsonforms-react-extended-renderers/ Shared optional behavior
apps/jsonforms-react-examples-app/           Selector for all renderer demos
```

Requirements:

- Each UI library MUST have its own demo application under `apps/`.
- The aggregate examples application MUST link to or embed each independently
  built demo; it MUST NOT merge all renderer demos into one bundle.
- Renderer packages MUST remain usable without the demo application.
- Extended renderers MUST remain a separate optional registry.
- The Web Component package MUST use the same base and extended renderer
  registries as the React demo.

## 5. Tooling contract

- Applications and libraries MUST build with Vite.
- Tests MUST run with Vitest.
- New Rollup configuration files MUST NOT be introduced. Vite's internal use
  of Rollup is an implementation detail and does not require a separate
  `rollup.config` file.
- A demo MUST provide at least these scripts:

  ```json
  {
    "dev": "vite dev",
    "build": "pnpm run check && vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  }
  ```

- A renderer package with tests MUST provide `test: vitest run` and a
  `vitest.config.mts` file.
- Vite's normal development port SHOULD be used unless the caller supplies a
  port or the port is unavailable.
- The repository lockfile MUST be updated whenever dependencies change.

## 6. Demo application layout

### 6.1 Desktop information architecture

The desktop application follows this structure:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Menu  Library logo + JSON Forms <UI> React      View/tools/settings │
├───────────────┬──────────────────────────────────────────────────────┤
│ Search        │ Example title                                        │
│               │ ┌──────────────────────────────────────────────────┐ │
│ Example list  │ │ Demo and Data | Schema | UI Schema | ... Config │ │
│               │ ├──────────────────────────────────────────────────┤ │
│ Active item   │ │ JSON Forms                         Actions        │ │
│ highlighted   │ │ ┌────────────────────────┬─────────────────────┐ │ │
│               │ │ │ Demo form              │ Data editor         │ │ │
│ Scrolls       │ │ │                        │ Reload / Apply      │ │ │
│ independently │ │ └────────────────────────┴─────────────────────┘ │ │
│               │ └──────────────────────────────────────────────────┘ │
└───────────────┴──────────────────────────────────────────────────────┘
```

- The header MUST remain fixed at the top.
- The header's left group MUST contain the sidebar toggle, library mark, and
  demo name. Activating the brand returns to the demo home page.
- The header's right group MUST contain compact, accessible tool actions.
- The example sidebar MUST begin below the header, remain fixed on desktop,
  and scroll independently from the workspace.
- Opening the sidebar MUST shift the desktop workspace rather than cover it.
- The workspace MUST begin below the fixed header and provide enough padding
  that content never sits underneath it.
- The current example title MUST appear above the tabbed work area.
- The tabbed work area MUST be visually contained using the UI library's card,
  panel, surface, or equivalent component.

### 6.2 Header tools

The header MUST provide, in this logical order:

1. Form-only/full-UI toggle.
2. React/Web Component toggle when a Web Component is available.
3. Repository link.
4. Theme customization/settings entry points.

The React/Web Component toggle is a top-level application action. It MUST NOT
also appear in the settings panel.

Each icon-only action MUST have an accessible name, tooltip or title, pressed
state where applicable, and visible keyboard focus.

### 6.3 Sidebar

- The sidebar MUST contain a search field above the example list.
- Search MUST filter examples by label without changing the active form data.
- The active example MUST be visually distinct.
- Long labels MUST wrap rather than overflow.
- Selecting an example MUST update the URL hash so examples are deep-linkable.
- An empty search result MUST display a useful message.
- The menu button MUST be able to hide and restore the sidebar.

### 6.4 Responsive behavior

- On narrow screens, the sidebar MUST become an overlay/drawer with a
  dismissible backdrop.
- The main workspace MUST use the full viewport width when the sidebar is
  closed or when form-only mode is active.
- Header branding MAY hide its text on very narrow screens, but the library
  mark and accessible name MUST remain.
- Tab lists MAY scroll horizontally; tab labels MUST NOT be compressed into
  unreadable text.
- The side-by-side demo/data layout MUST stack when the available width cannot
  support both panes.
- Forms MUST not introduce page-level horizontal scrolling at supported
  viewport widths.

## 7. Demo views and behavior

### 7.1 Home view

The home view MUST include:

- the library logo or mark;
- a clear `JSON Forms React <UI library>` title;
- the `More Forms. Less Code.` tagline;
- an action that opens the first example.

Logos MUST remain legible in light and dark mode. SVGs that use
`currentColor` SHOULD be rendered inline when theme inheritance is required.

### 7.2 Example workspace

The workspace MUST expose these tabs:

- Demo or Demo and Data
- Schema
- UI Schema
- UI Schemas
- Internationalization
- Config
- Data, when Data is not already visible beside the demo

The Demo tab label MUST display the current validation error count when the
count is greater than zero.

Example-specific actions MUST appear on the same row as the `JSON Forms`
heading and MUST use the selected UI library's buttons.

### 7.3 Demo and Data layout

The preferred desktop layout starts at approximately 75% form and 25% data
editor:

- The form is on the inline-start side.
- The live data editor is on the inline-end side.
- The two panes MUST use the selected UI library's splitter or resizable-panel
  component. A fixed grid is not sufficient when both panes are visible.
- The splitter MUST let the user drag the divider to give either the form or
  the data editor the larger visible area.
- The splitter SHOULD start at 75% form and 25% data, and each pane SHOULD keep
  a usable minimum size rather than allowing its content to disappear.
- The resize handle MUST be visually discoverable and keyboard accessible when
  the UI library supports keyboard resizing.
- The panes are separated by the splitter's library-native handle and styling.
- RTL mode MUST reverse the inline direction naturally.
- At narrow viewport widths the panes MAY stack vertically. In the stacked
  layout the resize handle MUST be removed unless a vertical splitter remains
  useful and accessible.
- The data editor MUST provide reload and apply actions.
- Reload and Apply MUST use the selected UI library's icon buttons. Each action
  MUST provide a tooltip and an accessible name.
- Editing JSON does not update the form until Apply is activated.
- Reload restores the editor text from the selected example's original data;
  it does not change the active form until Apply is activated.
- Form changes MUST update the data model and validation count.

### 7.4 JSON editors

- Schema, UI Schema, UI Schemas, Internationalization, Config, and Data MUST
  use a JSON-aware editor.
- Editors MUST follow the active light/dark mode.
- Every editor view MUST provide Reload and Apply behavior.
- Invalid JSON MUST not silently replace the current working model. The demo
  SHOULD show a useful parse error.
- Applying one editor MUST update only the corresponding JSON Forms property.

### 7.5 Form-only mode

- Form-only mode MUST hide demo chrome that is not part of the rendered form,
  including the sidebar, example title, tabs, data pane, and settings panel.
- The form MUST retain the selected theme, direction, locale, validation mode,
  configuration, provider settings, and current data.
- Leaving form-only mode MUST restore the previous example and state.

## 8. Settings specification

Settings MUST appear in an end-side drawer or equivalent UI-library overlay.
The overlay MUST have a heading, concise explanation, close action, scrollable
content, focus management, and a dismissible backdrop.

### 8.1 Common settings

Every demo MUST support:

| Setting     | Values/default                                      | Required behavior                                                            |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Mode        | System, Light, Dark; default System                 | System follows `prefers-color-scheme`; editors and forms update immediately. |
| Direction   | LTR, RTL; default LTR                               | Applies to shell, form, overlays, and Web Component.                         |
| Locale      | English, German, Bulgarian, browser locale          | Updates JSON Forms internationalization without resetting data.              |
| Validation  | Validate and show, Validate and hide, No validation | Maps directly to JSON Forms validation modes.                                |
| Demo Layout | Default, Demo and Data                              | Changes presentation only.                                                   |
| Restrict    | Default on                                          | Enforces schema length, array size, and related restrictions.                |
| Read-only   | Default off                                         | Disables mutation while preserving readable values and navigation.           |

The common options section MUST also expose:

- Hide Required Asterisk
- Show Unfocused Description
- Collapse New Array Items
- Hide Array Summary Validation
- Collapse Arrays Initially
- Hide Array Item Avatar
- Enable Filter Errors Before Touch
- Filter Error Keywords Before Touch
- Allow Additional Properties By Default

Option names and descriptions SHOULD remain consistent across demos.

### 8.2 UI-library settings

Each renderer demo MAY add provider or theme settings specific to its library,
for example accent color, density, component size, border radius, or theme
algorithm.

- These settings MUST use the UI library's supported provider or token API.
- They MUST affect React and Web Component views equivalently.
- Defaults MUST produce a recognizable standard theme for that library.
- Customization MUST not alter schema semantics or data.

## 9. Renderer behavior contract

### 9.1 Common control anatomy

Every control SHOULD use this visual order:

1. Label and required indicator.
2. Input/control.
3. Description or helper text.
4. Validation message.

Requirements:

- Labels MUST be programmatically associated with controls.
- Required indicators MUST reflect JSON Schema requirements and respect
  `hideRequiredAsterisk`.
- Descriptions MUST use UI Schema or schema descriptions and respect the
  unfocused-description option.
- Validation messages MUST be associated through `aria-describedby` or the UI
  library's equivalent accessibility API.
- Invalid, focused, disabled, and read-only states MUST use the UI library's
  standard styling.
- Hidden controls MUST not render.
- Disabled controls MUST not emit changes.
- Clearing an optional value SHOULD produce `undefined` unless JSON Forms or
  the schema requires a different representation.
- Renderers MUST call `handleChange` with the correct JSON Forms path and value
  type.

#### 9.1.1 Clear actions

Editable controls that can hold a scalar or textual value SHOULD provide a
compact icon-only Clear value action. This includes, where applicable, text
inputs, textareas, password and masked inputs, number and integer inputs,
date/time inputs, editable comboboxes, enum dropdowns, one-of enum dropdowns,
full `oneOf` selectors, and mixed-type selectors.

- Clearability SHOULD be enabled by default and MAY be disabled with the
  applied `clearable` option or an equivalent documented renderer option.
- The Clear value action MUST exist only when the control currently has data.
  Empty string, `undefined`, and `null` normally count as empty; a valid false
  or zero value MUST still count as data.
- The icon SHOULD be visually revealed when the control or its wrapper has
  focus, when its selection UI is active, or when the pointer hovers over it.
  It SHOULD remain hidden at other times so it does not compete with the
  primary input. Touch and keyboard users MUST still be able to reveal and
  activate it without hover.
- The action MUST use the UI library's recognizable clear/close icon, have an
  accessible name such as `Clear value`, and preserve visible keyboard focus.
- Activating Clear MUST NOT accidentally open a dropdown, submit the form, or
  move focus away before the clear operation is committed. Inputs SHOULD
  reserve sufficient inline-end padding so the icon never covers their value
  or a dropdown indicator.
- Disabled and read-only controls MUST NOT expose an active Clear action.
- Clearing normally emits `undefined`, removing an optional object property.
  A renderer MAY use a type-specific empty value only when required by the
  established JSON Forms behavior, for example to preserve a dynamic property
  key while clearing its value.
- A required control MAY still be cleared unless the selected UI library has a
  documented restriction. The resulting empty value MUST expose the normal
  required validation state; the renderer MUST NOT immediately restore the
  previous value or silently choose a replacement.

### 9.2 Primitive controls

The base renderer set MUST cover:

- string and multiline string;
- number and integer;
- boolean checkbox;
- boolean toggle when selected by UI Schema options;
- enum select;
- radio group where supported/configured;
- slider where supported/configured;
- labels and static text;
- null and mixed types, when included in the renderer set.

Numeric controls MUST preserve numeric values rather than returning strings.
Integer controls MUST prevent or reject fractional values according to the UI
library and JSON Forms conventions.

Enum controls MUST preserve the original option values, including numeric and
boolean enum values, and MUST display translated labels when available.

Selection controls MUST represent an absent value as genuinely unselected:

- When data is `undefined`, `null`, or the renderer's established empty value,
  the trigger MUST show a placeholder and MUST NOT preselect the first item.
- Merely rendering or opening a dropdown MUST NOT initialize form data.
- A schema or application default MAY appear selected only after that default
  has actually been applied to the JSON Forms data model.
- Required state MUST NOT cause implicit selection. An unselected required
  dropdown remains unselected and displays its required validation error.
- These rules apply to enum and one-of enum controls, full `oneOf` or variant
  selectors, mixed-type selectors, and other single-selection controls.

### 9.3 Date and time controls

- Date, time, and date-time formats MUST use the UI library's real picker
  components when they exist.
- Native `input[type=date]`, `input[type=time]`, or
  `input[type=datetime-local]` MUST NOT be used merely as a shortcut when the
  UI library provides a picker.
- Date values MUST remain `YYYY-MM-DD` strings.
- Time values MUST retain the precision required by the schema/example.
- Date-time values MUST use the project's established ISO representation.
- Picker popovers MUST be keyboard accessible and correctly themed.
- Clear actions MUST be available for optional values.
- Date-time controls SHOULD present date and time selection in one coherent
  popover or workflow.

#### 9.3.1 Display and storage formats

Date, time, and date-time controls MUST support distinct display and storage
formats supplied through the applied UI Schema options. The established option
names are:

| Schema format | Display option   | Storage option       |
| ------------- | ---------------- | -------------------- |
| `date`        | `dateFormat`     | `dateSaveFormat`     |
| `time`        | `timeFormat`     | `timeSaveFormat`     |
| `date-time`   | `dateTimeFormat` | `dateTimeSaveFormat` |

The display option controls how the value appears in the input and picker. The
storage option controls the string emitted to JSON Forms through
`handleChange`. For example, a date may be displayed as `MM/DD/YYYY` while the
data model stores `YYYY-MM-DD`.

- Renderers MUST read these values from the applied UI Schema options, including
  the renderer configuration merged by JSON Forms.
- A configured display format MUST be used for visible text, placeholder or
  input parsing, picker precision, and 12/24-hour presentation where relevant.
- A configured save format MUST be used whenever picker selection or valid
  typed input updates the data model.
- Existing data MUST be parsed using at least the configured save format, the
  configured display format, and the canonical JSON Schema formats supported
  by the renderer. A renderer MUST therefore display previously stored values
  even when display and save formats differ.
- Locale-specific display formats MAY expand localized tokens, but changing the
  locale MUST NOT silently rewrite the stored value or change its storage
  format.
- Seconds, fractional seconds, AM/PM, and time-zone offsets MUST be preserved
  when required by the configured formats. A renderer MUST NOT introduce an
  unintended local/UTC conversion.
- Incomplete or invalid typed input MUST NOT be serialized as a different valid
  value. The renderer SHOULD retain the editable text or expose validation
  feedback until the value can be parsed according to the display format.
- Clearing an optional control MUST use the renderer set's established JSON
  Forms clear value and MUST NOT emit a formatted representation of an invalid
  date.
- When no save format is configured, the renderer MUST use the JSON Forms
  default storage format for the corresponding schema format. When no display
  format is configured, it SHOULD use the UI library's locale-aware default or
  the renderer set's documented default without changing storage semantics.
- Controls and cells for the same schema format MUST implement equivalent
  parsing and serialization behavior.
- React and Web Component modes MUST honor the same display and save options.

The renderer set MUST document which formatting token syntax it accepts. If
the UI library uses a different token system, the integration layer MUST map
the established UI Schema option values consistently or document the supported
syntax without changing the option names.

### 9.4 Objects and groups

- Object properties MUST render as object fields, never as an array or generic
  mixed-type selector.
- Generated object UI Schemas SHOULD use a vertical layout unless the example
  or registered UI Schema requests another layout.
- A named nested object SHOULD have a visible group/card title.
- Root objects SHOULD avoid redundant outer titles and borders.
- Object controls MUST support dynamic properties governed by `properties`,
  `patternProperties`, `additionalProperties`, and `propertyNames`.

### 9.5 Arrays

- Arrays MUST display a clear title and add action.
- Array items MUST have stable paths and keys.
- Add MUST create a schema-valid default item of the correct type.
- Remove MUST target the intended indexes and respect `minItems` when
  `restrict` is enabled.
- Add MUST respect `maxItems` when `restrict` is enabled.
- Object-array items SHOULD expose a useful label when an element-label
  property is configured.
- Detail, list-with-detail, table/grid, and primitive-array presentations MUST
  preserve identical array data semantics.
- Collapse and summary-validation options MUST behave consistently.

### 9.6 Dynamic object properties

Dynamic object-property support includes `patternProperties` and
`propertyNames`; it is not limited to the `additionalProperties` keyword. The
renderer MUST provide:

- a `Property Name` input and compact add icon/action;
- an inline, translated validation message for invalid, empty, or duplicate
  names;
- one rendered value control per dynamic property;
- compact rename and delete icon actions aligned with the property;
- a UI-library dialog for rename confirmation;
- restrictions for `required`, `minProperties`, `maxProperties`, read-only
  state, and `additionalProperties: false`;
- support for `allowAdditionalPropertiesIfMissing`.

Actions SHOULD use recognizable add, edit, and delete icons rather than large
text buttons when the UI library's pattern is icon-based.

#### 9.6.1 Property-name validation

- The `propertyNames` schema MUST validate names entered by both Add and Rename.
  The complete schema MUST be honored, not only its `pattern`; this includes
  constraints such as `minLength`, `maxLength`, `format`, `enum`, `const`, and
  composed schemas when supported by the configured AJV.
- A `$ref` in `propertyNames` MUST resolve against the root schema.
- Property-name validation MUST reuse the parent JSON Forms AJV instance so
  custom formats, keywords, draft behavior, and AJV options remain consistent.
- A name already present in the object MUST be rejected, except that a Rename
  operation may retain its current name until a different name is committed.
- Names that cannot be represented safely by JSON Forms' data-path syntax MUST
  be rejected with a useful error instead of writing to the wrong path.
- When `additionalProperties` is `false` and `patternProperties` is present,
  Add and Rename MUST accept names matching at least one allowed pattern and
  reject names matching none. Explicit `propertyNames` constraints still
  apply.
- Validation errors produced by `propertyNames` MUST use the configured JSON
  Forms error translator where available.

For example, the following object accepts keys such as `string_title` and
`number_count`, renders a different value control for each prefix, and rejects
every other dynamic key:

```json
{
  "type": "object",
  "propertyNames": {
    "pattern": "^(string|number)_[A-Za-z0-9_]+$"
  },
  "patternProperties": {
    "^string_": { "type": "string" },
    "^number_": { "type": "number" }
  },
  "additionalProperties": false
}
```

`patternProperties` keys are regular expressions rather than literal prefixes
or glob expressions. They are not implicitly anchored, so schema authors must
use `^` and `$` when a full-name match is intended.

#### 9.6.2 Selecting the dynamic value schema

For each property name, the renderer MUST determine the value schema according
to JSON Schema semantics:

1. A schema in `properties` applies to an explicitly declared name. Declared
   names are reserved and MUST NOT also appear as additional-property rows.
2. Every schema in `patternProperties` whose regular expression matches the
   property name applies. If several patterns match, all matching constraints
   MUST be composed; selecting only the first match is insufficient.
3. `additionalProperties` applies only when the name is not covered by
   `properties` or any `patternProperties` entry. Its schema may be `true`,
   `false`, an object schema, or a `$ref`.
4. When `additionalProperties` is absent, JSON Schema treats additional values
   as allowed. The renderer MUST expose the unrestricted Add action when the
   applied option `allowAdditionalPropertiesIfMissing` is enabled; matching
   `patternProperties` entries remain available independently of that option.
   Existing dynamic data MUST still render even when the option is disabled.

All applicable `$ref` values MUST resolve against the root schema. The selected
or composed schema determines the value renderer and the default value created
by Add. Object, array, primitive, null, and mixed schemas MUST retain their
correct JSON data types.

If a rename changes which pattern schema applies, the value MUST be rendered
and validated against the newly applicable schema without silently coercing,
discarding, or replacing the existing value.

#### 9.6.3 Mutation and synchronization

- Add MUST preserve the new key even when its schema-valid default is empty or
  undefined according to the renderer's normal initialization rules.
- Rename MUST preserve the property's value and object-key ordering as far as
  JavaScript object semantics allow. It MUST be atomic: validation failure
  leaves the original key and value unchanged.
- Delete MUST remove only the selected dynamic property and MUST respect
  `required` and `minProperties` when restrictions are enabled.
- Add MUST respect `maxProperties` when restrictions are enabled.
- External data changes that add, remove, rename, or reorder dynamic keys MUST
  update the rendered rows. A value-only change MUST NOT unnecessarily rebuild
  the property's renderer or lose its interaction state.
- Nested dynamic properties MUST use correct data paths and inherit renderer,
  cell, configuration, validation, internationalization, middleware, and AJV
  context from the parent form.
- React and Web Component modes MUST implement identical dynamic-property
  behavior.

### 9.7 Combinators and references

The base renderer registry MUST correctly support:

- `$ref`
- `allOf`
- `anyOf`
- `oneOf`

Rules:

- `$ref` MUST resolve against the root schema.
- `allOf` MUST render all composed constraints against the same data path.
- An `allOf` composed from object schemas MUST render the combined object
  fields. It MUST NOT display a JSON-type selector or initialize array data.
- `anyOf` and `oneOf` MUST offer a clear variant selection mechanism when more
  than one alternative can be chosen.
- With no current value, a variant selector MUST begin unselected and render
  only its selector, shared combinator properties, and validation feedback. It
  MUST NOT preselect or render the first variant merely because the field is
  required. The selected variant detail is rendered only after data fits a
  variant or the user explicitly selects one.
- Switching alternatives MUST create or retain data according to JSON Forms'
  combinator semantics; it MUST NOT leave data in an unrelated JSON type.
- Registered detail UI Schemas MUST take precedence over generated detail UI
  Schemas.
- Mixed-type fallback renderers MUST NOT claim schemas handled by a dedicated
  combinator renderer.

### 9.8 Mixed-type renderer

A mixed-type renderer handles a schema that genuinely permits more than one
JSON data type, including an array-valued `type` and unrestricted schemas such
as `items: true`. It MUST NOT claim an `allOf`, `anyOf`, `oneOf`, ordinary
object, or other schema for which a more specific renderer exists.

The renderer MUST derive its available choices from the resolved schema. Its
selection MUST follow the current data type, with JSON Schema `number`
accepting integer data. Selecting a different type MUST replace the value with
a schema-valid default of that type. A registered per-type detail UI Schema, such as
`object-detail` or `array-detail`, MUST be honored.

#### 9.8.1 Primitive presentation

When the selected value is a primitive or `null`, the mixed renderer MUST look
and behave like a normal one-line form control:

- A compact type-selection dropdown appears at the inline-start of the row.
- The type selector MUST NOT add a separate Clear value action. Type changes
  are made through the selector; an initially absent value remains unselected.
- The control for the selected primitive appears beside it in the remaining
  width and SHOULD have the same visual height as the dropdown.
- The active value control MUST be rendered through the normal renderer and
  cell registries rather than through a mixed-renderer-specific imitation.
- Label, description, required, validation, focus, enabled, disabled, and
  read-only behavior MUST follow the common control contract.
- Choosing `null` or having no selected type MUST not leave a stale primitive
  input visible.
- With absent data, no type is selected and only the type selector, label,
  description, and validation feedback are shown. The renderer MUST NOT select
  the first allowed type automatically, including when the field is required;
  the required error remains visible until a type/value is explicitly chosen
  or supplied by the data model.

#### 9.8.2 Object and array presentation

When a root mixed value is an object or array, it MUST use a UI-library-native
collapsible panel or accordion. The header MUST retain the type selector at
the inline-start followed by the field label. Selecting an object or array
from a primitive state SHOULD open the panel automatically.

The expanded panel MUST contain two resizable panes, initially approximately
25% tree and 75% detail:

1. The inline-start pane is a searchable, expandable tree of the current data.
2. The inline-end pane renders the control for the selected tree node.

The tree and detail panes MUST provide the following behavior:

- The tree root represents the mixed control itself. It MUST use the
  library's JSON object/array icon or an equivalent `{}`/`[]` mark instead of
  a generic `Value` label. Objects and arrays are always shown hierarchically;
  primitive children MAY be hidden initially.
- Show/Hide primitives MUST be an eye/eye-off icon action on the root tree
  row, with a tooltip and accessible name. It MUST NOT consume a separate row
  as a text button.
- Tree nodes SHOULD show their JSON type, selected state, expansion state, and
  a concise label. Array elements SHOULD use labels such as `Item 0` rather
  than exposing JSON Forms path syntax.
- Search MUST retain matching descendants and their ancestors and expand the
  matching branches sufficiently to make results visible.
- Selecting a node MUST show its regular dispatched JSON Forms control in the
  detail pane. Breadcrumbs SHOULD identify the selected path and allow
  navigation to its ancestors.
- A nested mixed value whose selected type is an object or array MUST NOT
  recursively create another tree/detail editor inside the detail pane. It
  MUST render only its compact type selector and a library-native View/eye
  icon action with a tooltip and accessible name.
- Activating the nested View action MUST select that object or array in the
  existing root tree, expand its ancestor tree nodes, and render the selected
  object's or array's regular control in the existing right-hand detail pane.
- Object properties MAY be renamed only when their names are dynamic (for
  example, properties supplied by `patternProperties` or
  `additionalProperties`). Declared property names and array indexes MUST NOT
  be renameable.
- Every non-root item SHOULD expose Delete when deletion is permitted. Rename
  and Delete actions SHOULD be compact, accessible icon actions shown on hover
  and keyboard focus without changing row layout.
- Rename MUST validate empty and duplicate names, `propertyNames`, matching
  `patternProperties`, JSON Forms path safety, and any configured AJV rules.
  It MUST preserve the value and key ordering and MUST leave the original data
  unchanged when validation fails.
- Delete MUST respect enabled/read-only state and, when `restrict` is enabled,
  applicable `required`, `minProperties`, and `minItems` constraints. Deleting
  a non-empty object or array MUST require confirmation and explain that its
  nested content will also be removed.
- Structural external changes MUST rebuild the tree without losing the active
  path when it remains valid. Value-only changes SHOULD preserve expansion,
  selection, and editor interaction state.

The tree MUST use appropriate `tree`, `treeitem`, expansion, and selection
semantics. Tree rows, disclosure controls, type selection, breadcrumbs, and
item actions MUST be keyboard accessible.

### 9.9 Layouts

The base renderer set MUST include:

- vertical layout;
- horizontal layout with wrapping at narrow widths;
- group layout;
- categorization/tabs;
- array layouts required by the base examples.

When supported by the renderer family, it SHOULD also include categorization
steppers and list-with-detail layouts.

Layouts MUST preserve child visibility, enabled/read-only state, paths,
renderer/cell registries, and responsive behavior.

### 9.10 Extended renderers

Extended renderers are optional additions to the base registry, but a new
renderer family SHOULD provide UI-library-native implementations for the
extended examples it enables. Current extended capabilities include:

- action button elements;
- color control;
- duration control;
- file control;
- null control;
- AG Grid array control;
- Monaco editor control;
- split layout;
- template, named-template, and slot renderers.

An extended renderer MUST live in its own file and MUST have a tester whose
rank does not accidentally override unrelated base schemas.

#### 9.10.1 Monaco editor renderer

The Monaco renderer is an opt-in code editor selected by UI Schema options. It
MUST use Monaco Editor itself and MUST NOT replace it with a textarea styled to
look like a code editor.

The established selection and value options are:

| Option                              | Meaning                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `format: "code"`                    | Opts the control into code-editor rendering.                               |
| `language`                          | Sets a fixed Monaco language identifier.                                   |
| `:language`                         | Resolves the Monaco language identifier from a root-data path.             |
| `convertJson`                       | Pretty-prints JSON-compatible data and parses editor text back to JSON.    |
| `monaco.rows`                       | Sets the normal fixed editor height in text rows.                          |
| `monaco.autoGrow`                   | Grows the editor with its content.                                         |
| `monaco.minRows` / `monaco.maxRows` | Clamp auto-growing editor height.                                          |
| `monaco.options`                    | Passes supported standalone-editor construction options through to Monaco. |
| `monaco.initActions`                | Runs named Monaco actions after initialization.                            |

- A string control with `format: "code"` and either `language` or
  `:language` MUST be eligible for this renderer.
- A non-string JSON value MAY use the renderer when `language: "json"` and
  `convertJson: true` are both present.
- `:language` takes precedence over `language`. It MUST react to changes in
  the referenced form data and update the existing Monaco model language so
  tokenization, validation, and language services change immediately.
- Without a valid language option, the editor SHOULD use `plaintext`.
- Ordinary code values MUST remain strings. An empty optional string SHOULD
  use the renderer set's normal cleared value, usually `undefined`.
- With `convertJson`, valid edits MUST update the form with the parsed JSON
  value rather than a JSON string. Invalid or incomplete JSON MUST remain
  editable in Monaco and MUST NOT replace the last valid form value.
- External data changes MUST update the editor without causing feedback loops,
  cursor loss from unnecessary model replacement, or duplicate change events.

The renderer MUST use the normal control wrapper for label, description,
required state, errors, focus, and accessibility. Disabled and read-only state
MUST make Monaco read-only and MUST prevent edits from reaching JSON Forms.
Validation state MUST remain visible around the editor without obscuring
Monaco's own diagnostics.

The editor MUST support a maximize/restore action, restore with Escape while
maximized, and recalculate its layout after container, pane, row-count, or
maximize changes. Auto-grow MUST count model lines and remain within the
configured minimum and maximum. Multiple editor instances MUST maintain
independent values, languages, options, heights, focus, and disposal.

#### 9.10.2 Monaco theme and Web Component behavior

- Monaco MUST follow explicit `light`, `dark`, and `system` modes on initial
  render and on every later transition, including light to dark to light.
- Editor, gutter, minimap, selection, diagnostics, and maximize controls MUST
  remain legible and visually integrated with the selected UI library. A
  renderer family MAY supply scoped surface colors when its native dark
  surface differs from Monaco's built-in theme.
- Monaco themes are process-global. A renderer MAY switch only the built-in
  `vs` and `vs-dark` fallback themes; it MUST preserve a custom Monaco theme
  installed by the host and MUST NOT unexpectedly retheme demo data editors or
  other Monaco instances.
- Theme detection MUST inspect the surrounding application or Shadow DOM host,
  not the editor's own previously assigned color scheme, so an editor cannot
  lock itself in dark mode.
- Monaco's structural styles and renderer-specific styles MUST be installed in
  the active document or ShadowRoot. A Web Component MUST therefore look and
  behave like the framework-native renderer rather than depending on document
  styles that cannot cross the shadow boundary.
- Monaco web workers and language services MUST work in development,
  production builds, and Web Component bundles without relying on a globally
  preloaded Monaco instance.
- All subscriptions, models, observers, workers owned by the component, and
  editor instances MUST be cleaned up when the control is destroyed. Shared
  host-owned Monaco resources MUST NOT be disposed by an individual control.

#### 9.10.3 Runtime applicability of web-specific renderers

AG Grid, Monaco Editor, and template/named-template/slot renderers are
web-platform integrations. They are expected for renderer families targeting
a browser, including React, Svelte, Vue, Lit, and browser-targeted variants of
other languages or frameworks.

They are not required for renderer sets targeting a native, non-web runtime,
such as Flutter native applications, Kotlin/JVM or Compose native UI, Swing,
SWT, iOS, or Android views. Those renderer sets MAY omit these extensions or
provide documented native equivalents, such as a native data grid, code
editor, or composition/template mechanism. They MUST NOT claim exact AG Grid,
Monaco, or DOM-template compatibility unless the actual web implementation is
hosted. Applicability is determined by the deployment runtime, not solely by
the implementation language: a Kotlin or Flutter browser target may still
implement the web contract.

## 10. Cells

Renderer sets that support table or compact array presentation MUST provide
cells for the applicable primitive types:

- boolean and boolean toggle;
- date and time;
- enum and one-of enum;
- integer, number, and formatted number;
- text.

Cells MUST preserve value types and read-only/disabled behavior. A cell MAY be
visually denser than a full control but MUST use the UI library's components.

## 11. Tester and registry rules

- Every renderer and cell MUST export a tester with an intentional rank.
- Specific format, combinator, and UI Schema testers MUST outrank generic
  object, array, primitive, or mixed-type fallbacks.
- Registry order MUST be readable and grouped by controls, complex renderers,
  layouts, additional renderers, and cells.
- A fallback tester MUST document which otherwise unsupported schemas it is
  intended to claim.
- A renderer MUST be tested through the full registry, not only as an isolated
  component, whenever tester competition can affect selection.

## 12. Web Component parity

The Web Component is another host for the same renderer set, not a simplified
renderer implementation.

- It MUST use the same base and extended registries as React mode.
- It MUST accept and update data, schema, UI Schema, UI Schemas, config,
  read-only state, validation mode, locale, translations, additional errors,
  direction, theme mode, and renderer-specific settings.
- It MUST emit data/error changes and action events with stable event shapes.
- Shadow DOM styles MUST contain the actual UI-library styles required by the
  renderer components.
- The Web Component MUST NOT use a hand-written approximation of the UI
  library's controls.
- Light/dark tokens, dimensions, typography, validation states, descriptions,
  and spacing MUST match React mode.
- Translation fallback MUST use JSON Forms defaults; untranslated internal
  keys such as `property.description` or `property.error.required` MUST NOT be
  visible.
- Popovers, dialogs, selects, calendars, and other portalled components MUST be
  styled and functional across the Shadow DOM boundary.
- Switching between React and Web Component modes MUST preserve current data
  and settings.

## 13. Theme, RTL, and accessibility

### 13.1 Theme

- All surfaces, controls, overlays, editors, and icons MUST support light and
  dark mode.
- Text and validation colors MUST meet reasonable contrast requirements.
- Logos and icons MUST remain visible against their containers in both modes.
- Renderer-specific tokens MUST be scoped so one demo cannot leak styles into
  another demo in the aggregate application.

### 13.2 RTL

- Direction MUST use logical inline properties where possible.
- Sidebar placement, settings drawer placement, form/data panes, icons with
  directional meaning, and control alignment MUST behave correctly in RTL.
- Data paths and JSON text remain unchanged.

### 13.3 Accessibility

- All interactive elements MUST be keyboard reachable.
- Icon-only controls MUST have accessible names.
- Dialogs and drawers MUST manage focus and support Escape when the library
  provides that behavior.
- Tabs, selects, checkboxes, and toggles MUST expose their standard roles and
  states.
- Errors MUST be announced or associated with their controls.
- Focus indicators MUST not be removed unless replaced with an equally visible
  UI-library focus treatment.

## 14. Testing specification

Tests exist to validate JSON Forms integration and application contracts, not
to retest the upstream UI library.

### 14.1 What to test

Each renderer SHOULD test:

- tester selection and rank where ambiguity is possible;
- rendering through the actual renderer registry;
- value conversion and `handleChange` output;
- Clear value availability only for populated, enabled controls, its
  hover/focus visibility, accessible name, and emitted clear value;
- unselected dropdown behavior, including no implicit first selection and a
  required error without data initialization;
- disabled, read-only, hidden, required, description, and error behavior;
- library-component composition when accidental fallback to native HTML is a
  risk;
- schema edge cases relevant to the renderer;
- accessibility attributes that the integration is responsible for.

Complex renderers MUST test data-shape preservation. Required regression cases
include:

- `allOf` object composition remains an object;
- arrays respect min/max restrictions;
- mixed primitive values use the one-line selector/control presentation and
  switching type creates the correct default value;
- mixed objects and arrays use the collapsible tree/detail presentation,
  preserve selection during synchronization, navigate nested structures, and
  enforce rename/delete permissions and restrictions;
- dynamic-property add, rename, delete, duplicate-name, `propertyNames`,
  `patternProperties`, schema-selection, `$ref`, and restriction behavior;
- date/time/date-time pickers emit the expected serialized values, including a
  regression case where display and save formats differ;
- Monaco tester selection, reactive language changes, string/JSON conversion,
  invalid JSON retention, fixed/auto-growing height, and maximize/restore;
- Monaco light/dark/system transitions, especially light to dark to light,
  multiple-instance isolation, custom host-theme preservation, and Shadow DOM
  styling in Web Component mode;
- React and Web Component registries expose equivalent renderers.

### 14.2 What not to test

- Do not create tests whose only purpose is to prove that an unmodified
  upstream button, alert, tab, input, or other UI-library primitive works.
- Do not snapshot large amounts of upstream component markup.
- Do not duplicate the UI library's own accessibility or interaction suite.

An upstream component test is justified only when this repository modifies
the component or depends on a specific integration detail that could regress.

### 14.3 Required verification

Before a renderer-set change is considered complete:

1. Run focused tests for the changed renderer.
2. Build the base renderer package.
3. Build the extended renderer package when affected.
4. Build the Web Component package when affected.
5. Build the corresponding demo with Vite.
6. Run the exact repository command `pnpm run test`.
7. Run formatting and `git diff --check`.
8. Visually inspect representative examples in light, dark, RTL, responsive,
   React, and Web Component modes when browser testing is available.

## 15. New renderer-set implementation sequence

1. **Inventory the UI library.** Identify its provider, theme system, icons,
   form controls, pickers, layouts, overlays, tables, and accessibility APIs.
2. **Create the base renderer package.** Keep every renderer, cell, and reusable
   UI component in its own file.
3. **Implement primitive controls.** Establish labels, descriptions, errors,
   value conversion, and read-only behavior first.
4. **Implement layouts and complex renderers.** Include objects, arrays,
   dynamic properties (`patternProperties`, `additionalProperties`, and
   `propertyNames`), `$ref`, and combinators before relying on a mixed fallback.
5. **Add cells.** Cover every compact/table type supported by the examples.
6. **Create extended renderers.** Use the UI library for every visual control;
   reuse only genuinely UI-independent behavior.
7. **Create the Web Component.** Reuse the same registries and package the real
   styles for its Shadow DOM.
8. **Create the independent demo app.** Supply the library shell, demo UI
   controls, logo, provider settings, and theme wrapper to
   `jsonforms-react-demo-common`.
9. **Add the app to the aggregate selector.** Keep its build output isolated in
   its own subdirectory.
10. **Add integration tests and run the acceptance checklist.** Test schemas
    through the full registry and verify that data shapes never depend on the
    selected renderer family.

## 16. Acceptance checklist

A new renderer set is ready when all answers are yes:

- [ ] Does it use real UI-library components rather than simplified adapters?
- [ ] Is every renderer and reusable component in its own file?
- [ ] Are base, extended, Web Component, and demo projects separated?
- [ ] Do Vite builds work without a standalone Rollup configuration?
- [ ] Does the independent demo implement the complete shared shell contract?
- [ ] Are all settings present, with Restrict enabled by default?
- [ ] Do light, dark, system, LTR, RTL, and responsive modes work?
- [ ] Does Demo and Data use the UI library's splitter, allow either pane to
      become larger, and retain usable minimum pane sizes?
- [ ] Do all JSON editors, form-only mode, and deep links work?
- [ ] Are date/time/date-time controls real UI-library pickers, and do they
      honor separate UI Schema display and save formats?
- [ ] Do applicable populated inputs, textareas, numeric controls, and
      dropdowns expose an accessible Clear value icon on hover/focus without
      obscuring the value?
- [ ] Do enum, one-of, mixed, and other selection controls remain genuinely
      unselected when data is absent, including when required, rather than
      silently choosing their first option?
- [ ] Do objects, arrays, `patternProperties`, `additionalProperties`,
      `propertyNames`, `$ref`, `allOf`, `anyOf`, and `oneOf` preserve correct
      data shapes and schema behavior?
- [ ] Does the mixed renderer use a one-line selector/control for primitives
      and a collapsible, searchable tree/detail split for objects and arrays,
      with schema-aware rename and delete actions?
- [ ] Does the Monaco renderer react to language and theme changes, preserve
      invalid JSON while editing, isolate multiple instances, and work in the
      Web Component Shadow DOM?
- [ ] Are AG Grid, Monaco, and template renderers required only for applicable
      browser runtimes, with native omissions or equivalents documented?
- [ ] Do React and Web Component modes look and behave equivalently?
- [ ] Are tests focused on renderer integration rather than upstream
      primitives?
- [ ] Do focused tests, package builds, demo builds, and `pnpm run test` pass?

## 17. Source-of-truth priority

When references disagree, use this order:

1. JSON Schema and JSON Forms semantics for data and validation behavior.
2. The selected UI library's official API and components for appearance and
   interaction.
3. This specification for repository architecture and demo behavior.
4. Existing renderer demos and implementations, including the Svelte mixed
   renderer and extended Monaco renderer, as visual and feature references.

Any intentional deviation MUST be documented in the renderer package README
and covered by a test when it changes observable behavior.
