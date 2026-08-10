import {
  ControlProps,
  isDateControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnInputControl } from './InputControl';

export const ShadcnDateControl = (props: ControlProps) => (
  <ShadcnInputControl {...props} type='date' />
);

export const dateControlTester: RankedTester = rankWith(4, isDateControl);
