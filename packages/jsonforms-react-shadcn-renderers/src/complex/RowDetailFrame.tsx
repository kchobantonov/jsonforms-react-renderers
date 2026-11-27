import { ScrollRegion } from '../components/ScrollRegion';
import { DetailDialogContent } from '../complex/DetailDialogContent';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import React from 'react';
import {
  type RowDetailState,
  createRowDetailToggle,
  createRowDetailFrame,
} from '@chobantonov/jsonforms-react-renderer-common/collections/rowDetail';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@jsonforms-react-shadcn-ui/dialog';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';
const RowDialog = ({ state }: { state: RowDetailState }) => {
  const { options, t } = state;
  return (
    <Dialog
      open={!!state.selection}
      onOpenChange={(open) => !open && state.close()}
    >
      <DetailDialogContent
        open={!!state.selection}
        options={options.dialog}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t('collection.editDetails')}</DialogTitle>
        </DialogHeader>
        <div className='p-1'>
          {state.conflict && <p role='alert'>{t('composite.applyConflict')}</p>}
          {state.content}
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={state.close}>
            {t('composite.cancel')}
          </Button>
          <Button
            type='button'
            disabled={!state.enabled || state.conflict}
            onClick={state.apply}
          >
            {t('composite.apply')}
          </Button>
        </DialogFooter>
      </DetailDialogContent>
    </Dialog>
  );
};
const RowPanel = ({
  state,
  children,
}: React.PropsWithChildren<{ state: RowDetailState }>) => {
  const { options, panelOpen } = state;
  return (
    <div>
      <ResizablePanelGroup
        orientation={options.placement === 'bottom' ? 'vertical' : 'horizontal'}
        // Percentage-sized panels need a definite height, even with one panel.
        style={{
          height:
            panelOpen && options.placement === 'bottom' ? '40rem' : '32rem',
        }}
      >
        <ResizablePanel defaultSize='55%' minSize='20%'>
          <ScrollRegion
            className='shadcn-jsonforms-collection-pane'
            style={{ height: '100%' }}
          >
            {children}
          </ScrollRegion>
        </ResizablePanel>
        {panelOpen && options.resizable !== false && (
          <ResizableHandle withHandle />
        )}
        {panelOpen && (
          <ResizablePanel minSize='20%'>
            <ScrollRegion style={{ height: '100%' }}>
              <div className='p-3'>
                {state.content ?? state.t('collection.selectItem')}
              </div>
            </ScrollRegion>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export const RowDetailFrame = createRowDetailFrame(RowDialog, RowPanel);

export const RowDetailToggle = createRowDetailToggle((toggle) => (
  <div className='flex items-center'>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={toggle.label}
            aria-expanded={toggle.expanded}
            onClick={toggle.toggle}
          >
            {toggle.expanded ? (
              <EyeOff aria-hidden='true' />
            ) : (
              <Eye aria-hidden='true' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{toggle.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
));

/** Shared row edit action for native tables and AG Grid. */
export const RowDetailEditButton = ({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          <Pencil className='h-4 w-4' aria-hidden='true' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
