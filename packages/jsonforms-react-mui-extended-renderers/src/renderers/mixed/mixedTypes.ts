import {
  ControlElement,
  createControlElement,
  createDefaultValue,
  findUISchema,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
} from '@jsonforms/core';

export type JsonDataType =
  | 'array'
  | 'boolean'
  | 'integer'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

export type MixedTreePath = Array<string | number>;

export interface MixedTreeNode {
  children: MixedTreeNode[];
  data: unknown;
  dynamic: boolean;
  label: string;
  path: MixedTreePath;
  schema: JsonSchema;
  type: JsonDataType | null;
}

export const mixedTreeNodeLabel = (node: MixedTreeNode) => {
  if (node.path.length > 0) return node.label;
  if (node.type === 'array') return '[]';
  if (node.type === 'object') return '{}';
  return node.label;
};

export const ANY_TYPES: JsonDataType[] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

const JSON_TYPES = new Set<JsonDataType>(ANY_TYPES);

const ARRAY_KEYWORDS = [
  'contains',
  'items',
  'maxContains',
  'maxItems',
  'minContains',
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

const removeKeywords = (schema: JsonSchema7, keywords: readonly string[]) => {
  keywords.forEach(
    (keyword) => delete (schema as Record<string, unknown>)[keyword]
  );
};

export const getJsonDataType = (value: unknown): JsonDataType | null => {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (value !== undefined && typeof value === 'object') return 'object';
  return null;
};

export const getSchemaTypes = (schema: JsonSchema): JsonDataType[] => {
  if ((schema as unknown) === true) return ANY_TYPES;
  if (!schema || typeof schema !== 'object') return [];
  const declared = Array.isArray(schema.type)
    ? schema.type
    : typeof schema.type === 'string'
    ? [schema.type]
    : ANY_TYPES;
  return declared.filter(
    (type, index): type is JsonDataType =>
      JSON_TYPES.has(type as JsonDataType) && declared.indexOf(type) === index
  );
};

export const selectedTypeForData = (
  data: unknown,
  types: JsonDataType[]
): JsonDataType | null => {
  const actual = getJsonDataType(data);
  if (!actual) return null;
  if (types.includes(actual)) return actual;
  if (actual === 'integer' && types.includes('number')) return 'number';
  return null;
};

export const schemaForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema
): JsonSchema => {
  const next = {
    ...(schema && typeof schema === 'object' ? schema : {}),
    type,
  } as unknown as JsonSchema7;
  delete next.anyOf;
  delete next.oneOf;
  delete next.allOf;

  if (type !== 'array') removeKeywords(next, ARRAY_KEYWORDS);
  if (type !== 'object') removeKeywords(next, OBJECT_KEYWORDS);
  if (type !== 'string') removeKeywords(next, STRING_KEYWORDS);
  if (type !== 'integer' && type !== 'number') {
    removeKeywords(next, NUMBER_KEYWORDS);
  }

  if (type === 'object' && next.additionalProperties === undefined) {
    next.additionalProperties = true;
  }
  if (type === 'array') {
    const items = next.items;
    next.items = (
      items && typeof items === 'object' && !Array.isArray(items) && items.$ref
        ? resolveSchema(rootSchema, items.$ref, rootSchema) ?? items
        : items ?? ({ type: ANY_TYPES } as JsonSchema7)
    ) as JsonSchema7 | JsonSchema7[];
  }
  return next;
};

export const defaultValueForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema
) => createDefaultValue(schemaForType(schema, type, rootSchema), rootSchema);

export const findMixedDetailUiSchema = (
  schema: JsonSchema,
  type: JsonDataType,
  uischema: ControlElement,
  path: string,
  rootSchema: JsonSchema,
  uischemas: JsonFormsUISchemaRegistryEntry[]
) =>
  findUISchema(
    uischemas,
    schema,
    uischema.scope,
    path,
    () => createControlElement('#'),
    {
      ...uischema,
      options: { ...uischema.options, detail: `${type}-detail` },
    },
    rootSchema
  );

const resolveChildSchema = (
  schema: JsonSchema,
  key: string | number,
  rootSchema: JsonSchema
): { dynamic: boolean; schema: JsonSchema } => {
  const resolved =
    schema && typeof schema === 'object' && schema.$ref
      ? resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema
      : schema;
  if (!resolved || typeof resolved !== 'object') {
    return { dynamic: typeof key === 'string', schema: {} };
  }
  if (typeof key === 'number') {
    const items = resolved.items;
    if (Array.isArray(items))
      return { dynamic: false, schema: items[key] ?? {} };
    return {
      dynamic: false,
      schema: (items as JsonSchema | undefined) ?? {},
    };
  }
  if (resolved.properties?.[key]) {
    return { dynamic: false, schema: resolved.properties[key] };
  }
  const matching = Object.entries(resolved.patternProperties ?? {})
    .filter(([pattern]) => {
      try {
        return new RegExp(pattern).test(key);
      } catch {
        return false;
      }
    })
    .map(([, child]) => child);
  if (matching.length > 1) {
    return { dynamic: true, schema: { allOf: matching } };
  }
  if (matching.length === 1) return { dynamic: true, schema: matching[0] };
  return {
    dynamic: true,
    schema:
      resolved.additionalProperties === false
        ? ({} as JsonSchema)
        : (resolved.additionalProperties as JsonSchema | undefined) ?? {},
  };
};

export const buildMixedTree = (
  data: unknown,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  label = 'Value',
  path: MixedTreePath = [],
  dynamic = false
): MixedTreeNode => {
  const type = getJsonDataType(data);
  const entries: Array<[string | number, unknown]> = Array.isArray(data)
    ? data.map((value, index) => [index, value])
    : data && typeof data === 'object'
    ? Object.entries(data)
    : [];
  return {
    children: entries.map(([key, value]) => {
      const child = resolveChildSchema(schema, key, rootSchema);
      return buildMixedTree(
        value,
        child.schema,
        rootSchema,
        typeof key === 'number' ? `Item ${key}` : key,
        [...path, key],
        child.dynamic
      );
    }),
    data,
    dynamic,
    label,
    path,
    schema,
    type,
  };
};

export const pathKey = (path: MixedTreePath) =>
  path.length === 0 ? '$' : JSON.stringify(path);

export const getAtMixedPath = (data: unknown, path: MixedTreePath): unknown =>
  path.reduce<any>((value, segment) => value?.[segment], data);

export const replaceAtMixedPath = (
  data: unknown,
  path: MixedTreePath,
  replacement: unknown
): unknown => {
  if (path.length === 0) return replacement;
  const [head, ...tail] = path;
  const clone: any = Array.isArray(data) ? [...data] : { ...(data as object) };
  clone[head] = replaceAtMixedPath(clone[head], tail, replacement);
  return clone;
};

export const deleteAtMixedPath = (data: unknown, path: MixedTreePath) => {
  const parentPath = path.slice(0, -1);
  const key = path[path.length - 1];
  const parent = getAtMixedPath(data, parentPath);
  const clone: any = Array.isArray(parent)
    ? [...parent]
    : { ...(parent as object) };
  if (Array.isArray(clone)) clone.splice(key as number, 1);
  else delete clone[key];
  return replaceAtMixedPath(data, parentPath, clone);
};

export const renameAtMixedPath = (
  data: unknown,
  path: MixedTreePath,
  nextName: string
) => {
  const parentPath = path.slice(0, -1);
  const oldName = path[path.length - 1] as string;
  const parent = getAtMixedPath(data, parentPath) as Record<string, unknown>;
  const renamed = Object.fromEntries(
    Object.entries(parent).map(([key, value]) => [
      key === oldName ? nextName : key,
      value,
    ])
  );
  return replaceAtMixedPath(data, parentPath, renamed);
};
