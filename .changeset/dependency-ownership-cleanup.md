---
'@chobantonov/jsonforms-react-antd-extended-renderers': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-extended-renderers': patch
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-shadcn-webcomponent': patch
---

Remove unused direct dependencies and peer requirements, and drop unused locale reexport files. Name the common English and Bulgarian locale catalogs consistently, with `i18nDefaults` available from the locale index as an alias for English. Declare React DOM for the extended renderer's portal support while retaining the masking engine in renderer-common and the shadcn UI runtime dependencies actually imported by the Web Component.
