import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React, { useState } from 'react';
import { useShadcnComponents } from '../components';

export const ShadcnCategorizationLayout = (props: LayoutProps) => {
  const { Tabs } = useShadcnComponents();
  const categorization = props.uischema as any;
  const categories = categorization.elements ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  if (!props.visible || categories.length === 0) return null;
  const activeCategory = categories[activeIndex] ?? categories[0];
  const activeValue = String(activeIndex);

  return (
    <Tabs
      className='shadcn-jsonforms-categorization'
      value={activeValue}
      onValueChange={(value) => setActiveIndex(Number(value))}
      items={categories.map((category: any, index: number) => ({
        value: String(index),
        label: category.label ?? `Category ${index + 1}`,
        content:
          index === activeIndex ? (
            <JsonFormsDispatch
              schema={props.schema}
              uischema={activeCategory}
              path={props.path}
              enabled={props.enabled}
              renderers={props.renderers}
              cells={props.cells}
            />
          ) : null,
      }))}
    />
  );
};

export const categorizationTester: RankedTester = rankWith(
  1,
  uiTypeIs('Categorization')
);
