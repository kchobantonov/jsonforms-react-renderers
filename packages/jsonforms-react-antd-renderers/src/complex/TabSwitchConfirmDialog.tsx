import React from 'react';

import { Modal } from 'antd';

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
    <Modal
      title={'Clear form?'}
      open={open}
      afterClose={handleClose}
      onOk={confirm}
      onCancel={cancel}
      okText={'Yes'}
      cancelText={'No'}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <p>
        Your data will be cleared if you navigate away from this tab. Do you
        want to proceed?
      </p>
    </Modal>
  );
};
