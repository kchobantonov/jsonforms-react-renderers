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
import React, { useState } from 'react';
import {
  DurationParts,
  EMPTY_DURATION,
  formatDuration,
  parseDuration,
} from './duration';

export const antdDurationControlTester: RankedTester = rankWith(
  3,
  and(isStringControl, formatIs('duration'))
);

const fields = Object.keys(EMPTY_DURATION) as Array<keyof DurationParts>;

export const AntdDurationControl = (props: ControlProps) => {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<DurationParts>(
    () => parseDuration(props.data) ?? EMPTY_DURATION
  );
  if (!props.visible) return null;
  const value = typeof props.data === 'string' ? props.data : '';
  const localError = value && !parseDuration(value)
    ? 'Enter an ISO 8601 duration, for example P2DT3H.'
    : '';
  const picker = (
    <Flex vertical gap='small' style={{ width: 280 }}>
      {fields.map((field) => (
        <Flex align='center' justify='space-between' key={field}>
          <span style={{ textTransform: 'capitalize' }}>{field}</span>
          <InputNumber
            min={0}
            onChange={(next) =>
              setParts((current) => ({ ...current, [field]: Number(next ?? 0) }))
            }
            value={parts[field]}
          />
        </Flex>
      ))}
      <Flex justify='end' gap='small'>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          onClick={() => {
            props.handleChange(props.path, formatDuration(parts));
            setOpen(false);
          }}
          type='primary'
        >
          Apply
        </Button>
      </Flex>
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
          disabled={!props.enabled}
          onChange={(event) =>
            props.handleChange(props.path, event.currentTarget.value || undefined)
          }
          placeholder='P1DT2H'
          status={localError || props.errors ? 'error' : undefined}
          value={value}
        />
        <Popover
          content={picker}
          onOpenChange={(next) => {
            if (next) setParts(parseDuration(value) ?? EMPTY_DURATION);
            setOpen(next);
          }}
          open={open}
          placement='bottomRight'
          trigger='click'
        >
          <Button disabled={!props.enabled}>Duration</Button>
        </Popover>
      </Flex>
    </Form.Item>
  );
};

export const AntdDurationControlRenderer = withJsonFormsControlProps(
  AntdDurationControl
);
