# @chobantonov/jsonforms-react-antd-webcomponent

## 0.1.0

### Minor Changes

- feaf9e8: Prepare the first public Web Component releases at 0.1.0 alongside the renderer packages. Package versions are independent of JSON Forms versions.
- acf2f07: Expose the element’s additional error store so hosts can publish server validation errors and clear them when the corresponding field changes.

### Patch Changes

- db59bef: Fix strict TypeScript errors in the renderers and web components, including table row callbacks, optional array actions, and validation messages. Formatted integer cells now support the standard JSON Forms cell props when custom formatters are absent.
- c2a41de: Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.
  
  Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
- 613ab8e: Adopt the Changesets release process, public package metadata, and workspace-aware internal peer dependencies. Validate built npm tarballs before publishing.
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
- c2a41de: Share Web Component JSON input parsing, boolean and mode handling, and translation fallback logic between the AntD and shadcn hosts. Share tuple-tail operations, tuple position writes and layout resolution, and mixed-value selection, type changes, and tree setup through renderer-common while keeping each renderer's presentation.
  
  Share the host property setters and observed attribute names. Reuse the numeric input implementation for AntD integer and decimal editors and the plain record check for dynamic UI expressions.
- 3b749cb: Accept compatible Ant Design 6 and icon 6 releases as peer dependencies while centralizing repeated workspace dependency versions in pnpm catalogs.
- de9ecaf: Add standalone browser module distributions for plain HTML hosts and npm CDNs.
- Updated dependencies [c35c46f]
- Updated dependencies [192f70f]
- Updated dependencies [67fec78]
- Updated dependencies [67fec78]
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
- Updated dependencies [192f70f]
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
- Updated dependencies [7df33d8]
- Updated dependencies [c2a41de]
- Updated dependencies [c2a41de]
- Updated dependencies [3b749cb]
- Updated dependencies [c428d41]
- Updated dependencies [9eb66d2]
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
- Updated dependencies [c5373f0]
  - @chobantonov/jsonforms-react-renderer-common@0.1.0
  - @chobantonov/jsonforms-react-antd-renderers@0.1.0
  - @chobantonov/jsonforms-react-antd-extended-renderers@0.1.0
