import AlignLeftOutlined from '@ant-design/icons/AlignLeftOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CodeOutlined from '@ant-design/icons/CodeOutlined';
import StopOutlined from '@ant-design/icons/StopOutlined';
import React from 'react';

export const AntdJsonTypeIcon = ({ type }: { type: string | null }) => {
  const icon =
    type === 'array' ? (
      '[]'
    ) : type === 'object' ? (
      '{}'
    ) : type === 'string' ? (
      <AlignLeftOutlined />
    ) : type === 'integer' || type === 'number' ? (
      '#'
    ) : type === 'boolean' ? (
      <CheckOutlined />
    ) : type === 'null' ? (
      <StopOutlined />
    ) : (
      <CodeOutlined />
    );

  return (
    <span
      aria-label={`${type ?? 'unknown'} value`}
      className='jsonforms-mixed-tree-type-icon'
      role='img'
      style={{ fontFamily: 'monospace', fontWeight: 600 }}
      title={`${type ?? 'unknown'} value`}
    >
      {icon}
    </span>
  );
};
