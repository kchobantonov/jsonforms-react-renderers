import React from 'react';
import {
  and,
  CellProps,
  isBooleanControl,
  optionIs,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdToggle } from '../antd-controls/AntdToggle';

import { ValidationIcon } from '../complex/ValidationIcon';

export const BooleanToggleCell = (props: CellProps & WithClassname) => {
  return props.visible === false ? null : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <AntdToggle
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

export const booleanToggleCellTester: RankedTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);

export default withJsonFormsCellProps(BooleanToggleCell);
