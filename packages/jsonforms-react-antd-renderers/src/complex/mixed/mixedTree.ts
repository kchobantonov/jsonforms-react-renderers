import { JsonSchema, resolveSchema } from '@jsonforms/core';

export type MixedTreePath = Array<string | number>;

export interface MixedTreeNode {
  children: MixedTreeNode[];
  data: unknown;
  dynamic: boolean;
  label: string;
  path: MixedTreePath;
  schema: JsonSchema;
  type: string | null;
}

export const mixedPathKey = (path: MixedTreePath) =>
  path.length ? JSON.stringify(path) : '$';

export const mixedDataType = (value: unknown): string | null => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'integer' : 'number';
  return value === undefined ? null : typeof value;
};

const childSchema = (
  schema: JsonSchema,
  key: string | number,
  rootSchema: JsonSchema
): { dynamic: boolean; schema: JsonSchema } => {
  const resolveChild = (candidate: JsonSchema): JsonSchema =>
    typeof candidate === 'object' && candidate.$ref
      ? resolveSchema(rootSchema, candidate.$ref, rootSchema) ?? candidate
      : candidate;
  const resolved =
    typeof schema === 'object' && schema.$ref
      ? resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema
      : schema;
  if (typeof resolved !== 'object') return { dynamic: false, schema: {} };
  if (typeof key === 'number') {
    const items = resolved.items;
    return {
      dynamic: false,
      schema: resolveChild(
        Array.isArray(items)
          ? items[key] ?? {}
          : (items as JsonSchema | undefined) ?? {}
      ),
    };
  }
  if (resolved.properties?.[key]) {
    return {
      dynamic: false,
      schema: resolveChild(resolved.properties[key]),
    };
  }
  const matches = Object.entries(resolved.patternProperties ?? {})
    .filter(([pattern]) => {
      try {
        return new RegExp(pattern).test(key);
      } catch {
        return false;
      }
    })
    .map(([, value]) => resolveChild(value));
  if (matches.length > 1) {
    return { dynamic: true, schema: { allOf: matches } as JsonSchema };
  }
  if (matches.length === 1) {
    return { dynamic: true, schema: matches[0] };
  }
  return {
    dynamic: true,
    schema:
      resolved.additionalProperties === false
        ? {}
        : resolveChild(
            (resolved.additionalProperties as JsonSchema | undefined) ?? {}
          ),
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
  const entries: Array<[string | number, unknown]> = Array.isArray(data)
    ? data.map((value, index) => [index, value])
    : data && typeof data === 'object'
    ? Object.entries(data)
    : [];
  return {
    children: entries.map(([key, value]) => {
      const resolved = childSchema(schema, key, rootSchema);
      return buildMixedTree(
        value,
        resolved.schema,
        rootSchema,
        typeof key === 'number' ? `Item ${key}` : key,
        [...path, key],
        resolved.dynamic
      );
    }),
    data,
    dynamic,
    label,
    path,
    schema,
    type: mixedDataType(data),
  };
};

export const findMixedTreeNode = (
  node: MixedTreeNode,
  path: MixedTreePath
): MixedTreeNode | undefined => {
  if (mixedPathKey(node.path) === mixedPathKey(path)) return node;
  for (const child of node.children) {
    const result = findMixedTreeNode(child, path);
    if (result) return result;
  }
  return undefined;
};

export const mixedTreeLabel = (node: MixedTreeNode) =>
  node.path.length === 0
    ? node.type === 'array'
      ? '[]'
      : node.type === 'object'
      ? '{}'
      : node.label
    : node.label;

const updateMixedParent = (
  data: unknown,
  parentPath: MixedTreePath,
  update: (parent: unknown) => unknown
): unknown => {
  if (parentPath.length === 0) return update(data);
  const [segment, ...remaining] = parentPath;
  if (Array.isArray(data) && typeof segment === 'number') {
    const next = [...data];
    next[segment] = updateMixedParent(next[segment], remaining, update);
    return next;
  }
  if (data && typeof data === 'object' && typeof segment === 'string') {
    const next = { ...(data as Record<string, unknown>) };
    next[segment] = updateMixedParent(next[segment], remaining, update);
    return next;
  }
  return data;
};

export const deleteMixedTreeNode = (
  data: unknown,
  path: MixedTreePath
): unknown => {
  if (path.length === 0) return data;
  const parentPath = path.slice(0, -1);
  const segment = path[path.length - 1];
  return updateMixedParent(data, parentPath, (parent) => {
    if (Array.isArray(parent) && typeof segment === 'number') {
      return parent.filter((_, index) => index !== segment);
    }
    if (parent && typeof parent === 'object' && typeof segment === 'string') {
      return Object.fromEntries(
        Object.entries(parent).filter(([key]) => key !== segment)
      );
    }
    return parent;
  });
};

export const renameMixedTreeNode = (
  data: unknown,
  path: MixedTreePath,
  nextName: string
): unknown => {
  if (path.length === 0) return data;
  const parentPath = path.slice(0, -1);
  const segment = path[path.length - 1];
  if (typeof segment !== 'string') return data;
  return updateMixedParent(data, parentPath, (parent) => {
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) {
      return parent;
    }
    return Object.fromEntries(
      Object.entries(parent).map(([key, value]) => [
        key === segment ? nextName : key,
        value,
      ])
    );
  });
};
