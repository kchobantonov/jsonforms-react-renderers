import React from 'react';
import {
  and,
  ControlProps,
  formatIs,
  or,
  optionIs,
  isStringControl,
  rankWith,
} from '@jsonforms/core';
import { MaterialInputControl } from '@jsonforms/material-renderers';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { MuiPasswordInput } from './MuiPasswordInput';

export const MuiPasswordControlComponent = (props: ControlProps) => (
  <MaterialInputControl {...props} input={MuiPasswordInput} />
);

export const MuiPasswordControl = withJsonFormsControlProps(
  MuiPasswordControlComponent
);
export const muiPasswordControlTester = rankWith(
  3,
  and(isStringControl, or(formatIs('password'), optionIs('format', 'password')))
);
