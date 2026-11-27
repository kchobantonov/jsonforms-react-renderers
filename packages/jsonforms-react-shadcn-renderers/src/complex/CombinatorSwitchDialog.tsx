import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
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

type CombinatorSwitchDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const CombinatorSwitchDialog = ({
  open,
  onCancel,
  onConfirm,
}: CombinatorSwitchDialogProps) => {
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('combinator.clearTitle')}</DialogTitle>
          <DialogDescription>{t('combinator.clearMessage')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onCancel}>
            {t('confirm.decline')}
          </Button>
          <Button type='button' onClick={onConfirm}>
            {t('confirm.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
