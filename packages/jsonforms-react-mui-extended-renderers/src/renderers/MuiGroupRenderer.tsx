import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import React from 'react';
import { useGroupState } from '../util/groupState';

export const muiGroupTester: RankedTester = rankWith(3, uiTypeIs('Group'));

export const MuiGroupRendererComponent = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  if (!props.visible) return null;
  return (
    <Paper sx={{ p: 2, mb: 1, width: '100%', boxSizing: 'border-box' }}>
      {(props.label || group.collapsible || group.hasData) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant='h6' sx={{ flex: 1 }}>
            {props.label}
          </Typography>
          {group.hasData && (
            <span role='img' aria-label='Contains data' data-group-indicator>
              ●
            </span>
          )}
          {group.collapsible && (
            <IconButton
              type='button'
              aria-label={props.label || 'Group'}
              aria-expanded={!group.collapsed}
              aria-controls={group.contentId}
              onClick={group.toggle}
            >
              <span aria-hidden='true'>{group.collapsed ? '▸' : '▾'}</span>
            </IconButton>
          )}
        </Box>
      )}
      <div id={group.contentId} hidden={group.collapsed}>
        {((props.uischema as GroupLayout).elements ?? []).map(
          (element, index) => (
            <JsonFormsDispatch
              key={`${props.path}-${index}`}
              schema={props.schema}
              uischema={element}
              path={props.path}
              enabled={props.enabled}
              renderers={props.renderers}
              cells={props.cells}
            />
          )
        )}
      </div>
    </Paper>
  );
};

export const MuiGroupRenderer = withJsonFormsLayoutProps(
  MuiGroupRendererComponent
);
