# Shadcn renderer parity review

The shadcn family now includes counterparts for the Ant Design renderer categories:
password/OTP, mask, chips, multi-select, automatic enum-array checkboxes,
enum and oneOf radio groups, scalar compositions, and the existing primitive,
object, array, combinator, layout, file and shared extended renderers.

Formatted-number and boolean-toggle cell registrations are present.
Mask editors share the Ant Design mask engine and remain control renderers;
inline table cells retain their existing editors, as in Ant Design.

Component names and registry sizes differ: shadcn handles ListWithDetail and
array presentations in its array renderer, categorization presentations in one
layout, and file controls in the extended package.

## Verification and limits

Behavior tests cover phone mask display/edit/clear, typed oneOf radio values,
positional removal of duplicate chips, explicit minimum-item restriction, and
automatic checkbox selection. Existing password/OTP tests remain enabled.

This is renderer-category coverage, not a certification of every option,
keyboard interaction, accessibility detail, or visual layout. Multi-select uses
a searchable checkbox popover; chips use removable tokens and constrained
choice suggestions or free text according to their item schema. Both preserve
incoming values and honor explicit restriction and readonly settings.

## Subsequent shared behavior (reviewed 2026-10-02)

Antd and shadcn now both have regression coverage for:

- Array detail modes and generalized editor details, including mixed per-type layouts.
- Recursive node trees, node actions and mixed tree/nested presentations.
- Metaschema array selection and mixed/composite table cell registration.
- Generic JSON editing, mixed scalar clearing and inferred-root examples.
- Opt-in conditional object fields with generated and explicit detail layouts.
- Named Template/Slot composition through their extended registries.

Evidence includes arrayDetailModes, editorDetailModes, recursiveTreePresentation,
metaschemaArrays, mixedEmptyString, conditionalFields and templateSlotsExample
suites in their respective packages. Generic JSON tests also live in extended
packages where the required renderer registry is available.

Remaining work includes broader conditional compositions, named-template cycle
protection, accessible required-state checks, touch-aware container summaries,
and reference-scope coverage. See [TODO](TODO.md). No other renderer family is
certified by these Antd/shadcn tests, and these notes do not claim a fresh full run.
