import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { Switch } from 'antd';
import merge from 'lodash/merge';
import { useI18n } from '../util/translate';
import { visuallyHidden } from '../util/visuallyHidden';

export const AntdToggle = React.memo(function AntdToggle(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof Switch> }
) {
  const {
    data,
    id,
    className,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const t = useI18n();
  /*
    A switch cannot show an indeterminate state, so the specification asks for
    an accessible "Not set" indication instead. `!!data` additionally rendered
    the string `'false'` as on; only a real `true` is on.
  */
  const committed = typeof data === 'boolean';
  const stateId = `${id}-state`;
  // Composed, not assigned: InputControl passes its help id through
  // `inputProps`, which is spread after our props and would otherwise replace
  // this one - leaving the state unannounced.
  const describedBy =
    [
      (inputProps as { 'aria-describedby'?: string } | undefined)?.[
        'aria-describedby'
      ],
      committed ? undefined : stateId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <>
      <Switch
        id={id}
        checked={data === true}
        onChange={(isChecked) => handleChange(path, isChecked)}
        className={className}
        disabled={!enabled}
        autoFocus={!!appliedUiSchemaOptions.focus}
        {...inputProps}
        aria-describedby={describedBy}
      />
      {committed ? null : (
        <span id={stateId} style={visuallyHidden}>
          {t(
            typeof data === 'undefined' || data === null
              ? 'boolean.notSet'
              : 'boolean.invalid'
          )}
        </span>
      )}
    </>
  );
});
