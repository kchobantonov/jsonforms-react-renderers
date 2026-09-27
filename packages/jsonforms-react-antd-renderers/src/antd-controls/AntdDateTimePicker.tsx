import { CellProps, WithClassname } from '@jsonforms/core';
import { DatePicker } from 'antd';
import merge from 'lodash/merge';
import React, { useEffect, useMemo } from 'react';
import { createOnChangeHandler, getData } from '../util';
import { useJsonForms } from '@jsonforms/react';
import {
  specDateTimeSaveFormat,
  timePickerColumns,
  warnOnSaveFormat,
} from '../util/temporalFormats';
import {
  disabledDateFor,
  disabledTimeFor,
  effectiveRestrict,
  resolveDataBounds,
  temporalBounds,
} from '../util/temporalBounds';

const JSON_SCHEMA_DATE_TIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
];

const DATE_PICKER_STYLE = {
  width: '100%',
};

export const AntdDateTimePicker = React.memo(function AntdDateTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof DatePicker> }
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

  const format = appliedUiSchemaOptions.dateTimeFormat ?? 'YYYY-MM-DD HH:mm';
  const saveFormat =
    appliedUiSchemaOptions.dateTimeSaveFormat ?? specDateTimeSaveFormat;

  /*
    Both halves of the bound. `disabledDate` removes whole days outside the
    range; `disabledTime` then narrows the hours on the **boundary days**
    only, which is what section 18 means by bounds "applied per boundary day".
    A day strictly inside the range offers every hour.
  */
  const restrict = effectiveRestrict(uischema.options, config);
  const bounds = useMemo(
    () =>
      temporalBounds(
        boundsSchema,
        [saveFormat, format, ...JSON_SCHEMA_DATE_TIME_FORMATS],
        format.includes('s') ? 'second' : 'minute'
      ),
    [schema, saveFormat, format]
  );
  const disabledDate = useMemo(
    () => (restrict ? disabledDateFor(bounds) : undefined),
    [restrict, bounds]
  );
  const disabledTime = useMemo(
    () =>
      restrict
        ? disabledTimeFor(
            bounds,
            false,
            format.includes('s') ? 'second' : 'minute'
          )
        : undefined,
    [restrict, bounds, format]
  );

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
    () => getData(data, [saveFormat, format, ...JSON_SCHEMA_DATE_TIME_FORMATS]),
    [data, saveFormat, format]
  );

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      format={format}
      disabledDate={disabledDate}
      disabledTime={disabledTime}
      allowClear={enabled}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      /*
        The time half of `views`. The date half is not applied here: a
        date-time picker always offers a full date, and narrowing it to months
        would leave a value it cannot express.
      */
      showTime={timePickerColumns(appliedUiSchemaOptions.views) ?? true}
      use12Hours={!!appliedUiSchemaOptions.ampm}
      style={DATE_PICKER_STYLE}
      status={isValid ? undefined : 'error'}
      {...inputProps}
    />
  );
});
