# Shared React extended renderers

`@chobantonov/jsonforms-react-extended-renderers` provides the shared
`ExtendedJsonForms` component, presentation and template renderers, and
utilities used by the Ant Design and shadcn extended renderer sets. It is not
a complete themed renderer registry on its own. Combine it with a renderer
family's base and extended registries.

`ExtendedJsonForms` supplies the additional-error store and action context
needed by extended controls. It also accepts `external` for host-owned values
and `config.jsonformsExtended.dynamic.enabled` to enable experimental
`$dynamic` overlays. See the [dynamic UI guide](../../docs/dynamic-ui.md) for
the JSX example and the [shared renderer architecture](../../docs/renderer-common.md)
for package boundaries.

Choose the [Ant Design extended package](../jsonforms-react-antd-extended-renderers/README.md)
or [shadcn extended package](../jsonforms-react-shadcn-extended-renderers/README.md)
for UI-library controls, cells, and host setup.
