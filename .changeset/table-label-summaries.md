---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-extended-renderers': patch
---

Support Label cell summaries using the existing renderer registry and a gated item namespace for the current row, preserving data as the form root. Add whole-row column binding with scope '#', keeping summary, detail and dialog configuration unified for normal tables and AG Grid. Label summaries omit object/array type icons. Presentation-only Label columns omit editing actions; row-bound columns never clear the whole row.
