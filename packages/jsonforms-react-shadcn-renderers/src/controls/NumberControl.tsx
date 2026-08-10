import {
  ControlProps,
  isNumberControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnNumberControl } from './InputControl';

export const ShadcnNumberInputControl = (props: ControlProps) => (
  <ShadcnNumberControl {...props} />
);

export const numberControlTester: RankedTester = rankWith(1, isNumberControl);
