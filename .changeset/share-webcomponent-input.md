---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-antd-webcomponent': patch
'@chobantonov/jsonforms-react-shadcn-webcomponent': patch
---

Share Web Component JSON input parsing, boolean and mode handling, and translation fallback logic between the AntD and shadcn hosts. Share tuple-tail operations, tuple position writes and layout resolution, and mixed-value selection, type changes, and tree setup through renderer-common while keeping each renderer's presentation.

Share the host property setters and observed attribute names. Reuse the numeric input implementation for AntD integer and decimal editors and the plain record check for dynamic UI expressions.
