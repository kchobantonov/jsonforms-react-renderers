import {
  ControlProps,
  isTimeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { Clock3, X } from 'lucide-react';
import React from 'react';
import { TimePicker } from '../components/TimePicker';
import { Button } from '../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  formatDisplayTime,
  formatTimeValue,
  parseTimeValue,
} from '../util/dateTime';
import { InputShell, makeId } from './InputControl';

export const ShadcnTimeControl = (props: ControlProps) => {
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

  if (!visible) return null;

  const id = makeId(path, label);
  const selected = parseTimeValue(data);
  const ampm = uischema.options?.ampm === true;
  const configuredFormat = uischema.options?.timeFormat;
  const useSeconds =
    (typeof configuredFormat === 'string' && configuredFormat.includes('s')) ||
    !!selected?.seconds;
  const placeholder =
    typeof uischema.options?.placeholder === 'string'
      ? uischema.options.placeholder
      : 'Pick a time';

  return (
    <InputShell
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='relative w-full'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              disabled={!enabled}
              autoFocus={uischema.options?.focus === true}
              aria-invalid={!!errors}
              className='w-full justify-start pr-10 text-left font-normal data-[empty=true]:text-muted-foreground'
              data-empty={!selected}
            >
              <Clock3 className='h-4 w-4' />
              {selected ? formatDisplayTime(selected, ampm) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-4'>
            <TimePicker
              value={typeof data === 'string' ? data : undefined}
              useSeconds={useSeconds}
              ampm={ampm}
              disabled={!enabled}
              onChange={(value) => {
                const time = parseTimeValue(value);
                if (time) handleChange(path, formatTimeValue(time, true));
              }}
            />
            <div className='mt-3 flex justify-end'>
              <Button type='button' size='sm' onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {selected && enabled ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute right-1 top-1 h-8 w-8'
            aria-label='Clear time'
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
