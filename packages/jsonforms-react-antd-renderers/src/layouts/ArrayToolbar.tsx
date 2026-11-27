import { usePathErrorIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import { ArrayPanel } from '../layouts/ArrayPanel';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { ArrayTranslations } from '@jsonforms/core';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { renderArrayTitle } from '../layouts/arrayTitle';
export interface ArrayLayoutToolbarProps {
  options?: Record<string, any>;
  config?: any;
  label: string;
  description: string;
  errors: string;
  path: string;
  enabled: boolean;
  addItem(path: string, data: any): () => void;
  createDefault(): any;
  translations: ArrayTranslations;
  disableAdd?: boolean;
  children?: React.ReactNode;
}

export const ArrayLayoutToolbar = React.memo(function ArrayLayoutToolbar({
  label,
  description,
  addItem,
  path,
  enabled,
  createDefault,
  translations,
  disableAdd,
  children,
  options,
  config,
}: ArrayLayoutToolbarProps) {
  const arrayErrors = usePathErrorIndicator(
    path,
    options,
    !(
      options?.hideArraySummaryValidation ?? config?.hideArraySummaryValidation
    ),
  );
  return (
    <ArrayPanel
      options={options}
      config={config}
      panelLabel={label}
      style={{ width: '100%' }}
      size='small'
      type='inner'
      title={renderArrayTitle(label, arrayErrors, description)}
      extra={[
        <Tooltip key='1' title={translations.addTooltip}>
          <Button
            disabled={!enabled || disableAdd}
            aria-label={translations.addTooltip}
            onClick={addItem(path, createDefault())}
            shape='circle'
            icon={<PlusOutlined rev={undefined} />}
          />
        </Tooltip>,
      ]}
    >
      {children}
    </ArrayPanel>
  );
});
