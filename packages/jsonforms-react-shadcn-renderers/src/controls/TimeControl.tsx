import {
  ControlProps,
  isTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnInputControl } from './InputControl';

export const ShadcnTimeControl = (props: ControlProps) => (
  <ShadcnInputControl {...props} type='time' />
);

export const timeControlTester: RankedTester = rankWith(4, isTimeControl);
