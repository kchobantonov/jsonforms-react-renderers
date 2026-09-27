import { JsonSchema } from '@jsonforms/core';

/**
 * Whether the schema forbids the value being emptied in place - a required
 * property, a minimum size. Ported from the Svelte renderers so `Clear` is
 * offered only where it would produce data the schema still accepts.
 */
export const preventsEmpty = (
  schema: JsonSchema | undefined,
  array: boolean
): boolean => {
  if (!schema) return false;
  if (schema.allOf?.some((part) => preventsEmpty(part, array))) return true;
  if (array) {
    const contains = (schema as JsonSchema & { contains?: unknown }).contains;
    const minContains = (schema as JsonSchema & { minContains?: number })
      .minContains;
    return (schema.minItems ?? 0) > 0 || (!!contains && (minContains ?? 1) > 0);
  }
  return (schema.minProperties ?? 0) > 0 || !!schema.required?.length;
};
