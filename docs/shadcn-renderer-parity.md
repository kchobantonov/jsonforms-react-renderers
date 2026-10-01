# Shadcn renderer parity review

The shadcn family now includes counterparts for the Ant Design renderer categories:
password/OTP, mask, chips, multi-select, automatic enum-array checkboxes,
enum and oneOf radio groups, scalar compositions, and the existing primitive,
object, array, combinator, layout, file and shared extended renderers.

This update also adds formatted-number and boolean-toggle cell registrations.
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
