import { createDefaultValue, JsonSchema } from '@jsonforms/core';

export const PRESERVE_DYNAMIC_PROPERTY_OPTION =
  'preserveDynamicPropertyKey' as const;

export const clearedDynamicPropertyValue = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): unknown => createDefaultValue(schema, rootSchema);
