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
    <ResizablePanelGroup
      orientation={options.placement === 'bottom' ? 'vertical' : 'horizontal'}
      style={{ height: options.placement === 'bottom' ? '40rem' : '32rem' }}
    >
      <ResizablePanel defaultSize='55%' minSize='20%'>
        {children}
      </ResizablePanel>
      {options.resizable !== false && <ResizableHandle withHandle />}
      <ResizablePanel minSize='20%'>
        <div className='p-3'>
          {state.content ?? state.t('collection.selectItem')}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
