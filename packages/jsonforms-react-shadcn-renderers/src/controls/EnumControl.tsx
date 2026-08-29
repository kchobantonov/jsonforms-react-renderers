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
import { useShadcnComponents } from '../components';

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
  const { Select } = useShadcnComponents();
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
      <Select
        id={id}
        className='shadcn-jsonforms-input'
        disabled={!enabled}
        value={toStringValue(data)}
        placeholder='Select...'
        options={(options ?? []).map((option) => ({
          label: option.label,
          value: String(option.value),
        }))}
        onValueChange={(value) => handleChange(path, value || undefined)}
      />
    </InputShell>
  );
};

export const enumControlTester: RankedTester = rankWith(2, isEnumControl);
