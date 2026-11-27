import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import { TimeValue, formatTimeValue, parseTimeValue } from '../util/dateTime';

export type TimePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  useSeconds?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  ampm?: boolean;
  disabled?: boolean;
  isAllowed?: (time: TimeValue) => boolean;
};

type TimePart = 'hours' | 'minutes' | 'seconds';

const partActionKeys = {
  hours: {
    increase: 'temporal.increaseHours',
    decrease: 'temporal.decreaseHours',
  },
  minutes: {
    increase: 'temporal.increaseMinutes',
    decrease: 'temporal.decreaseMinutes',
  },
  seconds: {
    increase: 'temporal.increaseSeconds',
    decrease: 'temporal.decreaseSeconds',
  },
} as const;

const emptyTime: TimeValue = { hours: 0, minutes: 0, seconds: 0 };

const TimePartInput = ({
  part,
  label,
  displayedValue,
  onValueChange,
  onStep,
  ampm,
  disabled,
  time,
  isAllowed,
}: {
  part: TimePart;
  label: string;
  displayedValue?: number;
  onValueChange: (value: number) => void;
  onStep: (amount: number) => void;
  ampm: boolean;
  disabled: boolean;
  time?: TimeValue;
  isAllowed?: TimePickerProps['isAllowed'];
}) => {
  const t = useI18n();
  return (
    <div className='flex flex-col items-center gap-1'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        disabled={disabled}
        aria-label={t(partActionKeys[part].increase)}
        onClick={() => onStep(1)}
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
        aria-invalid={time && isAllowed ? !isAllowed(time) : undefined}
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
        aria-label={t(partActionKeys[part].decrease)}
        onClick={() => onStep(-1)}
      >
        <ChevronDown className='h-4 w-4' />
      </Button>
    </div>
  );
};

const TimePeriodButtons = ({
  hours = 0,
  disabled,
  onChange,
}: {
  hours?: number;
  disabled: boolean;
  onChange: (isPm: boolean) => void;
}) => {
  const t = useI18n();
  return (
    <div className='ml-2 grid gap-1' aria-label={t('temporal.period')}>
      <Button
        type='button'
        size='sm'
        variant={hours < 12 ? 'default' : 'outline'}
        disabled={disabled}
        onClick={() => onChange(false)}
      >
        {t('temporal.am')}
      </Button>
      <Button
        type='button'
        size='sm'
        variant={hours >= 12 ? 'default' : 'outline'}
        disabled={disabled}
        onClick={() => onChange(true)}
      >
        {t('temporal.pm')}
      </Button>
    </div>
  );
};

const displayHour = (hours: number, ampm: boolean) =>
  ampm ? hours % 12 || 12 : hours;

export const TimePicker = ({
  value,
  onChange,
  useSeconds = false,
  showHours = true,
  showMinutes = true,
  ampm = false,
  disabled = false,
  isAllowed,
}: TimePickerProps) => {
  const t = useI18n();
  const parsedValue = parseTimeValue(value);
  const [time, setTime] = React.useState<TimeValue | undefined>(parsedValue);

  const [previousValue, setPreviousValue] = React.useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    setTime(parsedValue);
  }

  const commit = (next: TimeValue) => {
    setTime(next);
    if (!isAllowed || isAllowed(next))
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

  const displayedHour = time ? displayHour(time.hours, ampm) : undefined;

  const updateDisplayedHour = (hour: number) => {
    if (!ampm) {
      updatePart('hours', hour);
      return;
    }
    const normalized = Math.max(1, Math.min(12, hour));
    const isPm = (time?.hours ?? 0) >= 12;
    updatePart('hours', (normalized % 12) + (isPm ? 12 : 0));
  };

  const setPeriod = (isPm: boolean) => {
    const current = time ?? emptyTime;
    const hours = (current.hours % 12) + (isPm ? 12 : 0);
    commit({ ...current, hours });
  };

  const renderPart = (
    part: TimePart,
    label: string,
    displayedValue: number | undefined,
    onValueChange = (next: number) => updatePart(part, next),
  ) => (
    <TimePartInput
      part={part}
      label={label}
      displayedValue={displayedValue}
      onValueChange={onValueChange}
      onStep={(amount) => stepPart(part, amount)}
      ampm={ampm}
      disabled={disabled}
      time={time}
      isAllowed={isAllowed}
    />
  );

  return (
    <div
      className='flex items-center justify-center gap-2'
      data-slot='time-picker'
    >
      {showHours &&
        renderPart(
          'hours',
          t('temporal.hours'),
          displayedHour,
          updateDisplayedHour,
        )}
      {showHours && showMinutes && (
        <span className='select-none text-2xl font-semibold'>:</span>
      )}
      {showMinutes &&
        renderPart('minutes', t('temporal.minutes'), time?.minutes)}
      {useSeconds ? (
        <>
          {(showHours || showMinutes) && (
            <span className='select-none text-2xl font-semibold'>:</span>
          )}
          {renderPart('seconds', t('temporal.seconds'), time?.seconds)}
        </>
      ) : null}
      {ampm && showHours ? (
        <TimePeriodButtons
          hours={time?.hours}
          disabled={disabled}
          onChange={setPeriod}
        />
      ) : null}
    </div>
  );
};
