import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import { Button, Tooltip } from 'antd';
import React from 'react';

export interface AntdClearValueButtonProps {
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
  visible?: boolean;
}

export const AntdClearValueButton = ({
  clearable = true,
  data,
  enabled,
  onClear,
  visible = true,
}: AntdClearValueButtonProps) => {
  const populated = data !== undefined && data !== null && data !== '';
  if (!clearable || !enabled || !populated) return null;

  return (
    <Tooltip title='Clear value'>
      <Button
        aria-label='Clear value'
        icon={<CloseCircleFilled />}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        onMouseDown={(event) => event.preventDefault()}
        shape='circle'
        size='small'
        style={{
          insetBlockStart: '50%',
          insetInlineEnd: 24,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          position: 'absolute',
          transform: 'translateY(-50%)',
          transition: 'opacity 120ms ease',
          zIndex: 2,
        }}
        type='text'
      />
    </Tooltip>
  );
};
