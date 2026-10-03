# Linting and formatting

Run `pnpm lint` for all package, app, and script JavaScript/TypeScript (including TSX).
Use `pnpm lint:fix` for safe automatic lint fixes. Package-local lint scripts use
the same root configuration. Run `pnpm check-format` or `pnpm format` to check or
apply the shared Prettier configuration.

ESLint 8 and TypeScript ESLint 5 match this workspace's existing TypeScript 4.9
stack. React Hooks rules are enabled: invalid hook order is an error, dependency
suggestions are warnings requiring review rather than blind automatic edits.
TypeScript checks props and module resolution; ESLint's prop-types and unresolved
import rules are disabled. Explicit any and non-null assertions are permitted at
the JSON Forms integration boundary. Tests allow empty stubs and require calls
for hoisted mocks. Formatting runs separately from semantic lint checks.

Generated builds, dependencies, coverage and synchronized shadcn UI copies are
excluded. Run `pnpm shadcn:check` to verify those copies against their source.

## Historical context: review of the other port

This records the earlier cleanup, not current pending work or a clean lint baseline.

The supplied check folder identified useful defects also present here:
conditional hooks in TemplateLayout and mixed renderers, unnamed runtime
components, redundant exports, and unused legacy ReactDOM cleanup in tests.
The MarkupLabel visibility guard was already after its hooks here. Its changes
were not copied wholesale; our implementation and localization behavior differ.
The supplied cron changes were primarily formatting. Existing shared formatting
settings were retained, and duplicate package configs removed.

A re-export repeated from the same underlying binding is redundant but is not
necessarily an ambiguous runtime export. The cleanup preserves the public names
while avoiding duplicate routes. Empty example namespaces were replaced with
side-effect imports because those modules register examples but export no API.
