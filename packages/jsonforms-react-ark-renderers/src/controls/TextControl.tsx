import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkInputControl } from './InputControl';

export const ArkTextControl = (props: ControlProps) => (
  <ArkInputControl {...props} type='text' />
);

export const textControlTester: RankedTester = rankWith(1, isStringControl);
