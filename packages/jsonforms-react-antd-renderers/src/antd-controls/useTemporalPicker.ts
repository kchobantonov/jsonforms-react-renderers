import type { CellProps, WithClassname } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useEffect, useMemo } from 'react';
import merge from 'lodash/merge';
import { createOnChangeHandler, getData } from '../util';
import {
  specDateSaveFormat,
  specDateTimeSaveFormat,
  specTimeSaveFormat,
  warnOnSaveFormat,
} from '../util/temporalFormats';
import {
  disabledDateFor,
  disabledTimeFor,
  effectiveRestrict,
  resolveDataBounds,
  temporalBounds,
} from '../util/temporalBounds';
const JSON_SCHEMA_DATE_FORMATS = ['YYYY-MM-DD'];
const JSON_SCHEMA_DATE_TIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
];
const JSON_SCHEMA_TIME_FORMATS = [
  'HH:mm:ss.SSSZ',
  'HH:mm:ss.SSS',
  'HH:mm:ssZ',
  'HH:mm:ss',
];
const defaults = {
  date: { formats: JSON_SCHEMA_DATE_FORMATS, saveFormat: specDateSaveFormat },
  dateTime: {
    formats: JSON_SCHEMA_DATE_TIME_FORMATS,
    saveFormat: specDateTimeSaveFormat,
  },
  time: { formats: JSON_SCHEMA_TIME_FORMATS, saveFormat: specTimeSaveFormat },
};
const style = { width: '100%' };

export function useTemporalPicker(
  props: CellProps & WithClassname,
  kind: keyof typeof defaults,
) {
  const {
    config,
    uischema,
    schema,
    path,
    data,
    handleChange,
    enabled,
    isValid,
    id,
    className,
  } = props;
  const options = useMemo(
    () => merge({}, config, uischema.options),
    [config, uischema.options],
  );
  const rootData = useJsonForms().core?.data;
  const boundsSchema = useMemo(
    () => resolveDataBounds(schema as Record<string, unknown>, path, rootData),
    [schema, path, rootData],
  );
  const defaultFormat =
    kind === 'date'
      ? 'YYYY-MM-DD'
      : kind === 'dateTime'
        ? 'YYYY-MM-DD HH:mm'
        : options.ampm === true
          ? 'hh:mm a'
          : 'HH:mm';
  const format = options[`${kind}Format`] ?? defaultFormat;
  const saveFormat = options[`${kind}SaveFormat`] ?? defaults[kind].saveFormat;
  const formats = useMemo(
    () => [saveFormat, format, ...defaults[kind].formats],
    [saveFormat, format, kind],
  );
  useEffect(() => {
    warnOnSaveFormat(schema?.format, saveFormat);
  }, [schema?.format, saveFormat]);
  const value = useMemo(() => getData(data, formats), [data, formats]);
  const onChange = useMemo(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat],
  );
  const restrict = effectiveRestrict(uischema.options, config);
  const precision = format.includes('s') ? 'second' : 'minute';
  const bounds = useMemo(
    () =>
      temporalBounds(
        boundsSchema,
        formats,
        kind === 'date' ? 'day' : precision,
        kind === 'time',
      ),
    [boundsSchema, formats, kind, precision],
  );
  const disabledDate = useMemo(
    () => (restrict && kind !== 'time' ? disabledDateFor(bounds) : undefined),
    [bounds, restrict, kind],
  );
  const disabledTime = useMemo(
    () =>
      restrict && kind !== 'date'
        ? disabledTimeFor(bounds, kind === 'time', precision)
        : undefined,
    [bounds, kind, restrict, precision],
  );
  return {
    options,
    disabledDate,
    disabledTime,
    saveFormat,
    pickerProps: {
      value,
      onChange,
      format,
      allowClear: enabled,
      disabled: !enabled,
      className,
      id,
      autoFocus: options.focus,
      placeholder: options.placeholder,
      style,
      status: isValid ? undefined : ('error' as const),
    },
  };
}
