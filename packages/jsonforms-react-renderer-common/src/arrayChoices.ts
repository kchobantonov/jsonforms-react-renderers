import { JsonSchema, Resolve, Tester, UISchemaElement } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';

/**
 * Array-choice selection and mutation, with no React in it.
 *
 * The specification's "multi-choice identity, applicability, and safe removal"
 * rules are all about *which value* an interaction refers to, which is decidable
 * from the data alone - so it is settled here and tested without rendering.
 */

export interface ArrayChoice {
  value: unknown;
  label: string;
}

/** The item schema, with a `$ref` followed. */
export const resolveItemSchema = (
  schema: JsonSchema | undefined,
  rootSchema: JsonSchema
): JsonSchema | undefined => {
  const items = schema?.items;
  if (!items || Array.isArray(items) || typeof items === 'boolean') {
    return undefined;
  }
  const resolved = items as JsonSchema;
  return resolved.$ref
    ? Resolve.schema(rootSchema, resolved.$ref, rootSchema) ?? resolved
    : resolved;
};

/**
 * The permitted values, or `undefined` when the items are not a finite choice.
 *
 * **String choices only.** The specification is explicit that "recognizing item
 * oneOf branches containing const is not by itself evidence of support for
 * object or array constants", and that a tester "must match only choice value
 * types that its selection, addition, and removal logic supports". These
 * renderers compare with `isEqual` and render labels as text, which is honest
 * for strings and would be a bluff for structured constants - so those are left
 * to a renderer that can edit them.
 */
export const arrayChoicesOf = (
  itemSchema: JsonSchema | undefined
): ArrayChoice[] | undefined => {
  if (!itemSchema) {
    return undefined;
  }
  if (Array.isArray(itemSchema.enum)) {
    if (!itemSchema.enum.every((value) => typeof value === 'string')) {
      return undefined;
    }
    return itemSchema.enum.map((value) => ({
      value,
      label: String(value),
    }));
  }
  const branches = itemSchema.oneOf as JsonSchema[] | undefined;
  if (Array.isArray(branches) && branches.length > 0) {
    if (!branches.every((branch) => typeof branch?.const === 'string')) {
      return undefined;
    }
    return branches.map((branch) => ({
      value: branch.const,
      // A branch title is the label; the constant stays the stored value.
      label: branch.title ?? String(branch.const),
    }));
  }
  return undefined;
};

/** Whether the items are homogeneous strings, finite or not. */
export const hasStringItems = (itemSchema: JsonSchema | undefined): boolean =>
  itemSchema?.type === 'string' ||
  (Array.isArray(itemSchema?.type) &&
    itemSchema?.type.length === 1 &&
    itemSchema.type[0] === 'string');

const optionIsVariant = (uischema: UISchemaElement, variant: string) =>
  (uischema as { options?: Record<string, unknown> }).options?.variant ===
  variant;

const arraySchemaAt = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema | undefined => {
  const scope = (uischema as { scope?: string }).scope;
  if (!scope) {
    return schema;
  }
  try {
    return Resolve.schema(schema, scope, rootSchema ?? schema) ?? schema;
  } catch {
    return undefined;
  }
};

/**
 * `variant: "multi-select"` over the same shapes the automatic checkbox group
 * matches: a unique-item array of finite string choices.
 *
 * "Explicit selection takes precedence over automatic checkboxes", so this
 * ranks above `EnumArrayRenderer`.
 */
export const isMultiSelectControl: Tester = (uischema, schema, context) => {
  if (!optionIsVariant(uischema, 'multi-select')) {
    return false;
  }
  const resolved = arraySchemaAt(
    uischema,
    schema,
    context?.rootSchema ?? schema
  );
  if (resolved?.type !== 'array' || resolved.uniqueItems !== true) {
    return false;
  }
  const items = resolveItemSchema(resolved, context?.rootSchema ?? schema);
  return arrayChoicesOf(items) !== undefined;
};

/**
 * `variant: "chips"` over an array of homogeneous strings, whether or not a
 * finite choice list narrows them. `uniqueItems` is *not* required: without it,
 * repeated tokens are permitted, which is the difference the specification
 * draws between chips and a multi-select.
 */
export const isChipsControl: Tester = (uischema, schema, context) => {
  if (!optionIsVariant(uischema, 'chips')) {
    return false;
  }
  const resolved = arraySchemaAt(
    uischema,
    schema,
    context?.rootSchema ?? schema
  );
  if (resolved?.type !== 'array' || Array.isArray(resolved.items)) {
    return false;
  }
  const items = resolveItemSchema(resolved, context?.rootSchema ?? schema);
  return hasStringItems(items) || arrayChoicesOf(items) !== undefined;
};

/** The current value as an array, without inventing one. */
export const asArrayValue = (data: unknown): unknown[] =>
  Array.isArray(data) ? data : [];

/**
 * Value identity for selection, duplicate prevention and removal.
 *
 * `isEqual` rather than `===` so a structured constant loaded as a different
 * object instance still matches its choice, and rather than `String(value)` so
 * numeric `1` and string `"1"` stay apart - both of which the specification
 * calls out by name.
 */
export const sameChoice = (a: unknown, b: unknown): boolean => isEqual(a, b);

export const isSelected = (values: unknown[], value: unknown): boolean =>
  values.some((entry) => sameChoice(entry, value));

/**
 * Adds a value, appending in interaction order.
 *
 * `unique` refuses a duplicate rather than silently collapsing one, so a
 * `uniqueItems` array cannot be pushed into an invalid state by this control
 * while a free-entry chips field can still repeat a token.
 */
export const addChoice = (
  values: unknown[],
  value: unknown,
  unique: boolean
): unknown[] =>
  unique && isSelected(values, value) ? values : [...values, value];

/**
 * Removes **one occurrence**, identified by position when given.
 *
 * The specification: "in presentations allowing repeated values, removal must
 * identify the intended occurrence", and "a removal request for a value that is
 * no longer present must not change unrelated items" - so a missing target
 * returns the array untouched rather than falling back to an index, which would
 * delete somebody else's value.
 */
export const removeChoiceAt = (values: unknown[], index: number): unknown[] =>
  index < 0 || index >= values.length
    ? values
    : values.filter((_, position) => position !== index);

export const removeChoice = (values: unknown[], value: unknown): unknown[] =>
  removeChoiceAt(
    values,
    values.findIndex((entry) => sameChoice(entry, value))
  );

export interface ArrayChoiceLimits {
  minItems?: number;
  maxItems?: number;
  /** False lets the validator report a breach instead of preventing it. */
  restrict: boolean;
}

export const canAddChoice = (
  values: unknown[],
  { maxItems, restrict }: ArrayChoiceLimits
): boolean => !restrict || maxItems === undefined || values.length < maxItems;

export const canRemoveChoice = (
  values: unknown[],
  { minItems, restrict }: ArrayChoiceLimits
): boolean => !restrict || minItems === undefined || values.length > minItems;
