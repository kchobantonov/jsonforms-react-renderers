# Renderer parity and implementation guidance

For renderer behavior changes, consult the sibling specification's
[implementation guide](../jsonforms-extended-spec/docs/implementation-guide.md)
and [implementation pitfalls](../jsonforms-extended-spec/docs/implementation-pitfalls.md).

When resolving a commonly overlooked semantic, usability, presentation,
accessibility or performance distinction, record the lesson in the spec's
implementation guidance and add an acceptance example/vector where practical.
Clarify the normative spec when the contract itself needs clarification.
Do not catalogue ordinary coding mistakes. Preserve behavior across renderer
sets; explicitly record platform limitations and unverified support instead of
claiming parity. Distinguish executable tests from proposed acceptance cases.
