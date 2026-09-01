const pad = (value: number) => String(value).padStart(2, '0');

export type TimeValue = {
  hours: number;
  minutes: number;
  seconds: number;
};

export const parseDateValue = (value: unknown): Date | undefined => {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : undefined;
};

export const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);

export const parseTimeValue = (value: unknown): TimeValue | undefined => {
  if (typeof value !== 'string') return undefined;
  const match = /(?:T)?(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return undefined;

  const result = {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    seconds: Number(match[3] ?? 0),
  };
  return result.hours < 24 && result.minutes < 60 && result.seconds < 60
    ? result
    : undefined;
};

export const formatTimeValue = (time: TimeValue, useSeconds = true) => {
  const value = `${pad(time.hours)}:${pad(time.minutes)}`;
  return useSeconds ? `${value}:${pad(time.seconds)}` : value;
};

export const formatDisplayTime = (time: TimeValue, ampm = false) => {
  if (!ampm) return formatTimeValue(time, time.seconds !== 0);
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hours = time.hours % 12 || 12;
  const value = `${pad(hours)}:${pad(time.minutes)}`;
  return `${time.seconds ? `${value}:${pad(time.seconds)}` : value} ${period}`;
};

export const formatDateTimeValue = (date: Date, time: TimeValue) => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  return `${formatDateValue(date)}T${formatTimeValue(
    time
  )}${sign}${offsetHours}:${offsetMinutes}`;
};

export const formatDisplayDateTime = (
  date: Date,
  time: TimeValue,
  ampm = false
) => `${formatDisplayDate(date)}, ${formatDisplayTime(time, ampm)}`;
