# Documentation guide

The installed `@chobantonov/jsonforms-extended-spec@0.2.0` package defines the
[portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/spec.md),
schemas, examples, and [implementation guidance](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/implementation-guide.md). The package
version in the manifests and lockfile identifies the contract used here. These
docs describe React-specific capabilities, integration, and verification.

## Current implementation and use

- [Renderer features](renderer-features.md) records selected Ant Design and
  shadcn support and limits. Start here when checking React support.
- [Shared renderer architecture](renderer-common.md) records package
  boundaries and ownership of renderer behavior.
- [Dynamic UI overlays](dynamic-ui.md) describes the React host API for the
  experimental overlay profile.
- [Demo examples](demo-examples.md), [demo settings audit](demo-settings-audit.md),
  and [development checks](linting-and-formatting.md) cover local use and
  maintenance. Package READMEs cover installation and Web Component hosts.

## Verification evidence and open work

The [demo example catalog](demo-examples.md) maps spec scenarios to demos;
renderer support requires the corresponding tests. Run current package and
workspace tests before claiming a passing result. The [known defects and open
work](TODO.md) page records a backlog snapshot at its stated review date.
