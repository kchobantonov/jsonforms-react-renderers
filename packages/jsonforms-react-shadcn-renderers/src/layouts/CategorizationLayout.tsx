import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React, { useState } from 'react';

export const ShadcnCategorizationLayout = (props: LayoutProps) => {
  const categorization = props.uischema as any;
  const categories = categorization.elements ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  if (!props.visible || categories.length === 0) return null;
  const activeCategory = categories[activeIndex] ?? categories[0];

  return (
    <div className='shadcn-jsonforms-categorization'>
      <div className='shadcn-jsonforms-tabs' role='tablist'>
        {categories.map((category: any, index: number) => (
          <button
            key={category.label ?? index}
            className='shadcn-jsonforms-tab'
            data-active={index === activeIndex ? '' : undefined}
            type='button'
            onClick={() => setActiveIndex(index)}
          >
            {category.label ?? `Category ${index + 1}`}
          </button>
        ))}
      </div>
      <JsonFormsDispatch
        schema={props.schema}
        uischema={activeCategory}
        path={props.path}
        enabled={props.enabled}
        renderers={props.renderers}
        cells={props.cells}
      />
    </div>
  );
};

export const categorizationTester: RankedTester = rankWith(
  1,
  uiTypeIs('Categorization')
);
