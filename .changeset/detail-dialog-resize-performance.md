---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
---

Remove shadcn dialog geometry transition lag and batch dragging updates to animation frames. Resize the actual Ant Design dialog container instead of its wrapper so the resize grip changes the editor dimensions.
