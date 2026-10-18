import React from 'react';
import { Button, ButtonProps } from 'primereact/button';

/** Native icon action. Callers supply text from the shared renderer catalog or
 * JSON Forms array translations, keeping locale ownership with the form. */
export type PrimeIconButtonProps = Omit<ButtonProps, 'children' | 'label'> & {
  'aria-label': string;
};

export const PrimeIconButton = ({
  style,
  tooltip,
  ...props
}: PrimeIconButtonProps) => (
  <Button
    text
    rounded
    {...props}
    type='button'
    tooltip={tooltip ?? props['aria-label']}
    tooltipOptions={{
      event: 'both',
      ...props.tooltipOptions,
    }}
    style={{
      width: '2rem',
      height: '2rem',
      padding: 0,
      flexShrink: 0,
      ...style,
    }}
  />
);
