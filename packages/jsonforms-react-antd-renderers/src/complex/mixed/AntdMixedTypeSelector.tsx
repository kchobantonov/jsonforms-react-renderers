import { Select, Typography } from 'antd';
import React from 'react';

export interface AntdMixedTypeSelectorProps {
  disabled: boolean;
  error?: string;
  onChange: (value: string) => void;
  required?: boolean;
  types: string[];
  value: string | null;
}

export const AntdMixedTypeSelector = ({
  disabled,
  error,
  onChange,
  required,
  types,
  value,
}: AntdMixedTypeSelectorProps) => (
  <div style={{ minWidth: 140 }}>
    <Select
      aria-label='Value type'
      disabled={disabled}
      onChange={onChange}
      options={types.map((type) => ({ label: type, value: type }))}
      placeholder='Select a type'
      status={error ? 'error' : undefined}
      value={value ?? undefined}
      style={{ width: '100%' }}
    />
    {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
    {required ? <span className='sr-only'>Required</span> : null}
  </div>
);
