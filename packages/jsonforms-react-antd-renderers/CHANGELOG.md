# @chobantonov/jsonforms-react-antd-renderers

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

### Patch Changes

- c35c46f: Paginate tuple additional items with native controls and scoped jsonformsExtended.additionalItems.pagination defaults. Enable additional-items and additional-properties pagination by default with five entries per page; boolean false disables pagination, and local options override scoped config. Preserve fixed tuple positions and absolute indices across pages.
- 192f70f: Show disallowed-property validation errors beside the Additional Properties heading,
  including the offending property name and translated validation message.
- 67fec78: Support AG Grid whole-row details in Ant Design and shadcn using options.rowDetail, with custom item UI schemas, draft dialogs, and resizable right or bottom panels shared with normal tables. Preserve source row paths when sorting or filtering and keep detail selection independent of bulk deletion.
- 172887e: Use a shared 8px gap between array header actions for regular tables and AG Grid.
- 829c8a0: Open detail dialogs centered in the viewport by default instead of at the top edge, retaining viewport size limits and drag support.
- 829c8a0: Use internal option IDs for Ant Design dropdowns, radio groups and enum cells. Match loaded JSON choices structurally, preserve their original types when selected, and avoid duplicate object-value React keys.
- 829c8a0: Use the outlined array error icon consistently in container headers and add spacing between array item labels and their error indicators.
- 172887e: Use consistent circular native buttons for array header actions, including detail visibility and panel collapse.
- 829c8a0: Remove native heading margins from array and table titles and vertically align inline container error markers and array item labels.
- 829c8a0: Honor hideRequiredAsterisk in shared form-item labels and enum-array/oneOf labels, including live config updates and explicit control overrides, without changing schema validation.
- 67fec78: Use the measured column widths for the table's horizontal scroll width after resizing. Long Label summaries no longer force the inner table to keep its content width when a column is narrowed.
- 67fec78: Override the native resized content width while maximized and restore it afterwards, so Ant Design detail dialogs fill the available viewport after resizing.
- 829c8a0: Honor explicit hidden labels in mixed editors and input controls to avoid repeated Value labels in cell dialogs.
- 46c2085: Place row detail editing first in the existing table actions column, before sorting and delete actions.
- b8f7408: Resolve array detail modes through JSON Forms core in shadcn and shared row detail editors used by both renderer sets. Preserve DEFAULT array selection and registry fallback, and verify Antd/shadcn parity for generated, registered, custom-string, and inline layouts. GENERATE bypasses the registry; GENERATED retains upstream registry-first behavior.
- 829c8a0: Show validation indicators in array item headers when enabled, so errors in collapsed items and their descendants remain discoverable.
- 613ab8e: Constrain wide array tables to the panel and scroll the table body horizontally, keeping header actions reachable. Enable Ant Design table horizontal scrolling.
- 5c4257a: Show local validation indicators and tooltips for checkbox and switch table cells, including invalid incoming values. Keep the array summary alongside the specific cell error.
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
- 613ab8e: Replace the internal dynamic-property UI-schema option with shared React context scoped to the property's path. Clearing dynamic values preserves their keys without changing normal clearing behavior for nested fields or allowing UI-schema options to override the context.
- 1f653b4: Use normal label weight for additional-property headings, including literal dotted keys, consistently with ordinary field labels.
- 192f70f: Edit empty and dotted property names through isolated value editors in shadcn,
  preserve literal names, and keep untouched Add fields free of draft errors.
  Remove extra Antd list spacing stacked on top of normal control margins.
- 172887e: Reveal a hidden detail pane when its row edit button is clicked. Ordinary row and cell clicks preserve pane visibility.
- 46c2085: Use normal native tooltips for single validation errors, preserving the control's message. Use expandable summaries for multiple errors. Keep indicators icon-only in both renderer sets and provide cell paths for structured error counting.
- 192f70f: Fix multiple-file picker activation using a native input ref. Use themed
  buttons and filename pills with individual removal and a localized clear-all
  action that respects readonly, clearable, restrict, and minItems.
- 192f70f: Support multiple-file selection for arrays of file strings in both themes,
  including referenced item schemas, ordered batch append, individual removal,
  uniqueItems and restrict-aware minItems/maxItems. Preserve committed attachments
  when reads fail or form data changes during a pending read.
- 192f70f: Use compact choice-style file pills. Remove the multiple-file cell border and
  wrapping; only the filename region scrolls, with fixed-size picker and clear
  actions outside it.
- 192f70f: Place multiple-file clear-all at the trailing edge and reveal it on hover or
  focus within the field. Unify single and multiple file picker actions with
  borderless buttons and use the standard Ant Design single-value clear behavior.
- 192f70f: Use a compact Ant Design file picker and register file cells in both themes.
  Remove forced unfocused descriptions from the File demo so the shared help
  policy follows the configuration. Avoid duplicate filename rows in shadcn and
  preserve data URI encoding for URI file values.
- 192f70f: Present single attachments as a read-only filename input with picker icon and
  clear action. Show multiple attachments in an input-style pill container with
  bounded filename widths and full filename hover text.
- 192f70f: Distinguish rejected file selections from validation errors using localized local
  warnings. Display file-operation feedback inline with a message popup in cells
  and themed text outside cells. Preserve existing data and form validity when a
  selection is rejected; report read failures as local operation errors.
- 192f70f: Derive attachment presence from form data after remounting. Recover stored
  filenames when available, otherwise show a localized attachment label. Hide
  the browser picker's transient filename display so it cannot contradict the
  persisted single-file or multiple-file values.
- c35c46f: Capture rendered column widths when resizing begins and adjust the total table width so resizing one column does not redistribute space into neighboring columns.
- 5f4f312: Show direct array-item validation errors on imported multi-select pills and their field, preserving invalid stored choices until removed.
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
- 829c8a0: Use the portable 16px default gap for rows and columns. Antd layout containers suppress native Form.Item bottom margins to avoid doubled spacing. Explicit layout/config gaps, including zero, retain precedence.
- 192f70f: Preserve resolved object Group layouts and use them as the single object boundary.
  Place Additional Properties inside the group without its own enclosing border;
  skip empty static content while retaining titles and group behavior.
- e6b03a4: Place dynamic property names and actions in a separate header row above their editors. Antd structured mixed controls also place the label above the type selector and expansion toggle, retaining full-width expanded content.
- 192f70f: Keep dynamic-property name validation indicators and rename/delete actions in
  one vertically centered horizontal row, including editors with their own labels.
- 192f70f: Show invalid property names once, in the error color with their validation icon
  beside the label. Keep rename and delete actions on the right.
- 192f70f: Explain the specific property-name constraints in Add/Rename validation and show
  name errors for scalar properties whose editor supplies its own heading.
- 192f70f: Place propertyNames errors beside the offending dynamic property name instead of
  at the object boundary. Validate full name constraints for Add and Rename,
  including unchanged invalid names and validation without an injected validator.
- 46c2085: Support config.jsonformsExtended.radio.vertical as the default radio layout, overridden by the control's options.vertical.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- e6b03a4: Show the recursive tree root's rename action on hover or focus, matching other row actions. Keep the mixed tree's primitive-visibility toggle always visible.
- 829c8a0: Recognize explicit discriminators in recursive referenced branches even when a nested value is invalid. Initialize shadcn oneOf object branches on selection using the shared confirmation policy. Add regression coverage for the recursive tree spec example and finite child creation.
- e6b03a4: Expose rename and delete actions on recursive tree rows. Rename edits the configured label property with schema validation. Delete removes child nodes with confirmation and respects minimum collection size and read-only constraints. The displayed root cannot be deleted.
- 5f4f312: Use shared localized rename-dialog titles, descriptions, field labels and action text in the React Antd and Shadcn renderer sets.
- 46c2085: Use icon buttons with translated native tooltips and accessible labels for row detail actions.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
- 613ab8e: Add a shadcn cron control selected by schema format or UI options, with a schedule
  picker, advanced expression editing, Apply/Cancel, readonly handling and shared
  cron parsing. Remove bundled German renderer translations and the default Antd
  German locale loader. Applications may still register their own translations.
- 9eb66d2: Render a sole anyOf or oneOf branch directly without a redundant tab or selector, retaining enclosing fields and branch validation.
- 46c2085: Show structured array validation summaries with separate translated messages, field and row context, an error count, and an expandable scrollable list. Use native popovers for interactive summary actions.
- 67fec78: Keep shadcn table cell validation icons beside their controls. Show nested validation errors on object and array cell summaries in both renderers, using the existing tooltip and multi-error summary feedback and respecting validation visibility.
- c7ff4dc: Support columnDefs to select and order table fields and specify width, minWidth and maxWidth in pixels, independently of the full row detail form.
- 6e346b0: Add pointer and keyboard column resizing to regular tables, honoring columnDefs width limits and retaining resized widths during row edits and pagination.
- 67fec78: Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
- 172887e: Replace per-row table deletion with selection checkboxes and a translated header delete action. Bulk deletion honors readonly, disableRemove, restrict/minItems and the table confirmation policy. Clear selection when array data changes to avoid stale indexes.
- c35c46f: Theme table column resize handles using Antd tokens and shadcn CSS variables. Use subtle inset separators, highlight hover and dragging, and preserve keyboard focus indicators and the wider grab area.
- 46c2085: Resolve tuple orientation from local options.vertical, then config.jsonformsExtended.tuple.vertical. Ignore generic config.vertical.
- 829c8a0: Preserve object-only array slots as empty objects when clearing a oneOf choice. Add a translated clear action in shadcn. Recursive tree examples initialize unselected nodes explicitly and apply whole-object defaults only after branch selection.
- c5373f0: Keep hook order stable when template and mixed controls become visible. Name generated components for debugging and remove redundant exports discovered by shared workspace linting.
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
- Updated dependencies [5f4f312]
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
- Updated dependencies [5f4f312]
- Updated dependencies [829c8a0]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [67fec78]
- Updated dependencies [c7ff4dc]
- Updated dependencies [6e346b0]
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [5f4f312]
- Updated dependencies [c35c46f]
- Updated dependencies [829c8a0]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
