import { Button, Tooltip, Typography, Row, Col, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React from 'react';
import ValidationIcon from '../complex/ValidationIcon';
import { ArrayTranslations } from '@jsonforms/core';
export interface ArrayLayoutToolbarProps {
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

const renderTitle = (label: string, errors: string, description: string) => (
  <>
    <Row>
      <Col>
        <Title level={3}>{label}</Title>
      </Col>
      <Col style={{ padding: '10px' }}>
        <ValidationIcon id='tooltip-validation' errorMessages={errors} />
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
}: ArrayLayoutToolbarProps) {
  return (
    <Card
      style={{ width: '100%' }}
      size='small'
      type='inner'
      title={renderTitle(label, errors, description)}
      extra={
        enabled && !disableAdd
          ? [
              <Tooltip key='1' title={translations.addTooltip}>
                <Button
                  disabled={!enabled}
                  aria-label={translations.addTooltip}
                  onClick={addItem(path, createDefault())}
                  shape='circle'
                  icon={<PlusOutlined rev={undefined} />}
                />
              </Tooltip>,
            ]
          : []
      }
    >
      {children}
    </Card>
  );
});
