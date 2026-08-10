import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnInputControl } from './InputControl';

export const ShadcnTextControl = (props: ControlProps) => (
  <ShadcnInputControl {...props} type='text' />
);

export const textControlTester: RankedTester = rankWith(1, isStringControl);
