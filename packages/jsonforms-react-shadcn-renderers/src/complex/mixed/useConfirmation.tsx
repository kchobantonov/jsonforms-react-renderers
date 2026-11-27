import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@jsonforms-react-shadcn-ui/dialog';
import { useConfirmationState } from '@chobantonov/jsonforms-react-renderer-common/interaction/useConfirmationState';

/** Presents the shared destructive-change policy with a shadcn dialog. */
export const useConfirmation = () => {
  const { t, pending, request, close, confirm, title, message } =
    useConfirmationState();
  const dialog = pending ? (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={close}>
            {t('confirm.decline')}
          </Button>
          <Button onClick={confirm}>{t('confirm.accept')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;
  return { request, dialog };
};
