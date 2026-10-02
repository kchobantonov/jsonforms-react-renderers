import React from 'react';
import {
  CellProps,
  isBooleanControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdCheckbox } from '../antd-controls/AntdCheckbox';

import { ValidationIcon } from '../complex/ValidationIcon';

export const BooleanCell = (props: CellProps & WithClassname) => {
  return props.visible === false ? null : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <AntdCheckbox
        {...props}
        inputProps={{ 'aria-invalid': Boolean(props.errors) }}
      />
      <ValidationIcon
        local
        errorMessages={props.errors}
        path={props.path}
        id={`${props.id}-error`}
      />
    </span>
  );
};

export const booleanCellTester: RankedTester = rankWith(2, isBooleanControl);

export default withJsonFormsCellProps(BooleanCell);
