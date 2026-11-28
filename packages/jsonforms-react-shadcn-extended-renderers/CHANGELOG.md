# @chobantonov/jsonforms-react-shadcn-extended-renderers

## 0.1.0

### Minor Changes

- 613ab8e: Support collapsible and initially collapsed array panels in table, expandable, list-with-detail, and AG Grid presentations. Keep body contents mounted and preserve independent item expansion.

### Patch Changes

- 67fec78: Supply native eye icons for AG Grid detail-panel header toggles and pin the compact edit-details action column to the right so it remains visible during horizontal scrolling.
- 192f70f: Include descendant row errors in AG Grid array header validation, respecting validation visibility. Show the standard shadcn error indicator beside the array title, matching normal tables and Ant Design.
- 67fec78: Support AG Grid whole-row details in Ant Design and shadcn using options.rowDetail, with custom item UI schemas, draft dialogs, and resizable right or bottom panels shared with normal tables. Preserve source row paths when sorting or filtering and keep detail selection independent of bulk deletion.
- 935122d: Support portable Button options.fullWidth, default false. Fill the allocated layout cell without changing its width, span or weight; use native Ant Design block and shadcn width utilities.
- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
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
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- ddcbc4c: Render portable start and end input adornments with localized text, semantic icons, accessible tooltips, and placement outside native picker, clear, and reveal controls.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 613ab8e: Move generated shadcn/ui components and their dependencies into the consuming
  hosts. React applications must now install the required components and map
  `@jsonforms-react-shadcn-ui/*` to their component directory. Import UI primitives
  from the application instead of the renderer package. The Web Component owns
  its component implementations and resolves the alias during its build.
  
  Add primitive controls, editable cells, typed enum values, array confirmation,
  and native shadcn resizable layouts, with expanded behavioral coverage.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
- 5c4257a: Map Button semantic colors to shadcn variants and remove legacy button styling that forced white text in dark mode. Preserve the host Button's theme, focus, hover, and disabled styles.
- 613ab8e: Honor colorSaveFormat hex3 for picker and text edits using shared nearest-channel rounding. Reject transparent edits with localized guidance rather than discarding alpha, and preserve untouched values.
- 613ab8e: Place the color picker inside the left edge of its text input, matching other picker controls and reserving the right edge for the clear action in forms and table cells.
- 613ab8e: Fix color swatches overlapping the text by using upstream Input styling without the legacy input padding override. Preserve spacing for the swatch and clear action.
- 613ab8e: Use compact shadcn icon-sm buttons for array toolbar actions, matching Svelte sizing. Host Button components must support icon-sm.
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
- 613ab8e: Show descriptions on focus unless showUnfocusedDescription is enabled, respecting control options over form configuration. Prioritize validation errors over descriptions.
- 67fec78: Focus row detail dialogs without selecting the first field. Keep widened native tables inside a horizontal scroll area, and share the compact edit icon button and translated tooltip between native tables and AG Grid.
- 613ab8e: Replace the legacy duration editor with a localized shadcn popover using shared
  duration behavior: weeks mode, active units, add/remove units, Apply/Cancel and
  immediate editing. Support duration selection through schema and UI formats,
  preserve validation messages and untouched duration spellings, and add a clear action.
- 613ab8e: Use compact maximize and restore icon buttons for the shadcn code editor,
  with tooltips and accessible names from the editor translation catalog.
- 613ab8e: Use the shared inline clear icon for file controls, honor clearable and readonly, and reset the native file selection when clearing.
- 613ab8e: Show a checkerboard swatch for empty colors and use full-size, borderless inputs inside AG Grid cells, leaving focus indication to the grid.
- 192f70f: Add shadcn mask controls using the shared mask engine, chips, multi-select,
  enum-array checkboxes, oneOf radio selection, scalar composition controls, and
  formatted-number and boolean-toggle cells.
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
- 613ab8e: Register date, time and date-time cells and expose shadcnExtendedCells for color,
  duration, cron and null. Reuse specialized form controls without field labels,
  preserve full cell paths on edits, and register both sets in the demo and web
  component. Center controls vertically in AG Grid rows and compact the color editor.
- c2a41de: Share composite dialog draft handling, composite cell presentation, confirmation state, scalar composition feedback, additional-property discovery, mixed tree behavior, and cron picker behavior across renderer sets. Reuse the shared additional-property schema resolver in the extended renderer so overlapping patterns retain all constraints. Keep toolkit-specific controls while applying the same invalid code-draft guard to both composite dialogs.
  
  Share mask editing and caret restoration across the two masked inputs while preserving their composition handling. Reuse mixed-schema type detection and keyword filtering in the generic renderer. Both renderer sets now use the same tuple editor, mixed detail dispatch, and allOf renderer. Duration controls share component formatting.
  
  Share object detail rendering, additional-property actions, validation summaries, and row detail presentation. AntD date and time pickers now use the same value and bounds handling. AntD also rechecks the current value and edit permissions before committing a confirmed mixed-tree deletion.
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [192f70f]
- Updated dependencies [1e97980]
- Updated dependencies [b8f7408]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [8bd776c]
- Updated dependencies [829c8a0]
- Updated dependencies [935122d]
- Updated dependencies [8bd776c]
- Updated dependencies [5c4257a]
- Updated dependencies [67fec78]
- Updated dependencies [db59bef]
- Updated dependencies [150fd68]
- Updated dependencies [5c4257a]
- Updated dependencies [46c2085]
- Updated dependencies [829c8a0]
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [b8f7408]
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
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [6e346b0]
- Updated dependencies [172887e]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [192f70f]
- Updated dependencies [172887e]
- Updated dependencies [b8f7408]
- Updated dependencies [46c2085]
- Updated dependencies [f016132]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [1e97980]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [c35c46f]
- Updated dependencies [5f4f312]
- Updated dependencies [5f4f312]
- Updated dependencies [424c461]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [e6b03a4]
- Updated dependencies [9eb66d2]
- Updated dependencies [e6b03a4]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [9eb66d2]
- Updated dependencies [e6b03a4]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [192f70f]
- Updated dependencies [9eb66d2]
- Updated dependencies [7a23d74]
- Updated dependencies [c2a41de]
- Updated dependencies [ddcbc4c]
- Updated dependencies [829c8a0]
- Updated dependencies [63ac9eb]
- Updated dependencies [e6b03a4]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [e6b03a4]
- Updated dependencies [5f4f312]
- Updated dependencies [829c8a0]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [5c4257a]
- Updated dependencies [613ab8e]
- Updated dependencies [192f70f]
- Updated dependencies [e6b03a4]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [4764910]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [46c2085]
- Updated dependencies [46c2085]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [172887e]
- Updated dependencies [829c8a0]
- Updated dependencies [5f4f312]
- Updated dependencies [829c8a0]
- Updated dependencies [46c2085]
- Updated dependencies [46c2085]
- Updated dependencies [613ab8e]
- Updated dependencies [67fec78]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [7a23d74]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [e3b6afa]
- Updated dependencies [46c2085]
- Updated dependencies [e3b6afa]
- Updated dependencies [67fec78]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [7df33d8]
- Updated dependencies [613ab8e]
- Updated dependencies [4764910]
- Updated dependencies [e3b6afa]
- Updated dependencies [613ab8e]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [c2a41de]
- Updated dependencies [c2a41de]
- Updated dependencies [c428d41]
- Updated dependencies [9eb66d2]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [67fec78]
- Updated dependencies [c7ff4dc]
- Updated dependencies [6e346b0]
- Updated dependencies [67fec78]
- Updated dependencies [172887e]
- Updated dependencies [5f4f312]
- Updated dependencies [c35c46f]
- Updated dependencies [c2a41de]
- Updated dependencies [829c8a0]
- Updated dependencies [717e288]
- Updated dependencies [717e288]
- Updated dependencies [c5373f0]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
  - @chobantonov/jsonforms-react-shadcn-renderers@0.1.0
  - @chobantonov/jsonforms-react-extended-renderers@0.1.0
