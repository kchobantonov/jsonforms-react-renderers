import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { useTemporalControl } from '../util/useTemporalControl';
import {
  ControlProps,
  isTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { Clock3, X } from 'lucide-react';
import React from 'react';
import { TimePicker } from '../components/TimePicker';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import { formatTimeValue, parseTimeValue } from '../util/dateTime';
import { InputShell, makeId } from './InputControl';

export const ShadcnTimeControl = (props: ControlProps) => {
  const text = useI18n();
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
  const temporal = useTemporalControl(props, 'time');
  const [open, setOpen] = React.useState(false);

  if (!visible) return null;

  const id = makeId(path, label);
  const { selectedTime: selected, ampm, useSeconds, placeholder } = temporal;

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              disabled={!enabled || props.readonly}
              autoFocus={uischema.options?.focus === true}
              aria-invalid={!!errors}
              className='w-full justify-start pr-10 text-left font-normal data-[empty=true]:text-muted-foreground'
              data-empty={!selected}
            >
              <Clock3 className='h-4 w-4' />
              {selected
                ? temporal.displayText
                : typeof data === 'string' && data
                  ? data
                  : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-4'>
            <TimePicker
              value={
                selected
                  ? formatTimeValue(selected, true)
                  : typeof data === 'string'
                    ? data
                    : undefined
              }
              useSeconds={useSeconds}
              showHours={temporal.showHours}
              showMinutes={temporal.showMinutes}
              ampm={ampm}
              disabled={!enabled || props.readonly}
              isAllowed={(time) =>
                temporal.allowed(
                  new Date(2000, 0, 1, time.hours, time.minutes, time.seconds),
                )
              }
              onChange={(value) => {
                const time = parseTimeValue(value);
                if (time) {
                  const date = new Date(
                    2000,
                    0,
                    1,
                    time.hours,
                    time.minutes,
                    time.seconds,
                  );
                  temporal.commit(date);
                }
              }}
            />
            <div className='mt-3 flex justify-end'>
              <Button type='button' size='sm' onClick={() => setOpen(false)}>
                {text('control.done')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {selected &&
        enabled &&
        !props.readonly &&
        (uischema.options?.clearable ?? props.config?.clearable ?? true) ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute end-1 top-1 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
            aria-label={text('temporal.clearTime')}
            title={text('temporal.clearTime')}
            onClick={() => handleChange(path, undefined)}
          >
            <X className='h-4 w-4' />
          </Button>
        ) : null}
      </div>
    </InputShell>
  );
};

export const timeControlTester: RankedTester = rankWith(4, isTimeControl);
