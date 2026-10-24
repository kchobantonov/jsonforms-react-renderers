---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
---

Use the portable 16px default gap for rows and columns. Antd layout containers suppress native Form.Item bottom margins to avoid doubled spacing. Explicit layout/config gaps, including zero, retain precedence.
