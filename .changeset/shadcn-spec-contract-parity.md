---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
'@chobantonov/jsonforms-react-extended-renderers': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-antd-extended-renderers': patch
---

Expand shadcn specification contract tests to cover the behavioral cases exercised by Ant Design, including property editing, confirmation policies, localization, validation, array expansion, temporal constraints, and extended editor integration.

Fix isolated property references, cyclic UI schema fallback, translated actions, logical array expansion and sorting, searchable finite choices, and temporal bounds, precision, and RFC 3339 serialization uncovered by those tests.

Run the same registry-level additional-property clearing contract against both renderer families and preserve cleared empty and dotted Ant Design property names.

Share button action, script permission, diagnostic, and pending-state behavior across Ant Design and shadcn.

Connect shadcn grid deletion to confirmation policies, distinguish unset and invalid null/boolean states, and honor markup typography options with native styling.

Refresh the inferred shadcn composition branch when externally supplied data changes its discriminator, while retaining explicit user selection.

Centralize shared object detail assembly, deletion-confirmation binding, composition selection checks, temporal picker state, and test navigation support; remove an unused temporal export.
