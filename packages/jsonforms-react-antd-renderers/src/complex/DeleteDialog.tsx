import React from 'react';
import { Modal } from 'antd';

export interface DeleteDialogProps {
  open: boolean;
  onConfirm(): void;
  onCancel(): void;
  title: string;
  message: string;
  acceptText: string;
  declineText: string;
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
  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={acceptText}
      cancelText={declineText}
      aria-labelledby='alert-dialog-confirmdelete-title'
      aria-describedby='alert-dialog-confirmdelete-description'
    >
      <p>{message}</p>
    </Modal>
  );
});
