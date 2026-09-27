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

export const formatDuration = (parts: DurationParts) => {
  const safe = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [
      key,
      Math.max(0, Math.floor(value || 0)),
    ])
  ) as unknown as DurationParts;
  const date = `${safe.years ? `${safe.years}Y` : ''}${
    safe.months ? `${safe.months}M` : ''
  }${safe.days ? `${safe.days}D` : ''}`;
  const time = `${safe.hours ? `${safe.hours}H` : ''}${
    safe.minutes ? `${safe.minutes}M` : ''
  }${safe.seconds ? `${safe.seconds}S` : ''}`;
  return !date && !time ? 'P0D' : `P${date}${time ? `T${time}` : ''}`;
};
