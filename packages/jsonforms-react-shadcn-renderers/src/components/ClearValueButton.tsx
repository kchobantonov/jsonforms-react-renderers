import { X } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';

export interface ClearValueButtonProps {
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
  readonly?: boolean;
}

export const hasClearableValue = (data: unknown) =>
  data !== undefined && data !== null && data !== '';

export const ClearValueButton = ({
  clearable = true,
  data,
  enabled,
  onClear,
  readonly,
}: ClearValueButtonProps) => {
  if (!clearable || !enabled || readonly || !hasClearableValue(data)) {
    return null;
  }

  return (
    <Button
      aria-label='Clear value'
      className='absolute right-1 top-1 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={(event) => event.preventDefault()}
      size='icon'
      title='Clear value'
      type='button'
      variant='ghost'
    >
      <X className='h-4 w-4' />
    </Button>
  );
};
