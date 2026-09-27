import React from 'react';
import {
  ControlElement,
  createDefaultValue,
  JsonSchema,
  ArrayTranslations,
} from '@jsonforms/core';
import { Button, Tooltip, Typography, Row, Col, Card } from 'antd';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ValidationIcon from './ValidationIcon';

export interface TableToolbarProps {
  errors: string;
  label: string;
  description: string;
  path: string;
  uischema: ControlElement;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  enabled: boolean;
  translations: ArrayTranslations;
  addItem(path: string, value: any): () => void;
  disableAdd?: boolean;
  children?: React.ReactNode;
}

const { Title } = Typography;

const renderTitle = (label: string, errors: string, description: string) => (
  <>
    <Row align='middle'>
      <Col>
        <Title level={5} style={{ marginBottom: 0 }}>
          {label}
        </Title>
      </Col>
      <Col style={{ paddingLeft: 8 }}>
        {errors.length !== 0 && (
          <ValidationIcon id='tooltip-validation' errorMessages={errors} />
        )}
      </Col>
    </Row>
    {description && <Card.Meta description={description} />}
  </>
);

const TableToolbar = React.memo(function TableToolbar({
  errors,
  label,
  description,
  path,
  addItem,
  schema,
  enabled,
  translations,
  rootSchema,
  disableAdd,
  children,
}: TableToolbarProps) {
  return (
    <Card
      style={{ width: '100%' }}
      size='small'
      type='inner'
      title={renderTitle(label, errors, description)}
      extra={[
        <Tooltip
          key='tooltip-add'
          title={translations.addTooltip}
          placement='bottom'
        >
          <Button
            disabled={!enabled || disableAdd}
            aria-label={translations.addAriaLabel}
            onClick={addItem(path, createDefaultValue(schema, rootSchema))}
            shape='circle'
            icon={<PlusOutlined rev={undefined} />}
          />
        </Tooltip>,
      ]}
    >
      {children}
    </Card>
  );
});

export default TableToolbar;
