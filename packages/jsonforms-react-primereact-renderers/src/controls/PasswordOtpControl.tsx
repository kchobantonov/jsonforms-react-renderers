import React, { useState } from 'react';
import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { InputOtp } from 'primereact/inputotp';
import { PrimeIconButton } from '../prime-controls/PrimeIconButton';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { InputControl } from './InputControl';

const PrimeOtp = (props: ControlProps) => {
  const t = useI18n();
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const editable = props.enabled && !props.readonly;
  const clearable =
    (props.uischema.options?.clearable ?? props.config?.clearable) !== false;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '.25rem',
        maxWidth: '100%',
        flexWrap: 'wrap',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
    >
      <InputOtp
        id={props.id}
        role='group'
        aria-label={props.label}
        value={typeof props.data === 'string' ? props.data : ''}
        length={props.schema.maxLength}
        mask={!revealed}
        disabled={!props.enabled}
        readonly={props.readonly}
        invalid={Boolean(props.errors)}
        onChange={(event) => {
          if (editable)
            props.handleChange(
              props.path,
              event.value === '' ? undefined : String(event.value ?? ''),
            );
        }}
      />
      <PrimeIconButton
        icon={revealed ? 'pi pi-eye' : 'pi pi-eye-slash'}
        aria-label={t(revealed ? 'password.hide' : 'password.show')}
        tooltip={t(revealed ? 'password.hide' : 'password.show')}
        aria-pressed={revealed}
        disabled={!props.enabled}
        onClick={() => setRevealed((value) => !value)}
      />
      {editable && clearable && Boolean(props.data) && (
        <PrimeIconButton
          icon='pi pi-times'
          aria-label={t('control.clearValue')}
          tooltip={t('control.clearValue')}
          style={{ opacity: hovered || focused ? 1 : 0 }}
          onClick={() => props.handleChange(props.path, undefined)}
        />
      )}
    </div>
  );
};

export const passwordOtpControlTester = rankWith(
  5,
  and(
    isStringControl,
    or(formatIs('password'), optionIs('format', 'password')),
    optionIs('variant', 'otp'),
    schemaMatches(
      (schema) =>
        typeof schema.minLength === 'number' &&
        typeof schema.maxLength === 'number' &&
        Number.isInteger(schema.maxLength) &&
        schema.maxLength > 0,
    ),
  ),
);
export const PasswordOtpControl = withJsonFormsControlProps(
  (props: ControlProps) => <InputControl {...props} input={PrimeOtp} />,
);
