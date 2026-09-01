import {
  and,
  ControlProps,
  JsonSchema,
  RankedTester,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Checkbox, Form } from 'antd';
import React from 'react';

export const antdNullControlTester: RankedTester = rankWith(
  3,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema: JsonSchema) => schema.type === 'null')
  )
);

export const AntdNullControl = (props: ControlProps) => {
  if (!props.visible) return null;
  return (
    <Form.Item
      help={props.errors || props.description}
      validateStatus={props.errors ? 'error' : undefined}
    >
      <Checkbox
        checked={props.data === null}
        disabled={!props.enabled}
        indeterminate={props.data !== null}
        onChange={(event) =>
          props.handleChange(props.path, event.target.checked ? null : undefined)
        }
      >
        {props.label}
        {props.required ? ' *' : ''}
      </Checkbox>
    </Form.Item>
  );
};

export const AntdNullControlRenderer = withJsonFormsControlProps(AntdNullControl);
