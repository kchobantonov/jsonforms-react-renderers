import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

export const ShadcnCategorizationLayout = (props: LayoutProps) => {
  const categorization = props.uischema as any;
  const categories = categorization.elements ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  if (!props.visible || categories.length === 0) return null;
  const activeValue = String(activeIndex);

  return (
    <Tabs
      className='shadcn-jsonforms-categorization'
      value={activeValue}
      onValueChange={(value) => setActiveIndex(Number(value))}
    >
      <TabsList className='shadcn-jsonforms-tabs'>
        {categories.map((category: any, index: number) => (
          <TabsTrigger
            className='shadcn-jsonforms-tab'
            key={index}
            value={String(index)}
          >
            {category.label ?? `Category ${index + 1}`}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category: any, index: number) => (
        <TabsContent key={index} value={String(index)}>
          {index === activeIndex ? (
            <JsonFormsDispatch
              schema={props.schema}
              uischema={category}
              path={props.path}
              enabled={props.enabled}
              renderers={props.renderers}
              cells={props.cells}
            />
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export const categorizationTester: RankedTester = rankWith(
  1,
  uiTypeIs('Categorization')
);
