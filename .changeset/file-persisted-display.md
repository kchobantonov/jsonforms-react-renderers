---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
---

Derive attachment presence from form data after remounting. Recover stored
filenames when available, otherwise show a localized attachment label. Hide
the browser picker's transient filename display so it cannot contradict the
persisted single-file or multiple-file values.
