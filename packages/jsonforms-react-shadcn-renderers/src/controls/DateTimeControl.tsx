import {
  ControlProps,
  isDateTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { CalendarClock, X } from 'lucide-react';
import React from 'react';
import { TimePicker } from '../components/TimePicker';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  TimeValue,
  formatDateTimeValue,
  formatDisplayDateTime,
  formatTimeValue,
  parseDateValue,
  parseTimeValue,
} from '../util/dateTime';
import { InputShell, makeId } from './InputControl';

export const ShadcnDateTimeControl = (props: ControlProps) => {
  const {
    data,
    description,
    enabled,
    errors,
    handleChange,
    label,
    path,
    required,
    uischema,
    visible,
  } = props;
  const [open, setOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState<Date>();
  const [draftTime, setDraftTime] = React.useState<TimeValue>();

  if (!visible) return null;

  const id = makeId(path, label);
  const selectedDate = parseDateValue(data);
  const selectedTime = parseTimeValue(data);
  const ampm = uischema.options?.ampm === true;
  const configuredFormat = uischema.options?.dateTimeFormat;
  const useSeconds =
    (typeof configuredFormat === 'string' && configuredFormat.includes('s')) ||
    !!selectedTime?.seconds;
  const placeholder =
    typeof uischema.options?.placeholder === 'string'
      ? uischema.options.placeholder
      : 'Pick a date and time';

  const updateValue = (date: Date | undefined, time: TimeValue | undefined) => {
    if (date && time) {
      handleChange(path, formatDateTimeValue(date, time));
    }
  };

  return (
    <InputShell
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='relative w-full'>
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen) {
              setDraftDate(selectedDate);
              setDraftTime(selectedTime);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              disabled={!enabled}
              autoFocus={uischema.options?.focus === true}
              aria-invalid={!!errors}
              className='w-full justify-start pr-10 text-left font-normal data-[empty=true]:text-muted-foreground'
              data-empty={!selectedDate || !selectedTime}
            >
              <CalendarClock className='h-4 w-4' />
              {selectedDate && selectedTime
                ? formatDisplayDateTime(selectedDate, selectedTime, ampm)
                : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-2'>
            <Calendar
              mode='single'
              selected={draftDate}
              defaultMonth={draftDate ?? selectedDate}
              captionLayout='dropdown'
              startMonth={new Date(new Date().getFullYear() - 100, 0)}
              endMonth={new Date(new Date().getFullYear() + 20, 11)}
              onSelect={(date) => {
                const nextTime =
                  draftTime ??
                  selectedTime ??
                  ({ hours: 0, minutes: 0, seconds: 0 } as TimeValue);
                setDraftDate(date);
                setDraftTime(nextTime);
                updateValue(date, nextTime);
              }}
            />
            <div className='border-t p-2 pt-3'>
              <TimePicker
                value={
                  draftTime
                    ? formatTimeValue(draftTime, true)
                    : typeof data === 'string'
                    ? data
                    : undefined
                }
                useSeconds={useSeconds}
                ampm={ampm}
                disabled={!enabled}
                onChange={(value) => {
                  const nextTime = parseTimeValue(value);
                  setDraftTime(nextTime);
                  updateValue(draftDate ?? selectedDate, nextTime);
                }}
              />
            </div>
            <div className='flex justify-end p-2 pt-0'>
              <Button type='button' size='sm' onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {selectedDate && enabled ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute right-1 top-1 h-8 w-8'
            aria-label='Clear date and time'
            onClick={() => handleChange(path, undefined)}
          >
            <X className='h-4 w-4' />
          </Button>
        ) : null}
      </div>
    </InputShell>
  );
};

export const dateTimeControlTester: RankedTester = rankWith(
  4,
  isDateTimeControl
);
