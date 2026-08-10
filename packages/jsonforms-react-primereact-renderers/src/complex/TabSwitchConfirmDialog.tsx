import React from 'react';

import { ConfirmDialog } from 'primereact/confirmdialog';

export interface TabSwitchConfirmDialogProps {
  open: boolean;
  handleClose: () => void;
  confirm: () => void;
  cancel: () => void;
  id: string;
}

export const TabSwitchConfirmDialog = ({
  open,
  handleClose,
  confirm,
  cancel,
}: TabSwitchConfirmDialogProps) => {
  return (
    <ConfirmDialog
      header={'Clear form?'}
      visible={open}
      onHide={handleClose}
      accept={confirm}
      reject={cancel}
      acceptLabel={'Yes'}
      rejectLabel={'No'}
      message={
        'Your data will be cleared if you navigate away from this tab. Do you want to proceed?'
      }
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    ></ConfirmDialog>
  );
};
