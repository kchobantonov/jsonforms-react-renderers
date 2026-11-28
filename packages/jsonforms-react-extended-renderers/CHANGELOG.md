# @chobantonov/jsonforms-react-extended-renderers

## 0.1.0

### Minor Changes

- 613ab8e: Support collapsible and initially collapsed array panels in table, expandable, list-with-detail, and AG Grid presentations. Keep body contents mounted and preserve independent item expansion.
- 613ab8e: Move portable TypeScript authoring helpers to @chobantonov/jsonforms-extended-spec/typescript. Consumers must import the helpers from that package. Demo fixtures and authoring schemas now come from the locally linked spec project rather than duplicated files.

### Patch Changes

- 67fec78: Supply native eye icons for AG Grid detail-panel header toggles and pin the compact edit-details action column to the right so it remains visible during horizontal scrolling.
- 192f70f: Include descendant row errors in AG Grid array header validation, respecting validation visibility. Show the standard shadcn error indicator beside the array title, matching normal tables and Ant Design.
- 67fec78: Filter Label summary columns using their resolved text in both renderer families. Use the existing interpolation evaluator and dynamic-value access gate for row and root data.
- 67fec78: Use resolved Label summaries as AG Grid values for sorting and filtering while preserving the original cell editing binding and expression access gates.
- 67fec78: Preserve AG Grid body height inside shadcn side and bottom detail panes. After adding a grid row, navigate to its displayed page and scroll it into view, respecting sorting and active filters.
- 67fec78: Use portable columnDefs and scoped array pagination defaults in AG Grid. Explicit native grid pagination settings override corresponding portable settings, and native column definitions replace the portable list while supporting grouped and computed columns.
- 67fec78: Support AG Grid whole-row details in Ant Design and shadcn using options.rowDetail, with custom item UI schemas, draft dialogs, and resizable right or bottom panels shared with normal tables. Preserve source row paths when sorting or filtering and keep detail selection independent of bulk deletion.
- 192f70f: Keep AG Grid cell renderer functions stable across form-data changes so typing does not recreate editors. Resolve label summaries through the latest data and cache without replacing cell renderers. Add clear actions to shadcn text and numeric cells.
- 1e97980: Honor field-specific and keyword error translations when using AJV locale messages, retaining localized AJV text as the fallback.
- 935122d: Support portable Button options.fullWidth, default false. Fill the allocated layout cell without changing its width, span or weight; use native Ant Design block and shadcn width utilities.
- 8bd776c: Resolve template, editor, mask, array sort, item labels, text multiline, Group, Button fields and stable command names, ImageView, Spacer, layout options, typed detail schemas, and readonly UI/config inputs only from canonical authoring names and namespaces.
- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- 192f70f: Use an icon button for collection error navigation, with a translated tooltip and accessible name in normal tables and AG Grid.
- 192f70f: Add collection error counts and navigation to off-page row details, plus row error counts. Share descendant-error indexes across cells. Sort and filter Markdown Label summaries by readable text with bounded summary caching. Explain when AG Grid filters hide a newly added item and provide an explicit Clear filters action.
- b8f7408: Show compact image warnings with an icon and focusable explanation tooltip. Omit blocked source URLs so long data URLs cannot expand the form layout.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
- 701760d: Remove unused direct dependencies and peer requirements, and drop unused locale reexport files. Name the common English and Bulgarian locale catalogs consistently, with `i18nDefaults` available from the locale index as an alias for English. Declare React DOM for the extended renderer's portal support while retaining the masking engine in renderer-common and the shadcn UI runtime dependencies actually imported by the Web Component.
- f016132: Remove the unused Babel standalone dependency. Dynamic JSX templates continue to compile with Sucrase.
- 1e97980: Use Control-based composite summaries for AG Grid sorting and filtering, so nested displayed values such as a contact city are searchable in both renderer families.
- 613ab8e: Preserve generated AG Grid cell renderer identities across data edits to avoid remounting active controls. Keep a single focus indication on borderless shadcn grid cell editors.
- 829c8a0: Use decoded filenames for AG Grid file-column filtering and sorting, including multiple-file cells. Exclude file contents, encoded payloads and MIME metadata from default search values.
- 192f70f: Defer indicator detail formatting until tooltip or popover opening. Use cached
  path lookups for presentation counts and memoize open summaries. AG Grid headers
  use a short accessible summary instead of formatting all descendant messages.
- 67fec78: Provide the current table item lazily through form context under the same item name used by expressions. Remove row paths from cell UI-schema options. Show a pending indicator while the interpolation evaluator loads, without flashing template expressions.
- e6b03a4: Add mixed structuredLayout code presentation using Monaco for the entire JSON value. Register section-specific schema validation, retain malformed drafts, publish syntax errors through the additional-error store without duplicating schema diagnostics, and block cell-dialog Apply while editor errors remain. Tree remains the default.
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 829c8a0: Show required property markers in table and AG Grid headers, honoring cell, collection and global hideRequiredAsterisk settings.
  
  Remove initCollapsed: use collapsed for array-item initialization and accordion expansion. Update existing configurations to the new name.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
- 613ab8e: Render object and array columns with compact summaries and shadcn detail dialogs,
  including isolated Apply/Cancel drafts, readonly inspection and conflict checks.
  Support table presentation with the same cell registry and preserve explicit AG
  Grid column widths instead of shrinking them through default flex sizing.
  
  Match Svelte shadcn with accessible icon buttons for composite details, clearing,
  array add/remove/reorder actions, and the AG Grid toolbar.
- 613ab8e: Add a shadcn cron control selected by schema format or UI options, with a schedule
  picker, advanced expression editing, Apply/Cancel, readonly handling and shared
  cron parsing. Remove bundled German renderer translations and the default Antd
  German locale loader. Applications may still register their own translations.
- 67fec78: Focus row detail dialogs without selecting the first field. Keep widened native tables inside a horizontal scroll area, and share the compact edit icon button and translated tooltip between native tables and AG Grid.
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
- c428d41: Separate array and object cell summaries, simplify AG Grid column resolution, and organize shadcn array presentations into list, table, and item-panel components.
- 67fec78: Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
- c2a41de: Remove unused module exports, duplicate default exports, and compatibility reexports that no renderer consumes. Registered renderers and runtime behavior remain unchanged.
- 717e288: Update markdown-it to 15.0.3 for parser fixes and use its bundled TypeScript declarations.
- 717e288: Update Maska, Sucrase, and React Day Picker to their latest patch releases.
- c5373f0: Keep hook order stable when template and mixed controls become visible. Name generated components for debugging and remove redundant exports discovered by shared workspace linting.
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [b8f7408]
- Updated dependencies [613ab8e]
- Updated dependencies [8bd776c]
- Updated dependencies [829c8a0]
- Updated dependencies [8bd776c]
- Updated dependencies [5c4257a]
- Updated dependencies [67fec78]
- Updated dependencies [db59bef]
- Updated dependencies [150fd68]
- Updated dependencies [5c4257a]
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [c428d41]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [67fec78]
- Updated dependencies [89f8fa6]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [c35c46f]
- Updated dependencies [701760d]
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
- Updated dependencies [424c461]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [9eb66d2]
- Updated dependencies [e6b03a4]
- Updated dependencies [9eb66d2]
- Updated dependencies [9eb66d2]
- Updated dependencies [c2a41de]
- Updated dependencies [ddcbc4c]
- Updated dependencies [829c8a0]
- Updated dependencies [63ac9eb]
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
- Updated dependencies [7df33d8]
- Updated dependencies [c2a41de]
- Updated dependencies [c2a41de]
- Updated dependencies [c428d41]
- Updated dependencies [46c2085]
- Updated dependencies [67fec78]
- Updated dependencies [c7ff4dc]
- Updated dependencies [6e346b0]
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [5f4f312]
- Updated dependencies [c35c46f]
- Updated dependencies [829c8a0]
- Updated dependencies [717e288]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
