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
      <div style={{ display: 'grid', gap: 16 }}>
        {tree}
        {detail}
      </div>
    );
  }
  return (
    <Splitter style={{ minHeight: 280 }}>
      <Splitter.Panel defaultSize='25%' min='18%' max='45%'>
        <div style={{ height: '100%', overflow: 'auto', padding: 12 }}>{tree}</div>
      </Splitter.Panel>
      <Splitter.Panel min='45%'>
        <div style={{ height: '100%', overflow: 'auto', padding: 12 }}>
          {detail}
        </div>
      </Splitter.Panel>
    </Splitter>
  );
};
