/// <reference path='../ark-ui-react-factory.d.ts' />

import {
  ControlProps,
  isBooleanControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { ark } from '@ark-ui/react/factory';
import React from 'react';
import { InputShell, makeId } from './InputControl';

export const ArkBooleanControl = ({
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  required,
  visible,
}: ControlProps) => {
  if (!visible) return null;
  const id = makeId(path, label);

  return (
    <InputShell
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <ark.label className='ark-jsonforms-checkbox'>
        <ark.input
          id={id}
          type='checkbox'
          disabled={!enabled}
          checked={Boolean(data)}
          onChange={(event) => handleChange(path, event.currentTarget.checked)}
        />
        <ark.span>{Boolean(data) ? 'Yes' : 'No'}</ark.span>
      </ark.label>
    </InputShell>
  );
};

export const booleanControlTester: RankedTester = rankWith(2, isBooleanControl);
