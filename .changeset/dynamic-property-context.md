---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
---

Replace the internal dynamic-property UI-schema option with shared React context scoped to the property's path. Clearing dynamic values preserves their keys without changing normal clearing behavior for nested fields or allowing UI-schema options to override the context.
