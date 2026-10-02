import { JsonSchema, JsonSchema7 } from '@jsonforms/core';

const valueMatchesType = (value: unknown, type: string): boolean => {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object')
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer')
    return typeof value === 'number' && Number.isInteger(value);
  return typeof value === type;
};

/** Narrow only schemas applying to the current value, never property/item schemas.
 * The budget bounds analysis; unresolved references and conditions stay intact.
 */
export const narrowMixedComposition = (
  schema: JsonSchema,
  type: string,
  budget = { remaining: 256 }
): JsonSchema => {
  if (typeof schema === 'boolean') {
    return schema ? { type: type as JsonSchema7['type'] } : schema;
  }
  if (--budget.remaining < 0) return schema;
  const source = schema as JsonSchema7;
  // Draft-07 ignores siblings of $ref. Do not infer compatibility from them.
  if (source.$ref) return schema;
  const declared = Array.isArray(source.type)
    ? source.type
    : source.type
    ? [source.type]
    : [];
  const compatible =
    declared.length === 0 ||
    declared.some(
      (candidate) =>
        candidate === type ||
        (candidate === 'number' && type === 'integer') ||
        (candidate === 'integer' && type === 'number')
    );
  if (!compatible) return false as unknown as JsonSchema;
  if ('const' in source && !valueMatchesType(source.const, type))
    return false as unknown as JsonSchema;
  const choices = source.enum?.filter((value) => valueMatchesType(value, type));
  if (choices?.length === 0) return false as unknown as JsonSchema;
  const next: JsonSchema7 = {
    ...source,
    ...(choices ? { enum: choices } : {}),
    type: (type === 'number' &&
    declared.includes('integer') &&
    !declared.includes('number')
      ? 'integer'
      : type) as JsonSchema7['type'],
  };
  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = source[keyword];
    if (!branches) continue;
    const narrowed = branches.map((branch) =>
      narrowMixedComposition(branch, type, budget)
    );
    // False alternatives contribute no matches, including to oneOf's count.
    // A false allOf branch must remain: the conjunction is impossible.
    const retained =
      keyword === 'allOf'
        ? narrowed
        : narrowed.filter((branch) => branch !== (false as unknown));
    next[keyword] = retained.length
      ? retained.map((branch) =>
          typeof branch === 'boolean'
            ? { type: type as JsonSchema7['type'], not: {} }
            : (branch as JsonSchema7)
        )
      : [{ type: type as JsonSchema7['type'], not: {} }];
  }
  return next;
};
