# Renderer parity and implementation guidance

For renderer behavior changes, use the installed
`@chobantonov/jsonforms-extended-spec@0.2.0` as the contract. Consult its
[implementation guide](node_modules/@chobantonov/jsonforms-extended-spec/docs/implementation-guide.md)
and [implementation pitfalls](node_modules/@chobantonov/jsonforms-extended-spec/docs/implementation-pitfalls.md).
The package manifests and lockfile record the consumed release. Use a sibling
`jsonforms-extended-spec` source checkout when proposing changes to the spec,
then update the package version when adopting a new release.

When resolving a commonly overlooked semantic, usability, presentation,
accessibility or performance distinction, record the lesson in the spec's
implementation guidance and add an acceptance example/vector where practical.
Clarify the normative spec when the contract itself needs clarification.
Do not catalogue ordinary coding mistakes. Preserve behavior across renderer
sets; explicitly record platform limitations and unverified support instead of
claiming parity. Distinguish executable tests from proposed acceptance cases.

# Implementation verification

After every implementation, before reporting the work complete:

- Run the tests relevant to the affected behavior and packages.
- Run repository lint and formatting checks: `pnpm run lint` and
  `pnpm run check-format`.
- Run both Fallow checks: `pnpm exec fallow dead-code` for unused files,
  exports, types, and dependencies, and `pnpm exec fallow dupes` for duplicate
  code.

Review the findings and fix errors, unused code, and unnecessary duplication
introduced by the change. Do not suppress findings merely to pass the checks.
Report any remaining warnings, failures, or findings accurately, distinguishing
existing findings from those introduced by the change. See
[development checks](docs/linting-and-formatting.md) for the Fallow workflow.

# Changesets

For every publishable change to a public React package, include a Markdown
changeset under `.changeset/` in the same change. Select the affected public
package and the appropriate patch, minor, or major bump; the fixed Changesets
group releases all public packages together. An existing pending changeset may
cover the change if its release note still describes it accurately. Changes
limited to private demos, tooling, or documentation do not need a changeset.
