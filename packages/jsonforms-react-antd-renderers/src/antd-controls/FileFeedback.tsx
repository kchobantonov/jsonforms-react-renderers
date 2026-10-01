import React from 'react';
import { Button, Popover, Typography, theme } from 'antd';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
export const FileFeedback = ({ message, cell, severity }: { message: string; cell?: boolean; severity: 'warning' | 'error' }) => {
  const { token } = theme.useToken();
  const color = severity === 'warning' ? token.colorWarning : token.colorError;
  return cell ? <Popover content={message} trigger={['hover', 'focus', 'click']}>
    <Button type='text' size='small' aria-label={message} style={{ color, flexShrink: 0 }}
      icon={severity === 'warning' ? <WarningOutlined /> : <ExclamationCircleOutlined />} />
  </Popover> : <Typography.Text style={{ color }} role='alert' data-file-rejection>{message}</Typography.Text>;
};
