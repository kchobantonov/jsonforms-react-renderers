# @chobantonov/jsonforms-react-shadcn-webcomponent

## 0.1.0

### Minor Changes

- feaf9e8: Prepare the first public Web Component releases at 0.1.0 alongside the renderer packages. Package versions are independent of JSON Forms versions.
- acf2f07: Expose the element’s additional error store so hosts can publish server validation errors and clear them when the corresponding field changes.

### Patch Changes

- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- 46c2085: Support the focused collection examples with table pagination, whole-row dialog editing, resizable side/bottom detail panels, and opt-in dynamic-property pagination. Use native Antd components and pinned upstream shadcn Pagination, Dialog and Resizable components.
- 701760d: Remove unused direct dependencies and peer requirements, and drop unused locale reexport files. Name the common English and Bulgarian locale catalogs consistently, with `i18nDefaults` available from the locale index as an alias for English. Declare React DOM for the extended renderer's portal support while retaining the masking engine in renderer-common and the shadcn UI runtime dependencies actually imported by the Web Component.
- 67fec78: Keep detail dialogs centered with a scrollable body and a fixed footer. Preserve shadcn web component dialog styling by keeping portals inside the shadow tree.
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
- 613ab8e: Move generated shadcn/ui components and their dependencies into the consuming
  hosts. React applications must now install the required components and map
  `@jsonforms-react-shadcn-ui/*` to their component directory. Import UI primitives
  from the application instead of the renderer package. The Web Component owns
  its component implementations and resolves the alias during its build.
  
  Add primitive controls, editable cells, typed enum values, array confirmation,
  and native shadcn resizable layouts, with expanded behavioral coverage.
- 613ab8e: Show array and cell validation through compact focusable icons with app-owned shadcn tooltips. Invalid cells receive a red border and a trailing error indicator instead of inline error paragraphs. Consumers must supply the tooltip module.
- 613ab8e: Forward Button refs in React 18 hosts so collapsible and tooltip triggers work without ref warnings. Preserve the upstream snapshot and apply the compatibility change through the shared sync script.
- 613ab8e: Use application-owned shadcn Base UI Collapsible components for collapsible groups, preserving mounted fields and translated data indicators. Consuming apps must provide the collapsible module alongside their other shadcn components.
- 613ab8e: Use compact shadcn icon-sm buttons for array toolbar actions, matching Svelte sizing. Host Button components must support icon-sm.
- 0e2de28: Keep validation error text, icons, and borders readable in the dark shadcn theme.
- 613ab8e: Forward dialog overlay refs in React 18 hosts to prevent warnings when opening confirmation dialogs. Apply the compatibility transform during upstream synchronization in both hosts.
- 613ab8e: Forward native Input refs in both React 18 shadcn hosts so file controls can open and reset the picker without ref warnings. Apply the compatibility transform through the upstream sync script.
- 613ab8e: Use shadcn Item and Avatar components for list-with-detail arrays, with per-row delete actions and support for hideAvatar.
- 613ab8e: Use the upstream shadcn Breadcrumb components for mixed value navigation. Add the pinned component to both hosts and the upstream sync manifest.
- 67fec78: Use the pinned upstream shadcn Scroll Area for list navigation, row detail panes and dialog bodies, with themed scrollbars on both axes.
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
- 46c2085: Defer disconnected element cleanup until the host React commit completes, and reuse the root when an element reconnects immediately.
- 46c2085: Wait for schema or data before mounting the form, and use the extended validator and form context in web component mode.
- 46c2085: Accept translation functions in the web component so demo example messages and locale changes match the React view.
- c2a41de: Share Web Component JSON input parsing, boolean and mode handling, and translation fallback logic between the AntD and shadcn hosts. Share tuple-tail operations, tuple position writes and layout resolution, and mixed-value selection, type changes, and tree setup through renderer-common while keeping each renderer's presentation.
  
  Share the host property setters and observed attribute names. Reuse the numeric input implementation for AntD integer and decimal editors and the plain record check for dynamic UI expressions.
- de9ecaf: Add standalone browser module distributions for plain HTML hosts and npm CDNs.
- 7bf670f: Update PostCSS to 8.5.34 and manage its version through the shared workspace catalog.
- 717e288: Update Maska, Sucrase, and React Day Picker to their latest patch releases.
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
- Updated dependencies [613ab8e]
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
- Updated dependencies [613ab8e]
- Updated dependencies [613ab8e]
- Updated dependencies [46c2085]
- Updated dependencies [46c2085]
- Updated dependencies [46c2085]
- Updated dependencies [613ab8e]
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
  - @chobantonov/jsonforms-react-shadcn-extended-renderers@0.1.0
