---
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
'@chobantonov/jsonforms-react-shadcn-webcomponent': patch
---

Move generated shadcn/ui components and their dependencies into the consuming
hosts. React applications must now install the required components and map
`@jsonforms-react-shadcn-ui/*` to their component directory. Import UI primitives
from the application instead of the renderer package. The Web Component owns
its component implementations and resolves the alias during its build.

Add primitive controls, editable cells, typed enum values, array confirmation,
and native shadcn resizable layouts, with expanded behavioral coverage.
