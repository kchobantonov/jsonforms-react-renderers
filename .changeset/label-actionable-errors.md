---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Hide validation indicators on Label cells without detail editors. For Label cells with explicit details, include only errors covered by the detail layout's controls, preserving complete row and collection error indicators in normal tables and AG Grid.
