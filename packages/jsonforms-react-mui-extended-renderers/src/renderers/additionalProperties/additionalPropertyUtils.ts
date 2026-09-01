import {
  composePaths,
  createControlElement,
  createDefaultValue,
  Generate,
  GroupLayout,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
  UISchemaElement,
} from '@jsonforms/core';

export const ANY_JSON_TYPE: JsonSchema7['type'] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

export interface MuiAdditionalPropertyItem {
  path: string;
  propertyName: string;
  schema: JsonSchema;
  uischema: UISchemaElement;
}

export const toObjectSchema = (schema: JsonSchema): JsonSchema7 =>
  schema && typeof schema === 'object' ? (schema as JsonSchema7) : {};

const resolveReferencedSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema => {
  if (schema && typeof schema === 'object' && schema.$ref) {
    return resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema;
  }
  return schema;
};

export const hasDynamicPropertySchema = (schema: JsonSchema) => {
  const objectSchema = toObjectSchema(schema);
  return (
    Object.keys(objectSchema.patternProperties ?? {}).length > 0 ||
    objectSchema.additionalProperties === true ||
    typeof objectSchema.additionalProperties === 'object'
  );
};

export const getDynamicPropertySchema = (
  propertyName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean,
  existing: boolean
): JsonSchema | undefined => {
  const objectSchema = toObjectSchema(parentSchema);
  if (objectSchema.properties?.[propertyName]) return undefined;

  const matching = Object.entries(objectSchema.patternProperties ?? {})
    .filter(([pattern]) => {
      try {
        return new RegExp(pattern).test(propertyName);
      } catch {
        return false;
      }
    })
    .map(([, childSchema]) => resolveReferencedSchema(childSchema, rootSchema));

  let propertySchema: JsonSchema | undefined;
  if (matching.length > 1) {
    propertySchema = { allOf: matching as JsonSchema7[] };
  } else if (matching.length === 1) propertySchema = matching[0];
  else if (objectSchema.additionalProperties === true) propertySchema = {};
  else if (typeof objectSchema.additionalProperties === 'object') {
    propertySchema = resolveReferencedSchema(
      objectSchema.additionalProperties,
      rootSchema
    );
  } else if (
    existing ||
    (objectSchema.additionalProperties === undefined && allowIfMissing)
  ) {
    propertySchema = {};
  }

  if (!propertySchema) return undefined;
  const resolved = toObjectSchema(propertySchema);
  const normalized: JsonSchema7 = {
    ...resolved,
    title: propertyName,
  };
  if (
    normalized.type === undefined &&
    !normalized.allOf &&
    !normalized.anyOf &&
    !normalized.oneOf
  ) {
    normalized.type = ANY_JSON_TYPE;
  }
  if (
    normalized.type === 'object' &&
    normalized.additionalProperties === undefined
  ) {
    normalized.additionalProperties = true;
  }
  if (normalized.type === 'array' && normalized.items === undefined) {
    normalized.items = {};
  }
  return normalized;
};

export const createAdditionalPropertyItem = (
  propertyName: string,
  parentPath: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean,
  existing: boolean
): MuiAdditionalPropertyItem | undefined => {
  const propertySchema = getDynamicPropertySchema(
    propertyName,
    parentSchema,
    rootSchema,
    allowIfMissing,
    existing
  );
  if (!propertySchema) return undefined;
  let propertyUiSchema: UISchemaElement = createControlElement('#');
  if (toObjectSchema(propertySchema).type === 'array') {
    propertyUiSchema = Generate.uiSchema(
      propertySchema,
      'Group',
      undefined,
      rootSchema
    );
    (propertyUiSchema as GroupLayout).label = propertyName;
  }
  return {
    path: composePaths(parentPath, propertyName),
    propertyName,
    schema: propertySchema,
    uischema: propertyUiSchema,
  };
};

export const defaultAdditionalPropertyValue = (
  item: MuiAdditionalPropertyItem,
  rootSchema: JsonSchema
) => createDefaultValue(item.schema, rootSchema);

export const renameObjectProperty = (
  data: Record<string, unknown>,
  oldName: string,
  newName: string
) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key === oldName ? newName : key,
      value,
    ])
  );

export const isJsonFormsSafePropertyName = (name: string) =>
  !name.includes('.') && !name.includes('[') && !name.includes(']');

export const resolvePropertyNamesSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema | undefined => {
  const propertyNames = toObjectSchema(schema).propertyNames as
    | JsonSchema
    | undefined;
  return propertyNames
    ? resolveReferencedSchema(propertyNames, rootSchema)
    : undefined;
};

export const matchesAllowedPattern = (name: string, schema: JsonSchema) => {
  const objectSchema = toObjectSchema(schema);
  const patterns = Object.keys(objectSchema.patternProperties ?? {});
  if (objectSchema.additionalProperties !== false) return true;
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(name);
    } catch {
      return false;
    }
  });
};
