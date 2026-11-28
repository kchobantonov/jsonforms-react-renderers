# @chobantonov/jsonforms-react-renderer-common

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
- 46c2085: Show structured array validation summaries with separate translated messages, field and row context, an error count, and an expandable scrollable list. Use native popovers for interactive summary actions.

### Patch Changes

- c35c46f: Paginate tuple additional items with native controls and scoped jsonformsExtended.additionalItems.pagination defaults. Enable additional-items and additional-properties pagination by default with five entries per page; boolean false disables pagination, and local options override scoped config. Preserve fixed tuple positions and absolute indices across pages.
- 192f70f: Show disallowed-property validation errors beside the Additional Properties heading,
  including the offending property name and translated validation message.
- b8f7408: Resolve array detail modes through JSON Forms core in shadcn and shared row detail editors used by both renderer sets. Preserve DEFAULT array selection and registry fallback, and verify Antd/shadcn parity for generated, registered, custom-string, and inline layouts. GENERATE bypasses the registry; GENERATED retains upstream registry-first behavior.
- 8bd776c: Use the canonical localized branch-change confirmation text in the Antd oneOf
  dialog and remove the unused generic combinator confirmation catalog entries.
- 829c8a0: Deduplicate equivalent document and local branch errors in combinator editor feedback. Keep distinct targets, constraints and messages, and preserve document validation output.
- 8bd776c: Resolve template, editor, mask, array sort, item labels, text multiline, Group, Button fields and stable command names, ImageView, Spacer, layout options, typed detail schemas, and readonly UI/config inputs only from canonical authoring names and namespaces.
- 5c4257a: Skip complex-policy confirmation for choice-card branch changes that discard only a fixed discriminator. Retain confirmation for entered details and the always policy. Show the card focus ring for keyboard focus rather than pointer selection.
- 67fec78: Carry Label summary row metadata through the existing JSON Forms context so mixed source and built package imports retain the current item. Preserve the form root and expression access gates.
- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- 150fd68: Fix oneOf choice-card branch details in Antd and shadcn to resolve generated, registered, and inline UI schemas through the shared detail resolver. Resolve referenced branch schemas before registry lookup, fall back to generation when no registration matches, and preserve the branch data scope when editing. Add regression coverage for detail modes and the translated choice-controls example.
- c35c46f: Apply shared delete confirmation policies to additional properties and tuple trailing items in both renderer sets. Use localized native dialogs, recheck mutation permissions, and reject stale collection targets before deleting.
- 192f70f: Use an icon button for collection error navigation, with a translated tooltip and accessible name in normal tables and AG Grid.
- 192f70f: Add collection error counts and navigation to off-page row details, plus row error counts. Share descendant-error indexes across cells. Sort and filter Markdown Label summaries by readable text with bounded summary caching. Explain when AG Grid filters hide a newly added item and provide an explicit Clear filters action.
- c428d41: Translate the remaining pagination, row detail, and dialog actions into Bulgarian. Type-check the built-in Bulgarian catalog against the English message keys.
- 613ab8e: Apply the shared delete confirmation policy to composite cell removal. Default to confirming nonempty objects and arrays, honor configured overrides, and recheck the target before confirmed removal.
- 67fec78: Distinguish generated composite cell summaries with secondary italic text. Use localized field-not-specified and empty-object descriptions, reserve Not set for missing values, and keep actual data previews in normal typography.
- 192f70f: Make container validation counts opt-in with showValidationIndicatorCount. Include ListWithDetail bindings in structural container aggregation and correctly resolve nested root scopes without a trailing path separator.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
- 46c2085: Default collection pagination to five items per page, preserving explicit page size overrides.
- c35c46f: Default all delete confirmation policies to complex: scalar values and empty containers delete immediately, while nonempty objects and arrays prompt. Preserve explicit element, renderer and global policy overrides.
- 701760d: Remove unused direct dependencies and peer requirements, and drop unused locale reexport files. Name the common English and Bulgarian locale catalogs consistently, with `i18nDefaults` available from the locale index as an alias for English. Declare React DOM for the extended renderer's portal support while retaining the masking engine in renderer-common and the shadcn UI runtime dependencies actually imported by the Web Component.
- 67fec78: Add configurable sizes, maximize/restore, optional title dragging and resizing for cell and row detail dialogs. Fix shadcn initial dialog focus and show composite edit actions on hover/focus, with destructive-colored removal.
- 829c8a0: Support form-wide jsonformsExtended.dialog defaults with per-dialog overrides. Align Antd dialog top spacing with its viewport height limit so long forms scroll internally while their actions remain visible.
- 67fec78: Keep detail dialogs centered with a scrollable body and a fixed footer. Preserve shadcn web component dialog styling by keeping portals inside the shadow tree.
- 67fec78: Remove shadcn dialog geometry transition lag and batch dragging updates to animation frames. Resize the actual Ant Design dialog container instead of its wrapper so the resize grip changes the editor dimensions.
- 172887e: Support rowDetail.collapsed to initialize side and bottom detail panes as hidden. The default remains visible, and users can toggle the pane afterward.
- 172887e: Add translated icon buttons to show and hide side and bottom row detail panels while retaining the selected row.
- 172887e: Place the detail pane visibility toggle beside Add in the array header for both renderer sets.
- 829c8a0: Allow detail dialogs to move to viewport edges using their measured size and position, replacing fixed drag-distance limits. Recompute bounds at each drag to account for resizing.
- 613ab8e: Replace the internal dynamic-property UI-schema option with shared React context scoped to the property's path. Clearing dynamic values preserves their keys without changing normal clearing behavior for nested fields or allowing UI-schema options to override the context.
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
- 424c461: Update JSON Forms core and React compatibility to 3.9.0-alpha.4.
- 192f70f: Hide validation indicators on Label cells without detail editors. For Label cells with explicit details, include only errors covered by the detail layout's controls, preserving complete row and collection error indicators in normal tables and AG Grid.
- 192f70f: Defer indicator detail formatting until tooltip or popover opening. Use cached
  path lookups for presentation counts and memoize open summaries. AG Grid headers
  use a short accessible summary instead of formatting all descendant messages.
- 67fec78: Provide the current table item lazily through form context under the same item name used by expressions. Remove row paths from cell UI-schema options. Show a pending indicator while the interpolation evaluator loads, without flashing template expressions.
- 829c8a0: Show missing required discriminator feedback on the oneOf selector when the discriminator's separate field is omitted from branch layouts. Include English and Bulgarian guidance and accessible invalid state.
- 829c8a0: Honor initial accordion collapse configuration and share Group expansion settings with mixed object/array frames. Local options override global defaults; tree-node expansion remains independent.
- 9eb66d2: Preserve composition constraints when delegating a mixed value to its selected type. Narrow explicitly typed composition branches, keep untyped and overlapping alternatives, and preserve boolean array item schemas. Add Antd and shadcn integration coverage and mixed-control specification examples.
  
  Render enclosing object properties alongside allOf branches in shadcn, matching Antd.
- e6b03a4: Preserve the selected scalar type when clearing a value owned by a mixed type selector, including root values and tree details. Strings reset to the empty string; numbers and integers reset to zero. Clearing the type still removes the value. Ordinary scalar controls retain their existing clearing behavior.
- 9eb66d2: Preserve explicit Number/Integer editor selection for mixed numeric values without resetting data. Show a localized whole-number error when Integer is selected for a fractional value. Prevent Antd integer inputs from committing fractions.
- 9eb66d2: Add validateActiveBranch (default true) to global config and control options. A control override takes precedence. Disabling it skips additional branch compilation and validation while retaining document validation. Document the rationale, cost and local-feedback semantics and demonstrate both settings in the mixed-control example.
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- ddcbc4c: Render portable start and end input adornments with localized text, semantic icons, accessible tooltips, and placement outside native picker, clear, and reveal controls.
- 829c8a0: Use the portable 16px default gap for rows and columns. Antd layout containers suppress native Form.Item bottom margins to avoid doubled spacing. Explicit layout/config gaps, including zero, retain precedence.
- 63ac9eb: Keep dynamic additional-property keys and editors when their values are cleared. Clearing a string stores an empty string, including when the schema defines a nonempty default. Explicit Delete remains responsible for removing the property.
- 192f70f: Explain the specific property-name constraints in Add/Rename validation and show
  name errors for scalar properties whose editor supplies its own heading.
- 192f70f: Place propertyNames errors beside the offending dynamic property name instead of
  at the object boundary. Validate full name constraints for Add and Rename,
  including unchanged invalid names and validation without an injected validator.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 829c8a0: Recognize explicit discriminators in recursive referenced branches even when a nested value is invalid. Initialize shadcn oneOf object branches on selection using the shared confirmation policy. Add regression coverage for the recursive tree spec example and finite child creation.
- e6b03a4: Expose rename and delete actions on recursive tree rows. Rename edits the configured label property with schema validation. Delete removes child nodes with confirmation and respects minimum collection size and read-only constraints. The displayed root cannot be deleted.
- 5f4f312: Use shared localized rename-dialog titles, descriptions, field labels and action text in the React Antd and Shadcn renderer sets.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
- 613ab8e: Add a shadcn cron control selected by schema format or UI options, with a schedule
  picker, advanced expression editing, Apply/Cancel, readonly handling and shared
  cron parsing. Remove bundled German renderer translations and the default Antd
  German locale loader. Applications may still register their own translations.
- 7df33d8: Expand shadcn specification contract tests to cover the behavioral cases exercised by Ant Design, including property editing, confirmation policies, localization, validation, array expansion, temporal constraints, and extended editor integration.
  
  Fix isolated property references, cyclic UI schema fallback, translated actions, logical array expansion and sorting, searchable finite choices, and temporal bounds, precision, and RFC 3339 serialization uncovered by those tests.
  
  Run the same registry-level additional-property clearing contract against both renderer families and preserve cleared empty and dotted Ant Design property names.
  
  Share button action, script permission, diagnostic, and pending-state behavior across Ant Design and shadcn.
  
  Connect shadcn grid deletion to confirmation policies, distinguish unset and invalid null/boolean states, and honor markup typography options with native styling.
  
  Refresh the inferred shadcn composition branch when externally supplied data changes its discriminator, while retaining explicit user selection.
  
  Centralize shared object detail assembly, deletion-confirmation binding, composition selection checks, temporal picker state, and test navigation support; remove an unused temporal export.
  
  Separate shadcn temporal presentation, time picker inputs, and array item actions into focused helpers and components while preserving their behavior.
  
  Localize default shadcn date, time, and date-time placeholders through the renderer catalogs, including Bulgarian defaults, while preserving explicit UI schema and configuration placeholders.
  
  Translate renderer-owned controls, actions, accessible names, calendar text, and diagnostics with locale-aware fallbacks. Preserve localization adapters during shadcn synchronization and support own nested translation catalog keys in both web-component wrappers.
- c2a41de: Share composite dialog draft handling, composite cell presentation, confirmation state, scalar composition feedback, additional-property discovery, mixed tree behavior, and cron picker behavior across renderer sets. Reuse the shared additional-property schema resolver in the extended renderer so overlapping patterns retain all constraints. Keep toolkit-specific controls while applying the same invalid code-draft guard to both composite dialogs.
  
  Share mask editing and caret restoration across the two masked inputs while preserving their composition handling. Reuse mixed-schema type detection and keyword filtering in the generic renderer. Both renderer sets now use the same tuple editor, mixed detail dispatch, and allOf renderer. Duration controls share component formatting.
  
  Share object detail rendering, additional-property actions, validation summaries, and row detail presentation. AntD date and time pickers now use the same value and bounds handling. AntD also rechecks the current value and edit permissions before committing a confirmed mixed-tree deletion.
- c2a41de: Share Web Component JSON input parsing, boolean and mode handling, and translation fallback logic between the AntD and shadcn hosts. Share tuple-tail operations, tuple position writes and layout resolution, and mixed-value selection, type changes, and tree setup through renderer-common while keeping each renderer's presentation.
  
  Share the host property setters and observed attribute names. Reuse the numeric input implementation for AntD integer and decimal editors and the plain record check for dynamic UI expressions.
- c428d41: Separate array and object cell summaries, simplify AG Grid column resolution, and organize shadcn array presentations into list, table, and item-panel components.
- 67fec78: Keep shadcn table cell validation icons beside their controls. Show nested validation errors on object and array cell summaries in both renderers, using the existing tooltip and multi-error summary feedback and respecting validation visibility.
- c7ff4dc: Support columnDefs to select and order table fields and specify width, minWidth and maxWidth in pixels, independently of the full row detail form.
- 6e346b0: Add pointer and keyboard column resizing to regular tables, honoring columnDefs width limits and retaining resized widths during row edits and pagination.
- 67fec78: Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
- 172887e: Replace per-row table deletion with selection checkboxes and a translated header delete action. Bulk deletion honors readonly, disableRemove, restrict/minItems and the table confirmation policy. Clear selection when array data changes to avoid stale indexes.
- 5f4f312: Resolve temporal picker restriction from local `options.restrict` and flat `config.restrict`. Ignore the removed nested restriction key.
- c35c46f: Theme table column resize handles using Antd tokens and shadcn CSS variables. Use subtle inset separators, highlight hover and dragging, and preserve keyboard focus indicators and the wider grab area.
- 829c8a0: Preserve object-only array slots as empty objects when clearing a oneOf choice. Add a translated clear action in shadcn. Recursive tree examples initialize unselected nodes explicitly and apply whole-object defaults only after branch selection.
- 717e288: Update Maska, Sucrase, and React Day Picker to their latest patch releases.
