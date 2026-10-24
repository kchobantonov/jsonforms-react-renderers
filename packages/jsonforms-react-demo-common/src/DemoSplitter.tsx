import React from 'react';

export type DemoSplitterProps = {
  form: React.ReactNode;
  data: React.ReactNode;
};

export const DefaultDemoSplitter = ({ form, data }: DemoSplitterProps) => (
  <div className='demo-data-layout demo-data-layout-default'>
    {form}
    {data}
  </div>
);
