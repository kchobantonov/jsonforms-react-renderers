import {
  ControlFormItem,
  usePreTouchErrors,
} from '@chobantonov/jsonforms-react-antd-renderers';
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
import { Checkbox } from 'antd';
import React from 'react';

export const antdNullControlTester: RankedTester = rankWith(
  3,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema: JsonSchema) => schema.type === 'null')
  )
);

export const AntdNullControl = (props: ControlProps) => {
  // See `usePreTouchErrors`; unchanged unless filtering is on.
  const { errors, onFocus, onBlur } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as any,
    config: props.config,
  });
  if (!props.visible) return null;
  return (
    <ControlFormItem
      errors={errors || undefined}
      help={errors || props.description}
    >
      <Checkbox
        checked={props.data === null}
        disabled={!props.enabled}
        onFocus={onFocus}
        onBlur={onBlur}
        /*
          Indeterminate means "neither of the two states this control has" -
          a value that is not `null` and is not absent either. It used to be
          `data !== null`, which made an absent property indeterminate too: the
          commonest state of all, nothing recorded yet, was drawn as though the
          data were broken. Section 19 wants the genuinely out-of-domain value
          marked, not the empty one.
        */
        indeterminate={props.data !== null && props.data !== undefined}
        onChange={(event) =>
          props.handleChange(
            props.path,
            event.target.checked ? null : undefined
          )
        }
      >
        {props.label}
        {props.required ? ' *' : ''}
      </Checkbox>
    </ControlFormItem>
  );
};

export const AntdNullControlRenderer =
  withJsonFormsControlProps(AntdNullControl);
