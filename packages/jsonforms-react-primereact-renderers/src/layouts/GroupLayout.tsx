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
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { PrimeLayoutRenderer } from '../util/layout';
import { useGroupState } from '../util/groupState';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GroupLayoutRenderer = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  const layout = props.uischema as GroupLayout;
  if (!props.visible) return null;
  const title =
    props.label || group.collapsible || group.hasData ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span>{props.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {group.hasData && (
            <span role='img' aria-label='Contains data' data-group-indicator>
              ●
            </span>
          )}
          {group.collapsible && (
            <Button
              type='button'
              aria-label={props.label || 'Group'}
              aria-expanded={!group.collapsed}
              aria-controls={group.contentId}
              onClick={group.toggle}
            >
              <span aria-hidden='true'>{group.collapsed ? '▸' : '▾'}</span>
            </Button>
          )}
        </span>
      </div>
    ) : undefined;
  return (
    <Card title={title} style={{ marginBottom: '10px', width: '100%' }}>
      <div id={group.contentId} hidden={group.collapsed}>
        <PrimeLayoutRenderer
          {...props}
          direction='column'
          elements={layout.elements}
        />
      </div>
    </Card>
  );
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);
export const primeGroupTester: RankedTester = withIncreasedRank(1, groupTester);
