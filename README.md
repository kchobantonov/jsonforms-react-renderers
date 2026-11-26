# JSON Forms React renderers

A pnpm monorepo for JSON Forms React renderer sets built with Ant Design and
shadcn/ui. Each family has base and extended renderers, a demo application, and
a Web Component. Shared packages supply extended behavior and renderer utilities.

The [JSON Forms Extended Specification](https://github.com/kchobantonov/jsonforms-extended-spec)
defines portable behavior and UI Schema options. This workspace consumes
`@chobantonov/jsonforms-extended-spec@0.2.0`; the manifests and lockfile record
the version used by the demos and tests.

## Packages

| Family     | Base renderers                                                                            | Extended renderers                                                                                          | Web Component                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Ant Design | [`jsonforms-react-antd-renderers`](packages/jsonforms-react-antd-renderers/README.md)     | `@chobantonov/jsonforms-react-antd-extended-renderers`                                                      | [`jsonforms-react-antd-webcomponent`](packages/jsonforms-react-antd-webcomponent/README.md)     |
| shadcn/ui  | [`jsonforms-react-shadcn-renderers`](packages/jsonforms-react-shadcn-renderers/README.md) | [`jsonforms-react-shadcn-extended-renderers`](packages/jsonforms-react-shadcn-extended-renderers/README.md) | [`jsonforms-react-shadcn-webcomponent`](packages/jsonforms-react-shadcn-webcomponent/README.md) |

`@chobantonov/jsonforms-react-extended-renderers` contains the shared
`ExtendedJsonForms` component and extended controls;
`@chobantonov/jsonforms-react-renderer-common` holds shared renderer utilities.
The demos are in `apps/`; `jsonforms-react-demo-common` is private demo support.
The examples app combines the two demos into one selector.

The shadcn renderer follows the consuming application's component ownership
model. Its [setup guide](packages/jsonforms-react-shadcn-renderers/README.md)
lists the required components, aliases, and styles.

## Get started

Use Node 22.18+ within Node 22 and the pinned pnpm version. Install
[Vite+](https://viteplus.dev/guide/) and run:

```sh
vp install --frozen-lockfile
vp run build:libs
vp run example:antd:dev
# Or: vp run example:shadcn:dev
```

For a combined example selector, run `vp run examples-app:dev`. The default
catalog loads portable spec examples and original JSON Forms examples. See the
[demo example guide](docs/demo-examples.md) to add a host example.

For a plain HTML host, start with the [Ant Design Web Component guide](packages/jsonforms-react-antd-webcomponent/README.md)
or the [shadcn Web Component guide](packages/jsonforms-react-shadcn-webcomponent/README.md).

## Documentation

- [React renderer features](docs/renderer-features.md): layouts, extended controls, and React-specific limits.
- [Dynamic UI overlays](docs/dynamic-ui.md): the `ExtendedJsonForms` props and experimental `$dynamic` setup.
- [Shared renderer architecture](docs/renderer-common.md): package boundaries and UI ownership.
- [Development checks](docs/linting-and-formatting.md): build, test, lint, and format commands.
- [Release guide](.changeset/README.md): Changesets and package validation.
- [Renderer and demo contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/renderer-and-demo.md): shared acceptance requirements.

## Development and releases

Run `pnpm run lint` and `pnpm run check-format` before reporting renderer work
complete. Run `pnpm run test` for the workspace tests and `vp run build` for
all packages and demos. See [development checks](docs/linting-and-formatting.md)
for focused commands.

Public packages form one fixed Changesets group. Add a changeset for a
publishable package change with `pnpm changeset`; private demos do not need
one. Merge to `master` to open or update the release pull request, then merge
that pull request to publish. The [release guide](.changeset/README.md)
explains the version policy and validation commands.
