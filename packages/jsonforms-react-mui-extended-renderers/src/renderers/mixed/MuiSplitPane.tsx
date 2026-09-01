import { Box, Divider } from '@mui/material';
import React, { ReactNode, useRef, useState } from 'react';

export interface MuiSplitPaneProps {
  detail: ReactNode;
  tree: ReactNode;
}

export const MuiSplitPane = ({ detail, tree }: MuiSplitPaneProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [treeSize, setTreeSize] = useState(25);
  const resizeTo = (clientX: number) => {
    const bounds = container.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    setTreeSize(
      Math.min(65, Math.max(20, ((clientX - bounds.left) / bounds.width) * 100))
    );
  };

  return (
    <Box
      ref={container}
      sx={{
        display: 'grid',
        gridTemplateColumns: `${treeSize}% 12px minmax(0, 1fr)`,
        minHeight: 280,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ minWidth: 0, overflow: 'auto', p: 1 }}>{tree}</Box>
      <Divider
        aria-label='Resize tree and detail panes'
        aria-orientation='vertical'
        aria-valuemax={65}
        aria-valuemin={20}
        aria-valuenow={Math.round(treeSize)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft')
            setTreeSize((size) => Math.max(20, size - 5));
          if (event.key === 'ArrowRight')
            setTreeSize((size) => Math.min(65, size + 5));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeTo(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            resizeTo(event.clientX);
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
      <Box sx={{ minWidth: 0, overflow: 'auto', p: 2 }}>{detail}</Box>
    </Box>
  );
};
