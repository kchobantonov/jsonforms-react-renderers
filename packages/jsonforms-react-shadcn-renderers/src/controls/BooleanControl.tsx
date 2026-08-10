import {
  ControlProps,
  isBooleanControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { InputShell, makeId } from './InputControl';

export const ShadcnBooleanControl = ({
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
      <label className='shadcn-jsonforms-checkbox'>
        <input
          id={id}
          type='checkbox'
          disabled={!enabled}
          checked={Boolean(data)}
          onChange={(event) => handleChange(path, event.currentTarget.checked)}
        />
        <span>{Boolean(data) ? 'Yes' : 'No'}</span>
      </label>
    </InputShell>
  );
};

export const booleanControlTester: RankedTester = rankWith(2, isBooleanControl);
