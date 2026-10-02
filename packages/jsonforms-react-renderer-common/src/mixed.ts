import {
  JsonSchema,
  JsonSchema7,
  UISchemaElement,
  Scopable,
  TesterContext,
  isControl,
  resolveSchema,
  rankWith,
  RankedTester,
} from '@jsonforms/core';
import get from 'lodash/get';
import { narrowMixedComposition } from './mixedComposition';
export type JsonDataType =
  | 'array'
  | 'boolean'
  | 'integer'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

export const ANY_TYPES: JsonDataType[] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

const ARRAY_KEYWORDS = [
  'items',
  'maxItems',
  'minItems',
  'uniqueItems',
] as const;
const OBJECT_KEYWORDS = [
  'additionalProperties',
  'dependencies',
  'dependentRequired',
  'dependentSchemas',
  'maxProperties',
  'minProperties',
  'patternProperties',
  'properties',
  'propertyNames',
  'required',
] as const;
const STRING_KEYWORDS = [
  'contentEncoding',
  'contentMediaType',
  'format',
  'maxLength',
  'minLength',
  'pattern',
] as const;
const NUMBER_KEYWORDS = [
  'exclusiveMaximum',
  'exclusiveMinimum',
  'maximum',
  'minimum',
  'multipleOf',
] as const;

const removeKeywords = (schema: JsonSchema7, keywords: readonly string[]) =>
  keywords.forEach(
    (keyword) => delete (schema as Record<string, unknown>)[keyword]
  );

export const getJsonDataType = (value: any): JsonDataType | null => {
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return 'object';
  }

  return null;
};

export const getSchemaTypes = (schema: JsonSchema): JsonDataType[] => {
  if (typeof schema !== 'object') {
    return ANY_TYPES;
  }

  if (typeof schema.type === 'string') {
    return [schema.type as JsonDataType];
  }

  if (Array.isArray(schema.type)) {
    return schema.type as JsonDataType[];
  }

  return ANY_TYPES;
};

export const schemaForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema
): JsonSchema => {
  const narrowed = narrowMixedComposition(schema, type);
  const nextSchema: JsonSchema7 = {
    ...(typeof narrowed === 'object' ? (narrowed as JsonSchema7) : {}),
    ...(narrowed === (false as unknown) ? { not: {} } : {}),
    type: typeof narrowed === 'object' ? narrowed.type ?? type : type,
  };
  if (type !== 'array') removeKeywords(nextSchema, ARRAY_KEYWORDS);
  if (type !== 'object') removeKeywords(nextSchema, OBJECT_KEYWORDS);
  if (type !== 'string') removeKeywords(nextSchema, STRING_KEYWORDS);
  if (type !== 'integer' && type !== 'number') {
    removeKeywords(nextSchema, NUMBER_KEYWORDS);
  }
  if (nextSchema.default !== undefined) {
    const defaultType = getJsonDataType(nextSchema.default);
    const compatibleDefault =
      defaultType === type || (type === 'number' && defaultType === 'integer');
    if (!compatibleDefault) delete nextSchema.default;
  }

  if (type === 'object') {
    nextSchema.additionalProperties =
      nextSchema.additionalProperties !== false
        ? nextSchema.additionalProperties ?? true
        : false;
  } else if (type === 'array') {
    const items =
      typeof nextSchema.items === 'object' &&
      typeof (nextSchema.items as JsonSchema).$ref === 'string'
        ? resolveSchema(
            rootSchema,
            (nextSchema.items as JsonSchema).$ref,
            rootSchema
          ) ?? nextSchema.items
        : nextSchema.items;
    nextSchema.items =
      items !== undefined
        ? (items as JsonSchema7 | JsonSchema7[])
        : { type: ANY_TYPES as JsonSchema7['type'] };
  }

  return nextSchema;
};

/**
 * Whether the value at `path` is an element of an array.
 *
 * Read from the data rather than from the schema, because it is the data's
 * shape that decides what unsetting the path will do: core deletes an array
 * element in place and leaves a hole, whatever the schema says the container
 * ought to be.
 */
export const isArrayElementPath = (data: unknown, path: string): boolean => {
  if (!path) {
    return false;
  }
  const separator = path.lastIndexOf('.');
  const parent =
    separator < 0 ? data : get(data, path.slice(0, separator).split('.'));
  return Array.isArray(parent);
};

/**
 * The schema this control actually edits.
 *
 * A tester is handed the schema of the dispatch it sits in, which at the top of
 * a form is the **root** - so a Control scoped at `#/properties/setting` is
 * asked about the whole document, not about `setting`. The specification is
 * explicit that selection is on "a Control with a **resolved** schema whose
 * type is an array of permitted JSON types", so the scope is resolved first.
 *
 * Without this, a declared property with a union type never matched: the root
 * carries `properties`, which the checks below reject, and the field fell
 * through to the plain text control. A `["string", "number"]` property became a
 * text box, and a number typed into it was stored as a string.
 */
const resolveScopedSchema = (
  uischema: UISchemaElement & Scopable,
  schema: JsonSchema,
  context: TesterContext
): JsonSchema => {
  const scope = uischema?.scope;
  if (!scope) {
    return schema;
  }
  try {
    return (
      (resolveSchema(schema, scope, context?.rootSchema ?? schema) as
        | JsonSchema
        | undefined) ?? schema
    );
  } catch {
    // An unresolvable scope is not this tester's problem to report.
    return schema;
  }
};

export const isMixedSchema = (
  uischema: UISchemaElement & Scopable,
  rawSchema: JsonSchema,
  context: TesterContext
) => {
  if (rawSchema && typeof rawSchema === 'boolean') {
    return true;
  }

  if (!rawSchema || typeof rawSchema !== 'object') {
    return false;
  }

  const schema = resolveScopedSchema(uischema, rawSchema, context);

  if (typeof schema === 'boolean') {
    return Boolean(schema);
  }

  if (Array.isArray(schema.type)) {
    return schema.type.length > 1;
  }

  if (
    schema.allOf ||
    schema.anyOf ||
    schema.oneOf ||
    schema.properties ||
    schema.patternProperties ||
    schema.additionalProperties !== undefined
  ) {
    return false;
  }

  // An unconstrained schema: the specification admits it to this renderer, and
  // nothing else would know what editor to offer.
  if (schema.type === undefined && isControl(uischema)) {
    return true;
  }

  return false;
};

const isDefaultGeneratedUiSchema = (uischema: UISchemaElement): boolean => {
  const elements = (uischema as any)?.elements;
  return (
    (uischema.type === 'VerticalLayout' || uischema.type === 'Group') &&
    Array.isArray(elements) &&
    elements.length === 1 &&
    elements[0].scope === '#' &&
    elements[0].type === 'Control'
  );
};

export const isMixedControl = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext
) =>
  isMixedSchema(uischema as UISchemaElement & Scopable, schema, context) &&
  (isControl(uischema) || isDefaultGeneratedUiSchema(uischema));

export const mixedControlTester: RankedTester = rankWith(20, isMixedControl);
