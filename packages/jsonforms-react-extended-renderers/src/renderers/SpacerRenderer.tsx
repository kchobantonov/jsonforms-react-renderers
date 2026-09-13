import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const spacerRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Spacer')
);

export const SpacerRendererComponent = ({
  config,
  uischema,
  visible,
}: LayoutProps) => {
  const configuredHeight =
    uischema.options?.height !== undefined
      ? uischema.options.height
      : config?.height;
  const height =
    typeof configuredHeight === 'number' && Number.isFinite(configuredHeight)
      ? Math.max(0, configuredHeight)
      : 32;

  return visible ? (
    <div aria-hidden='true' style={{ height, flexShrink: 0 }} />
  ) : null;
};

export const SpacerRenderer = withJsonFormsLayoutProps(SpacerRendererComponent);
