import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import { Button, Flex, Tooltip } from 'antd';
import React from 'react';

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
}: AntdAdditionalPropertyActionsProps) => (
  <Flex className='jsonforms-additional-property-actions' gap={4}>
    <Tooltip title='Rename property'>
      <Button
        aria-label={`Rename ${name}`}
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
          ? 'The schema requires this property to remain.'
          : 'Delete property'
      }
    >
      <Button
        aria-label={`Delete ${name}`}
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
