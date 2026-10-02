---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Preserve composition constraints when delegating a mixed value to its selected type. Narrow explicitly typed composition branches, keep untyped and overlapping alternatives, and preserve boolean array item schemas. Add Antd and shadcn integration coverage and mixed-control specification examples.

Render enclosing object properties alongside allOf branches in shadcn, matching Antd.
