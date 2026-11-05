import React from 'react';
import { useI18n } from '../util/translate';

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
  const t = useI18n();
  return (
    <Modal
      title={t('confirm.branchChange.title')}
      open={open}
      afterClose={handleClose}
      onOk={confirm}
      onCancel={cancel}
      okText={t('confirm.accept')}
      cancelText={t('confirm.decline')}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <p>{t('confirm.branchChange.message')}</p>
    </Modal>
  );
};
