# React shadcn Web Component

This project is a consuming host for the base and extended shadcn renderer sets.
It owns the generated components in `src/components/ui`, their dependencies,
and the Tailwind styles used inside its shadow root. Customize those files when
building your own element. The renderer packages themselves do not own UI source.

Run `pnpm wc:shadcn:build` to build the element. See the
[base renderer setup](../jsonforms-react-shadcn-renderers/README.md) for the
component contract and alias required when bundling renderers in another host.
