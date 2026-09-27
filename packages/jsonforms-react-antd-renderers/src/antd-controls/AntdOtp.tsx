import { CellProps, JsonSchema, WithClassname } from '@jsonforms/core';
import { Flex, Input } from 'antd';
import merge from 'lodash/merge';
import React, { useState } from 'react';
import { AntdClearableInput } from './AntdClearableInput';
import { AntdRevealButton } from './AntdRevealButton';

/**
 * How many boxes a segmented code editor draws, or `undefined` when the schema
 * does not fix a length.
 *
 * `maxLength` is the count, because a box the user cannot fill would be a lie
 * about what the field accepts. `minLength` has to be present too - see
 * `otpControlTester` - but it constrains validity rather than layout: with the
 * two equal, which is the intended authoring, the boxes and the schema agree
 * exactly; with `minLength` lower, the trailing boxes are optional and the
 * floor is enforced by validation like any other `minLength`.
 */
/**
 * The character drawn in place of each hidden one.
 *
 * A bullet rather than `true`: see the note on `mask` below - antd's boolean
 * form reveals the value it is supposed to hide.
 */
export const OTP_MASK = '\u2022';

export const otpLength = (schema?: JsonSchema): number | undefined => {
  const min = (schema as { minLength?: unknown } | undefined)?.minLength;
  const max = (schema as { maxLength?: unknown } | undefined)?.maxLength;
  return typeof min === 'number' && typeof max === 'number' && max > 0
    ? max
    : undefined;
};

/**
 * A fixed-length secret entered one character per box.
 *
 * Selected by `options.variant: "otp"` on a password control whose schema
 * bounds its length. It is the same value under the same storage contract as
 * the ordinary password field - only the editor differs - so masking, reveal
 * and clear all behave the way section 18 requires of a password.
 */
export const AntdOtp = React.memo(function AntdOtp(
  props: CellProps &
    WithClassname & {
      inputProps?: Record<string, unknown>;
      label?: React.ReactNode;
    }
) {
  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    schema,
    label,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const [revealed, setRevealed] = useState(false);
  const length = otpLength(schema) ?? 6;
  const value = typeof data === 'string' ? data : '';

  return (
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={data}
      enabled={enabled}
      onClear={() => handleChange(path, undefined)}
    >
      {(clear) => (
        <Flex align='center' gap='small'>
          <Input.OTP
            /*
              `onInput`, not `onChange`. antd fires `onChange` only once every
              box is filled, so a half-typed code would leave the form data
              holding the previous value while the screen showed something
              else, and deleting a character would write nothing at all.
              Section 19 requires the UI to represent the actual form data, and
              a `minLength` error can only be reported against a value that was
              actually stored.
            */
            onInput={(cells) => handleChange(path, cells.join('') || undefined)}
            /*
              Reveal is the `mask` lever: antd's OTP has no toggle of its own.
              As with the password field this changes presentation only and
              never touches form data.

              `mask` is a **character**, not `true`. antd draws the mask as an
              overlay showing `typeof mask === 'string' ? mask : value`, over an
              input whose own text is `color: transparent` - so `mask={true}`
              puts the real character on screen, which is no mask at all.

              `type` is set for the same reason from the other side: OTPInput
              asks for `type: mask === true ? 'password' : 'text'` and then
              spreads its shared props, which carry `type: undefined`, over the
              top - so the cells come out as plain text boxes unless the type is
              passed in explicitly. Passing it keeps each box a real password
              input, which is what a screen reader and a browser read.
            */
            mask={revealed ? false : OTP_MASK}
            type={revealed ? 'text' : 'password'}
            value={value}
            length={length}
            disabled={!enabled}
            autoComplete='one-time-code'
            className={className}
            /*
              The boxes are separate inputs, so the Form.Item label has no
              single control to point `htmlFor` at. Naming the group is what
              assistive technology needs to announce the field once rather than
              announcing `length` unlabelled text boxes.
            */
            role='group'
            aria-label={typeof label === 'string' ? label : undefined}
            id={id}
            {...(props.inputProps as Record<string, unknown>)}
          />
          <AntdRevealButton
            revealed={revealed}
            onToggle={() => setRevealed((shown) => !shown)}
            disabled={!enabled}
          />
          {clear}
        </Flex>
      )}
    </AntdClearableInput>
  );
});
