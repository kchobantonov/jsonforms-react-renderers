import { LabelProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';

export const ShadcnLabelRenderer = ({ text, visible }: LabelProps) => {
  if (!visible) return null;
  return <div className='shadcn-jsonforms-static-label'>{text}</div>;
};
export const labelRendererTester: RankedTester = rankWith(1, uiTypeIs('Label'));
