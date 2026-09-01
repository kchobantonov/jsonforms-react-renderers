import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import React from 'react';
import { ClearValueButton } from '../components/ClearValueButton';
import { InputShell, makeId, toStringValue } from './InputControl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export const ShadcnEnumControl = ({
  data,
  config,
  description,
  enabled,
  errors,
  handleChange,
  label,
  options,
  path,
  required,
  readonly,
  uischema,
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
      <div className='group relative w-full'>
        <Select
          disabled={!enabled}
          value={toStringValue(data) || undefined}
          onValueChange={(value) => handleChange(path, value || undefined)}
        >
          <SelectTrigger
            id={id}
            className='shadcn-jsonforms-input shadcn-jsonforms-select pr-16'
          >
            <SelectValue placeholder='Select...' />
          </SelectTrigger>
          <SelectContent className='shadcn-jsonforms-select-content'>
            {(options ?? []).map((option) => (
              <SelectItem
                className='shadcn-jsonforms-select-item'
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ClearValueButton
          clearable={uischema.options?.clearable ?? config?.clearable ?? true}
          data={data}
          enabled={enabled}
          readonly={readonly}
          onClear={() => handleChange(path, undefined)}
        />
      </div>
    </InputShell>
  );
};

export const enumControlTester: RankedTester = rankWith(2, isEnumControl);
