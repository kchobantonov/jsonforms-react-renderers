/// <reference path='../ark-ui-react-factory.d.ts' />

import { LabelProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export const ArkLabelRenderer = ({ text, visible }: LabelProps) => {
  if (!visible) return null;
  return <ark.div className='ark-jsonforms-static-label'>{text}</ark.div>;
};
export const labelRendererTester: RankedTester = rankWith(1, uiTypeIs('Label'));
