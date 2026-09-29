import {
  composePaths,
  createControlElement,
  Generate,
  GroupLayout,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
  UISchemaElement,
} from '@jsonforms/core';
const ANY_TYPE: JsonSchema7['type'] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

export type AdditionalPropertyItem = {
  propertyName: string;
  path: string;
  schema: JsonSchema;
  uischema: UISchemaElement;
};

export const toObjectSchema = (schema: JsonSchema): JsonSchema7 =>
  typeof schema === 'object' ? (schema as JsonSchema7) : {};

export const hasAdditionalProperties = (schema: JsonSchema): boolean => {
  const objectSchema = toObjectSchema(schema);
  return (
    Boolean(
      objectSchema.patternProperties &&
        Object.keys(objectSchema.patternProperties).length > 0
    ) ||
    typeof objectSchema.additionalProperties === 'object' ||
    objectSchema.additionalProperties === true
  );
};

export const getMatchingAdditionalPropertySchema = (
  propName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): JsonSchema => {
  const objectSchema = toObjectSchema(parentSchema);
  let propSchema: JsonSchema | undefined;

  if (objectSchema.patternProperties) {
    const matchingSchemas = Object.entries(objectSchema.patternProperties)
      .filter(([pattern]) => new RegExp(pattern).test(propName))
      .map(([, candidate]) => candidate);
    if (matchingSchemas.length === 1) propSchema = matchingSchemas[0];
    if (matchingSchemas.length > 1) propSchema = { allOf: matchingSchemas };
  }

  if (
    !propSchema &&
    (typeof objectSchema.additionalProperties === 'object' ||
      objectSchema.additionalProperties === true)
  ) {
    propSchema =
      objectSchema.additionalProperties === true
        ? { type: ANY_TYPE }
        : objectSchema.additionalProperties;
  }

  if (!propSchema && allowIfMissing) {
    propSchema = { type: ANY_TYPE };
  }

  if (typeof propSchema === 'object' && typeof propSchema.$ref === 'string') {
    propSchema = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
  }

  propSchema = propSchema ?? { type: ANY_TYPE };

  if (typeof propSchema === 'object' && propSchema.type === undefined) {
    propSchema = {
      ...propSchema,
      type: ANY_TYPE,
    };
  }

  return propSchema;
};

export const toAdditionalPropertyItem = (
  propName: string,
  parentPath: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): AdditionalPropertyItem => {
  let propSchema = getMatchingAdditionalPropertySchema(
    propName,
    parentSchema,
    rootSchema,
    allowIfMissing
  );
  let propUiSchema: UISchemaElement = createControlElement('#');

  if (typeof propSchema === 'object' && propSchema.type === 'array') {
    propUiSchema = Generate.uiSchema(
      propSchema,
      'Group',
      undefined,
      rootSchema
    );
    (propUiSchema as GroupLayout).label = propSchema.title ?? propName;
  }

  if (typeof propSchema === 'object') {
    propSchema = {
      ...propSchema,
      title: propName,
    };

    if (propSchema.type === 'object') {
      propSchema.additionalProperties =
        propSchema.additionalProperties !== false
          ? propSchema.additionalProperties ?? true
          : false;
    } else if (propSchema.type === 'array') {
      propSchema.items = propSchema.items ?? {};
    }
  }

  return {
    propertyName: propName,
    path: composePaths(parentPath, propName),
    schema: propSchema,
    uischema: propUiSchema,
  };
};
