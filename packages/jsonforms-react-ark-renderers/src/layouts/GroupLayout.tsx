/// <reference path='../ark-ui-react-factory.d.ts' />

import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { ark } from '@ark-ui/react/factory';
import React from 'react';
import { ArkLayout } from './Layout';

export const ArkGroupLayout = (props: LayoutProps) => {
  if (!props.visible) return null;
  const layout = props.uischema as any;

  return (
    <ark.fieldset className='ark-jsonforms-group'>
      {layout.label ? <ark.legend>{layout.label}</ark.legend> : null}
      <ArkLayout {...props} direction='column' />
    </ark.fieldset>
  );
};

export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
