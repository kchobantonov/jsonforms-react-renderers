import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Button, Flex, Form, Input, InputNumber, Popover } from 'antd';
import React from 'react';
import {
  useDurationControl,
  durationFields,
  durationFieldMax,
} from '@chobantonov/jsonforms-react-extended-renderers';

export const antdDurationControlTester: RankedTester = rankWith(
  3,
  and(isStringControl, formatIs('duration'))
);

const fields = durationFields;

export const AntdDurationControl = (props: ControlProps) => {
  const state = useDurationControl(props);
  const { open, draft: parts } = state;
  if (!props.visible) return null;
  const value = state.value;
  const localError = state.error;
  const picker = (
    <Flex vertical gap='small' style={{ width: 280 }}>
      {fields.map((field) => (
        <Flex align='center' justify='space-between' key={field}>
          <span style={{ textTransform: 'capitalize' }}>{field}</span>
          <InputNumber
            min={0}
            max={durationFieldMax[field]}
            disabled={state.fieldDisabled(field)}
            onChange={(next) => state.changePart(field, Number(next ?? 0))}
            value={parts[field]}
          />
        </Flex>
      ))}
      {state.showActions && (
        <Flex justify='end' gap='small'>
          <Button onClick={() => state.close()}>
            {state.options.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            onClick={() => {
              state.apply();
            }}
            type='primary'
          >
            {state.options.okLabel ?? 'Apply'}
          </Button>
        </Flex>
      )}
    </Flex>
  );
  return (
    <Form.Item
      help={localError || props.errors || props.description}
      label={`${props.label}${props.required ? ' *' : ''}`}
      validateStatus={localError || props.errors ? 'error' : undefined}
    >
      <Flex gap='small'>
        <Input
          disabled={state.disabled}
          onChange={(event) =>
            props.handleChange(
              props.path,
              event.currentTarget.value || undefined
            )
          }
          placeholder={state.options.placeholder ?? 'P1DT2H'}
          autoFocus={state.options.focus}
          status={localError || props.errors ? 'error' : undefined}
          value={value}
        />
        <Popover
          content={picker}
          onOpenChange={(next) => (next ? state.openPicker() : state.close())}
          open={open}
          placement='bottomRight'
          trigger='click'
        >
          <Button disabled={state.disabled}>Duration</Button>
        </Popover>
      </Flex>
    </Form.Item>
  );
};

export const AntdDurationControlRenderer =
  withJsonFormsControlProps(AntdDurationControl);
