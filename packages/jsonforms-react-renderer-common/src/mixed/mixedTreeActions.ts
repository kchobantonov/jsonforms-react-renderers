import type { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { ANY_TYPES, schemaForType, type JsonDataType } from './mixedSchema';
import { findMixedTreeNode, type MixedTreeNode } from './mixedTree';

export const mixedParentNode = (
  tree: MixedTreeNode | undefined,
  node: MixedTreeNode,
) => (tree ? findMixedTreeNode(tree, node.path.slice(0, -1)) : undefined);

/** Respect collection bounds, required properties and renderer permissions. */
export const canDeleteMixedTreeNode = (
  tree: MixedTreeNode | undefined,
  node: MixedTreeNode,
  rootSchema: JsonSchema,
  enabled: boolean,
  readonly: boolean | undefined,
  restrict: boolean,
) => {
  if (!enabled || readonly || node.path.length === 0) return false;
  const parent = mixedParentNode(tree, node);
  if (!parent) return false;
  if (!restrict) return true;
  const parentSchema = ANY_TYPES.includes(parent.type as JsonDataType)
    ? (schemaForType(
        parent.schema,
        parent.type as JsonDataType,
        rootSchema,
      ) as JsonSchema7)
    : (parent.schema as JsonSchema7);
  if (Array.isArray(parent.data)) {
    return (
      parentSchema.minItems === undefined ||
      parent.data.length > parentSchema.minItems
    );
  }
  const key = node.path[node.path.length - 1];
  if (
    !parent.data ||
    typeof parent.data !== 'object' ||
    typeof key !== 'string'
  )
    return false;
  if (parentSchema.required?.includes(key)) return false;
  return (
    parentSchema.minProperties === undefined ||
    Object.keys(parent.data).length > parentSchema.minProperties
  );
};

export const canRenameMixedTreeNode = (
  node: MixedTreeNode,
  enabled: boolean,
  readonly: boolean | undefined,
) =>
  Boolean(
    enabled &&
    !readonly &&
    node.dynamic &&
    typeof node.path[node.path.length - 1] === 'string',
  );
