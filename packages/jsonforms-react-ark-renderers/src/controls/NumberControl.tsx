import {
  ControlProps,
  isNumberControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkNumberControl } from './InputControl';

export const ArkNumberInputControl = (props: ControlProps) => (
  <ArkNumberControl {...props} />
);

export const numberControlTester: RankedTester = rankWith(1, isNumberControl);
