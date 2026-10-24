import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jsonforms-react-shadcn-ui/dialog';

export const DeleteDialog = ({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirm.delete.title')}</DialogTitle>
          <DialogDescription>{t('confirm.delete.message')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onCancel}>
            {t('confirm.decline')}
          </Button>
          <Button type='button' variant='destructive' onClick={onConfirm}>
            {t('confirm.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
