---
"@chobantonov/jsonforms-react-renderer-common": patch
"@chobantonov/jsonforms-react-shadcn-renderers": patch
"@chobantonov/jsonforms-react-antd-renderers": patch
---

Resolve array detail modes through JSON Forms core in shadcn and shared row detail editors used by both renderer sets. Preserve DEFAULT array selection and registry fallback, and verify Antd/shadcn parity for generated, registered, custom-string, and inline layouts. GENERATE bypasses the registry; GENERATED retains upstream registry-first behavior.
