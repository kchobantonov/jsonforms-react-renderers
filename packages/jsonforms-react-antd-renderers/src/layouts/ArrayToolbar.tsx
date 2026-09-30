import { ArrayPanel } from '../layouts/ArrayPanel';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { ArrayTranslations } from '@jsonforms/core';
import { Button, Card, Col, Row, Tooltip, Typography } from 'antd';
import React from 'react';
import ValidationIcon from '../complex/ValidationIcon';
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

const { Title } = Typography;

const renderTitle = (
  label: string,
  errors: string,
  description: string,
  path: string
) => (
  <>
    <Row align='middle'>
      <Col>
        <Title level={5} style={{ marginBottom: 0 }}>
          {label}
        </Title>
      </Col>
      <Col style={{ paddingLeft: 8 }}>
        <ValidationIcon
          id='tooltip-validation'
          errorMessages={errors}
          path={path}
        />
      </Col>
    </Row>
    {description && <Card.Meta description={description} />}
  </>
);

export const ArrayLayoutToolbar = React.memo(function ArrayLayoutToolbar({
  label,
  description,
  errors,
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
  return (
    <ArrayPanel
      options={options}
      config={config}
      panelLabel={label}
      style={{ width: '100%' }}
      size='small'
      type='inner'
      title={renderTitle(label, errors, description, path)}
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
