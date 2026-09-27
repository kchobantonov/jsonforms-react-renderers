import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { Checkbox } from 'antd';
import merge from 'lodash/merge';

type Props = {
  label?: string;
};

export const AntdCheckbox = React.memo(function AntdCheckbox(
  props: CellProps &
    WithClassname &
    Props & { inputProps?: React.ComponentProps<typeof Checkbox> }
) {
  const {
    data,
    className,
    id,
    enabled,
    label,
    uischema,
    path,
    handleChange,
    config,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
    Only a real `true` is checked, and anything that is not a boolean shows as
    indeterminate rather than as a selection.

    `!!data` made the *string* `'false'` render as checked - the case the
    specification names - and made `0`, `''` and `{}` look like deliberate
    answers. Incoming data that is not a boolean is preserved for correction
    and reported by validation; it must not be presented as a valid true or
    false selection.
  */
  const committed = typeof data === 'boolean';

  return (
    <Checkbox
      indeterminate={!committed}
      checked={data === true}
      onChange={(e: any) => handleChange(path, e.target.checked)}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={!!appliedUiSchemaOptions.focus}
      {...inputProps}
    >
      {label}
    </Checkbox>
  );
});
