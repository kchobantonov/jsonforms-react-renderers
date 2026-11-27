import isEqual from 'lodash/isEqual';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import React from 'react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import {
  ClearValueButton,
  hasClearableValue,
} from '../components/ClearValueButton';
import { InputShell, makeId } from './InputControl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';

export const ShadcnEnumControl = ({
  schema,
  data,
  config,
  description,
  enabled,
  errors,
  handleChange,
  label,
  options,
  path,
  required,
  readonly,
  uischema,
  visible,
}: ControlProps & OwnPropsOfEnum & TranslateProps) => {
  const t = useI18n();
  const [query, setQuery] = React.useState('');
  const searchable =
    (uischema.options?.autocomplete ?? config?.autocomplete) === true;
  const choices = (options ?? [])
    .map((option, index) => ({ option, index }))
    .filter(
      ({ option }) =>
        !searchable ||
        option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
  if (!visible) return null;
  const id = makeId(path, label);
  const clearable = uischema.options?.clearable ?? config?.clearable ?? true;
  const showClear =
    clearable && enabled && !readonly && hasClearableValue(data);

  return (
    <InputShell
      path={path}
      schema={schema}
      config={config}
      uischema={uischema}
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <div className='group relative w-full'>
        <Select
          onOpenChange={() => setQuery('')}
          disabled={!enabled || readonly}
          value={(() => {
            const index = (options ?? []).findIndex((option) =>
              isEqual(option.value, data),
            );
            return index < 0 ? '' : `option-${index}`;
          })()}
          onValueChange={(value) => {
            const option = (options ?? [])[
              Number(value.replace('option-', ''))
            ];
            if (option && enabled && !readonly)
              handleChange(path, option.value);
          }}
        >
          <SelectTrigger
            id={id}
            className='shadcn-jsonforms-input shadcn-jsonforms-select w-full min-w-0 pr-3'
          >
            <SelectValue
              className={showClear ? 'mr-10 min-w-0' : 'min-w-0'}
              placeholder='Select...'
            />
          </SelectTrigger>
          <SelectContent className='shadcn-jsonforms-select-content'>
            {searchable && (
              <Input
                type='search'
                role='searchbox'
                aria-label={t('enum.search')}
                value={query}
                disabled={!enabled || readonly}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (
                    !['ArrowUp', 'ArrowDown', 'Escape', 'Tab'].includes(
                      event.key,
                    )
                  ) {
                    event.stopPropagation();
                  }
                }}
              />
            )}
            {searchable && choices.length === 0 && (
              <div role='status'>{t('enum.noMatches')}</div>
            )}
            {choices.map(({ option, index }) => (
              <SelectItem
                className='shadcn-jsonforms-select-item'
                key={index}
                value={`option-${index}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ClearValueButton
          clearable={clearable}
          trailingControlSpace={36}
          data={data}
          enabled={enabled}
          readonly={readonly}
          onClear={() => handleChange(path, undefined)}
        />
      </div>
    </InputShell>
  );
};

export const enumControlTester: RankedTester = rankWith(2, isEnumControl);
