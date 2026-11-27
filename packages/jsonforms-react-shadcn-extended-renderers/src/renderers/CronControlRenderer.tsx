import React from 'react';
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
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import {
  useCronPicker,
  CRON_FIELDS,
  CronField,
  CronPeriod,
  DEFAULT_CRON,
  FIELD_RANGE,
  formatField,
  labelFor,
  parseField,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { CalendarClock, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Input } from '@jsonforms-react-shadcn-ui/input';
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
  and(isStringControl, or(formatIs('cron'), optionIs('format', 'cron'))),
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

const PopupTextInput = ({
  name,
  value,
  disabled,
  invalid,
  placeholder,
  onChange,
}: {
  name: string;
  value: string;
  disabled: boolean;
  invalid?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) => {
  const label = useI18n();
  return (
    <div className='group/cron-popup-input relative min-w-0'>
      <Input
        className='w-full pe-10'
        aria-label={name}
        aria-invalid={Boolean(invalid)}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {value !== '' && !disabled && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='invisible absolute inset-y-0 end-1 my-auto h-8 w-8 opacity-0 transition-opacity group-hover/cron-popup-input:visible group-hover/cron-popup-input:opacity-100 group-focus-within/cron-popup-input:visible group-focus-within/cron-popup-input:opacity-100'
          aria-label={`${label('control.clearValue')}: ${name}`}
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onChange('')}
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </Button>
      )}
    </div>
  );
};

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
      <div className='grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2'>
        <span>{name}</span>
        <PopupTextInput
          name={name}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    );
  const selected = values.length === high - low + 1 ? [] : values;
  return (
    <div className='grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2'>
      <span>{name}</span>
      <div className='group/cron-choice relative min-w-0'>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              disabled={disabled}
              aria-label={name}
              className='w-full min-w-0 justify-between pe-3'
            >
              <span className='min-w-0 flex-1 truncate text-start pe-10'>
                {selected.length
                  ? selected.map((v) => labelFor(v, field)).join(', ')
                  : label('cron.every')}
              </span>
              <ChevronDown
                className='h-4 w-4 shrink-0 opacity-60'
                aria-hidden='true'
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='w-[var(--radix-popover-trigger-width)] max-h-64 overflow-y-auto p-1'
          >
            <div role='listbox' aria-label={name} aria-multiselectable='true'>
              {Array.from({ length: high - low + 1 }, (_, i) => low + i).map(
                (choice) => (
                  <Button
                    key={choice}
                    type='button'
                    variant='ghost'
                    role='option'
                    aria-selected={selected.includes(choice)}
                    className='w-full justify-between font-normal'
                    onClick={() =>
                      onChange(
                        formatField(
                          selected.includes(choice)
                            ? selected.filter((v) => v !== choice)
                            : [...selected, choice],
                          field,
                        ),
                      )
                    }
                  >
                    {labelFor(choice, field)}
                    {selected.includes(choice) && (
                      <Check className='h-4 w-4' aria-hidden='true' />
                    )}
                  </Button>
                ),
              )}
            </div>
          </PopoverContent>
        </Popover>
        {selected.length > 0 && !disabled && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute end-8 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover/cron-choice:opacity-100 group-focus-within/cron-choice:opacity-100'
            aria-label={`${label('cron.every')}: ${name}`}
            title={`${label('cron.every')}: ${name}`}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onChange('*');
            }}
          >
            <X className='h-3 w-3' aria-hidden='true' />
          </Button>
        )}
      </div>
    </div>
  );
};

/** Uses the shared cron parser and preserves untouched fields and expressions. */
export const ShadcnCronControl = (props: ControlProps) => {
  const {
    label,
    expression,
    open,
    setOpen,
    text,
    period,
    options,
    showActions,
    disabled,
    localError,
    draft,
    changeField,
    changeText,
    changePeriod,
    editedProblem,
    shownFields,
    hasCustomField,
    openOn,
    accept,
  } = useCronPicker(props);
  if (!props.visible) return null;

  const id = makeId(props.path, props.label);
  return (
    <InputShell
      {...props}
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
              event.currentTarget.value || undefined,
            )
          }
        />
        <Popover open={open} onOpenChange={openOn}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute start-1 top-1/2 h-8 w-8 -translate-y-1/2'
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
            <div className='grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2'>
              <span>{label('cron.repeats')}</span>
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
            </div>
            {shownFields.map((field) => (
              <FieldPicker
                key={field}
                field={field}
                value={draft[CRON_FIELDS.indexOf(field)] ?? '*'}
                disabled={disabled}
                onChange={(value) => changeField(field, value)}
              />
            ))}
            {hasCustomField && (
              <p className='text-sm text-muted-foreground'>
                {label('cron.advanced')}
              </p>
            )}
            <div className='grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2'>
              <span>{label('cron.expression')}</span>
              <PopupTextInput
                name={label('cron.expression')}
                value={text}
                disabled={disabled}
                placeholder={DEFAULT_CRON}
                invalid={Boolean(editedProblem)}
                onChange={changeText}
              />
            </div>
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
                  onClick={accept}
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
