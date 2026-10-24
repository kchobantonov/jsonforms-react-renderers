import { Grid, Splitter } from 'antd';
import React from 'react';

export const AntdMixedSplitPane = ({
  detail,
  tree,
}: {
  detail: React.ReactNode;
  tree: React.ReactNode;
}) => {
  const screens = Grid.useBreakpoint();
  if (!screens.md) {
    return (
      <div
        className='jsonforms-mixed-split-pane-stacked'
        style={{ display: 'grid', gap: 16 }}
      >
        <div
          className='jsonforms-mixed-tree-pane'
          style={{ maxHeight: 'min(45vh, 480px)', overflow: 'auto' }}
        >
          {tree}
        </div>
        <div className='jsonforms-mixed-detail-pane'>{detail}</div>
      </div>
    );
  }
  return (
    <Splitter
      className='jsonforms-mixed-split-pane'
      style={{ height: 'min(70vh, 720px)', minHeight: 280 }}
    >
      <Splitter.Panel defaultSize='25%' min='18%' max='45%'>
        <div
          className='jsonforms-mixed-tree-pane'
          style={{ height: '100%', overflow: 'auto', padding: 12 }}
        >
          {tree}
        </div>
      </Splitter.Panel>
      <Splitter.Panel min='45%'>
        <div
          className='jsonforms-mixed-detail-pane'
          style={{ height: '100%', overflow: 'auto', padding: 12 }}
        >
          {detail}
        </div>
      </Splitter.Panel>
    </Splitter>
  );
};
