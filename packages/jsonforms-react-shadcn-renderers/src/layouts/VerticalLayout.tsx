import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ShadcnLayout } from './Layout';

export const ShadcnVerticalLayout = (props: LayoutProps) => (
  <ShadcnLayout {...props} direction='column' />
);

export const verticalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('VerticalLayout')
);
