import React from 'react';
import { Button, Card, Col, Row, Tooltip, Typography } from 'antd';
import {
  ArrayPanel,
  ValidationIcon,
} from '@chobantonov/jsonforms-react-antd-renderers';
import type { EditorArrayFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';

const { Title } = Typography;

/**
 * Mirrors ArrayLayoutToolbar from the antd renderer set so grid-backed arrays
 * and the regular array renderers share one header: title with the validation
 * indicator beside it, circular icon actions with tooltips on the right.
 */
export const AntdArrayFrame = ({
  options,
  config,
  label,
  description,
  errors,
  actions = [],
  children,
}: EditorArrayFrameProps) => (
  <ArrayPanel
    options={options}
    config={config}
    panelLabel={label}
    style={{ width: '100%' }}
    size='small'
    type='inner'
    title={
      <>
        <Row align='middle'>
          <Col>
            <Title level={5} style={{ marginBottom: 0 }}>
              {label}
            </Title>
          </Col>
          <Col style={{ paddingLeft: 8 }}>
            <ValidationIcon
              local
              id='tooltip-validation'
              errorMessages={errors ?? ''}
            />
          </Col>
        </Row>
        {description && <Card.Meta description={description} />}
      </>
    }
    extra={actions.map((action) => (
      <Tooltip key={action.key} title={action.label} placement='bottom'>
        {/* span keeps the tooltip working while the button is disabled */}
        <span style={{ display: 'inline-flex' }}>
          <Button
            disabled={action.disabled}
            danger={action.danger}
            aria-label={action.label}
            onClick={action.onClick}
            shape='circle'
            icon={action.icon}
          />
        </span>
      </Tooltip>
    ))}
  >
    {children}
  </ArrayPanel>
);
