import { Select, Typography } from 'antd';
import React from 'react';

export interface AntdMixedTypeSelectorProps {
  clearable?: boolean;
  disabled: boolean;
  error?: string;
  fullWidth?: boolean;
  onChange: (value: string | undefined) => void;
  required?: boolean;
  types: string[];
  value: string | null;
}

export const AntdMixedTypeSelector = ({
  clearable = true,
  disabled,
  error,
  fullWidth = false,
  onChange,
  required,
  types,
  value,
}: AntdMixedTypeSelectorProps) => (
  <div
    className={
      fullWidth
        ? 'jsonforms-mixed-type-selector jsonforms-mixed-type-selector-full-width'
        : 'jsonforms-mixed-type-selector'
    }
    style={{ minWidth: 140, width: fullWidth ? '100%' : undefined }}
  >
    <Select
      allowClear={clearable}
      aria-label='Value type'
      disabled={disabled}
      onChange={onChange}
      options={types.map((type) => ({ label: type, value: type }))}
      placeholder='Select a type'
      popupMatchSelectWidth={false}
      status={error ? 'error' : undefined}
      value={value ?? undefined}
      style={{ width: '100%' }}
    />
    {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
    {required ? <span className='sr-only'>Required</span> : null}
  </div>
);
