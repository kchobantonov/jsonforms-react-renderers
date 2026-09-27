import { CellProps, WithClassname } from '@jsonforms/core';
import { DatePicker } from 'antd';
import merge from 'lodash/merge';
import React, { useEffect, useMemo } from 'react';
import { createOnChangeHandler, getData } from '../util';
import { useJsonForms } from '@jsonforms/react';
import {
  datePickerMode,
  specDateSaveFormat,
  warnOnSaveFormat,
} from '../util/temporalFormats';
import {
  disabledDateFor,
  effectiveRestrict,
  resolveDataBounds,
  temporalBounds,
} from '../util/temporalBounds';

const JSON_SCHEMA_DATE_FORMATS = ['YYYY-MM-DD'];
const DATE_PICKER_STYLE = {
  width: '100%',
};

export const AntdDatePicker = React.memo(function AntdDatePicker(
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

  const format = appliedUiSchemaOptions.dateFormat ?? 'YYYY-MM-DD';
  const saveFormat =
    appliedUiSchemaOptions.dateSaveFormat ?? specDateSaveFormat;

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
    () => getData(data, [saveFormat, format, ...JSON_SCHEMA_DATE_FORMATS]),
    [data, saveFormat, format]
  );

  /*
    Section 18's format bounds, "following effective `restrict`". They govern
    what the picker offers; an existing value outside them is left alone and
    reported by the validator, since the section is explicit that a bound
    "does not authorize clamping existing data".
  */
  const restrict = effectiveRestrict(uischema.options, config);
  const disabledDate = useMemo(() => {
    if (!restrict) {
      return undefined;
    }
    return disabledDateFor(
      temporalBounds(
        boundsSchema,
        [saveFormat, format, ...JSON_SCHEMA_DATE_FORMATS],
        'day'
      )
    );
  }, [restrict, schema, saveFormat, format]);

  const picker = datePickerMode(appliedUiSchemaOptions.views, saveFormat);

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      format={format}
      allowClear={enabled}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      style={DATE_PICKER_STYLE}
      picker={picker}
      disabledDate={disabledDate}
      status={isValid ? undefined : 'error'}
      {...inputProps}
    />
  );
});
