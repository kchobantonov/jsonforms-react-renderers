import type { TimeValue } from './dateTime';
import type { ControlProps } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import {
  formatDate,
  parseDateValue,
} from '@chobantonov/jsonforms-react-renderer-common/formats/dateValues';
import {
  effectiveRestrict,
  resolveDataBounds,
  temporalBounds,
} from '@chobantonov/jsonforms-react-renderer-common/formats/temporalBounds';
import {
  specDateSaveFormat,
  specTimeSaveFormat,
  specDateTimeSaveFormat,
  warnOnSaveFormat,
} from '@chobantonov/jsonforms-react-renderer-common/formats/temporalFormats';

const saveFormats = {
  date: specDateSaveFormat,
  time: specTimeSaveFormat,
  dateTime: specDateTimeSaveFormat,
};

/** Shared serialization and bound policy for the three shadcn pickers. */
export function useTemporalControl(
  props: ControlProps,
  kind: keyof typeof saveFormats,
) {
  const context = useJsonForms();
  const options = { ...props.config, ...props.uischema.options };
  const displayFormat: string =
    options[`${kind}Format`] ??
    (kind === 'date'
      ? 'YYYY-MM-DD'
      : kind === 'time'
        ? options.ampm === true
          ? 'hh:mm a'
          : 'HH:mm'
        : 'YYYY-MM-DD HH:mm');
  const saveFormat: string = options[`${kind}SaveFormat`] ?? saveFormats[kind];
  useEffect(() => {
    warnOnSaveFormat(props.schema.format, saveFormat);
  }, [props.schema.format, saveFormat]);
  const formats = [
    saveFormat,
    displayFormat,
    'YYYY-MM-DDTHH:mm:ssZ',
    'HH:mm:ssZ',
    'HH:mm:ss',
  ];
  const selected =
    typeof props.data === 'string' ? parseDateValue(props.data, formats) : null;
  const selectedTime: TimeValue | undefined = selected
    ? {
        hours: selected.hour(),
        minutes: selected.minute(),
        seconds: selected.second(),
      }
    : undefined;
  const ampm = options.ampm === true;
  const placeholder =
    typeof options.placeholder === 'string'
      ? options.placeholder
      : kind === 'dateTime'
        ? 'Pick a date and time'
        : kind === 'time'
          ? 'Pick a time'
          : 'Pick a date';
  const views: unknown = options.views;
  const hasTimeViews =
    Array.isArray(views) &&
    views.some((view) => ['hours', 'minutes', 'seconds'].includes(view));
  const showHours = !hasTimeViews || views.includes('hours');
  const showMinutes = !hasTimeViews || views.includes('minutes');
  const useSeconds = hasTimeViews
    ? views.includes('seconds')
    : displayFormat.includes('s');
  const precision = useSeconds ? 'second' : 'minute';
  const schema = resolveDataBounds(
    props.schema as Record<string, unknown>,
    props.path,
    context.core?.data,
  );
  const bounds = temporalBounds(
    schema,
    formats,
    kind === 'date' ? 'day' : precision,
    kind === 'time',
  );
  const restrict = effectiveRestrict(props.uischema.options, props.config);
  const comparable = (value: Date) => {
    const date = dayjs(value);
    return kind === 'time' ? date.year(2000).month(0).date(1) : date;
  };
  const allowed = (value: Date) => {
    if (!restrict) return true;
    const date = comparable(value);
    return (
      !bounds.empty &&
      !(bounds.min && date.isBefore(bounds.min)) &&
      !(bounds.max && date.isAfter(bounds.max))
    );
  };
  const disabledDate = (value: Date) =>
    restrict &&
    (bounds.empty ||
      Boolean(bounds.min && dayjs(value).isBefore(bounds.min, 'day')) ||
      Boolean(bounds.max && dayjs(value).isAfter(bounds.max, 'day')));
  const commit = (value: Date) => {
    const date = dayjs(value)
      .second(useSeconds || kind === 'date' ? value.getSeconds() : 0)
      .millisecond(0);
    if (props.enabled && !props.readonly && allowed(date.toDate())) {
      props.handleChange(props.path, formatDate(date, saveFormat));
    }
  };
  return {
    options,
    selected,
    selectedTime,
    ampm,
    placeholder,
    displayFormat,
    displayText: selected ? formatDate(selected, displayFormat) : undefined,
    saveFormat,
    useSeconds,
    showHours,
    showMinutes,
    allowed,
    disabledDate,
    commit,
    min: restrict ? bounds.min?.toDate() : undefined,
    max: restrict ? bounds.max?.toDate() : undefined,
  };
}
