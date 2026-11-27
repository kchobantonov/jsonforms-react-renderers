import React from 'react';
import { Modal } from 'antd';
import { useConfirmationState } from '@chobantonov/jsonforms-react-renderer-common/interaction/useConfirmationState';
export type { ConfirmationRequest as ConfirmRequest } from '@chobantonov/jsonforms-react-renderer-common/interaction/confirmation';

/** Presents the shared destructive-change policy with an AntD dialog. */
export const useConfirmation = () => {
  const { t, pending, request, close, confirm, title, message } =
    useConfirmationState();
  const dialog = pending ? (
    <Modal
      open
      title={title}
      okText={t('confirm.accept')}
      cancelText={t('confirm.decline')}
      okButtonProps={{ danger: pending.operation === 'delete' }}
      onOk={confirm}
      onCancel={close}
      data-confirm={pending.operation}
    >
      <p>{message}</p>
    </Modal>
  ) : null;
  return { request, dialog };
};
