import { AntdClearValueButton } from '@chobantonov/jsonforms-react-antd-renderers';
import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ColorPicker, Flex, Form, Input } from 'antd';
import React from 'react';

export const antdColorControlTester: RankedTester = rankWith(
  3,
  and(isStringControl, formatIs('color'))
);

export const AntdColorControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const value = typeof props.data === 'string' ? props.data : undefined;
  return (
    <Form.Item
      help={props.errors || props.description}
      label={`${props.label}${props.required ? ' *' : ''}`}
      validateStatus={props.errors ? 'error' : undefined}
    >
      <Flex gap='small'>
        <Input
          disabled={!props.enabled}
          onChange={(event) =>
            props.handleChange(props.path, event.currentTarget.value || undefined)
          }
          placeholder='#RRGGBB'
          status={props.errors ? 'error' : undefined}
          value={value}
        />
        <ColorPicker
          disabled={!props.enabled}
          onChangeComplete={(color) =>
            props.handleChange(props.path, color.toHexString())
          }
          value={value}
        />
        <span style={{ position: 'relative', width: 32 }}>
          <AntdClearValueButton
            data={value}
            enabled={props.enabled}
            onClear={() => props.handleChange(props.path, undefined)}
          />
        </span>
      </Flex>
    </Form.Item>
  );
};

export const AntdColorControlRenderer = withJsonFormsControlProps(AntdColorControl);
