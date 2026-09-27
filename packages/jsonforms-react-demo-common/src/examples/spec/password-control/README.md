# Example: password control

**Example ID:** `password-control`\
**Demo entry:** **Spec: Password control** (`#spec-password-control`)\
**Domain:** account credentials\
**Specs covered:**

- [Portable spec §18 — Password control interaction](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §5 — Schema-driven and UI-driven format selection](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §18 — Shared table-cell behavior](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §9 — `variant: "otp"`, a fixed-length code editor](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/password` | `minLength` | must NOT have fewer than 8 characters |
| `/verificationCode` | `minLength` | must NOT have fewer than 6 characters |

The second is the point of the OTP field below: a half-entered code is stored
and reported, not hidden.

Ajv also warns that `password` is an unknown format and ignores it. That is
correct and expected: `password` is "a custom format convention supported by
this project, not a built-in JSON Schema validation format". It selects a
presentation; it constrains nothing.

## Both selection paths

Section 5 keeps these separate on purpose — schema `format` describes the data,
UI `options.format` requests a presentation without changing the schema — and
requires both to work.

| Field | Selected by |
| --- | --- |
| `password` | `"format": "password"` in the **schema** |
| `recoveryPhrase` | `"options": { "format": "password" }` on a **plain string** |
| `verificationCode`, `backupCode` | schema format again, plus `"variant": "otp"` |

The second used to render in clear text: the renderer only looked at the schema
format. The `hint` field beside it is an ordinary string, for contrast.

## What to try

**Reveal, then check the Data tab.** Toggling changes presentation only. It
must not write form data, fire a change event, alter validation or mark the
value dirty, and the reveal state is never stored anywhere.

**Tab to the toggle and press Enter.** It is a real focusable button, and the
only one: antd 6 makes its own reveal icon a `role="button"` too, so the field
uses a plain `Input` with the type switched rather than `Input.Password`, which
would have nested one button inside another. Its accessible name states the
action it will perform — "Show password", becoming "Hide password" once
revealed — and hovering shows the same wording as a tooltip.

**Reveal and clear are separate controls.** Each has its own name and its own
hit target; neither reaches the other.

**Length is an ordinary constraint.** `password` holds `"short"` and reports
`minLength`. The presentation imposes no complexity rules of its own — the spec
is explicit that "password presentation itself imposes no complexity rules or
additional content validation".

**Enter the verification code.** `options.variant: "otp"` draws it one
character per box — six of them, because the schema says `minLength: 6` and
`maxLength: 6`. It is still the same password: masked by default — each box a real password
input showing a bullet — with the same reveal button and the same clear action. Only the editor changed, which is why
this is a `variant` and not a new `format`.

**Type two digits and stop.** The partial code is stored and reported as too
short. antd fires its own `onChange` only once every box is filled, which would
leave the form data holding the old value while the screen showed the new one;
the renderer commits on every keystroke instead.

**Backup code asks for the same variant and does not get it.** Its schema sets
no `minLength`/`maxLength`, so there is no honest number of boxes to draw and it
falls back to an ordinary password field. Drawing six boxes would be the widget
asserting a constraint the schema does not carry.

**A PIN is this variant plus a constraint.** `verificationCode` adds
`"pattern": "^[0-9]*$"`. There is no separate `pin` variant: the numeric rule
belongs in the schema, where validation can see it.

**Look at the service accounts table.** The `token` column is masked too.
Without a password cell it fell through to the plain text cell and printed the
token for anyone looking at the screen.

**Switch to Bulgarian.** The toggle and clear names translate; the stored
values do not change.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| Neither format supplied | An ordinary text control. |
| Renderer set without the password entry | The string control wins at a lower rank and the value shows in clear text. |
| `clearable: false` | No clear affordance; the reveal toggle is unaffected. |
| `variant: "otp"` without both length bounds | The ordinary password field. Not an error, not an empty control. |
| `variant: "otp"` inside a table cell | The ordinary masked password cell — a row of boxes does not fit a column, and only masking has to survive delegation. |
| `minLength` lower than `maxLength` | `maxLength` boxes; the trailing ones are optional and the floor is reported by validation. |

## Status

Implemented and covered by `test/passwordControl.test.tsx` in the antd renderer
set, including both selection paths, the toggle's name and focusability, that
toggling writes nothing, and that a password column stays masked.

The OTP variant is covered by `test/passwordOtpControl.test.tsx`: selection and
its length precondition, the box count, the group's accessible name, partial
commits, masking and reveal, and clearing.

No portable option disables the reveal action, and none is introduced here.
