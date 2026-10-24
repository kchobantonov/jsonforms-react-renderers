---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Add validateActiveBranch (default true) to global config and control options. A control override takes precedence. Disabling it skips additional branch compilation and validation while retaining document validation. Document the rationale, cost and local-feedback semantics and demonstrate both settings in the mixed-control example.
