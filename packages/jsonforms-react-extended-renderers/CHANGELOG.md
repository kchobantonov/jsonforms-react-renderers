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
- 192f70f: Use an icon button for collection error navigation, with a translated tooltip and accessible name in normal tables and AG Grid.
- 192f70f: Add collection error counts and navigation to off-page row details, plus row error counts. Share descendant-error indexes across cells. Sort and filter Markdown Label summaries by readable text with bounded summary caching. Explain when AG Grid filters hide a newly added item and provide an explicit Clear filters action.
- b8f7408: Show compact image warnings with an icon and focusable explanation tooltip. Omit blocked source URLs so long data URLs cannot expand the form layout.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
- 1e97980: Use Control-based composite summaries for AG Grid sorting and filtering, so nested displayed values such as a contact city are searchable in both renderer families.
- 613ab8e: Preserve generated AG Grid cell renderer identities across data edits to avoid remounting active controls. Keep a single focus indication on borderless shadcn grid cell editors.
- 829c8a0: Use decoded filenames for AG Grid file-column filtering and sorting, including multiple-file cells. Exclude file contents, encoded payloads and MIME metadata from default search values.
- 192f70f: Defer indicator detail formatting until tooltip or popover opening. Use cached
  path lookups for presentation counts and memoize open summaries. AG Grid headers
  use a short accessible summary instead of formatting all descendant messages.
- 67fec78: Provide the current table item lazily through form context under the same item name used by expressions. Remove row paths from cell UI-schema options. Show a pending indicator while the interpolation evaluator loads, without flashing template expressions.
- e6b03a4: Add mixed structuredLayout code presentation using Monaco for the entire JSON value. Register section-specific schema validation, retain malformed drafts, publish syntax errors through the additional-error store without duplicating schema diagnostics, and block cell-dialog Apply while editor errors remain. Tree remains the default.
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
- 67fec78: Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
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
