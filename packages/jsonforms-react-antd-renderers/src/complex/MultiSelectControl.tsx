import React from 'react';
import { Select } from 'antd';
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
  arrayChoicesOf,
  asArrayValue,
  canAddChoice,
  canRemoveChoice,
  isMultiSelectControl,
  resolveItemSchema,
  sameChoice,
} from '../util/arrayChoices';

/**
 * `variant: "multi-select"` — several finite choices in one compact control.
 *
 * Rank 6, above the automatic checkbox group at 5, because the specification
 * says "explicit selection takes precedence over automatic checkboxes". It
 * matches the same schema shapes that group does, so the only thing choosing
 * between them is the variant.
 *
 * There is **no free entry**: the choices come from the schema, and a search
 * query filters them rather than adding to them.
 */
export const multiSelectControlTester: RankedTester = rankWith(
  6,
  and(uiTypeIs('Control'), isMultiSelectControl)
);

export const MultiSelectControl = (props: ControlProps) => {
  const t = useI18n();
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
  const choices = arrayChoicesOf(itemSchema) ?? [];
  const limits = {
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    restrict: options.restrict !== false,
  };
  const addable = canAddChoice(values, limits);
  const removable = canRemoveChoice(values, limits);

  if (!visible) {
    return null;
  }

  /*
    Incoming values the schema does not admit are shown as choices of their own
    rather than dropped. Section 19, and the array-choice contract: "do not
    silently deduplicate, coerce, or discard invalid incoming values."
  */
  const unknownValues = values.filter(
    (value) => !choices.some((choice) => sameChoice(choice.value, value))
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
      <Select
        mode='multiple'
        data-multi-select
        disabled={!enabled}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={options.focus === true}
        style={{ width: '100%' }}
        placeholder={options.placeholder}
        value={values}
        /*
          Searching filters the labels; it never creates a value. `mode="tags"`
          would, which is what makes it the wrong mode here even though it looks
          the same.
        */
        showSearch={{
          optionFilterProp: 'label',
          filterOption: (input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase()),
        }}
        notFoundContent={t('enum.noMatches')}
        onChange={(next: unknown[]) => {
          /*
            antd reports the whole selection, so the bound has to be applied to
            the *direction* of the change: refusing a longer list when the
            maximum is reached, and a shorter one when the minimum is.
          */
          if (next.length > values.length && !addable) {
            return;
          }
          if (next.length < values.length && !removable) {
            return;
          }
          props.handleChange(path, next);
        }}
        options={[
          ...choices.map((choice) => ({
            value: choice.value as string,
            label: choice.label,
          })),
          ...unknownValues.map((value) => ({
            value: value as string,
            label: String(value),
          })),
        ]}
      />
    </ControlFormItem>
  );
};

export default withJsonFormsControlProps(MultiSelectControl);
