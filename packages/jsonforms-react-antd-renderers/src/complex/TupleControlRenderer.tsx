import { useTupleControl } from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleControl';
import {
  connectTupleControl,
  TupleControlContent,
  type TupleControlProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleControlContent';
import React from 'react';
import type { RankedTester } from '@jsonforms/core';
import { Typography, theme as antTheme } from 'antd';
import { ControlFormItem } from '../util/cellMode';
import { tupleControlTester } from '../util/tuple';
import { TupleAdditionalItems } from './TupleAdditionalItems';
import { TupleField } from './TupleField';

export const tupleControlRendererTester: RankedTester = tupleControlTester;

export const TupleControl = (props: TupleControlProps) => {
  const { label, required, visible, uischema } = props;
  const { token } = antTheme.useToken();
  const model = useTupleControl(props);
  const { options, shownErrors } = model;
  if (!visible) return null;
  const content = (
    <TupleControlContent
      props={props}
      model={model}
      TupleField={TupleField}
      TupleAdditionalItems={TupleAdditionalItems}
      gap={token.margin}
      diagnostic={(message) => (
        <Typography.Text type='danger' role='alert' data-tuple-diagnostic>
          {message}
        </Typography.Text>
      )}
    />
  );
  return (
    /*
      Array-level errors - minItems, maxItems, uniqueItems - belong to the tuple
      as a whole and appear here, beneath it. `props.errors` on an array control
      carries only errors at the array's own path, so a position's error stays
      beside that position and never marks the others invalid.

      The exception is a position a supplied layout does not draw: its error
      has no field to sit beside, so it is reported here instead, named.
    */
    <ControlFormItem
      hideRequiredAsterisk={uischema.options?.hideRequiredAsterisk}
      id={props.id}
      label={label}
      required={required}
      errors={shownErrors || undefined}
      help={shownErrors || props.description}
    >
      {options.showBorder === false ? (
        <div data-tuple-control>{content}</div>
      ) : (
        /*
          `showBorder` defaults to true: one subtle boundary around the heading,
          the positions, the additional items and the array-level errors, so a
          tuple reads as one value rather than as several loose fields.
        */
        <div
          data-tuple-control
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            padding: token.paddingSM,
          }}
        >
          {content}
        </div>
      )}
    </ControlFormItem>
  );
};

export const TupleControlRenderer = connectTupleControl(TupleControl);
