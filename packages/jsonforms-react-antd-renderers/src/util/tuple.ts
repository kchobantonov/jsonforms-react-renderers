import {
  JsonSchema,
  RankedTester,
  Resolve,
  extractDefaults,
  isControl,
} from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Positional arrays, with no React in it.
 *
 * Which schemas are tuples, what each position renders, and what value a
 * missing position starts life with are all decidable from the schema alone, so
 * they are settled here and tested without rendering anything.
 */

/**
 * A position's schema. `false` is a real value here - draft-07's
 * `additionalItems: false` and 2020-12's `items: false` both mean "nothing is
 * permitted past the prefix" - so this cannot be narrowed to `JsonSchema`.
 */
export type TupleSchema = JsonSchema | boolean;

export interface TupleDefinition {
  /** One schema per declared position. */
  prefix: TupleSchema[];
  /** What a trailing value past the prefix must satisfy; `false` forbids one. */
  tail: TupleSchema;
}

/** 2020-12 spells the positional list `prefixItems`; the types predate it. */
type PositionalSchema = JsonSchema & { prefixItems?: TupleSchema[] };

/**
 * The declared positions and the tail, or `undefined` when the schema does not
 * describe a tuple at all.
 *
 * **Both dialects are recognized**, which the gap review asks to be declared:
 * draft 2020-12's `prefixItems` + `items`, and draft-07's positional `items` +
 * `additionalItems`. `prefixItems` is checked first, because a 2020-12 schema
 * uses `items` for the *tail* and reading it as the prefix would turn one
 * position into every position.
 *
 * `explicit` is `options.variant === 'tuple'` and unlocks only the third case -
 * a uniform array asked to be presented positionally. A positional schema needs
 * no variant, and per section 18 equal bounds alone must not change how an
 * ordinary uniform array is presented.
 */
export const tupleDefinition = (
  schema: JsonSchema | undefined,
  explicit = false
): TupleDefinition | undefined => {
  const candidate = schema as PositionalSchema | undefined;
  if (candidate?.type !== 'array') {
    return undefined;
  }
  if (Array.isArray(candidate.prefixItems)) {
    return {
      prefix: candidate.prefixItems,
      tail: (candidate.items ?? true) as TupleSchema,
    };
  }
  if (Array.isArray(candidate.items)) {
    return {
      prefix: candidate.items as TupleSchema[],
      tail: (candidate.additionalItems ?? true) as TupleSchema,
    };
  }
  const { minItems, maxItems } = candidate;
  if (
    explicit &&
    Number.isInteger(minItems) &&
    (minItems as number) >= 0 &&
    minItems === maxItems
  ) {
    return {
      // The shared item schema, repeated. The count comes from the bounds, so
      // the tail is closed: a uniform tuple has exactly as many positions as it
      // declares.
      prefix: Array.from(
        { length: minItems as number },
        () => (candidate.items ?? true) as TupleSchema
      ),
      tail: false,
    };
  }
  return undefined;
};

/**
 * Rank 25, above the mixed control at 20 and every array renderer below it.
 *
 * It deliberately also claims a control that merely *asks* for `variant:
 * "tuple"` without a schema that can support one. Section 18 calls that an
 * "unsupported configuration" and says to "report a configuration diagnostic
 * rather than guessing a positional count" - which is only possible if this
 * renderer wins and explains itself. Falling through would render an ordinary
 * array control and silently ignore the request.
 */
export const tupleControlTester: RankedTester = (uischema, schema, context) => {
  if (!isControl(uischema)) {
    return -1;
  }
  const resolved = Resolve.schema(
    schema,
    uischema.scope,
    context?.rootSchema ?? schema
  );
  const explicit = uischema.options?.variant === 'tuple';
  return explicit || (resolved && tupleDefinition(resolved)) ? 25 : -1;
};

/** Follows a `$ref` on a positional schema, leaving anything else alone. */
export const resolveTupleSchema = (
  schema: TupleSchema,
  root: JsonSchema
): TupleSchema =>
  typeof schema === 'object' && schema.$ref
    ? Resolve.schema(root, schema.$ref, root) ?? schema
    : schema;

/**
 * What a position holds when an edit further along the array forces it into
 * existence - the shared **Array Add-item initialization** contract.
 *
 * `undefined` means the schema gives no unambiguous answer. That is not a
 * failure to handle: section 18 says to "retain the edit as a local draft and
 * identify the position needing input rather than inventing a type or null
 * value", so the caller reports which position is blocking instead of filling
 * it with a guess.
 */
export const tupleInitialValue = (
  schema: TupleSchema,
  root: JsonSchema
): unknown => {
  const resolved = resolveTupleSchema(schema, root);
  if (typeof resolved !== 'object') {
    return undefined;
  }
  if (resolved.default !== undefined) {
    // Deep-copied, so two positions sharing one schema cannot end up sharing
    // the object the schema author wrote.
    return cloneDeep(resolved.default);
  }
  switch (resolved.type) {
    case 'string':
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array':
      return [];
    case 'object':
      return extractDefaults(resolved, root);
    default:
      // A union, an unconstrained schema, or a combinator: no single supported
      // type, so no initial value.
      return undefined;
  }
};

/**
 * The value a *cleared* position keeps, which is not the same question as
 * {@link tupleInitialValue}.
 *
 * Section 18: "absence and emptiness are distinct" and clearing "must never
 * splice the array, shift later positions, or write undefined into it".
 * Clearing a string leaves `""`; clearing a number has no natural empty value,
 * so this returns `undefined` and the caller keeps the edit as a draft rather
 * than silently writing `0` or `null`.
 */
export const tupleEmptyValue = (
  schema: TupleSchema,
  root: JsonSchema
): unknown => {
  const resolved = resolveTupleSchema(schema, root);
  if (typeof resolved !== 'object') {
    return undefined;
  }
  if (resolved.type === 'string') return '';
  if (resolved.type === 'array') return [];
  if (resolved.type === 'object') return {};
  if (
    resolved.type === 'null' ||
    (Array.isArray(resolved.type) && resolved.type.includes('null'))
  ) {
    return null;
  }
  return undefined;
};

/** Every JSON type, for a position the schema does not constrain. */
export const UNCONSTRAINED_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
];

/**
 * The schema to hand a delegated renderer.
 *
 * An unconstrained tail - `true`, or `{}` - carries no type, and JSON Forms
 * would find no renderer for it. Section 18 says such a tail uses "the mixed
 * renderer with type selection", and the way to ask for that renderer is a
 * schema naming every type.
 */
export const tupleRenderSchema = (schema: TupleSchema): JsonSchema => {
  if (
    schema === true ||
    (typeof schema === 'object' && Object.keys(schema).length === 0)
  ) {
    return { type: UNCONSTRAINED_TYPES } as JsonSchema;
  }
  return schema as JsonSchema;
};

/** Whether a position is edited through a summary and a dialog. */
export const isComplexTupleSchema = (schema: TupleSchema): boolean =>
  typeof schema === 'object' &&
  (schema.type === 'object' || schema.type === 'array');

/**
 * Whether a position draws its own label above the delegated editor.
 *
 * A scalar control renders its own `Form.Item` label, so labelling it here too
 * would print the name twice. A complex position shows a summary rather than a
 * control, a forbidden position shows a message, and a mixed position's own
 * label belongs to the type selector - all three need the label supplied.
 */
export const tupleFieldOwnsLabel = (schema: TupleSchema): boolean => {
  if (schema === false || isComplexTupleSchema(schema)) {
    return true;
  }
  const rendered = tupleRenderSchema(schema);
  return !rendered.type || Array.isArray(rendered.type);
};
