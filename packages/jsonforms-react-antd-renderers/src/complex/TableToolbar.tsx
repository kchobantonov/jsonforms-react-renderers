import { ArrayPanel } from '../layouts/ArrayPanel';
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
  options?: Record<string, any>;
  config?: any;
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
        {errors.length !== 0 && (
          <ValidationIcon
            id='tooltip-validation'
            errorMessages={errors}
            path={path}
          />
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
  options,
  uischema,
  config,
}: TableToolbarProps) {
  return (
    <ArrayPanel
      options={options ?? uischema.options}
      config={config}
      panelLabel={label}
      style={{ width: '100%' }}
      size='small'
      type='inner'
      title={renderTitle(label, errors, description, path)}
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
    </ArrayPanel>
  );
});

export default TableToolbar;
