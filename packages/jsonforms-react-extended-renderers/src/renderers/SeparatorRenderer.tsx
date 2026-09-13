import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const separatorRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Separator')
);

export const SeparatorRendererComponent = ({ visible }: LayoutProps) =>
  visible ? <hr /> : null;

export const SeparatorRenderer = withJsonFormsLayoutProps(
  SeparatorRendererComponent
);
