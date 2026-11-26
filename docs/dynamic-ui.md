# Dynamic UI overlays in React

The Ant Design and shadcn renderer sets support the experimental `$dynamic`
overlay contract in the installed [spec §11](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/spec.md).
Use `ExtendedJsonForms` from `@chobantonov/jsonforms-react-extended-renderers`
(also re-exported by the Ant Design extended package):

```tsx
<ExtendedJsonForms
  schema={schema}
  uischema={uischema}
  data={data}
  renderers={renderers}
  cells={cells}
  external={{ settings }}
  config={{ jsonformsExtended: { dynamic: { enabled: true } } }}
  onChange={({ data }) => setData(data)}
/>
```

`external` supplies host-owned values independently of overlay activation.
Only `config.jsonformsExtended.dynamic.enabled === true` enables overlays;
`dynamicValues.enabled` is a separate interpolation option. Replace external
objects and authored UI schemas immutably. The `settings` key is only an
example namespace. Template layouts also expose external values as
`context.external`.

For a base-only application, `DynamicJsonForms` from
`@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider` accepts the
same `external` and `config` props. A plain `JsonForms` can instead be wrapped
in `DynamicUiProvider` with `config` and `external` when using the supplied
Ant Design or shadcn registries. Custom registries can use
`withDynamicRenderers` and `withDynamicCells`.

An element's `$dynamic` supports ordered conditions, deep overlays, `bind`,
CEL `expression`, restricted path `template`, and `literal`. The available
environment roots are `data`, `value`, `item`, `path`, `locale`, `external`,
`config` (excluding `jsonformsExtended`), and core `errors`. Invalid values
and unsafe access are rejected; diagnostics are logged without bound values.
Trusted in-process function leaves require the exported
`TRUST_DYNAMIC_FUNCTIONS` symbol at `config.jsonformsExtended.dynamic.trusted`.
Never enable that capability from untrusted configuration.

Both Web Components accept host values through `element.external` and overlay
activation through `element.config`. Their own usage guides cover attributes
and events. The React demos include **Spec: Dynamic playground: preview and
configuration forms**. The implementation is experimental; its tests do not
certify every custom renderer or asynchronous editor. A changed renderer or
Control scope replaces that editor session while committed form data remains.
