---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
---

Preserve the selected scalar type when clearing a value owned by a mixed type selector, including root values and tree details. Strings reset to the empty string; numbers and integers reset to zero. Clearing the type still removes the value. Ordinary scalar controls retain their existing clearing behavior.
