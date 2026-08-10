import {
  ControlProps,
  isIntegerControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { ArkNumberControl } from './InputControl';

export const ArkIntegerControl = (props: ControlProps) => (
  <ArkNumberControl {...props} integer />
);

export const integerControlTester: RankedTester = rankWith(2, isIntegerControl);
