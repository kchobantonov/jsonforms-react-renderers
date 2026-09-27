import { JsonSchema, JsonSchema7 } from '@jsonforms/core';

/**
 * Rebundles a property's schema so it can stand alone as its own document.
 *
 * An isolated editor gives the property's *value* its own form, which means its
 * own root schema - and that breaks every local `$ref`. A schema saying
 * `{ "$ref": "#/definitions/address" }` resolves against the document it came
 * from; in a form rooted at the value there is no such definition, so the
 * control fails to resolve and renders nothing.
 *
 * So the original root is carried along under
 * `definitions.__jsonforms_root`, and every local reference is rewritten to
 * point into it. `#/definitions/address` becomes
 * `#/definitions/__jsonforms_root/definitions/address`, and a bare `#` becomes
 * `#/definitions/__jsonforms_root`.
 *
 * Only schema *keywords* are walked. `default`, `const` and `enum` hold data,
 * and data is allowed to contain a `$ref` key that means nothing to a
 * validator - rewriting it would corrupt a value.
 */

const SCHEMA_MAPS = new Set([
  'properties',
  'patternProperties',
  'definitions',
  '$defs',
  'dependentSchemas',
]);

const SCHEMA_VALUES = new Set([
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'unevaluatedProperties',
  'unevaluatedItems',
]);

const SCHEMA_ARRAYS = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems']);

const ROOT_POINTER = '#/definitions/__jsonforms_root';

const rewrite = (input: unknown): unknown => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }
  const source = input as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => {
      if (
        key === '$ref' &&
        typeof value === 'string' &&
        (value === '#' || value.startsWith('#/'))
      ) {
        return [key, `${ROOT_POINTER}${value.slice(1)}`];
      }
      if (SCHEMA_MAPS.has(key) || key === 'dependencies') {
        return [
          key,
          Object.fromEntries(
            Object.entries((value ?? {}) as Record<string, unknown>).map(
              ([name, child]) => [name, rewrite(child)]
            )
          ),
        ];
      }
      if (SCHEMA_VALUES.has(key)) {
        return [key, rewrite(value)];
      }
      if (SCHEMA_ARRAYS.has(key) || key === 'items') {
        return [
          key,
          Array.isArray(value) ? value.map(rewrite) : rewrite(value),
        ];
      }
      return [key, value];
    })
  );
};

export const literalPropertySchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema => {
  const root = rewrite(rootSchema) as JsonSchema7;
  // The bundled root is part of this document now, not a separate reference
  // scope, so its own identifier must not follow it in.
  delete root.$id;
  const value = rewrite(schema) as JsonSchema7;
  delete value.$id;
  return {
    ...value,
    definitions: { ...value.definitions, __jsonforms_root: root },
  } as JsonSchema;
};
