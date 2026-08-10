import {
  ControlProps,
  isIntegerControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ShadcnNumberControl } from './InputControl';

export const ShadcnIntegerControl = (props: ControlProps) => (
  <ShadcnNumberControl {...props} integer />
);

export const integerControlTester: RankedTester = rankWith(2, isIntegerControl);
