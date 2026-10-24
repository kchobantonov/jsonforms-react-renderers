import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import { Button, Flex, Tooltip } from 'antd';
import React from 'react';
import { useI18n } from '../../util/translate';

export interface AntdAdditionalPropertyActionsProps {
  deleteDisabled: boolean;
  name: string;
  onDelete: () => void;
  onRename: () => void;
  readonly?: boolean;
}

export const AntdAdditionalPropertyActions = ({
  deleteDisabled,
  name,
  onDelete,
  onRename,
  readonly,
}: AntdAdditionalPropertyActionsProps) => {
  const t = useI18n();
  return (
    <Flex className='jsonforms-additional-property-actions' gap={4}>
      <Tooltip title={t('additionalProperties.rename')}>
        <Button
          aria-label={t('additionalProperties.renameNamed', { name })}
          disabled={readonly}
          icon={<EditOutlined />}
          onClick={onRename}
          shape='circle'
          size='small'
          type='text'
        />
      </Tooltip>
      <Tooltip
        title={
          deleteDisabled
            ? t('additionalProperties.deleteBlocked')
            : t('additionalProperties.delete')
        }
      >
        <Button
          aria-label={t('additionalProperties.deleteNamed', { name })}
          danger
          disabled={deleteDisabled}
          icon={<DeleteOutlined />}
          onClick={onDelete}
          shape='circle'
          size='small'
          type='text'
        />
      </Tooltip>
    </Flex>
  );
};
