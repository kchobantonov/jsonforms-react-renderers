import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TimeValue, formatTimeValue, parseTimeValue } from '../util/dateTime';

export type TimePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  useSeconds?: boolean;
  ampm?: boolean;
  disabled?: boolean;
};

type TimePart = 'hours' | 'minutes' | 'seconds';

const emptyTime: TimeValue = { hours: 0, minutes: 0, seconds: 0 };

export const TimePicker = ({
  value,
  onChange,
  useSeconds = false,
  ampm = false,
  disabled = false,
}: TimePickerProps) => {
  const parsedValue = parseTimeValue(value);
  const [time, setTime] = React.useState<TimeValue | undefined>(parsedValue);

  React.useEffect(() => {
    setTime(parseTimeValue(value));
  }, [value]);

  const commit = (next: TimeValue) => {
    setTime(next);
    onChange(formatTimeValue(next, useSeconds));
  };

  const updatePart = (part: TimePart, value: number) => {
    const current = time ?? emptyTime;
    const maximum = part === 'hours' ? 23 : 59;
    commit({ ...current, [part]: Math.max(0, Math.min(maximum, value)) });
  };

  const stepPart = (part: TimePart, amount: number) => {
    const current = time ?? emptyTime;
    const maximum = part === 'hours' ? 23 : 59;
    const next = (current[part] + amount + maximum + 1) % (maximum + 1);
    commit({ ...current, [part]: next });
  };

  const displayedHour = time
    ? ampm
      ? time.hours % 12 || 12
      : time.hours
    : undefined;

  const updateDisplayedHour = (hour: number) => {
    if (!ampm) {
      updatePart('hours', hour);
      return;
    }
    const normalized = Math.max(1, Math.min(12, hour));
    const isPm = (time?.hours ?? 0) >= 12;
    updatePart('hours', normalized % 12 + (isPm ? 12 : 0));
  };

  const setPeriod = (isPm: boolean) => {
    const current = time ?? emptyTime;
    const hours = current.hours % 12 + (isPm ? 12 : 0);
    commit({ ...current, hours });
  };

  const renderPart = (
    part: TimePart,
    label: string,
    displayedValue: number | undefined,
    onValueChange = (next: number) => updatePart(part, next)
  ) => (
    <div className='flex flex-col items-center gap-1'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        disabled={disabled}
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={() => stepPart(part, 1)}
      >
        <ChevronUp className='h-4 w-4' />
      </Button>
      <Input
        type='number'
        inputMode='numeric'
        className='h-12 w-16 appearance-none text-center text-xl font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        value={displayedValue ?? ''}
        placeholder='--'
        min={ampm && part === 'hours' ? 1 : 0}
        max={part === 'hours' ? (ampm ? 12 : 23) : 59}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          if (event.currentTarget.value !== '') {
            onValueChange(Number(event.currentTarget.value));
          }
        }}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        disabled={disabled}
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={() => stepPart(part, -1)}
      >
        <ChevronDown className='h-4 w-4' />
      </Button>
    </div>
  );

  return (
    <div className='flex items-center justify-center gap-2' data-slot='time-picker'>
      {renderPart('hours', 'Hours', displayedHour, updateDisplayedHour)}
      <span className='select-none text-2xl font-semibold'>:</span>
      {renderPart('minutes', 'Minutes', time?.minutes)}
      {useSeconds ? (
        <>
          <span className='select-none text-2xl font-semibold'>:</span>
          {renderPart('seconds', 'Seconds', time?.seconds)}
        </>
      ) : null}
      {ampm ? (
        <div className='ml-2 grid gap-1' aria-label='Period'>
          <Button
            type='button'
            size='sm'
            variant={(time?.hours ?? 0) < 12 ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => setPeriod(false)}
          >
            AM
          </Button>
          <Button
            type='button'
            size='sm'
            variant={(time?.hours ?? 0) >= 12 ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => setPeriod(true)}
          >
            PM
          </Button>
        </div>
      ) : null}
    </div>
  );
};
