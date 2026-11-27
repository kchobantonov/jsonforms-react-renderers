---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-extended-renderers': patch
'@chobantonov/jsonforms-react-antd-extended-renderers': patch
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
'@chobantonov/jsonforms-react-antd-webcomponent': patch
'@chobantonov/jsonforms-react-shadcn-webcomponent': patch
---

Group the common package’s module entry points by feature and update the renderer and web component packages to use them. For example, import `useMixedRenderer` from `@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer`. The package root continues to expose its existing APIs.

Organize extended renderer components, hooks, cell adapters, and utilities by role. The Ant Design package now exports its duration helpers directly from the common package. Existing package-root imports continue to work.
