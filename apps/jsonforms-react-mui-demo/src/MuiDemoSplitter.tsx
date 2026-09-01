import { Box, Divider, useMediaQuery } from '@mui/material';
import { DemoSplitterProps } from '@chobantonov/jsonforms-react-demo-common';
import React, { useRef, useState } from 'react';

const stackedLayoutQuery = '(max-width: 1100px)';

export const MuiDemoSplitter = ({ form, data }: DemoSplitterProps) => {
  const stacked = useMediaQuery(stackedLayoutQuery);
  const container = useRef<HTMLDivElement>(null);
  const [formSize, setFormSize] = useState(75);

  const resizeTo = (clientX: number) => {
    const element = container.current;
    const bounds = element?.getBoundingClientRect();
    if (!element || !bounds?.width) return;
    const rtl = getComputedStyle(element).direction === 'rtl';
    const offset = rtl ? bounds.right - clientX : clientX - bounds.left;
    setFormSize(Math.min(80, Math.max(20, (offset / bounds.width) * 100)));
  };

  if (stacked) {
    return (
      <Box
        className='demo-data-layout demo-data-layout-stacked'
        sx={{
          display: 'grid',
          gap: 3,
          minWidth: 0,
          '& .demo-data-pane': { minWidth: 0 },
          '& .demo-data-pane > h3': { mt: 0 },
          '& .form-card': { mt: 2 },
          '& .demo-editor-pane': {
            borderTop: 1,
            borderColor: 'divider',
            pt: 3,
          },
          '& .data-editor-frame': {
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mt: 2,
            overflow: 'hidden',
          },
        }}
      >
        {form}
        {data}
      </Box>
    );
  }

  return (
    <Box
      className='demo-data-layout demo-data-splitter'
      ref={container}
      sx={{
        direction: 'inherit',
        display: 'grid',
        gridTemplateColumns: `${formSize}% 12px minmax(0, 1fr)`,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          minWidth: 0,
          overflow: 'auto',
          pe: 2,
          '& .demo-data-pane': { minWidth: 0 },
          '& .demo-data-pane > h3': { mt: 0 },
          '& .form-card': { mt: 2 },
        }}
      >
        {form}
      </Box>
      <Divider
        aria-label='Resize demo and data panes'
        aria-orientation='vertical'
        aria-valuemax={80}
        aria-valuemin={20}
        aria-valuenow={Math.round(formSize)}
        onKeyDown={(event) => {
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const step = event.key === 'ArrowLeft' ? -5 : 5;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            setFormSize((size) =>
              Math.min(80, Math.max(20, size + (rtl ? -step : step)))
            );
          }
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeTo(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            resizeTo(event.clientX);
          }
        }}
        orientation='vertical'
        role='separator'
        tabIndex={0}
        sx={{
          alignItems: 'center',
          cursor: 'col-resize',
          display: 'flex',
          justifyContent: 'center',
          outlineOffset: -2,
          touchAction: 'none',
        }}
      >
        <Box aria-hidden sx={{ color: 'text.secondary', lineHeight: 1 }}>
          ⋮
        </Box>
      </Divider>
      <Box
        sx={{
          minWidth: 0,
          overflow: 'auto',
          ps: 2,
          '& .demo-data-pane': { minWidth: 0 },
          '& .editor-heading': { mb: 0 },
          '& .editor-heading h3': { m: 0 },
          '& .data-editor-frame': {
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mt: 2,
            overflow: 'hidden',
          },
        }}
      >
        {data}
      </Box>
    </Box>
  );
};
