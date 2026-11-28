# @chobantonov/jsonforms-react-antd-extended-renderers

## 0.1.0

### Minor Changes

- 613ab8e: Support collapsible and initially collapsed array panels in table, expandable, list-with-detail, and AG Grid presentations. Keep body contents mounted and preserve independent item expansion.

### Patch Changes

- 67fec78: Supply native eye icons for AG Grid detail-panel header toggles and pin the compact edit-details action column to the right so it remains visible during horizontal scrolling.
- 67fec78: Support AG Grid whole-row details in Ant Design and shadcn using options.rowDetail, with custom item UI schemas, draft dialogs, and resizable right or bottom panels shared with normal tables. Preserve source row paths when sorting or filtering and keep detail selection independent of bulk deletion.
- 172887e: Use a shared 8px gap between array header actions for regular tables and AG Grid.
- 935122d: Support portable Button options.fullWidth, default false. Fill the allocated layout cell without changing its width, span or weight; use native Ant Design block and shadcn width utilities.
- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- 192f70f: Unify array feedback across tables and AG Grid: show direct validation messages
  followed by a localized child-error notice, with counts only when requested.
  Show object-only errors beside object Group titles or above unframed fields.
- 701760d: Remove unused direct dependencies and peer requirements, and drop unused locale reexport files. Name the common English and Bulgarian locale catalogs consistently, with `i18nDefaults` available from the locale index as an alias for English. Declare React DOM for the extended renderer's portal support while retaining the masking engine in renderer-common and the shadcn UI runtime dependencies actually imported by the Web Component.
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- ddcbc4c: Render portable start and end input adornments with localized text, semantic icons, accessible tooltips, and placement outside native picker, clear, and reveal controls.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 192f70f: Use the native error indicator for row validation in tables and AG Grid. Show the translated error count in its tooltip and accessible name instead of a warning triangle and visible number. Keep the AG Grid indicator separate from the row edit button.
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
- 3b749cb: Accept compatible Ant Design 6 and icon 6 releases as peer dependencies while centralizing repeated workspace dependency versions in pnpm catalogs.
- c2a41de: Remove unused module exports, duplicate default exports, and compatibility reexports that no renderer consumes. Registered renderers and runtime behavior remain unchanged.
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
- Updated dependencies [172887e]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [172887e]
- Updated dependencies [829c8a0]
- Updated dependencies [829c8a0]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
- Updated dependencies [829c8a0]
- Updated dependencies [f016132]
- Updated dependencies [46c2085]
- Updated dependencies [b8f7408]
- Updated dependencies [829c8a0]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [5c4257a]
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
- Updated dependencies [1f653b4]
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
- Updated dependencies [192f70f]
- Updated dependencies [1e97980]
- Updated dependencies [613ab8e]
- Updated dependencies [829c8a0]
- Updated dependencies [c35c46f]
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
- Updated dependencies [192f70f]
- Updated dependencies [63ac9eb]
- Updated dependencies [e6b03a4]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [192f70f]
- Updated dependencies [46c2085]
- Updated dependencies [613ab8e]
- Updated dependencies [e6b03a4]
- Updated dependencies [e6b03a4]
- Updated dependencies [829c8a0]
- Updated dependencies [e6b03a4]
- Updated dependencies [c2a41de]
- Updated dependencies [5f4f312]
- Updated dependencies [829c8a0]
- Updated dependencies [46c2085]
- Updated dependencies [192f70f]
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [67fec78]
- Updated dependencies [7df33d8]
- Updated dependencies [c2a41de]
- Updated dependencies [c2a41de]
- Updated dependencies [3b749cb]
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
- Updated dependencies [46c2085]
- Updated dependencies [829c8a0]
- Updated dependencies [717e288]
- Updated dependencies [717e288]
- Updated dependencies [c5373f0]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
  - @chobantonov/jsonforms-react-antd-renderers@0.1.0
  - @chobantonov/jsonforms-react-extended-renderers@0.1.0
