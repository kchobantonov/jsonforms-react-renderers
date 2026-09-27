import React from 'react';
import { CellProps, OwnPropsOfEnum, WithClassname } from '@jsonforms/core';
import { Flex, Radio } from 'antd';
import merge from 'lodash/merge';

export const AntdRadioGroup = React.memo(function AntdRadioGroup(
  props: CellProps &
    WithClassname &
    OwnPropsOfEnum & {
      inputProps?: React.ComponentProps<typeof Radio.Group>;
    }
) {
  const {
    data,
    options,
    handleChange,
    path,
    enabled,
    config,
    uischema,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
    `options.vertical` is the single orientation encoding for a radio group:
    false (the default) arranges the choices in a row that may wrap, true
    stacks them. The orientation is also announced, so assistive technology
    describes the arrangement that is actually on screen.
  */
  const vertical = appliedUiSchemaOptions.vertical === true;

  return (
    <Radio.Group
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      disabled={!enabled}
      value={data ?? ''}
      // Guarded as well as disabled: the specification requires mutation
      // handlers to enforce the same rules as the visible state, so that
      // neither a keyboard path nor a caller-supplied `inputProps.disabled`
      // override can commit a change to a read-only control.
      onChange={(e: any) => {
        if (!enabled) {
          return;
        }
        handleChange(path, e.target.value);
      }}
      {...inputProps}
    >
      <Flex gap={vertical ? 4 : 8} vertical={vertical} wrap={!vertical}>
        {(options || []).map((option) => (
          // Keyed by value, not label: two distinct values may translate to
          // the same label, and keying by label collapses them.
          <Radio value={option.value} key={String(option.value)}>
            {option.label}
          </Radio>
        ))}
      </Flex>
    </Radio.Group>
  );
});
