import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
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

const displayFormats = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  dateTime: 'YYYY-MM-DD HH:mm',
};
const placeholderKeys = {
  date: 'temporal.datePlaceholder',
  time: 'temporal.timePlaceholder',
  dateTime: 'temporal.dateTimePlaceholder',
} as const;

function resolveTimeViews(views: unknown, displayFormat: string) {
  const timeViews = Array.isArray(views)
    ? views.filter((view) => ['hours', 'minutes', 'seconds'].includes(view))
    : [];
  const hasTimeViews = timeViews.length > 0;
  return {
    showHours: !hasTimeViews || timeViews.includes('hours'),
    showMinutes: !hasTimeViews || timeViews.includes('minutes'),
    useSeconds: hasTimeViews
      ? timeViews.includes('seconds')
      : displayFormat.includes('s'),
  };
}

function resolvePresentation(
  options: NonNullable<ControlProps['config']>,
  kind: keyof typeof saveFormats,
  defaultPlaceholder: string,
) {
  const ampm = options.ampm === true;
  const displayFormat: string =
    options[`${kind}Format`] ??
    (kind === 'time' && ampm ? 'hh:mm a' : displayFormats[kind]);
  const saveFormat: string = options[`${kind}SaveFormat`] ?? saveFormats[kind];
  return {
    ampm,
    displayFormat,
    saveFormat,
    placeholder:
      typeof options.placeholder === 'string'
        ? options.placeholder
        : defaultPlaceholder,
    ...resolveTimeViews(options.views, displayFormat),
  };
}

/** Shared serialization and bound policy for the three shadcn pickers. */
export function useTemporalControl(
  props: ControlProps,
  kind: keyof typeof saveFormats,
) {
  const context = useJsonForms();
  const options = { ...props.config, ...props.uischema.options };
  const t = useI18n();
  const presentation = resolvePresentation(
    options,
    kind,
    t(placeholderKeys[kind]),
  );
  const { displayFormat, saveFormat, useSeconds } = presentation;
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
    ...presentation,
    displayText: selected ? formatDate(selected, displayFormat) : undefined,
    allowed,
    disabledDate,
    commit,
    min: restrict ? bounds.min?.toDate() : undefined,
    max: restrict ? bounds.max?.toDate() : undefined,
  };
}
