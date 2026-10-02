import React, { useState } from 'react';
import { Flex, Input, Select, Tag, theme as antTheme } from 'antd';
import {
  ControlProps,
  RankedTester,
  rankWith,
  and,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ControlFormItem } from '../util/cellMode';
import { usePreTouchErrors } from '../util/preTouchErrors';
import { useI18n } from '../util/translate';
import {
  addChoice,
  arrayChoicesOf,
  asArrayValue,
  canAddChoice,
  canRemoveChoice,
  isChipsControl,
  isSelected,
  removeChoiceAt,
  resolveItemSchema,
} from '../util/arrayChoices';

/**
 * `variant: "chips"` — an array of strings as removable tokens.
 *
 * **The tokens are drawn here rather than by antd's `Select` in tags mode**,
 * and the reason is duplicates. `uniqueItems` is optional for chips, so
 * `["a", "a"]` is legal data the specification expects to survive: "otherwise
 * free-entry chips may retain repeated strings", and "remove the selected
 * occurrence when duplicates exist". A `Select` keys its tags by value, so two
 * equal tokens are one entry to it and closing either removes both. Tags of our
 * own are identified by **position**, which is what makes removing the intended
 * occurrence possible at all.
 *
 * What is free here is entry, not validation: item constraints still apply to
 * every stored value, and a schema that narrows the items to a finite list
 * turns the adder into a chooser.
 */
export const chipsControlTester: RankedTester = rankWith(
  6,
  and(uiTypeIs('Control'), isChipsControl)
);

export const ChipsControl = (props: ControlProps) => {
  const t = useI18n();
  const { token } = antTheme.useToken();
  const [draft, setDraft] = useState('');
  const {
    data,
    enabled,
    id,
    label,
    path,
    required,
    rootSchema,
    schema,
    uischema,
    visible,
  } = props;
  // See `usePreTouchErrors`; unchanged unless filtering is on.
  const { errors, onFocus, onBlur } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as any,
    config: props.config,
  });

  const options = {
    ...props.config,
    ...(uischema.options ?? {}),
  } as Record<string, any>;
  const values = asArrayValue(data);
  const itemSchema = resolveItemSchema(schema, rootSchema);
  const choices = arrayChoicesOf(itemSchema);
  const unique = schema.uniqueItems === true;
  const limits = {
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    restrict: options.restrict !== false,
  };
  const addable = enabled !== false && canAddChoice(values, limits);
  const removable = enabled !== false && canRemoveChoice(values, limits);

  if (!visible) {
    return null;
  }

  const commit = (next: unknown[]) => props.handleChange(path, next);

  const add = (value: string) => {
    if (!addable || value === '') {
      return;
    }
    // `unique` refuses rather than collapses, so a `uniqueItems` array cannot
    // be pushed into an invalid state from here.
    const next = addChoice(values, value, unique);
    if (next !== values) {
      commit(next);
    }
    setDraft('');
  };

  /** The label to show for a stored value, which may not be a known choice. */
  const labelFor = (value: unknown): string => {
    const choice = choices?.find((entry) => entry.value === value);
    return choice ? choice.label : String(value);
  };

  const remaining = choices?.filter(
    (choice) => !unique || !isSelected(values, choice.value)
  );

  return (
    <ControlFormItem
      hideRequiredAsterisk={uischema.options?.hideRequiredAsterisk}
      id={id}
      label={label}
      required={required}
      errors={errors || undefined}
      help={errors || props.description}
    >
      <Flex data-chips vertical gap={token.paddingXS}>
        {values.length > 0 && (
          <Flex wrap gap={token.paddingXXS}>
            {values.map((value, index) => (
              /*
                Keyed and closed by **position**, never by value. Two equal
                tokens are two tokens, and closing the second must not take the
                first with it.
              */
              <Tag
                key={`${index}-${String(value)}`}
                closable={removable}
                data-chip={index}
                onClose={(event) => {
                  event.preventDefault();
                  if (removable) {
                    commit(removeChoiceAt(values, index));
                  }
                }}
              >
                {labelFor(value)}
              </Tag>
            ))}
          </Flex>
        )}
        {choices ? (
          /*
            A finite item schema turns entry into selection: the specification
            says "the schema determines whether entry is free or choice-limited;
            no separate free-entry option is introduced".
          */
          <Select
            data-chips-select
            disabled={!addable}
            autoFocus={options.focus === true}
            style={{ width: '100%' }}
            placeholder={options.placeholder}
            // Controlled as empty: the chosen value goes into the tag list
            // above, not into the selector.
            value={null}
            showSearch={{
              optionFilterProp: 'label',
              filterOption: (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
            notFoundContent={t('enum.noMatches')}
            onChange={(value: string) => add(value)}
            options={(remaining ?? []).map((choice) => ({
              value: choice.value as string,
              label: choice.label,
            }))}
          />
        ) : (
          <Input
            data-chips-input
            disabled={!addable}
            autoFocus={options.focus === true}
            placeholder={options.placeholder ?? t('chips.addPlaceholder')}
            value={draft}
            /*
              A partial token "remains a local draft until explicitly
              committed", so nothing is written while typing - only on Enter.
            */
            onChange={(event) => setDraft(event.currentTarget.value)}
            onPressEnter={() => add(draft)}
            onFocus={onFocus}
            onBlur={() => {
              setDraft('');
              onBlur();
            }}
          />
        )}
      </Flex>
    </ControlFormItem>
  );
};

export default withJsonFormsControlProps(ChipsControl);
