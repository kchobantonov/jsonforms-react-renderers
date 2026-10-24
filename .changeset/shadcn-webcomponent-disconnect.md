---
'@chobantonov/jsonforms-react-shadcn-webcomponent': patch
---

Defer disconnected element cleanup until the host React commit completes, and reuse the root when an element reconnects immediately.
