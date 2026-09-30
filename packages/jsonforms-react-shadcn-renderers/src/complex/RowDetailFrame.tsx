import { Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@jsonforms-react-shadcn-ui/tooltip';
import React from 'react';
import { RowDetailState } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
import {
  Dialog,
  DialogContent,
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
export const RowDetailFrame = ({
  state,
  children,
}: React.PropsWithChildren<{ state: RowDetailState }>) => {
  const { options, t } = state;
  const { panelOpen } = state;
  if (!options) return <>{children}</>;
  if (options.presentation === 'dialog')
    return (
      <>
        {children}
        <Dialog
          open={!!state.selection}
          onOpenChange={(open) => !open && state.close()}
        >
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{t('collection.editDetails')}</DialogTitle>
            </DialogHeader>
            <div className='max-h-[65vh] overflow-auto p-1'>
              {state.conflict && (
                <p role='alert'>{t('composite.applyConflict')}</p>
              )}
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
          </DialogContent>
        </Dialog>
      </>
    );
  return (
    <div>

    <ResizablePanelGroup
      orientation={options.placement === 'bottom' ? 'vertical' : 'horizontal'}
      // Percentage-sized panels need a definite height, even with one panel.
      style={{ height: panelOpen && options.placement === 'bottom' ? '40rem' : '32rem' }}
    >
      <ResizablePanel defaultSize='55%' minSize='20%'>
        {children}
      </ResizablePanel>
      {panelOpen && options.resizable !== false && <ResizableHandle withHandle />}
      {panelOpen && <ResizablePanel minSize='20%'>
        <div className='p-3'>
          {state.content ?? state.t('collection.selectItem')}
        </div>
      </ResizablePanel>}
    </ResizablePanelGroup>
    </div>
  );
};

export const RowDetailToggle = ({ state }: { state: RowDetailState }) => {
  const { panelOpen, setPanelOpen, t, options } = state;
  if (options?.presentation !== 'panel') return null;
  const toggleLabel = t(panelOpen ? 'collection.hideDetails' : 'collection.showDetails');
  return (
      <div className='flex items-center'>
        <TooltipProvider><Tooltip>
          <TooltipTrigger asChild>
            <Button type='button' variant='ghost' size='icon-sm'
              aria-label={toggleLabel} aria-expanded={panelOpen}
              onClick={() => setPanelOpen((open) => !open)}>
              {panelOpen ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{toggleLabel}</TooltipContent>
        </Tooltip></TooltipProvider>
      </div>
  );
};
