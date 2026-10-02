---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
---

Expose rename and delete actions on recursive tree rows. Rename edits the configured label property with schema validation. Delete removes child nodes with confirmation and respects minimum collection size and read-only constraints. The displayed root cannot be deleted.
