---
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Handle arrays without an items schema without crashing. Use the resolved array
schema supplied by JSON Forms when enforcing nested array item limits.
