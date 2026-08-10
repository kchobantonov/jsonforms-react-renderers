import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ArkLayout } from './Layout';

export const ArkHorizontalLayout = (props: LayoutProps) => (
  <ArkLayout {...props} direction='row' />
);

export const horizontalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('HorizontalLayout')
);
