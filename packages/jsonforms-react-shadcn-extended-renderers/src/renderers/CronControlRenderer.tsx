import React, { useState } from 'react';
import {
  ControlProps,
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  InputShell,
  makeId,
  ClearValueButton,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  CRON_FIELDS,
  CronField,
  CronPeriod,
  DEFAULT_CRON,
  FIELD_RANGE,
  NOTHING_CHOSEN,
  cronProblem,
  fieldsForPeriod,
  formatField,
  joinCron,
  labelFor,
  parseField,
  periodOf,
  sameExpression,
  splitCron,
  standDown,
  withTimeDefaults,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { CalendarClock } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';

export const cronControlTester = rankWith(
  3,
  and(isStringControl, or(formatIs('cron'), optionIs('format', 'cron')))
);
const periods: CronPeriod[] = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

const FieldPicker = ({
  field,
  value,
  disabled,
  onChange,
}: {
  field: CronField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) => {
  const label = useI18n();
  const values = parseField(value, field);
  const [low, high] = FIELD_RANGE[field];
  const name = label(`cron.${field}` as any);
  if (values === undefined)
    return (
      <label className='grid gap-1'>
        {name}
        <Input
          aria-label={name}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </label>
    );
  const selected = values.length === high - low + 1 ? [] : values;
  return (
    <div className='grid grid-cols-[8rem_1fr] items-center gap-2'>
      <span>{name}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            disabled={disabled}
            aria-label={name}
            className='justify-start truncate'
          >
            {selected.length
              ? selected.map((v) => labelFor(v, field)).join(', ')
              : label('cron.every')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='max-h-64 overflow-auto' align='start'>
          <Button type='button' variant='ghost' onClick={() => onChange('*')}>
            {label('cron.every')}
          </Button>
          <div className='grid grid-cols-3 gap-2'>
            {Array.from({ length: high - low + 1 }, (_, i) => low + i).map(
              (value) => (
                <label key={value} className='flex items-center gap-2'>
                  <Checkbox
                    disabled={disabled}
                    checked={selected.includes(value)}
                    onCheckedChange={(checked) =>
                      onChange(
                        formatField(
                          checked === true
                            ? [...selected, value]
                            : selected.filter((v) => v !== value),
                          field
                        )
                      )
                    }
                    aria-label={`${name} ${labelFor(value, field)}`}
                  />
                  {labelFor(value, field)}
                </label>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/** Uses the shared cron parser and preserves untouched fields and expressions. */
export const ShadcnCronControl = (props: ControlProps) => {
  const label = useI18n();
  const expression = typeof props.data === 'string' ? props.data : '';
  const [open, setOpen] = useState(false);

  const [text, setText] = useState('');

  const [period, setPeriod] = useState<CronPeriod | undefined>(undefined);

  const [touched, setTouched] = useState(false);

  if (!props.visible) return null;

  const options = { ...props.config, ...props.uischema.options };
  const showActions = options.showActions !== false;
  const disabled = !props.enabled || Boolean(props.readonly);
  const problem =
    expression.trim() === '' ? undefined : cronProblem(expression);
  const localError = problem ? label(`cron.error.${problem}` as any) : '';

  const commit = (next: string) => {
    if (disabled || sameExpression(next, expression)) return;
    props.handleChange(props.path, next);
  };

  const draft = splitCron(text) ?? NOTHING_CHOSEN;

  const change = (next: string) => {
    setText(next);
    setTouched(true);
    if (!showActions) commit(next);
  };

  const changeField = (field: CronField, value: string) => {
    const next = [...draft];
    const chosen = value.trim() !== '' && value !== '*';
    next[CRON_FIELDS.indexOf(field)] = chosen ? value : '*';
    change(joinCron(chosen ? withTimeDefaults(next, field) : next));
  };

  const changeText = (next: string) => {
    const fields = splitCron(next);
    if (fields) setPeriod(periodOf(fields));
    change(next);
  };

  const changePeriod = (next: CronPeriod) => {
    if (disabled || next === period) return;
    setPeriod(next);

    if (next === 'second') change(joinCron(NOTHING_CHOSEN));
    else if (splitCron(text)) change(joinCron(standDown(draft, next)));
  };

  const editedProblem = text.trim() === '' ? undefined : cronProblem(text);
  const shownFields = period ? fieldsForPeriod(period) : [];

  const openOn = (next: boolean) => {
    if (disabled) return;
    if (next) {
      const fields = splitCron(expression);
      setText(expression);
      setPeriod(fields ? periodOf(fields) : undefined);
      setTouched(false);
    }
    setOpen(next);
  };

  const id = makeId(props.path, props.label);
  return (
    <InputShell {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={localError || props.errors}
    >
      <div className='group relative'>
        <Input
          id={id}
          className='pl-10 pr-10'
          value={expression}
          disabled={disabled}
          placeholder={options.placeholder ?? DEFAULT_CRON}
          autoFocus={options.focus}
          aria-invalid={Boolean(localError || props.errors)}
          aria-describedby={
            localError || props.errors ? `${id}-errors` : undefined
          }
          onChange={(event) =>
            props.handleChange(
              props.path,
              event.currentTarget.value || undefined
            )
          }
        />
        <Popover open={open} onOpenChange={openOn}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute left-1 top-1 h-8 w-8'
              disabled={disabled}
              aria-label={label('cron.choose')}
              title={label('cron.choose')}
            >
              <CalendarClock aria-hidden='true' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='w-96 max-w-[calc(100vw-2rem)] space-y-3'
          >
            <Select
              value={period ?? ''}
              disabled={disabled}
              onValueChange={(value) => changePeriod(value as CronPeriod)}
            >
              <SelectTrigger aria-label={label('cron.repeats')}>
                <SelectValue placeholder={label('cron.chooseRepeats')} />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {label(`cron.period.${period}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shownFields.map((field) => (
              <FieldPicker
                key={field}
                field={field}
                value={draft[CRON_FIELDS.indexOf(field)] ?? '*'}
                disabled={disabled}
                onChange={(value) => changeField(field, value)}
              />
            ))}
            {shownFields.some(
              (field) =>
                parseField(draft[CRON_FIELDS.indexOf(field)] ?? '*', field) ===
                undefined
            ) && (
              <p className='text-sm text-muted-foreground'>
                {label('cron.advanced')}
              </p>
            )}
            <Input
              value={text}
              disabled={disabled}
              placeholder={DEFAULT_CRON}
              aria-label={label('cron.expression')}
              aria-invalid={Boolean(editedProblem)}
              onChange={(event) => changeText(event.currentTarget.value)}
            />
            {editedProblem && (
              <p role='alert'>{label(`cron.error.${editedProblem}` as any)}</p>
            )}
            {showActions && (
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  {label('cron.cancel')}
                </Button>
                <Button
                  type='button'
                  disabled={disabled || Boolean(editedProblem)}
                  onClick={() => {
                    if (touched) commit(text);
                    setOpen(false);
                  }}
                >
                  {label('cron.ok')}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <ClearValueButton
          clearable={options.clearable !== false}
          data={props.data}
          enabled={!disabled}
          onClear={() => props.handleChange(props.path, undefined)}
        />
      </div>
    </InputShell>
  );
};
export const CronControlRenderer = withJsonFormsControlProps(ShadcnCronControl);
