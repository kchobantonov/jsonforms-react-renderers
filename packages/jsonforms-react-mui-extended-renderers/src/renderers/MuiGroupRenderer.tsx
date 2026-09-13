import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useGroupState } from '../util/groupState';

export const muiGroupTester: RankedTester = rankWith(3, uiTypeIs('Group'));

export const MuiGroupRendererComponent = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  if (!props.visible) return null;
  const indicator = group.hasData ? (
    <span role='img' aria-label='Contains data' data-group-indicator>
      ●
    </span>
  ) : null;
  const children = ((props.uischema as GroupLayout).elements ?? []).map(
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
  );
  if (group.collapsible) {
    return (
      <Box sx={{ mb: 1, width: '100%', boxSizing: 'border-box' }}>
        <Accordion
          expanded={!group.collapsed}
          onChange={group.toggle}
          slotProps={{ transition: { unmountOnExit: false } }}
          sx={{ m: 0, '&.Mui-expanded': { m: 0 } }}
        >
          <AccordionSummary
            id={`${group.contentId}-header`}
            aria-label={props.label || 'Group'}
            aria-controls={group.contentId}
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            <Typography component='span' variant='h6' sx={{ flex: 1 }}>
              {props.label || 'Group'}
            </Typography>
            {indicator}
          </AccordionSummary>
          <AccordionDetails>{children}</AccordionDetails>
        </Accordion>
      </Box>
    );
  }
  return (
    <Paper sx={{ p: 2, mb: 1, width: '100%', boxSizing: 'border-box' }}>
      {(props.label || group.hasData) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant='h6' sx={{ flex: 1 }}>
            {props.label}
          </Typography>
          {indicator}
        </Box>
      )}
      <div id={group.contentId}>{children}</div>
    </Paper>
  );
};

export const MuiGroupRenderer = withJsonFormsLayoutProps(
  MuiGroupRendererComponent
);
