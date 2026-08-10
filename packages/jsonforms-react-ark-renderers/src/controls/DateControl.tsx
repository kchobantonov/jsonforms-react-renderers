import {
  ControlProps,
  isDateControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkInputControl } from './InputControl';

export const ArkDateControl = (props: ControlProps) => (
  <ArkInputControl {...props} type='date' />
);

export const dateControlTester: RankedTester = rankWith(4, isDateControl);
