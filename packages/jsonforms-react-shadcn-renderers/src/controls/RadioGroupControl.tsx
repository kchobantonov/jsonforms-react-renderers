import isEqual from 'lodash/isEqual';
import React from 'react';
import {
  ControlProps,
  OwnPropsOfEnum,
  and,
  isEnumControl,
  optionIs,
  rankWith,
} from '@jsonforms/core';
import {
  RadioGroup,
  RadioGroupItem,
} from '@jsonforms-react-shadcn-ui/radio-group';
import { InputShell, makeId } from './InputControl';

export const ShadcnRadioGroupControl = (
  props: ControlProps & OwnPropsOfEnum
) => {
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const options = props.options ?? [];
  const selected = options.findIndex((option) =>
    isEqual(option.value, props.data)
  );
  const orientation =
    (props.uischema.options?.vertical ??
      props.config?.jsonformsExtended?.radio?.vertical ??
      false) === true
      ? 'vertical'
      : 'horizontal';
  return (
    <InputShell
      {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <RadioGroup
        id={id}
        aria-label={props.label}
        orientation={orientation}
        className={
          orientation === 'horizontal' ? 'flex flex-wrap gap-4' : undefined
        }
        value={selected < 0 ? '' : `option-${selected}`}
        disabled={!props.enabled || props.readonly}
        onValueChange={(token) => {
          const option = options[Number(token.replace('option-', ''))];
          if (option) props.handleChange(props.path, option.value);
        }}
      >
        {options.map((option, index) => (
          <label
            key={index}
            className='flex items-center gap-2'
            htmlFor={`${id}-${index}`}
          >
            <RadioGroupItem id={`${id}-${index}`} value={`option-${index}`} />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    </InputShell>
  );
};
export const radioGroupControlTester = rankWith(
  20,
  and(isEnumControl, optionIs('format', 'radio'))
);
