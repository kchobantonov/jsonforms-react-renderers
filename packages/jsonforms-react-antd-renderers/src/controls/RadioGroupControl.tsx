import React from 'react';
import {
  and,
  ControlProps,
  isEnumControl,
  optionIs,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsEnumProps } from '@jsonforms/react';
import { RadioGroup } from './RadioGroup';
export const RadioGroupControl = (props: ControlProps & OwnPropsOfEnum) => {
  return <RadioGroup {...props} />;
};

export const radioGroupControlTester: RankedTester = rankWith(
  20,
  and(isEnumControl, optionIs('format', 'radio'))
);
export default withJsonFormsEnumProps(RadioGroupControl);
