import React from 'react';
import { Card, Typography } from 'antd';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  createObjectRenderer,
  type ObjectFrameProps,
} from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
export { objectControlTester } from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
import { ValidationIcon } from './ValidationIcon';
import { AdditionalProperties } from './AdditionalProperties';

const ObjectFrame = ({
  path,
  title,
  errors,
  detail,
  additional,
}: ObjectFrameProps) => {
  const content = (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {!title && errors && (
        <Typography.Text type='danger' role='alert'>
          {errors}
        </Typography.Text>
      )}
      {detail}
      {additional}
    </div>
  );
  return path ? (
    <Card
      className='jsonforms-object'
      title={title}
      extra={
        title && errors ? (
          <ValidationIcon
            local
            errorMessages={errors}
            id={`${path}-object-errors`}
          />
        ) : undefined
      }
    >
      {content}
    </Card>
  ) : (
    content
  );
};

export const ObjectRenderer = createObjectRenderer(
  AdditionalProperties,
  ObjectFrame,
);
export default withJsonFormsControlProps(ObjectRenderer);
