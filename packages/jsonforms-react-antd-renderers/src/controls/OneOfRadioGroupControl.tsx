import React from 'react';
import {
  and,
  ControlProps,
  isOneOfEnumControl,
  optionIs,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsOneOfEnumProps } from '@jsonforms/react';
import { RadioGroup } from './RadioGroup';

export const OneOfRadioGroupControl = (
  props: ControlProps & OwnPropsOfEnum
) => {
  return <RadioGroup {...props} />;
};

export const oneOfRadioGroupControlTester: RankedTester = rankWith(
  20,
  and(isOneOfEnumControl, optionIs('format', 'radio'))
);

export default withJsonFormsOneOfEnumProps(OneOfRadioGroupControl);
