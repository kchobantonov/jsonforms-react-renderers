export interface DurationParts {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EMPTY_DURATION: DurationParts = {
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const DURATION =
  /^P(?:(?<years>\d+)Y)?(?:(?<months>\d+)M)?(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/i;

export const parseDuration = (value: unknown): DurationParts | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.trim().match(DURATION);
  if (!match?.groups || !Object.values(match.groups).some(Boolean)) return null;
  const number = (part?: string) => (part ? Number.parseInt(part, 10) : 0);
  return {
    years: number(match.groups.years),
    months: number(match.groups.months),
    days: number(match.groups.days),
    hours: number(match.groups.hours),
    minutes: number(match.groups.minutes),
    seconds: number(match.groups.seconds),
  };
};

export const sanitizeComponents = <T extends DurationParts>(parts: T): T =>
  Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [
      key,
      Math.max(0, Math.floor(value || 0)),
    ]),
  ) as unknown as T;

export const formatDuration = (parts: DurationParts) => {
  const safe = sanitizeComponents(parts);
  return formatDurationComponents(safe);
};

export const formatDurationComponents = (parts: DurationParts) => {
  const unit = (value: number, suffix: string) =>
    value ? `${value}${suffix}` : '';
  const date =
    unit(parts.years, 'Y') + unit(parts.months, 'M') + unit(parts.days, 'D');
  const time =
    unit(parts.hours, 'H') +
    unit(parts.minutes, 'M') +
    unit(parts.seconds, 'S');
  return date || time ? `P${date}${time ? `T${time}` : ''}` : 'P0D';
};
