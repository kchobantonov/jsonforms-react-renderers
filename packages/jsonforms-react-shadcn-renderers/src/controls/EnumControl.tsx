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
import { InputShell, makeId } from './InputControl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';

export const ShadcnEnumControl = ({
  schema,
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
      path={path}
      schema={schema}
      config={config}
      uischema={uischema}
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='group relative w-full'>
        <Select
          disabled={!enabled || readonly}
          value={(() => {
            const index = (options ?? []).findIndex((option) =>
              Object.is(option.value, data)
            );
            return index < 0 ? '' : `option-${index}`;
          })()}
          onValueChange={(value) => {
            const option = (options ?? [])[
              Number(value.replace('option-', ''))
            ];
            if (option && enabled && !readonly)
              handleChange(path, option.value);
          }}
        >
          <SelectTrigger
            id={id}
            className='shadcn-jsonforms-input shadcn-jsonforms-select w-full min-w-0 pr-16'
          >
            <SelectValue placeholder='Select...' />
          </SelectTrigger>
          <SelectContent className='shadcn-jsonforms-select-content'>
            {(options ?? []).map((option, index) => (
              <SelectItem
                className='shadcn-jsonforms-select-item'
                key={index}
                value={`option-${index}`}
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
