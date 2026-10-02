---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
---

Preserve object-only array slots as empty objects when clearing a oneOf choice. Add a translated clear action in shadcn. Recursive tree examples initialize unselected nodes explicitly and apply whole-object defaults only after branch selection.
