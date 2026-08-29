import type { ShadcnTabsProps } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const JsonFormsTabs = ({
  className,
  items,
  onValueChange,
  value,
}: ShadcnTabsProps) => (
  <Tabs className={className} value={value} onValueChange={onValueChange}>
    <TabsList className='shadcn-jsonforms-tabs'>
      {items.map((item) => (
        <TabsTrigger
          className='shadcn-jsonforms-tab'
          key={item.value}
          value={item.value}
        >
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
    {items.map((item) => (
      <TabsContent key={item.value} value={item.value}>
        {item.content}
      </TabsContent>
    ))}
  </Tabs>
);
import React from 'react';
