/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import isEmpty from 'lodash/isEmpty';
import React, { ComponentType } from 'react';
import Ajv from 'ajv';
import type { UISchemaElement } from '@jsonforms/core';
import {
  getAjv,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { Col, Row } from 'antd';

export interface AntdLayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
}

export const renderColumnLayoutElements = (
  elements: UISchemaElement[],
  schema: JsonSchema,
  path: string,
  enabled: boolean,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  return (
    <>
      {elements.map((child, index) => (
        <Row key={`${path}-${index}`}>
          <Col span={24}>
            <JsonFormsDispatch
              uischema={child}
              schema={schema}
              path={path}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          </Col>
        </Row>
      ))}
    </>
  );
};

export const renderRowLayoutElements = (
  elements: UISchemaElement[],
  schema: JsonSchema,
  path: string,
  enabled: boolean,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  return (
    <Row gutter={8} style={{ width: '100%' }}>
      {elements.map((child, index) => (
        <Col key={`${path}-${index}`} span={Math.floor(24 / elements.length)}>
          <JsonFormsDispatch
            uischema={child}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        </Col>
      ))}
    </Row>
  );
};

const AntdLayoutRendererComponent = ({
  visible,
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
}: AntdLayoutRendererProps) => {
  if (isEmpty(elements) || !visible) {
    return null;
  } else {
    if (direction === 'column') {
      return renderColumnLayoutElements(
        elements,
        schema,
        path,
        enabled,
        renderers,
        cells
      );
    }
    return renderRowLayoutElements(
      elements,
      schema,
      path,
      enabled,
      renderers,
      cells
    );
  }
};
export const AntdLayoutRenderer = React.memo(AntdLayoutRendererComponent);

export interface AjvProps {
  ajv: Ajv;
}

// TODO fix @typescript-eslint/ban-types
// eslint-disable-next-line @typescript-eslint/ban-types
export const withAjvProps = <P extends {}>(
  Component: ComponentType<AjvProps & P>
) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };

export interface AntdLabelableLayoutRendererProps
  extends AntdLayoutRendererProps {
  label?: string;
}
