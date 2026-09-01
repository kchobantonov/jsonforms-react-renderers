import { Form, Input, Modal } from 'antd';
import React from 'react';

export interface AntdAdditionalPropertyRenameDialogProps {
  disabled: boolean;
  error?: string;
  oldName: string | null;
  onCancel: () => void;
  onChange: (value: string) => void;
  onRename: () => void;
  value: string;
}

export const AntdAdditionalPropertyRenameDialog = ({
  disabled,
  error,
  oldName,
  onCancel,
  onChange,
  onRename,
  value,
}: AntdAdditionalPropertyRenameDialogProps) => (
  <Modal
    cancelText='Cancel'
    destroyOnHidden
    okButtonProps={{ disabled }}
    okText='Rename'
    onCancel={onCancel}
    onOk={onRename}
    open={oldName !== null}
    title={`Rename ${oldName ?? 'property'}`}
  >
    <Form.Item
      help={error}
      label='Property name'
      validateStatus={error ? 'error' : undefined}
    >
      <Input
        autoFocus
        aria-label={oldName ? `Rename ${oldName}` : 'Property name'}
        onChange={(event) => onChange(event.currentTarget.value)}
        onPressEnter={() => {
          if (!disabled) onRename();
        }}
        value={value}
      />
    </Form.Item>
  </Modal>
);
