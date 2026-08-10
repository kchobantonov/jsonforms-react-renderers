import {
  ControlProps,
  isDateTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkInputControl } from './InputControl';

export const ArkDateTimeControl = (props: ControlProps) => (
  <ArkInputControl {...props} type='datetime-local' />
);

export const dateTimeControlTester: RankedTester = rankWith(
  4,
  isDateTimeControl
);
