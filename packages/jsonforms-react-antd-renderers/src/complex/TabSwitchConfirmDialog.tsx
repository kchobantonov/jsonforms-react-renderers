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
      title={t('combinator.clearFormTitle')}
      open={open}
      afterClose={handleClose}
      onOk={confirm}
      onCancel={cancel}
      okText={t('combinator.clearFormConfirm')}
      cancelText={t('combinator.clearFormDecline')}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <p>{t('combinator.clearFormMessage')}</p>
    </Modal>
  );
};
