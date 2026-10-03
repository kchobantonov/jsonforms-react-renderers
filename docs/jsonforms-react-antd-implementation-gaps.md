# React + Ant Design implementation status

Reviewed against current source and selected regression tests on 2026-10-02.
This replaces the mixed historical/current audit. Its investigation details are
preserved in the [historical review](jsonforms-react-antd-implementation-gaps-history.md).
The [TODO](TODO.md) tracks actionable work; the
[portable spec](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md)
owns the contract. This review is not exhaustive browser or accessibility certification.

## Implemented since the historical review

| Area | Current evidence and limits |
| --- | --- |
| Object and mixed detail layouts | Shared detail resolver supports GENERATE, registry modes and inline layouts, including legacy elements-only layouts. Mixed per-type overrides exist in Antd and shadcn. editorDetailModes.test.tsx and arrayDetailModes.test.tsx cover these paths. |
| Mixed structured editing | Tree, nested and code presentations exist. Code requires the extended editor registry. Generic JSON and inferred-schema examples are separate; inference retains an upstream workaround. |
| Conditional fields | Opt-in conditionalFields supports the documented object-boundary slice, with generated or authored placement. Broader composition coverage remains open. |
| Recursive trees | Shared node navigation, rename/delete guards and native tree adapters exist. recursiveTreePresentation.test.tsx covers specific interactions, not arbitrary reference cycles. |
| Collections and cells | Pagination, row details, composite cells and schema-sensitive array selection have implementations and focused tests. Remaining parity and interaction checks are not absence of these features. |
| Required asterisk | Ordinary controls consume hideRequiredAsterisk; requiredAsterisk.test.tsx covers visibility and validation. Accessible required state still needs verification when the marker is hidden. |
| Container feedback | Shared aggregation and object/group/array indicators exist. Default inline object-error coverage has a narrower unresolved case below. |
| Named templates | Template and Slot resolve names and fallback content; examples and native-registry tests exist. Named-reference cycle guards and diagnostics remain open. |
| Image diagnostics | Compact warnings omit refused URLs and expose explanations through a focusable tooltip. imageView.test.tsx covers the behavior. |
| Earlier foundations | Layout sizing, Label CEL interpolation, shared confirmation, extended AJV integration, template script gates and URL checks are implemented. The historical “missing” entries are not current work orders. |

## Confirmed gaps and limits

- **Default inline object errors:** objectControl.test.tsx still passes the
  assertions that the fixture does not show the minProperties and forbidden-key
  message text. That does not establish that every tooltip or configured
  indicator is missing. Reconcile default inline feedback with newer container
  feedback and test discoverability before closing this gap.
- **Touch filtering:** control filtering exists; consistent descendant summary
  participation across every container is not certified.
- **Rich text:** Label supports markup/interpolation. Other labels and control
  descriptions need separate integration and translation-order coverage.
- **Diagnostics and async validity:** some stable codes and owner-scoped errors
  exist, but a universal diagnostic pipeline and pending-analysis submit contract
  are not complete. File read/conversion error publication needs verification.
- **Dynamic overlays:** not implemented; their shape remains design work. Label
  dynamic interpolation is a separate capability. Do not revive the old ICU or
  “five settled decisions” narrative as an API commitment.
- **References and Draft-07 combinations:** consult the spec's visual-support
  audit and the TODO. Local support is not proof of arbitrary remote references,
  nested identifier scopes or all conditional/composition combinations.
- **Other adapters:** shared code does not automatically establish identical
  native registries, keyboard behavior or option support across families.

## Verification record

This documentation review reran objectControl.test.tsx: its 17 other cases
passed, including the inline-error absence assertions. The remaining test still
expected elements-only detail layouts to be ignored, contrary to the implemented
shared detail normalization. That stale expectation is tracked in TODO.
No full-suite, lint or browser certification is claimed by this review.

Use the [shared architecture](renderer-common.md), [shadcn parity notes](shadcn-renderer-parity.md),
[demo settings](demo-settings-audit.md) and [example catalog guide](demo-examples.md)
for current entry points. Historical numbered section links are preserved in the
historical review, not maintained as a second backlog.
