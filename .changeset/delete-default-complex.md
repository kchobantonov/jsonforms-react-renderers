---
'@chobantonov/jsonforms-react-renderer-common': patch
---

Default all delete confirmation policies to complex: scalar values and empty containers delete immediately, while nonempty objects and arrays prompt. Preserve explicit element, renderer and global policy overrides.
