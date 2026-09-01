import { Button } from 'primereact/button';
import React from 'react';

export interface PrimeClearValueButtonProps {
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
}

export const PrimeClearValueButton = ({
  clearable = true,
  data,
  enabled,
  onClear,
}: PrimeClearValueButtonProps) => {
  const populated = data !== undefined && data !== null && data !== '';
  if (!clearable || !enabled || !populated) return null;

  return (
    <Button
      aria-label='Clear value'
      icon='pi pi-times'
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      onMouseDown={(event) => event.preventDefault()}
      rounded
      style={{
        insetBlockStart: '50%',
        insetInlineEnd: '0.25rem',
        position: 'absolute',
        transform: 'translateY(-50%)',
      }}
      text
      tooltip='Clear value'
      type='button'
    />
  );
};
