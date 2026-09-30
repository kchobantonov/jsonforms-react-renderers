---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Replace per-row table deletion with selection checkboxes and a translated header delete action. Bulk deletion honors readonly, disableRemove, restrict/minItems and the table confirmation policy. Clear selection when array data changes to avoid stale indexes.
