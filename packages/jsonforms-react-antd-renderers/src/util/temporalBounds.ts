import dayjs from 'dayjs';
import type {
  TemporalBounds,
  BoundPrecision,
} from '@chobantonov/jsonforms-react-renderer-common/temporalBounds';
export {
  temporalBounds,
  effectiveRestrict,
  resolveDataPointer,
  resolveDataBounds,
} from '@chobantonov/jsonforms-react-renderer-common/temporalBounds';
export type {
  TemporalBoundsSchema,
  BoundPrecision,
  TemporalBounds,
} from '@chobantonov/jsonforms-react-renderer-common/temporalBounds';
const CLOCK_DAY = '2000-01-01';

/** A `disabledDate` for antd, or undefined when nothing is bounded. */
export const disabledDateFor = (bounds: TemporalBounds) => {
  if (bounds.empty) {
    return () => true;
  }
  if (!bounds.min && !bounds.max) {
    return undefined;
  }
  return (current: dayjs.Dayjs) => outside(current, bounds, 'day');
};

const range = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let value = from; value <= to; value += 1) {
    out.push(value);
  }
  return out;
};

/**
 * A `disabledTime` for antd.
 *
 * For a date-time the bounds only bite on the **boundary days** - the section
 * asks for exactly that, "date-time bounds applied per boundary day". On any
 * day strictly inside the range every hour is available, and on a day outside
 * it `disabledDate` has already removed the day itself.
 *
 * The parameter is **not** nullable, although at runtime it can be: antd
 * types it as `(date: DateType) => DisabledTimes`, and declaring
 * `DateType | null` makes TypeScript infer the picker's whole generic as
 * `Dayjs | null`. That then rejects the `onChange` handler beside it, whose
 * value is a plain `Dayjs` - an error that points at `onChange` and is caused
 * here. The runtime guard below stays, because a bare time picker really can
 * be called with nothing.
 */
export const disabledTimeFor = (
  bounds: TemporalBounds,
  timeOnly: boolean,
  precision: BoundPrecision
) => {
  if (!bounds.min && !bounds.max) {
    return undefined;
  }
  const useSeconds = precision === 'second';

  return (current: dayjs.Dayjs) => {
    const day = timeOnly
      ? dayjs(CLOCK_DAY).startOf('day')
      : // `current` is typed non-null and is not always supplied.
        (current ?? bounds.min ?? bounds.max)!.startOf('day');

    const lower =
      bounds.min && bounds.min.isSame(day, 'day') ? bounds.min : undefined;
    const upper =
      bounds.max && bounds.max.isSame(day, 'day') ? bounds.max : undefined;
    if (!lower && !upper) {
      return {};
    }

    const disabledHours = () => [
      ...(lower ? range(0, lower.hour() - 1) : []),
      ...(upper ? range(upper.hour() + 1, 23) : []),
    ];
    const disabledMinutes = (hour: number) => [
      ...(lower && hour === lower.hour() ? range(0, lower.minute() - 1) : []),
      ...(upper && hour === upper.hour() ? range(upper.minute() + 1, 59) : []),
    ];
    const disabledSeconds = (hour: number, minute: number) => [
      ...(lower && hour === lower.hour() && minute === lower.minute()
        ? range(0, lower.second() - 1)
        : []),
      ...(upper && hour === upper.hour() && minute === upper.minute()
        ? range(upper.second() + 1, 59)
        : []),
    ];

    return useSeconds
      ? { disabledHours, disabledMinutes, disabledSeconds }
      : { disabledHours, disabledMinutes };
  };
};

/** Whether a whole unit at `value` is outside the range. */
const outside = (
  value: dayjs.Dayjs,
  { min, max }: TemporalBounds,
  precision: BoundPrecision
): boolean =>
  (!!min && value.isBefore(min.startOf(precision))) ||
  (!!max && value.isAfter(max.startOf(precision)));
