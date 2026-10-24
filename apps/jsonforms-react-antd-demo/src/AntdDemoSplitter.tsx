import { DemoSplitterProps } from '@chobantonov/jsonforms-react-demo-common';
import { Grid, Splitter } from 'antd';
import React from 'react';

export const AntdDemoSplitter = ({ form, data }: DemoSplitterProps) => {
  const screens = Grid.useBreakpoint();

  if (!screens.lg) {
    return (
      <div className='demo-data-layout demo-data-layout-stacked'>
        {form}
        {data}
      </div>
    );
  }

  return (
    <Splitter
      className='demo-data-layout demo-data-splitter'
      aria-label='Resize demo and data panes'
    >
      <Splitter.Panel defaultSize='75%' min='20%' max='80%'>
        <div className='antd-demo-splitter-pane'>{form}</div>
      </Splitter.Panel>
      <Splitter.Panel min='20%'>
        <div className='antd-demo-splitter-pane'>{data}</div>
      </Splitter.Panel>
    </Splitter>
  );
};
