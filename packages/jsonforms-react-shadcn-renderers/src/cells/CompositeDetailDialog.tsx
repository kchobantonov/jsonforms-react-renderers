import {
  useCompositeDraft,
  type CompositeDetailDialogProps,
} from '@chobantonov/jsonforms-react-renderer-common/cells/useCompositeDraft';
import { DetailDialogContent } from '../complex/DetailDialogContent';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@jsonforms-react-shadcn-ui/dialog';
import { JsonFormsContext } from '@jsonforms/react';
import { ShadcnCellMode } from './asCell';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';

export const CompositeDetailDialog = (props: CompositeDetailDialogProps) => {
  const { open, title, label, options, t, children } = props;
  const dialog = useCompositeDraft(props);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dialog.cancel();
      }}
    >
      <DetailDialogContent
        open={open}
        options={options.dialog}
        className='max-w-2xl'
        aria-label={label}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <JsonFormsContext.Provider value={dialog.context as any}>
          <PendingChangesProvider changes={dialog.pending}>
            <ShadcnCellMode.Provider value={false}>
              <div className='p-1'>{children}</div>
            </ShadcnCellMode.Provider>
          </PendingChangesProvider>
        </JsonFormsContext.Provider>
        {dialog.conflicted && (
          <p role='alert'>
            {t(
              'composite.applyConflict',
              dialog.defaultMessage('composite.applyConflict'),
            )}
          </p>
        )}
        <DialogFooter>
          {options.showEmptyButton === true && (
            <Button
              type='button'
              variant='outline'
              disabled={!dialog.canEmpty}
              onClick={dialog.clear}
            >
              {dialog.buttonLabel(options.emptyLabel, 'composite.empty')}
            </Button>
          )}
          <Button type='button' variant='outline' onClick={dialog.cancel}>
            {dialog.buttonLabel(options.cancelLabel, 'composite.cancel')}
          </Button>
          <Button
            type='button'
            disabled={!dialog.canApply}
            onClick={dialog.apply}
          >
            {dialog.buttonLabel(options.okLabel, 'composite.apply')}
          </Button>
        </DialogFooter>
      </DetailDialogContent>
    </Dialog>
  );
};
