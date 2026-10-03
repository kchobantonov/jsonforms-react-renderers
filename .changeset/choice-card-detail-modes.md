---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
---

Fix oneOf choice-card branch details in Antd and shadcn to resolve generated, registered, and inline UI schemas through the shared detail resolver. Resolve referenced branch schemas before registry lookup, fall back to generation when no registration matches, and preserve the branch data scope when editing. Add regression coverage for detail modes and the translated choice-controls example.
