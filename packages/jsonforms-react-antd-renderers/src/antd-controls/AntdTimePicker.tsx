import { CellProps, WithClassname } from '@jsonforms/core';
import { TimePicker } from 'antd';
import merge from 'lodash/merge';
import React, { useEffect, useMemo } from 'react';
import { createOnChangeHandler, getData } from '../util';
import { useJsonForms } from '@jsonforms/react';
import {
  specTimeSaveFormat,
  timePickerColumns,
  warnOnSaveFormat,
} from '../util/temporalFormats';
import {
  disabledTimeFor,
  effectiveRestrict,
  resolveDataBounds,
  temporalBounds,
} from '../util/temporalBounds';

const JSON_SCHEMA_TIME_FORMATS = [
  'HH:mm:ss.SSSZ',
  'HH:mm:ss.SSS',
  'HH:mm:ssZ',
  'HH:mm:ss',
];

const TIME_PICKER_STYLE = {
  width: '100%',
};

export const AntdTimePicker = React.memo(function AntdTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof TimePicker> }
) {
  const {
    data,
    className,
    enabled,
    id,
    uischema,
    path,
    handleChange,
    config,
    isValid,
    inputProps,
    schema,
  } = props as typeof props & { schema?: Record<string, unknown> };
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
    A `$data` bound points at another part of the form - the other end of a
    date range, typically - so the bounds have to be recomputed as that value
    changes, not once at mount.
  */
  const rootData = useJsonForms().core?.data;
  const boundsSchema = useMemo(
    () => resolveDataBounds(schema, path, rootData),
    [schema, path, rootData]
  );

  const format =
    appliedUiSchemaOptions.timeFormat ??
    (appliedUiSchemaOptions.ampm === true ? 'hh:mm a' : 'HH:mm');
  const saveFormat =
    appliedUiSchemaOptions.timeSaveFormat ?? specTimeSaveFormat;

  /*
    Bounds on a bare time are clock values: both ends are placed on one
    arbitrary day so they compare, rather than inventing a reference date.
    Seconds are only offered when the display format asks for them, so the
    precision follows it.
  */
  const restrict = effectiveRestrict(uischema.options, config);
  const disabledTime = useMemo(() => {
    if (!restrict) {
      return undefined;
    }
    const precision = format.includes('s') ? 'second' : 'minute';
    return disabledTimeFor(
      temporalBounds(
        boundsSchema,
        [saveFormat, format, ...JSON_SCHEMA_TIME_FORMATS],
        precision,
        true
      ),
      true,
      precision
    );
  }, [restrict, schema, saveFormat, format]);

  /*
    A save format the schema's own `format` would reject is an authoring
    mistake that shows up as an unfixable validation error, so it is reported
    where the author will see it.
  */
  useEffect(() => {
    warnOnSaveFormat(schema?.format, saveFormat);
  }, [schema?.format, saveFormat]);

  const onChange = useMemo(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat]
  );

  // Keep the controlled value stable while the popup holds an unconfirmed selection.
  const value = useMemo(
    () => getData(data, [saveFormat, format, ...JSON_SCHEMA_TIME_FORMATS]),
    [data, saveFormat, format]
  );

  return (
    <TimePicker
      value={value}
      onChange={onChange}
      format={format}
      disabledTime={disabledTime}
      allowClear={enabled}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      // `views` picks the columns; absent, the display format still decides.
      {...timePickerColumns(appliedUiSchemaOptions.views)}
      use12Hours={!!appliedUiSchemaOptions.ampm}
      style={TIME_PICKER_STYLE}
      status={isValid ? undefined : 'error'}
      {...inputProps}
    />
  );
});
