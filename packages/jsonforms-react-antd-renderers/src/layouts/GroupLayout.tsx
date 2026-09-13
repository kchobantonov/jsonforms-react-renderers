/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import React from 'react';
import { Card, Collapse } from 'antd';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { AntdLayoutRenderer } from '../util/layout';
import { useGroupState } from '../util/groupState';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GroupLayoutRenderer = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  const layout = props.uischema as GroupLayout;
  if (!props.visible) return null;
  const indicator = group.hasData ? (
    <span role='img' aria-label='Contains data' data-group-indicator>
      ●
    </span>
  ) : undefined;
  const content = (
    <AntdLayoutRenderer
      {...props}
      direction='column'
      elements={layout.elements}
    />
  );
  const style = { marginBottom: '10px', width: '100%' };

  if (group.collapsible) {
    return (
      <Collapse
        style={style}
        activeKey={group.collapsed ? [] : ['group']}
        onChange={(keys) => {
          if (keys.includes('group') === group.collapsed) group.toggle();
        }}
        destroyOnHidden={false}
        items={[
          {
            key: 'group',
            label: props.label || 'Group',
            extra: indicator,
            forceRender: true,
            children: content,
          },
        ]}
      />
    );
  }

  return (
    <Card title={props.label || undefined} extra={indicator} style={style}>
      {content}
    </Card>
  );
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);
export const antdGroupTester: RankedTester = withIncreasedRank(1, groupTester);
