import {
  ControlProps,
  isDateControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { CalendarIcon, X } from 'lucide-react';
import React from 'react';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { isValid } from 'date-fns/isValid';
import { useJsonForms } from '@jsonforms/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@jsonforms-react-shadcn-ui/select';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Calendar } from '@jsonforms-react-shadcn-ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import { formatDisplayDate, parseDateValue } from '../util/dateTime';
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
  const ctx = useJsonForms();
  const t = (key: string, fallback: string) =>
    ctx.i18n?.translate?.(key, fallback) ?? fallback;
  const options = { ...props.config, ...uischema.options };
  const datePattern = (value: string) =>
    value.replace(/\[([^\]]*)\]|YYYY|YY|DD|D/g, (token, literal) =>
      literal !== undefined
        ? "'" + literal + "'"
        : { YYYY: 'yyyy', YY: 'yy', DD: 'dd', D: 'd' }[token]!
    );
  const saveFormat =
    typeof options.dateSaveFormat === 'string'
      ? datePattern(options.dateSaveFormat)
      : 'yyyy-MM-dd';
  const selectedDate =
    typeof data === 'string'
      ? parse(data, saveFormat, new Date(2000, 0, 1))
      : undefined;
  const selected =
    selectedDate && isValid(selectedDate) ? selectedDate : undefined;
  const monthYearOnly =
    Array.isArray(options.views) &&
    options.views.includes('month') &&
    options.views.includes('year') &&
    !options.views.includes('day') &&
    !options.views.includes('date');
  const [draft, setDraft] = React.useState(selected ?? new Date());
  const [open, setOpen] = React.useState(false);

  if (!visible) return null;

  const id = makeId(path, label);

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
    <InputShell {...props}
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='relative w-full'>
        <Popover
          open={open}
          onOpenChange={(value) => {
            if (value) setDraft(selected ?? new Date());
            setOpen(value);
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
              data-empty={!selected}
            >
              <CalendarIcon className='h-4 w-4' />
              {selected
                ? typeof options.dateFormat === 'string'
                  ? format(selected, datePattern(options.dateFormat))
                  : formatDisplayDate(selected)
                : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            {monthYearOnly ? (
              <div className='space-y-4 p-3'>
                <div className='flex gap-2'>
                  <Select
                    value={String(draft.getMonth())}
                    onValueChange={(value) =>
                      setDraft(new Date(draft.getFullYear(), Number(value), 1))
                    }
                  >
                    <SelectTrigger
                      aria-label={t('Month', 'Month')}
                      className='w-36'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, month) => (
                        <SelectItem key={month} value={String(month)}>
                          {new Intl.DateTimeFormat(ctx.i18n?.locale, {
                            month: 'long',
                          }).format(new Date(2000, month, 1))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(draft.getFullYear())}
                    onValueChange={(value) =>
                      setDraft(new Date(Number(value), draft.getMonth(), 1))
                    }
                  >
                    <SelectTrigger
                      aria-label={t('Year', 'Year')}
                      className='w-24'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        {
                          length:
                            (max?.getFullYear() ??
                              new Date().getFullYear() + 100) -
                            (min?.getFullYear() ??
                              new Date().getFullYear() - 100) +
                            1,
                        },
                        (_, index) =>
                          (min?.getFullYear() ??
                            new Date().getFullYear() - 100) + index
                      ).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => setOpen(false)}
                  >
                    {t('Cancel', 'Cancel')}
                  </Button>
                  <Button
                    type='button'
                    disabled={!!((min && draft < min) || (max && draft > max))}
                    onClick={() => {
                      handleChange(path, format(draft, saveFormat));
                      setOpen(false);
                    }}
                  >
                    {t('Apply', 'Apply')}
                  </Button>
                </div>
              </div>
            ) : (
              <Calendar
                mode='single'
                selected={selected}
                defaultMonth={selected}
                onSelect={(date) => {
                  handleChange(
                    path,
                    date ? format(date, saveFormat) : undefined
                  );
                  setOpen(false);
                }}
                disabled={disabledDates}
                captionLayout='dropdown'
                startMonth={min ?? new Date(new Date().getFullYear() - 100, 0)}
                endMonth={max ?? new Date(new Date().getFullYear() + 20, 11)}
              />
            )}
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
