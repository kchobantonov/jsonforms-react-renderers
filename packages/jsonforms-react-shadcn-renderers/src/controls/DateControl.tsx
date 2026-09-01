import {
  ControlProps,
  isDateControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { CalendarIcon, X } from 'lucide-react';
import React from 'react';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  formatDateValue,
  formatDisplayDate,
  parseDateValue,
} from '../util/dateTime';
import { InputShell, makeId } from './InputControl';

type DateSchema = ControlProps['schema'] & {
  formatMinimum?: string;
  formatMaximum?: string;
};

export const ShadcnDateControl = (props: ControlProps) => {
  const {
    data,
    description,
    enabled,
    errors,
    handleChange,
    label,
    path,
    required,
    schema,
    uischema,
    visible,
  } = props;
  const [open, setOpen] = React.useState(false);

  if (!visible) return null;

  const id = makeId(path, label);
  const selected = parseDateValue(data);
  const min = parseDateValue((schema as DateSchema).formatMinimum);
  const max = parseDateValue((schema as DateSchema).formatMaximum);
  const disabledDates = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ];
  const placeholder =
    typeof uischema.options?.placeholder === 'string'
      ? uischema.options.placeholder
      : 'Pick a date';

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
              <CalendarIcon className='h-4 w-4' />
              {selected ? formatDisplayDate(selected) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={selected}
              defaultMonth={selected}
              onSelect={(date) => {
                handleChange(path, date ? formatDateValue(date) : undefined);
                setOpen(false);
              }}
              disabled={disabledDates}
              captionLayout='dropdown'
              startMonth={min ?? new Date(new Date().getFullYear() - 100, 0)}
              endMonth={max ?? new Date(new Date().getFullYear() + 20, 11)}
            />
          </PopoverContent>
        </Popover>
        {selected && enabled ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute right-1 top-1 h-8 w-8'
            aria-label='Clear date'
            onClick={() => handleChange(path, undefined)}
          >
            <X className='h-4 w-4' />
          </Button>
        ) : null}
      </div>
    </InputShell>
  );
};

export const dateControlTester: RankedTester = rankWith(4, isDateControl);
