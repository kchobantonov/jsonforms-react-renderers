export interface DurationParts {
  weeks: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EMPTY_DURATION_PARTS: DurationParts = {
  weeks: 0, years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
};

const DURATION = /^P(?:(?<years>\d+)Y)?(?:(?<months>\d+)M)?(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/i;
const WEEKS = /^P(?<weeks>\d+)W$/i;
const number = (value?: string) => value ? Number.parseInt(value, 10) : 0;

export const parseDuration = (value: unknown): DurationParts | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const week = value.trim().match(WEEKS);
  if (week?.groups) return { ...EMPTY_DURATION_PARTS, weeks: number(week.groups.weeks) };
  const match = value.trim().match(DURATION);
  if (!match?.groups || !Object.values(match.groups).some((part) => part !== undefined)) return null;
  return {
    weeks: 0,
    years: number(match.groups.years), months: number(match.groups.months), days: number(match.groups.days),
    hours: number(match.groups.hours), minutes: number(match.groups.minutes), seconds: number(match.groups.seconds),
  };
};

export const sanitizeDurationParts = (parts: DurationParts): DurationParts => {
  const next = Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, Math.max(0, Math.floor(value || 0))])) as unknown as DurationParts;
  return next.weeks ? { ...EMPTY_DURATION_PARTS, weeks: next.weeks } : next;
};

export const formatDurationIso = (input: DurationParts): string => {
  const parts = sanitizeDurationParts(input);
  if (parts.weeks) return `P${parts.weeks}W`;
  const date = `${parts.years ? `${parts.years}Y` : ''}${parts.months ? `${parts.months}M` : ''}${parts.days ? `${parts.days}D` : ''}`;
  const time = `${parts.hours ? `${parts.hours}H` : ''}${parts.minutes ? `${parts.minutes}M` : ''}${parts.seconds ? `${parts.seconds}S` : ''}`;
  return !date && !time ? 'P0D' : `P${date}${time ? `T${time}` : ''}`;
};
