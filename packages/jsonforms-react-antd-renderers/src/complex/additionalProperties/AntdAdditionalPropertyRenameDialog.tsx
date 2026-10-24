import { Form, Input, Modal } from 'antd';
import React from 'react';
import { useI18n } from '../../util/translate';

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
}: AntdAdditionalPropertyRenameDialogProps) => {
  const t = useI18n();
  return (
    <Modal
      cancelText={t('combinator.cancel')}
      destroyOnHidden
      okButtonProps={{ disabled }}
      okText={t('additionalProperties.renameConfirm')}
      onCancel={onCancel}
      onOk={onRename}
      open={oldName !== null}
      title={
        oldName
          ? t('additionalProperties.renameNamed', { name: oldName })
          : t('additionalProperties.renameTitle')
      }
    >
      <Form.Item
        help={error}
        label={t('additionalProperties.namePlaceholder')}
        validateStatus={error ? 'error' : undefined}
      >
        <Input
          autoFocus
          aria-label={
            oldName
              ? t('additionalProperties.renameNamed', { name: oldName })
              : t('additionalProperties.namePlaceholder')
          }
          onChange={(event) => onChange(event.currentTarget.value)}
          onPressEnter={() => {
            if (!disabled) onRename();
          }}
          value={value}
        />
      </Form.Item>
    </Modal>
  );
};
