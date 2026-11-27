import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import { ValidationIcon } from '../complex/ValidationIcon';
const { Title } = Typography;

export const renderArrayTitle = (
  label: string,
  errors: string,
  description: string,
) => (
  <>
    <Row align='middle'>
      <Col>
        <Title level={5} style={{ margin: 0 }}>
          {label}
        </Title>
      </Col>
      <Col style={{ paddingLeft: 8 }}>
        {errors.length !== 0 && (
          <ValidationIcon
            id='tooltip-validation'
            errorMessages={errors}
            local
          />
        )}
      </Col>
    </Row>
    {description && <Card.Meta description={description} />}
  </>
);
