import { createDefaultValue, type JsonSchema } from '@jsonforms/core';
import {
  ANY_TYPES,
  getSchemaTypes,
  schemaForType,
  type JsonDataType,
} from './mixedSchema';
import type { MixedTreeNode } from './mixedTree';

/** The editor at a selected mixed-tree node, independent of selector widgets. */
export const resolveMixedNodeEditor = (
  node: MixedTreeNode,
  path: string,
  rootSchema: JsonSchema,
) => {
  const isNestedPrimitive =
    node.path.length > 0 &&
    node.type !== 'array' &&
    node.type !== 'object' &&
    node.type !== 'null';
  const nodeSchema = ANY_TYPES.includes(node.type as JsonDataType)
    ? schemaForType(node.schema, node.type as JsonDataType, rootSchema)
    : node.schema;
  const nodePath = [path, ...node.path]
    .filter((segment) => segment !== '')
    .join('.');
  const nodeTypes = getSchemaTypes(node.schema);
  const nodeType =
    node.type && nodeTypes.includes(node.type as JsonDataType)
      ? node.type
      : node.type === 'integer' && nodeTypes.includes('number')
        ? 'number'
        : null;
  return { isNestedPrimitive, nodeSchema, nodePath, nodeTypes, nodeType };
};

export const changeMixedNodeType = (
  node: MixedTreeNode,
  nextType: JsonDataType | undefined,
  nodePath: string,
  rootSchema: JsonSchema,
  handleChange: (path: string, value: unknown) => void,
) => {
  if (!nextType) return;
  const nextSchema = schemaForType(node.schema, nextType, rootSchema);
  handleChange(nodePath, createDefaultValue(nextSchema, rootSchema));
};
