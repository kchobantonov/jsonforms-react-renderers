import React from 'react';
import { Modal } from 'antd';
import { useI18n } from '../util/translate';

export interface DeleteDialogProps {
  open: boolean;
  onConfirm(): void;
  onCancel(): void;
  title?: string;
  message?: string;
  acceptText?: string;
  declineText?: string;
}

export interface WithDeleteDialogSupport {
  openDeleteDialog(path: string, data: number): void;
}

export const DeleteDialog = React.memo(function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  acceptText,
  declineText,
}: DeleteDialogProps) {
  const t = useI18n();
  return (
    <Modal
      title={title ?? t('confirm.delete.title')}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={acceptText ?? t('confirm.accept')}
      okButtonProps={{ danger: true }}
      cancelText={declineText ?? t('confirm.decline')}
      aria-labelledby='alert-dialog-confirmdelete-title'
      aria-describedby='alert-dialog-confirmdelete-description'
    >
      <p>{message ?? t('confirm.delete.message')}</p>
    </Modal>
  );
});
