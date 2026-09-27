import {
  and,
  ControlProps,
  optionIs,
  RankedTester,
  rankWith,
  schemaMatches,
  Tester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { AntdOtp, otpLength } from '../antd-controls/AntdOtp';
import { InputControl } from './InputControl';
import { isPasswordControl } from './PasswordControl';

export const PasswordOtpControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdOtp} />
);

/**
 * The schema must bound the length before a segmented editor is drawn.
 *
 * A box-per-character editor has to know how many boxes to draw, and inventing
 * a number would make the widget claim a length the schema does not require -
 * the user would see six boxes for a value that accepts any string. So both
 * `minLength` and `maxLength` must be present. With the two equal, which is
 * the intended authoring, the boxes and the schema agree exactly.
 *
 * Through `schemaMatches` rather than by reading `schema` directly: a tester is
 * handed the **root** schema and the control's scope, not the property's own
 * subschema, so `schema.minLength` on the object at the root is always
 * `undefined` and the variant would never be selected.
 */
export const hasSegmentedLength: Tester = schemaMatches(
  (schema) => otpLength(schema) !== undefined
);

/**
 * `options.variant: "otp"` - a fixed-length code entered one character per box.
 *
 * `variant` rather than a new `format`, because in this project `variant` is
 * the reserved dispatch input that chooses *which renderer draws a value*
 * (`variant: "ag-grid"`, `variant: "splitter"`), while `format` describes what
 * the value **is**. An OTP is still a password: same schema, same storage, same
 * masking contract - only the editor differs.
 *
 * `otp` rather than `pin`, of the two names: a PIN is by definition a numeric
 * personal code, while a one-time password may be alphanumeric, so `otp`
 * constrains the alphabet less. A PIN is this variant plus a numeric `pattern`,
 * not a second variant name.
 *
 * Ranked above the plain password control so it wins when asked for, and
 * failing either condition falls back to it rather than to nothing - an
 * unbounded string with `variant: "otp"` is an ordinary password field.
 */
export const passwordOtpControlTester: RankedTester = rankWith(
  5,
  and(isPasswordControl, optionIs('variant', 'otp'), hasSegmentedLength)
);

export default withJsonFormsControlProps(PasswordOtpControl);
