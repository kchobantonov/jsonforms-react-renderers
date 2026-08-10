import {
  ControlProps,
  isTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkInputControl } from './InputControl';

export const ArkTimeControl = (props: ControlProps) => (
  <ArkInputControl {...props} type='time' />
);

export const timeControlTester: RankedTester = rankWith(4, isTimeControl);
