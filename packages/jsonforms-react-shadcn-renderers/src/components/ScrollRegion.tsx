import React from 'react';
import { ScrollArea, ScrollBar } from '@jsonforms-react-shadcn-ui/scroll-area';

/** The host supplies upstream themed scrollbars; both axes remain reachable. */
export const ScrollRegion = ({
  children,
  style,
  className = '',
  ...props
}: React.ComponentProps<typeof ScrollArea>) => (
  <ScrollArea
    {...props}
    type='auto'
    className={'shadcn-jsonforms-scroll-region ' + className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      minHeight: 0,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
    <ScrollBar orientation='horizontal' />
  </ScrollArea>
);
