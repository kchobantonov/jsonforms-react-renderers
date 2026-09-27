import { JsonSchema } from '@jsonforms/core';

/**
 * JSON Schema 7 permits a boolean sub-schema - `items: true` means "any item is
 * allowed". @jsonforms/core's `JsonSchema` type models `items` as an object
 * schema only, so fixtures exercising that form need an assertion.
 *
 * Keeping it here confines the one unsound cast to a single documented place;
 * call sites stay fully type-checked against the shape below.
 */
export const booleanItemsSchema = (schema: {
  type: string | string[];
  items?: boolean;
  [key: string]: unknown;
}): JsonSchema => schema as unknown as JsonSchema;
