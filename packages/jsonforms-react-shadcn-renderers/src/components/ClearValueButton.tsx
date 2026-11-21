import { X } from 'lucide-react';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';

export interface ClearValueButtonProps {
  clearable?: boolean;
  adornmentAware?: boolean;
  trailingControlSpace?: number;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
  readonly?: boolean;
}

export const hasClearableValue = (data: unknown) =>
  data !== undefined && data !== null && data !== '';

export const ClearValueButton = ({
  clearable = true,
  adornmentAware = true,
  trailingControlSpace = 0,
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
      className='absolute top-1/2 h-8 w-8 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
      style={{
        insetInlineEnd: adornmentAware
          ? `calc(0.25rem + var(--jf-end-adornment-space, 0px) + ${trailingControlSpace}px)`
          : '0.25rem',
      }}
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
