import { ScrollRegion } from '../components/ScrollRegion';
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { DialogContent } from '@jsonforms-react-shadcn-ui/dialog';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  useDetailDialog,
  DetailDialogOptions,
} from '@chobantonov/jsonforms-react-renderer-common/detailDialog';
import { useTranslator } from '@chobantonov/jsonforms-react-renderer-common/translate';

export const DetailDialogContent = ({
  options = {},
  open,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  options?: DetailDialogOptions;
  open: boolean;
}) => {
  const geometry = useDetailDialog(open, { width: 640, ...options });
  const t = useTranslator();
  const label = geometry.maximized
    ? t('dialog.restore', 'Restore dialog')
    : t('dialog.maximize', 'Maximize dialog');
  const parts = React.Children.toArray(children);
  return (
    <DialogContent
      {...props}
      tabIndex={-1}
      style={{
        ...props.style,
        ...geometry.style,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // Geometry must follow the pointer without the primitive's transition delay.
        transitionProperty: 'none',
        left: `calc(50% + ${geometry.offset.x}px)`,
        top: `calc(50% + ${geometry.offset.y}px)`,
        translate: '-50% -50%',
        transform: 'none',
      }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.target as HTMLElement).focus();
      }}
    >
      {options.maximizable !== false && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='absolute right-10 top-2'
          aria-label={label}
          title={label}
          onClick={geometry.toggle}
        >
          {geometry.maximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
      )}
      <div
        {...geometry.dragProps}
        style={{ ...geometry.dragProps.style, flexShrink: 0 }}
        className='min-w-0 pr-16'
      >
        {parts[0]}
      </div>
      <ScrollRegion
        data-detail-dialog-body
        style={{ flex: '1 1 auto', minHeight: 0 }}
      >
        {parts.slice(1, -1)}
      </ScrollRegion>
      <div
        data-detail-dialog-footer
        style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}
      >
        {parts[parts.length - 1]}
      </div>
    </DialogContent>
  );
};
