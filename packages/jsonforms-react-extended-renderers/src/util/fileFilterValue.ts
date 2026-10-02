import { JsonSchema, Resolve } from '@jsonforms/core';
import {
  attachmentName,
  fileItemSchema,
  isFileString,
} from '@chobantonov/jsonforms-react-renderer-common/FileArrayInput';

/** Undefined means this is not a file column; nameless files have no search text. */
export const fileFilterValue = (
  value: unknown,
  schema: JsonSchema,
  rootSchema: JsonSchema
): string | undefined => {
  const resolved = schema.$ref
    ? Resolve.schema(rootSchema, schema.$ref, rootSchema)
    : schema;
  if (!resolved) return undefined;
  if (isFileString(resolved)) return attachmentName(value) ?? '';
  if (fileItemSchema(resolved, rootSchema)) {
    return Array.isArray(value)
      ? value
          .map((item) => attachmentName(item) ?? '')
          .filter(Boolean)
          .join(' ')
      : '';
  }
  return undefined;
};
