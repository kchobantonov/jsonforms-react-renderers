import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  optionIs,
  or,
  RankedTester,
  rankWith,
  Tester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { AntdPassword } from '../antd-controls/AntdPassword';
import { InputControl } from './InputControl';

export const PasswordControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdPassword} />
);

/**
 * A string this project treats as a password, by **either** path, as section 5
 * requires: schema `format` describes the data, UI `options.format` requests
 * the presentation without changing the schema. Supporting only the schema
 * format - which is what the string control used to do - leaves
 * `options.format: "password"` on a plain string rendering in clear text.
 *
 * Exported so the OTP variant selects on exactly the same predicate; a value
 * that is a password with `variant: "otp"` must not stop being a password
 * because of how it is drawn.
 */
export const isPasswordControl: Tester = and(
  isStringControl,
  or(formatIs('password'), optionIs('format', 'password'))
);

/** Ranked above the string control so it wins for a string that asks for it. */
export const passwordControlTester: RankedTester = rankWith(
  4,
  isPasswordControl
);

export default withJsonFormsControlProps(PasswordControl);
