### First time setup

- Install [node.js](https://nodejs.org/) (only Node v18.19+ < 19 is currently supported)
- Install pnpm: <https://pnpm.io/installation> (use pnpm 8.6.2+)
- Clone this repository
- Install dependencies: `pnpm i --frozen-lockfile`

### Build & Testing

- Build (all packages): `pnpm run build`
- Build renderer packages: `pnpm run build:libs`
- Test (all packages): `pnpm run test`
- Clean generated package output: `pnpm run clean`
- Run React Ant Design examples: `pnpm run example:antd:dev`
- Run React PrimeReact examples: `pnpm run example:primereact:dev`
- Run React Shadcn UI examples: `pnpm run example:shadcn:dev`
- Run React MUI examples: `pnpm run example:mui:dev`
- Build examples app: `pnpm run examples-app:build`
- Run the examples selector: `pnpm run examples-app:dev`

### Workspace

- `packages/jsonforms-react-antd-renderers` - Ant Design renderer set.
- `packages/jsonforms-react-antd-extended-renderers` - optional advanced Ant Design renderers.
- `packages/jsonforms-react-antd-webcomponent` - Ant Design custom element.
- `packages/jsonforms-react-primereact-renderers` - PrimeReact renderer set.
- `packages/jsonforms-react-primereact-extended-renderers` - optional advanced PrimeReact renderers.
- `packages/jsonforms-react-primereact-webcomponent` - PrimeReact custom element.
- `packages/jsonforms-react-shadcn-renderers` - Shadcn UI renderer set.
- `packages/jsonforms-react-shadcn-extended-renderers` - optional advanced Shadcn UI renderers.
- `packages/jsonforms-react-shadcn-webcomponent` - Shadcn UI custom element.
- `packages/jsonforms-react-mui-extended-renderers` - optional advanced MUI renderers layered on top of `@jsonforms/material-renderers`.
- `packages/jsonforms-react-mui-webcomponent` - MUI custom element backed by `@jsonforms/material-renderers`.
- `packages/jsonforms-react-extended-renderers` - shared extended renderers.
- `packages/jsonforms-react-demo-common` - shared React demo state, editor plumbing, UI adapter contracts, and examples; each renderer demo supplies its own UI-library shell and controls.
- `apps/jsonforms-react-antd-demo` - Ant Design demo app.
- `apps/jsonforms-react-primereact-demo` - PrimeReact demo app.
- `apps/jsonforms-react-shadcn-demo` - Shadcn UI demo app.
- `apps/jsonforms-react-mui-demo` - MUI demo app.
- `apps/jsonforms-react-examples-app` - aggregated React examples app.

### Implementation specification

See [Renderer Set and Demo Application Specification](docs/renderer-set-and-demo-specification.md)
for the required demo layout, settings, renderer behavior, Web Component
parity, project structure, and acceptance checklist for new UI-library
renderer sets.
