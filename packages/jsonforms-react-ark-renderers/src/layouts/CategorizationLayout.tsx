/// <reference path='../ark-ui-react-factory.d.ts' />

import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { ark } from '@ark-ui/react/factory';
import React, { useState } from 'react';

export const ArkCategorizationLayout = (props: LayoutProps) => {
  const categorization = props.uischema as any;
  const categories = categorization.elements ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  if (!props.visible || categories.length === 0) return null;
  const activeCategory = categories[activeIndex] ?? categories[0];

  return (
    <ark.div className='ark-jsonforms-categorization'>
      <ark.div className='ark-jsonforms-tabs' role='tablist'>
        {categories.map((category: any, index: number) => (
          <ark.button
            key={category.label ?? index}
            className='ark-jsonforms-tab'
            data-active={index === activeIndex ? '' : undefined}
            type='button'
            onClick={() => setActiveIndex(index)}
          >
            {category.label ?? `Category ${index + 1}`}
          </ark.button>
        ))}
      </ark.div>
      <JsonFormsDispatch
        schema={props.schema}
        uischema={activeCategory}
        path={props.path}
        enabled={props.enabled}
        renderers={props.renderers}
        cells={props.cells}
      />
    </ark.div>
  );
};

export const categorizationTester: RankedTester = rankWith(
  1,
  uiTypeIs('Categorization')
);
