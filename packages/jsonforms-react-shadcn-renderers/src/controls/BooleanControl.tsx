import {
  ControlProps,
  isBooleanControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { InputShell, makeId } from './InputControl';
import { Checkbox } from '../components/ui/checkbox';

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
        <Checkbox
          className='shadcn-jsonforms-checkbox-control'
          id={id}
          disabled={!enabled}
          checked={Boolean(data)}
          onCheckedChange={(checked) => handleChange(path, checked === true)}
        />
        <span>{Boolean(data) ? 'Yes' : 'No'}</span>
      </label>
    </InputShell>
  );
};

export const booleanControlTester: RankedTester = rankWith(2, isBooleanControl);
