import { Generate, JsonSchema } from '@jsonforms/core';

/** Temporary workaround for JSON Forms 3.9.0-alpha.1's object-root inference.
 * Upstream fix: https://github.com/eclipsesource/jsonforms/pull/2478
 * Wrapping the value lets core's property inference handle every JSON type.
 *
 * TODO(jsonforms#2478): After upgrading to a released version containing the fix,
 * verify absent data, null, scalar/array roots and data-driven schema regeneration.
 * Then remove this helper and App.tsx's schema override so an omitted schema
 * reaches JsonForms directly. Keep the genericJsonExamples regression tests and
 * update them to exercise the upstream path without this adapter.
 */
export const demoSchema = (
  schema: JsonSchema | undefined,
  data: unknown
): JsonSchema => {
  if (schema !== undefined) return schema;
  if (data === undefined) return {};
  return Generate.jsonSchema({ value: data }).properties!.value;
};
