import { Select, Typography } from 'antd';
import React from 'react';
import { useI18n } from '../../util/translate';
import { visuallyHidden } from '../../util/visuallyHidden';

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
}: AntdMixedTypeSelectorProps) => {
  const t = useI18n();
  return (
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
        aria-label={t('mixed.typeLabel')}
        disabled={disabled}
        onChange={onChange}
        options={types.map((type) => ({ label: type, value: type }))}
        placeholder={t('mixed.typePlaceholder')}
        popupMatchSelectWidth={false}
        status={error ? 'error' : undefined}
        value={value ?? undefined}
        style={{ width: '100%' }}
      />
      {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
      {required ? (
        <span style={visuallyHidden}>{t('mixed.required')}</span>
      ) : null}
    </div>
  );
};
