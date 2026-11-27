import { useJsonForms } from '@jsonforms/react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { useTemporalControl } from '../util/useTemporalControl';
import {
  ControlProps,
  isDateTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { CalendarClock, X } from 'lucide-react';
import React from 'react';
import { TimePicker } from '../components/TimePicker';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Calendar } from '@jsonforms-react-shadcn-ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import {
  TimeValue,
  formatDisplayDateTime,
  formatTimeValue,
  parseTimeValue,
} from '../util/dateTime';
import { InputShell, makeId } from './InputControl';

export const ShadcnDateTimeControl = (props: ControlProps) => {
  const text = useI18n();
  const locale = useJsonForms().i18n?.locale;
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
  const temporal = useTemporalControl(props, 'dateTime');
  const [open, setOpen] = React.useState(false);
  const [calendarYear] = React.useState(() => new Date().getFullYear());
  const [draftDate, setDraftDate] = React.useState<Date>();
  const [draftTime, setDraftTime] = React.useState<TimeValue>();

  if (!visible) return null;

  const id = makeId(path, label);
  const selectedDate = temporal.selected?.toDate();
  const { selectedTime, ampm, useSeconds, placeholder } = temporal;

  const updateValue = (date: Date | undefined, time: TimeValue | undefined) => {
    if (date && time) {
      const value = new Date(date);
      value.setHours(time.hours, time.minutes, time.seconds, 0);
      temporal.commit(value);
    }
  };

  return (
    <InputShell
      {...props}
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='group relative w-full'>
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
              disabled={!enabled || props.readonly}
              autoFocus={uischema.options?.focus === true}
              aria-invalid={!!errors}
              className='w-full justify-start pr-10 text-left font-normal data-[empty=true]:text-muted-foreground'
              data-empty={!selectedDate || !selectedTime}
            >
              <CalendarClock className='h-4 w-4' />
              {selectedDate && selectedTime
                ? typeof temporal.options.dateTimeFormat === 'string'
                  ? temporal.displayText
                  : formatDisplayDateTime(
                      selectedDate,
                      selectedTime,
                      ampm,
                      locale,
                    )
                : typeof data === 'string' && data
                  ? data
                  : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-2'>
            <Calendar
              mode='single'
              disabled={temporal.disabledDate}
              selected={draftDate}
              defaultMonth={draftDate ?? selectedDate}
              captionLayout='dropdown'
              startMonth={new Date(calendarYear - 100, 0)}
              endMonth={new Date(calendarYear + 20, 11)}
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
                showHours={temporal.showHours}
                showMinutes={temporal.showMinutes}
                ampm={ampm}
                disabled={!enabled || props.readonly}
                isAllowed={(time) => {
                  const date = new Date(
                    draftDate ?? selectedDate ?? new Date(),
                  );
                  date.setHours(time.hours, time.minutes, time.seconds, 0);
                  return temporal.allowed(date);
                }}
                onChange={(value) => {
                  const nextTime = parseTimeValue(value);
                  setDraftTime(nextTime);
                  updateValue(draftDate ?? selectedDate, nextTime);
                }}
              />
            </div>
            <div className='flex justify-end p-2 pt-0'>
              <Button type='button' size='sm' onClick={() => setOpen(false)}>
                {text('control.done')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {selectedDate &&
        enabled &&
        !props.readonly &&
        (uischema.options?.clearable ?? props.config?.clearable ?? true) ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute end-1 top-1 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
            aria-label={text('temporal.clearDateTime')}
            title={text('temporal.clearDateTime')}
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
  isDateTimeControl,
);
