import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ShadcnLayout } from './Layout';

export const ShadcnGroupLayout = (props: LayoutProps) => {
  if (!props.visible) return null;
  const layout = props.uischema as any;

  return (
    <fieldset className='shadcn-jsonforms-group'>
      {layout.label ? <legend>{layout.label}</legend> : null}
      <ShadcnLayout {...props} direction='column' />
    </fieldset>
  );
};

export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
