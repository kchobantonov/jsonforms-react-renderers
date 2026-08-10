import {
  ControlProps,
  isDateTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnInputControl } from './InputControl';

export const ShadcnDateTimeControl = (props: ControlProps) => (
  <ShadcnInputControl {...props} type='datetime-local' />
);

export const dateTimeControlTester: RankedTester = rankWith(
  4,
  isDateTimeControl
);
