import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ArkLayout } from './Layout';

export const ArkVerticalLayout = (props: LayoutProps) => (
  <ArkLayout {...props} direction='column' />
);

export const verticalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('VerticalLayout')
);
