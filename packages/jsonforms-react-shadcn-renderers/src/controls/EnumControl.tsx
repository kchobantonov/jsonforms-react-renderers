import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import React from 'react';
import { InputShell, makeId, toStringValue } from './InputControl';

export const ShadcnEnumControl = ({
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  options,
  path,
  required,
  visible,
}: ControlProps & OwnPropsOfEnum & TranslateProps) => {
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
      <select
        id={id}
        className='shadcn-jsonforms-input'
        disabled={!enabled}
        value={toStringValue(data)}
        onChange={(event) =>
          handleChange(path, event.currentTarget.value || undefined)
        }
      >
        <option value=''>Select...</option>
        {options?.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </InputShell>
  );
};

export const enumControlTester: RankedTester = rankWith(2, isEnumControl);
