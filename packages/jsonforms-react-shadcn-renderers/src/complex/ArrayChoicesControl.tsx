import React, { useState } from 'react';
import {
  ControlProps,
  defaultErrorTranslator,
  getCombinedErrorMessage,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import { X, Plus, ChevronDown, CircleAlert } from 'lucide-react';
import {
  useI18n,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/translate';
import { displayableErrors } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import {
  addChoice,
  arrayChoiceItemErrors,
  arrayChoicesOf,
  asArrayValue,
  canAddChoice,
  canRemoveChoice,
  isChipsControl,
  isMultiSelectControl,
  isSelected,
  removeChoiceAt,
  resolveItemSchema,
  sameChoice,
} from '@chobantonov/jsonforms-react-renderer-common/arrayChoices';
import { InputShell, makeId } from '../controls/InputControl';

export const chipsControlTester = rankWith(
  6,
  and(uiTypeIs('Control'), isChipsControl),
);
export const multiSelectControlTester = rankWith(
  6,
  and(uiTypeIs('Control'), isMultiSelectControl),
);
const enumChoices = (
  schema: ControlProps['schema'],
  root: ControlProps['rootSchema'],
) => {
  const items = resolveItemSchema(schema, root);
  const strings = arrayChoicesOf(items);
  if (strings) return strings;
  const branches = items?.oneOf as Array<ControlProps['schema']> | undefined;
  return Array.isArray(branches) &&
    branches.length > 0 &&
    branches.every((branch) => branch.const !== undefined)
    ? branches.map((branch) => ({
        value: branch.const,
        label: branch.title ?? String(branch.const),
      }))
    : undefined;
};
export const enumArrayControlTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    schemaMatches(
      (schema, root) =>
        schema.type === 'array' &&
        schema.uniqueItems === true &&
        enumChoices(schema, root) !== undefined,
    ),
  ),
);

export const ShadcnArrayChoicesControl = (props: ControlProps) => {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const t = useI18n();
  const context = useJsonForms();
  const translate = useTranslator();
  if (!props.visible) return null;
  const { schema, rootSchema, data, path, handleChange } = props;
  const options = { ...props.config, ...props.uischema.options };
  const chips = options.variant === 'chips';
  const dropdown = options.variant === 'multi-select';
  const values = asArrayValue(data);
  const choices = enumChoices(schema, rootSchema);
  const [primary, additional] = displayableErrors(context.core ?? {});
  const itemErrors = arrayChoiceItemErrors(
    [...(primary ?? []), ...(additional ?? [])],
    path,
    values.length,
  );
  const itemSchema = resolveItemSchema(schema, rootSchema);
  const itemMessages = itemErrors.map((errors, index) =>
    getCombinedErrorMessage(
      errors,
      context.i18n?.translateError ?? defaultErrorTranslator,
      translate,
      itemSchema,
      props.uischema,
      path ? `${path}.${index}` : String(index),
    ),
  );
  const errors = [
    props.errors,
    ...itemMessages.map((message, index) =>
      message ? `${String(values[index])}: ${message}` : '',
    ),
  ]
    .filter(Boolean)
    .join('\n');
  const limits = {
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    restrict: options.restrict !== false,
  };
  const disabled = !props.enabled || props.readonly;
  const id = makeId(path, props.label);
  const label = (value: unknown) =>
    choices?.find((choice) => sameChoice(choice.value, value))?.label ??
    String(value);
  const remove = (index: number) => {
    if (!disabled && canRemoveChoice(values, limits))
      handleChange(path, removeChoiceAt(values, index));
  };
  const add = (value: unknown) => {
    if (disabled || value === '' || !canAddChoice(values, limits)) return;
    if (choices && !choices.some((choice) => sameChoice(choice.value, value)))
      return;
    handleChange(path, addChoice(values, value, schema.uniqueItems === true));
    setDraft('');
  };
  const choiceList = [
    ...(choices ?? []),
    ...values
      .filter(
        (value) => !choices?.some((choice) => sameChoice(choice.value, value)),
      )
      .map((value) => ({ value, label: String(value) })),
  ];
  const checks = (
    <div
      className={
        options.vertical ? 'flex flex-col gap-2' : 'flex flex-wrap gap-3'
      }
      role='group'
      aria-label={props.label}
    >
      {choiceList
        .filter((choice) =>
          choice.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        )
        .map((choice, index) => {
          const checked = isSelected(values, choice.value);
          return (
            <label key={index} className='flex items-center gap-2'>
              <Checkbox
                checked={checked}
                disabled={
                  disabled ||
                  (checked
                    ? !canRemoveChoice(values, limits)
                    : !canAddChoice(values, limits))
                }
                onCheckedChange={() =>
                  checked
                    ? remove(
                        values.findIndex((value) =>
                          sameChoice(value, choice.value),
                        ),
                      )
                    : add(choice.value)
                }
              />
              {choice.label}
            </label>
          );
        })}
    </div>
  );
  const pills = (
    <>
      {values.map((value, index) => (
        <span
          key={index}
          className={`inline-flex max-w-full items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-sm text-secondary-foreground ${itemMessages[index] ? 'border-destructive' : 'border-transparent'}`}
          aria-invalid={Boolean(itemMessages[index])}
          title={itemMessages[index] || undefined}
        >
          <span className='min-w-0 truncate' title={label(value)}>
            {label(value)}
          </span>
          {itemMessages[index] ? (
            <CircleAlert
              className='h-3.5 w-3.5 text-destructive'
              role='img'
              aria-label={itemMessages[index]}
            />
          ) : null}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-4 w-4 shrink-0 rounded-sm p-0'
            disabled={disabled || !canRemoveChoice(values, limits)}
            aria-label={t('composite.remove', { label: label(value) })}
            onClick={() => remove(index)}
          >
            <X className='h-3 w-3' />
          </Button>
        </span>
      ))}
    </>
  );
  return (
    <InputShell {...props} id={id} errors={errors}>
      {chips ? (
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          {pills}
          <Input
            id={id}
            className='min-w-40 flex-1'
            value={draft}
            list={choices ? id + '-choices' : undefined}
            disabled={disabled || !canAddChoice(values, limits)}
            aria-invalid={Boolean(errors)}
            placeholder={options.placeholder ?? t('chips.addPlaceholder')}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                add(draft);
              }
            }}
          />
          {choices && (
            <datalist id={id + '-choices'}>
              {choices.map((choice) => (
                <option key={String(choice.value)} value={String(choice.value)}>
                  {choice.label}
                </option>
              ))}
            </datalist>
          )}
          <Button
            type='button'
            variant='outline'
            size='icon'
            disabled={disabled || !draft || !canAddChoice(values, limits)}
            aria-label={t('tuple.add')}
            onClick={() => add(draft)}
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      ) : dropdown ? (
        <Popover>
          <div className='flex min-h-9 w-full min-w-0 items-center gap-1 rounded-md border border-input bg-background px-2 py-1'>
            <div className='flex min-w-0 flex-1 flex-wrap gap-1 max-h-32 overflow-auto'>
              {values.length ? (
                pills
              ) : (
                <span className='text-sm text-muted-foreground'>
                  {options.placeholder || props.label}
                </span>
              )}
            </div>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type='button'
                variant='ghost'
                size='icon'
                aria-label={props.label}
                disabled={disabled}
                aria-invalid={Boolean(errors)}
                className='h-7 w-7 shrink-0'
              >
                <ChevronDown className='h-4 w-4' />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent>
            <Input
              aria-label={props.label}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className='max-h-64 overflow-auto py-2'>{checks}</div>
          </PopoverContent>
        </Popover>
      ) : (
        checks
      )}
    </InputShell>
  );
};
