import {
  EMPTY_DURATION,
  parseDuration as parseComponents,
  sanitizeComponents,
  formatDurationComponents,
  type DurationParts as Components,
} from '@chobantonov/jsonforms-react-renderer-common/formats/duration';

export interface DurationParts extends Components {
  weeks: number;
}
export const EMPTY_DURATION_PARTS: DurationParts = {
  weeks: 0,
  ...EMPTY_DURATION,
};
const WEEKS = /^P(?<weeks>\d+)W$/i;
const number = (value?: string) => (value ? Number.parseInt(value, 10) : 0);

export const parseDuration = (value: unknown): DurationParts | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const week = value.trim().match(WEEKS);
  if (week?.groups)
    return { ...EMPTY_DURATION_PARTS, weeks: number(week.groups.weeks) };
  const parts = parseComponents(value);
  return parts ? { weeks: 0, ...parts } : null;
};

export const sanitizeDurationParts = (parts: DurationParts): DurationParts => {
  const next = sanitizeComponents(parts);
  return next.weeks ? { ...EMPTY_DURATION_PARTS, weeks: next.weeks } : next;
};

export const formatDurationIso = (input: DurationParts): string => {
  const parts = sanitizeDurationParts(input);
  if (parts.weeks) return `P${parts.weeks}W`;
  return formatDurationComponents(parts);
};
