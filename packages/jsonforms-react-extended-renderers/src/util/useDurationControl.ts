import { ControlProps } from '@jsonforms/core';
import { useState } from 'react';

export const emptyDurationParts = {
  weeks: 0,
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};
export type ExtendedDurationParts = typeof emptyDurationParts;
export const durationFields = Object.keys(emptyDurationParts) as Array<
  keyof ExtendedDurationParts
>;
export const durationFieldMax: Partial<ExtendedDurationParts> = {
  months: 11,
  hours: 23,
  minutes: 59,
  seconds: 59,
};
export const parseExtendedDuration = (
  value: unknown
): ExtendedDurationParts | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const weeks = /^P(\d+)W$/i.exec(text);
  if (weeks) return { ...emptyDurationParts, weeks: Number(weeks[1]) };
  const match =
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(
      text
    );
  if (!match || !match.slice(1).some(Boolean) || /T$/i.test(text)) return null;
  const [, years, months, days, hours, minutes, seconds] = match;
  const parts = {
    weeks: 0,
    years: Number(years || 0),
    months: Number(months || 0),
    days: Number(days || 0),
    hours: Number(hours || 0),
    minutes: Number(minutes || 0),
    seconds: Number(seconds || 0),
  };
  return Object.values(parts).every(Number.isFinite) ? parts : null;
};
export const formatExtendedDuration = (parts: ExtendedDurationParts) => {
  const safe = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [
      key,
      Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
    ])
  ) as ExtendedDurationParts;
  if (safe.weeks) return `P${safe.weeks}W`;
  const date = `${safe.years ? `${safe.years}Y` : ''}${
    safe.months ? `${safe.months}M` : ''
  }${safe.days ? `${safe.days}D` : ''}`;
  const time = `${safe.hours ? `${safe.hours}H` : ''}${
    safe.minutes ? `${safe.minutes}M` : ''
  }${safe.seconds ? `${safe.seconds}S` : ''}`;
  return date || time ? `P${date}${time ? `T${time}` : ''}` : 'P0D';
};
export const useDurationControl = (props: ControlProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...emptyDurationParts });
  const options = { ...props.config, ...props.uischema.options };
  const disabled = !props.enabled || Boolean(props.readonly);
  const value = typeof props.data === 'string' ? props.data : '';
  const commit = (next: string | undefined) => {
    if (!disabled) props.handleChange(props.path, next);
  };
  return {
    open,
    draft,
    options,
    disabled,
    value,
    error:
      props.errors ||
      (value && !parseExtendedDuration(value)
        ? 'Enter an ISO 8601 duration, for example P2DT3H or P2W.'
        : ''),
    showActions: options.showActions !== false,
    openPicker: () => {
      if (!disabled) {
        setDraft(parseExtendedDuration(value) ?? { ...emptyDurationParts });
        setOpen(true);
      }
    },
    close: () => setOpen(false),
    apply: () => {
      commit(formatExtendedDuration(draft));
      setOpen(false);
    },
    changeText: (next: string) => commit(next || undefined),
    fieldDisabled: (key: keyof ExtendedDurationParts) =>
      disabled ||
      (key === 'weeks'
        ? durationFields.some((field) => field !== 'weeks' && draft[field] > 0)
        : draft.weeks > 0),
    changePart: (key: keyof ExtendedDurationParts, value: number) => {
      if (disabled) return;
      const next = {
        ...draft,
        [key]: Math.max(
          0,
          Math.min(
            durationFieldMax[key] ?? Number.MAX_SAFE_INTEGER,
            Math.floor(value || 0)
          )
        ),
      };
      setDraft(next);
      if (options.showActions === false) commit(formatExtendedDuration(next));
    },
  };
};
