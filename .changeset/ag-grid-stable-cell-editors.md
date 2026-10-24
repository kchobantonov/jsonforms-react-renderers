---
'@chobantonov/jsonforms-react-extended-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Keep AG Grid cell renderer functions stable across form-data changes so typing does not recreate editors. Resolve label summaries through the latest data and cache without replacing cell renderers. Add clear actions to shadcn text and numeric cells.
