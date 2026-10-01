---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
---

Place propertyNames errors beside the offending dynamic property name instead of
at the object boundary. Validate full name constraints for Add and Rename,
including unchanged invalid names and validation without an injected validator.
