# @chobantonov/jsonforms-react-shadcn-renderers

## 0.1.0

### Minor Changes

- 613ab8e: Support collapsible and initially collapsed array panels in table, expandable, list-with-detail, and AG Grid presentations. Keep body contents mounted and preserve independent item expansion.
- 5c4257a: Add translated choice cards for enum, constant oneOf, and oneOf branch forms. Support presentation layouts, selected content, disabled choices, and optional visible radios while preserving keyboard access and branch-change confirmation.
- 46c2085: Support the focused collection examples with table pagination, whole-row dialog editing, resizable side/bottom detail panels, and opt-in dynamic-property pagination. Use native Antd components and pinned upstream shadcn Pagination, Dialog and Resizable components.
- 829c8a0: Add jsonformsExtended.group/mixed/accordion/array.collapsed defaults. Local collapsed options take precedence over component defaults and the shared collapsed default. Expose these overrides in the demo settings.
- 89f8fa6: Add opt-in conditional object field discovery for if/then/else and Draft-07 dependencies. Preserve explicit detail placement, active required markers, inactive data and original document validation. Support local conditionalFields overrides of the namespaced configuration default.
- b8f7408: Support upstream detail modes in composite cell, tuple-field, and recursive-node editors through shared resolution. Preserve forced generation through delegated controls and normalize legacy inline layouts. Align mixed type-specific detail overrides across Antd and shadcn, retaining labels on explicitly scoped child controls. Tuple container detail remains a position layout.
- e6b03a4: Add an opt-in recursiveTree control presentation with named node navigation and a selected-node detail pane. Reuse branch editors, native child collection actions, and container validation indicators in Antd and shadcn. Keep existing recursive controls nested by default.
- 829c8a0: Show required property markers in table and AG Grid headers, honoring cell, collection and global hideRequiredAsterisk settings.
  
  Remove initCollapsed: use collapsed for array-item initialization and accordion expansion. Update existing configurations to the new name.
- 613ab8e: Render structured mixed values in collapsible panels with a searchable structure navigator, breadcrumbs, selected-node editing, and guarded rename/delete actions. Align scalar type selectors with their editors, reuse shared mixed schema behavior, and apply type-change confirmation.
- 46c2085: Register a positional tuple renderer using the shared tuple schema rules. Support fixed editors, vertical defaults, custom position layouts, safe initialization of missing positions, trailing items, and isolated complex-position dialogs built with shadcn components.

### Patch Changes

- c35c46f: Paginate tuple additional items with native controls and scoped jsonformsExtended.additionalItems.pagination defaults. Enable additional-items and additional-properties pagination by default with five entries per page; boolean false disables pagination, and local options override scoped config. Preserve fixed tuple positions and absolute indices across pages.
- 192f70f: Show disallowed-property validation errors beside the Additional Properties heading,
  including the offending property name and translated validation message.
- 67fec78: Preserve AG Grid body height inside shadcn side and bottom detail panes. After adding a grid row, navigate to its displayed page and scroll it into view, respecting sorting and active filters.
- 67fec78: Support AG Grid whole-row details in Ant Design and shadcn using options.rowDetail, with custom item UI schemas, draft dialogs, and resizable right or bottom panels shared with normal tables. Preserve source row paths when sorting or filtering and keep detail selection independent of bulk deletion.
- 192f70f: Keep AG Grid cell renderer functions stable across form-data changes so typing does not recreate editors. Resolve label summaries through the latest data and cache without replacing cell renderers. Add clear actions to shadcn text and numeric cells.
- b8f7408: Resolve array detail modes through JSON Forms core in shadcn and shared row detail editors used by both renderer sets. Preserve DEFAULT array selection and registry fallback, and verify Antd/shadcn parity for generated, registered, custom-string, and inline layouts. GENERATE bypasses the registry; GENERATED retains upstream registry-first behavior.
- 829c8a0: Show validation indicators in array item headers when enabled, so errors in collapsed items and their descendants remain discoverable.
- 613ab8e: Constrain wide array tables to the panel and scroll the table body horizontally, keeping header actions reachable. Enable Ant Design table horizontal scrolling.
- 150fd68: Fix oneOf choice-card branch details in Antd and shadcn to resolve generated, registered, and inline UI schemas through the shared detail resolver. Resolve referenced branch schemas before registry lookup, fall back to generation when no registration matches, and preserve the branch data scope when editing. Add regression coverage for detail modes and the translated choice-controls example.
- 46c2085: Resolve choice-group orientation only from the control's options.vertical, without inheriting global config.vertical.
- 829c8a0: Clear stale oneOf selection and branch fields when external data removes the bound value or replaces it with an empty object that matches no branch.
- c35c46f: Apply shared delete confirmation policies to additional properties and tuple trailing items in both renderer sets. Use localized native dialogs, recheck mutation permissions, and reject stale collection targets before deleting.
- 192f70f: Use an icon button for collection error navigation, with a translated tooltip and accessible name in normal tables and AG Grid.
- c35c46f: Place additional-properties pagination below the entries inside the collection boundary. Use consistent end-aligned, separated pagination footers for tables, additional items and additional properties, retaining native pagination controls.
- 192f70f: Add collection error counts and navigation to off-page row details, plus row error counts. Share descendant-error indexes across cells. Sort and filter Markdown Label summaries by readable text with bounded summary caching. Explain when AG Grid filters hide a newly added item and provide an explicit Clear filters action.
- 613ab8e: Apply the shared delete confirmation policy to composite cell removal. Default to confirming nonempty objects and arrays, honor configured overrides, and recheck the target before confirmed removal.
- 67fec78: Distinguish generated composite cell summaries with secondary italic text. Use localized field-not-specified and empty-object descriptions, reserve Not set for missing values, and keep actual data previews in normal typography.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
- 67fec78: Add configurable sizes, maximize/restore, optional title dragging and resizing for cell and row detail dialogs. Fix shadcn initial dialog focus and show composite edit actions on hover/focus, with destructive-colored removal.
- 829c8a0: Support form-wide jsonformsExtended.dialog defaults with per-dialog overrides. Align Antd dialog top spacing with its viewport height limit so long forms scroll internally while their actions remain visible.
- 67fec78: Keep detail dialogs centered with a scrollable body and a fixed footer. Preserve shadcn web component dialog styling by keeping portals inside the shadow tree.
- 67fec78: Remove shadcn dialog geometry transition lag and batch dragging updates to animation frames. Resize the actual Ant Design dialog container instead of its wrapper so the resize grip changes the editor dimensions.
- 67fec78: Give fixed-height row detail split panes independent scroll areas so large forms and tables remain reachable.
- 172887e: Add translated icon buttons to show and hide side and bottom row detail panels while retaining the selected row.
- 6e346b0: Highlight the row displayed in the detail pane without changing checkbox selection for deletion.
- 172887e: Place the detail pane visibility toggle beside Add in the array header for both renderer sets.
- 829c8a0: Allow detail dialogs to move to viewport edges using their measured size and position, replacing fixed drag-distance limits. Recompute bounds at each drag to account for resizing.
- 192f70f: Edit empty and dotted property names through isolated value editors in shadcn,
  preserve literal names, and keep untouched Add fields free of draft errors.
  Remove extra Antd list spacing stacked on top of normal control margins.
- 172887e: Reveal a hidden detail pane when its row edit button is clicked. Ordinary row and cell clicks preserve pane visibility.
- 46c2085: Use normal native tooltips for single validation errors, preserving the control's message. Use expandable summaries for multiple errors. Keep indicators icon-only in both renderer sets and provide cell paths for structured error counting.
- 613ab8e: Preserve generated AG Grid cell renderer identities across data edits to avoid remounting active controls. Keep a single focus indication on borderless shadcn grid cell editors.
- c35c46f: Capture rendered column widths when resizing begins and adjust the total table width so resizing one column does not redistribute space into neighboring columns.
- 192f70f: Hide validation indicators on Label cells without detail editors. For Label cells with explicit details, include only errors covered by the detail layout's controls, preserving complete row and collection error indicators in normal tables and AG Grid.
- 192f70f: Verify that row-bound Label summaries open details only through an explicit edit button when a detail layout is configured, while label text remains selectable and no clear-row action is offered.
- 192f70f: Defer indicator detail formatting until tooltip or popover opening. Use cached
  path lookups for presentation counts and memoize open summaries. AG Grid headers
  use a short accessible summary instead of formatting all descendant messages.
- 67fec78: Provide the current table item lazily through form context under the same item name used by expressions. Remove row paths from cell UI-schema options. Show a pending indicator while the interpolation evaluator loads, without flashing template expressions.
- 67fec78: Limit the list-with-detail navigation pane to 20rem and scroll overflowing items independently of the detail editor.
- 46c2085: Use native resizable splitters for list-with-detail arrays so users can adjust the list and detail widths. Start with a 25% list pane.
- 192f70f: Use the control's translated validation message directly in local error tooltips. Keep path details and expandable summaries for container feedback only, avoiding summary formatting for local controls.
- e6b03a4: Use detail panels for nested shadcn arrays by default, matching Antd, while preserving explicit table presentation. Support composed schemas in composite table cells so metaschema values have an editor.
- 829c8a0: Show missing required discriminator feedback on the oneOf selector when the discriminator's separate field is omitted from branch layouts. Include English and Bulgarian guidance and accessible invalid state.
- 829c8a0: Honor initial accordion collapse configuration and share Group expansion settings with mixed object/array frames. Local options override global defaults; tree-node expansion remains independent.
- e6b03a4: Add mixed structuredLayout code presentation using Monaco for the entire JSON value. Register section-specific schema validation, retain malformed drafts, publish syntax errors through the additional-error store without duplicating schema diagnostics, and block cell-dialog Apply while editor errors remain. Tree remains the default.
- 9eb66d2: Preserve composition constraints when delegating a mixed value to its selected type. Narrow explicitly typed composition branches, keep untyped and overlapping alternatives, and preserve boolean array item schemas. Add Antd and shadcn integration coverage and mixed-control specification examples.
  
  Render enclosing object properties alongside allOf branches in shadcn, matching Antd.
- e6b03a4: Preserve the selected scalar type when clearing a value owned by a mixed type selector, including root values and tree details. Strings reset to the empty string; numbers and integers reset to zero. Clearing the type still removes the value. Ordinary scalar controls retain their existing clearing behavior.
- e6b03a4: Align structured mixed labels above the selector row in both renderers. Allow the Antd header area beside the selector to toggle expansion while keeping selector interactions independent.
- 829c8a0: Display descendant validation indicators in structured mixed-control headers, including when collapsed. Honor local overrides and validation visibility.
- 9eb66d2: Preserve explicit Number/Integer editor selection for mixed numeric values without resetting data. Show a localized whole-number error when Integer is selected for a fractional value. Prevent Antd integer inputs from committing fractions.
- e6b03a4: Reserve space for dynamic-property actions beside structured mixed headers so collapse icons remain accessible. Use borderless Antd mixed panels for dynamic properties and separate adjacent property editors with spacing, retaining full-width expanded content.
- e6b03a4: Support structuredLayout: nested or tree on mixed controls and in jsonformsExtended.mixed configuration. Local options take precedence; tree remains the default. Nested mode uses regular object and array editors.
- 829c8a0: Render mixed-type table cells through the composite summary and dialog editor instead of reporting that no applicable cell was found.
- 192f70f: Preserve object titles when unwrapping outer detail Groups, avoid redundant object
  borders, and omit empty static layouts for dynamic-only objects. Keep direct
  object validation beside the title or above untitled content.
- 9eb66d2: Add validateActiveBranch (default true) to global config and control options. A control override takes precedence. Disabling it skips additional branch compilation and validation while retaining document validation. Document the rationale, cost and local-feedback semantics and demonstrate both settings in the mixed-control example.
- 7a23d74: Hide composite cell type markers by default. Set showTypeIndicator to true to display object or array markers independently of the summary and actions.
  
  Support top-level config.showTypeIndicator as the form-wide default, with explicit per-cell options taking precedence.
- e6b03a4: Place dynamic property names and actions in a separate header row above their editors. Antd structured mixed controls also place the label above the type selector and expansion toggle, retaining full-width expanded content.
- 192f70f: Show invalid property names once, in the error color with their validation icon
  beside the label. Keep rename and delete actions on the right.
- 192f70f: Explain the specific property-name constraints in Add/Rename validation and show
  name errors for scalar properties whose editor supplies its own heading.
- 192f70f: Place propertyNames errors beside the offending dynamic property name instead of
  at the object boundary. Validate full name constraints for Add and Rename,
  including unchanged invalid names and validation without an injected validator.
- 46c2085: Support config.jsonformsExtended.radio.vertical as the default radio layout, overridden by the control's options.vertical.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 613ab8e: Move generated shadcn/ui components and their dependencies into the consuming
  hosts. React applications must now install the required components and map
  `@jsonforms-react-shadcn-ui/*` to their component directory. Import UI primitives
  from the application instead of the renderer package. The Web Component owns
  its component implementations and resolves the alias during its build.
  
  Add primitive controls, editable cells, typed enum values, array confirmation,
  and native shadcn resizable layouts, with expanded behavioral coverage.
- 829c8a0: Show the authored oneOf selector label visibly and associate it with the selector. The recursive spec example uses registered branch layouts to show one Kind selector without a redundant discriminator field.
- 829c8a0: Recognize explicit discriminators in recursive referenced branches even when a nested value is invalid. Initialize shadcn oneOf object branches on selection using the shared confirmation policy. Add regression coverage for the recursive tree spec example and finite child creation.
- e6b03a4: Expose rename and delete actions on recursive tree rows. Rename edits the configured label property with schema validation. Delete removes child nodes with confirmation and respects minimum collection size and read-only constraints. The displayed root cannot be deleted.
- 46c2085: Use icon buttons with translated native tooltips and accessible labels for row detail actions.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
- 613ab8e: Register a specialized anyOf string-or-enum renderer using the app-owned shadcn Input with native suggestions. Accept free text and suggested values without generic anyOf tabs, matching Svelte shadcn.
- 613ab8e: Show array and cell validation through compact focusable icons with app-owned shadcn tooltips. Invalid cells receive a red border and a trailing error indicator instead of inline error paragraphs. Consumers must supply the tooltip module.
- 613ab8e: Render array detail items as app-owned shadcn Collapsible panels with custom labels, one-based index markers, and separate header delete actions. Open the first item by default and preserve mounted fields when collapsed.
- 613ab8e: Handle arrays without an items schema without crashing. Use the resolved array
  schema supplied by JSON Forms when enforcing nested array item limits.
- 613ab8e: Populate const enum cells and display translated validation errors in array cells and at table level, respecting the JSON Forms validation mode. Resolve referenced column schemas before dispatching cells.
- 829c8a0: Make oneOf dropdowns full width and replace the separate clear text button with an accessible inset clear icon.
- 5c4257a: Map Button semantic colors to shadcn variants and remove legacy button styling that forced white text in dark mode. Preserve the host Button's theme, focus, hover, and disabled styles.
- 613ab8e: Implement accordion and stepper categorization variants instead of falling back
  to tabs. Share initial selection, rule visibility, stable category identity,
  translated labels, and data/validation indicators across all presentations.
  Preserve mounted panels and provide accessible accordion relationships and
  optional stepper navigation.
- 192f70f: Show compact removable pills for multi-select values and chips, with bounded
  text and separate accessible dropdown and removal buttons.
- e6b03a4: Vertically center the shared clear button within its input instead of using a fixed top offset.
- 613ab8e: Use application-owned shadcn Base UI Collapsible components for collapsible groups, preserving mounted fields and translated data indicators. Consuming apps must provide the collapsible module alongside their other shadcn components.
- 613ab8e: Use compact shadcn icon-sm buttons for array toolbar actions, matching Svelte sizing. Host Button components must support icon-sm.
- 4764910: Match enum and constant choices by structural equality in dropdowns, radio groups, and cells so object and array values remain selected after loading JSON.
- 613ab8e: Render object and array columns with compact summaries and shadcn detail dialogs,
  including isolated Apply/Cancel drafts, readonly inspection and conflict checks.
  Support table presentation with the same cell registry and preserve explicit AG
  Grid column widths instead of shrinking them through default flex sizing.
  
  Match Svelte shadcn with accessible icon buttons for composite details, clearing,
  array add/remove/reorder actions, and the AG Grid toolbar.
- 46c2085: Show validation icons on groups and category headers with native shadcn tooltips containing localized error counts. Respect indicator visibility, count settings, and validation modes through the shared container validation rules.
- 613ab8e: Add localized data indicator tooltips to collapsible groups and category panels using the shared group.dataIndicator translation key.
- 613ab8e: Show descriptions on focus unless showUnfocusedDescription is enabled, respecting control options over form configuration. Prioritize validation errors over descriptions.
- 67fec78: Focus row detail dialogs without selecting the first field. Keep widened native tables inside a horizontal scroll area, and share the compact edit icon button and translated tooltip between native tables and AG Grid.
- 67fec78: Use theme tokens directly for renderer inputs, labels, descriptions and container borders. Portaled detail dialogs now inherit the active light or dark colors without depending on an app wrapper ancestor.
- 46c2085: Make enum and oneOf dropdown editors fill their table cells instead of using the upstream select trigger's content-sized width.
- 46c2085: Make enum selects fill their layout column, including the Nationality field in the Additional errors example, by overriding the upstream trigger's content-sized width at the renderer level.
- 46c2085: Make array and cell error indicators icon-only. Open the expandable error summary on hover or keyboard focus, and constrain cell indicators to the space reserved beside the editor.
- 192f70f: Show validation error indicators for scalar AG Grid cells using the same localized, lazily expanded feedback as normal table cells. Reserve space for the indicator beside the editor.
- 613ab8e: Show a checkerboard swatch for empty colors and use full-size, borderless inputs inside AG Grid cells, leaving focus indication to the grid.
- 829c8a0: Center array item validation icons beside their labels without inline baseline spacing, and vertically align shared container indicators.
- 172887e: Keep the table splitter at a definite height when details are hidden so the bottom-panel layout does not collapse the table.
- 829c8a0: Honor hideRequiredAsterisk configuration in field labels and array/mixed headings, including live settings changes and explicit UI schema overrides. Required validation remains unchanged.
- 829c8a0: Position array item error indicators beside their labels so the delete action cannot cover them.
- 46c2085: Truncate long list-with-detail item labels with an ellipsis while keeping item actions visible.
- 46c2085: Reduce the list-with-detail navigation pane from 40% to 25% of the available width, matching Antd and leaving more room for the detail form.
- 613ab8e: Use shadcn Item and Avatar components for list-with-detail arrays, with per-row delete actions and support for hideAvatar.
- 67fec78: Truncate long list-with-detail labels with an ellipsis inside the themed scroll area. Keep row actions visible and only scroll horizontally when the pane is too narrow for the controls.
- 613ab8e: Handle ListWithDetail array elements with selectable item navigation, delegated detail layouts, empty state, and array validation. Show required array labels.
- 613ab8e: Resolve the bound property schema before selecting the mixed renderer so typed fields inside untyped allOf branches render their proper controls.
- 613ab8e: Use the upstream shadcn Breadcrumb components for mixed value navigation. Add the pinned component to both hosts and the upstream sync manifest.
- 613ab8e: Place the mixed-type clear action inside the selector outline, beside the dropdown arrow, with hover and keyboard-focus visibility. Keep it separate from the trigger button and hide it when disabled.
- 829c8a0: Honor explicit hidden labels in mixed editors and input shells, avoiding repeated Value labels in cell dialogs.
- 613ab8e: Remove redundant mixed workspace and tree borders, and duplicate card outlines inside the object detail panel.
- 613ab8e: Keep the mixed-schema type selector controlled when values are missing or cleared, preventing uncontrolled/controlled warnings and restoring its placeholder.
- 613ab8e: Reserve consistent space for tree expand icons on leaf rows so child labels remain indented beneath their parents.
- 613ab8e: Start mixed tree branches collapsed so users explicitly expand the nodes they want to browse.
- 613ab8e: Respect date display and save formats and render month/year-only views using shadcn selects with Apply and Cancel actions.
- 613ab8e: Default object arrays to table presentation when no detail layout is requested, matching Svelte shadcn. Register oneOf enum cells with titled choices. Explicit table:false retains the list presentation.
- 192f70f: Preserve object Group layouts and contain their title and additional properties within one boundary. Remove the embedded additional-properties frame and omit empty static layouts.
  
  Avoid stacking Card and paginator padding inside the object frame.
- 67fec78: Use a dropdown for oneOf branch selection, matching Ant Design, while retaining anyOf tabs and the existing branch-switch handling.
- 192f70f: Keep OTP reveal and clear actions immediately beside the segmented inputs instead of pushing them to the far edge of the form. Retain horizontal scrolling for the slots when space is limited.
- 192f70f: Add segmented OTP password controls with immediate partial updates, paste, keyboard navigation, masking, reveal and clear. Support schema and UI password formats, ordinary password fallback without bounded length, and compact masked password table cells.
- 7a23d74: Use the shared dynamic-property schema resolver so every matching patternProperties schema contributes to the editor, matching Antd.
- 613ab8e: Default primitive arrays to compact table rows with adjacent actions and validation feedback, matching Svelte and Antd. Omit redundant column headings for single-value rows.
- 613ab8e: Match additional-property rename/delete buttons to Svelte shadcn's compact size and subtle destructive styling, preserving add-button alignment.
- 46c2085: Honor the canonical vertical option for radio groups, with horizontal presentation by default.
- 192f70f: Add shadcn mask controls using the shared mask engine, chips, multi-select,
  enum-array checkboxes, oneOf radio selection, scalar composition controls, and
  formatted-number and boolean-toggle cells.
- e3b6afa: Resolve column resize and row selection colors through the theme's HSL color format. Keep column resize separators visible in light and dark themes using the muted foreground token.
- 46c2085: Update table detail panels when a row or one of its cells is clicked, matching Antd row selection.
- e3b6afa: Constrain table selection columns to 32px and center their checkboxes. Improve unchecked and disabled row selector visibility with shadcn theme colors, preserving the native checkbox component.
- 67fec78: Use the pinned upstream shadcn Scroll Area for list navigation, row detail panes and dialog bodies, with themed scrollbars on both axes.
- 829c8a0: Honor global restrict for text length, hideArraySummaryValidation for descendant header notices, and collapseNewItems for added accordion items. Preserve direct array errors and per-control overrides.
- 613ab8e: Show slider minimum and maximum beside the track and the current value above its position. Unset values remain unset without displaying a fabricated current value.
- 613ab8e: Register date, time and date-time cells and expose shadcnExtendedCells for color,
  duration, cron and null. Reuse specialized form controls without field labels,
  preserve full cell paths on edits, and register both sets in the demo and web
  component. Center controls vertically in AG Grid rows and compact the color editor.
- 4764910: Keep long categorization tab rows scrollable within the form width instead of widening split panes. Constrain the shadcn demo grid and keep its navigation tabs at their natural width so the form/data splitter can shrink the form. Keep vertical overflow hidden in both tab bars to avoid unnecessary vertical scrollbars.
- e3b6afa: Keep table row actions on one line in a content-sized column. Omit the action column when no row actions are available.
- 613ab8e: Use JSON Forms label formatting for array table column names while preserving explicit schema titles.
- 192f70f: Use a compact focus halo for normal table inputs and choice controls, preserving
  rounded input borders and validation colors without a heavy outer ring.
- 613ab8e: Use the shadcn destructive button variant for mixed tree delete actions.
- 613ab8e: Give mixed tree inputs and actions room for their upstream focus rings inside the resizable panel, preventing clipping along the panel edges.
- 613ab8e: Move the mixed tree primitives toggle onto the root row, translate action tooltips, truncate narrow labels, and show row actions on hover or keyboard focus. Rename dynamic properties inline with shared property-name validation.
- 613ab8e: Use the Svelte renderers' JSON type icon shapes for every mixed tree item, including primitives and inline rename rows. Show the root label beside its type icon.
- 9eb66d2: Render a sole anyOf or oneOf branch directly without a redundant tab or selector, retaining enclosing fields and branch validation.
- 46c2085: Show structured array validation summaries with separate translated messages, field and row context, an error count, and an expandable scrollable list. Use native popovers for interactive summary actions.
- 67fec78: Keep shadcn table cell validation icons beside their controls. Show nested validation errors on object and array cell summaries in both renderers, using the existing tooltip and multi-error summary feedback and respecting validation visibility.
- c7ff4dc: Support columnDefs to select and order table fields and specify width, minWidth and maxWidth in pixels, independently of the full row detail form.
- 6e346b0: Add pointer and keyboard column resizing to regular tables, honoring columnDefs width limits and retaining resized widths during row edits and pagination.
- 67fec78: Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
- 172887e: Replace per-row table deletion with selection checkboxes and a translated header delete action. Bulk deletion honors readonly, disableRemove, restrict/minItems and the table confirmation policy. Clear selection when array data changes to avoid stale indexes.
- c35c46f: Theme table column resize handles using Antd tokens and shadcn CSS variables. Use subtle inset separators, highlight hover and dragging, and preserve keyboard focus indicators and the wider grab area.
- 829c8a0: Preserve object-only array slots as empty objects when clearing a oneOf choice. Add a translated clear action in shadcn. Recursive tree examples initialize unselected nodes explicitly and apply whole-object defaults only after branch selection.
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [b8f7408]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [5c4257a]
- Updated dependencies [67fec78]
- Updated dependencies [150fd68]
- Updated dependencies [5c4257a]
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [67fec78]
- Updated dependencies [89f8fa6]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [c35c46f]
- Updated dependencies [67fec78]
- Updated dependencies [829c8a0]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [172887e]
- Updated dependencies [172887e]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [b8f7408]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [9eb66d2]
- Updated dependencies [e6b03a4]
- Updated dependencies [9eb66d2]
- Updated dependencies [9eb66d2]
- Updated dependencies [829c8a0]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [67fec78]
- Updated dependencies [c7ff4dc]
- Updated dependencies [6e346b0]
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [c35c46f]
- Updated dependencies [829c8a0]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
