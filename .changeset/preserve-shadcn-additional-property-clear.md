---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
---

Keep dynamic additional-property keys and editors when their values are cleared. Clearing a string stores an empty string, including when the schema defines a nonempty default. Explicit Delete remains responsible for removing the property.
