import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ShadcnLayout } from './Layout';

export const ShadcnHorizontalLayout = (props: LayoutProps) => (
  <ShadcnLayout {...props} direction='row' />
);

export const horizontalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('HorizontalLayout')
);
