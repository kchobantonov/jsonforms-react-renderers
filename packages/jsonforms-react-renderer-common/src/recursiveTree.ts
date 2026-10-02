import { JsonSchema, resolveSchema } from '@jsonforms/core';
import { discriminatorBranch } from './discriminatorBranch';
import { MixedTreeNode, MixedTreePath, findMixedTreeNode } from './mixedTree';

/** Project a recursive collection onto domain nodes, without expanding schemas. */
export const buildRecursiveTree = (
  data: any,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  childrenProperty: string,
  labelProperty: string,
  fallback: string,
  path: MixedTreePath = []
): MixedTreeNode => {
  const resolved = schema.$ref
    ? resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema
    : schema;
  const branch = recursiveNodeSchema(schema, rootSchema, data);
  const collection = branch.properties?.[childrenProperty];
  const arraySchema = collection?.$ref
    ? resolveSchema(rootSchema, collection.$ref, rootSchema)
    : collection;
  const children = Array.isArray(data?.[childrenProperty])
    ? data[childrenProperty]
    : [];
  const name = data?.[labelProperty];
  return {
    label: typeof name === 'string' && name.trim() ? name : fallback,
    named: true,
    path,
    data,
    schema: resolved,
    type: 'object',
    dynamic: false,
    children: children.map((child: unknown, index: number) => {
      const items = arraySchema?.items;
      const childSchema = Array.isArray(items) ? items[index] : items;
      return buildRecursiveTree(
        child,
        (childSchema || resolved) as JsonSchema,
        rootSchema,
        childrenProperty,
        labelProperty,
        String(index + 1),
        [...path, childrenProperty, index]
      );
    }),
  };
};

/** After removal, choose the closest remaining ancestor rather than a sibling
 * that happens to occupy the removed item's index. */
export const recursiveTreeSelection = (
  tree: MixedTreeNode,
  previous: MixedTreeNode,
  previousTree: MixedTreeNode
): MixedTreeNode => {
  const identity = (node: MixedTreeNode): MixedTreeNode | undefined =>
    node.data === previous.data
      ? node
      : node.children.map(identity).find(Boolean);
  const retained = identity(tree);
  if (retained) return retained;
  const oldParent = recursiveTreeParent(previousTree, previous.path);
  const parent = recursiveTreeParent(tree, previous.path);
  if (
    previous.path.length &&
    parent.children.length < oldParent.children.length
  )
    return parent;
  const current = findMixedTreeNode(tree, previous.path);
  // Immutable field edits replace a node, but leave its containing list length intact.
  return current ?? recursiveTreeParent(tree, previous.path);
};
export const recursiveTreeParent = (
  tree: MixedTreeNode,
  path: MixedTreePath
): MixedTreeNode => {
  for (let length = path.length - 2; length >= 0; length -= 2) {
    const parent = findMixedTreeNode(tree, path.slice(0, length));
    if (parent) return parent;
  }
  return tree;
};

export const recursiveNodeSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  data: unknown
): JsonSchema => {
  const resolved = schema.$ref
    ? resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema
    : schema;
  let branch = resolved;
  for (const keyword of ['oneOf', 'anyOf'] as const) {
    const index = discriminatorBranch(resolved, rootSchema, keyword, data);
    if (index !== undefined) {
      const candidate = resolved[keyword]![index];
      branch = candidate.$ref
        ? resolveSchema(rootSchema, candidate.$ref, rootSchema) ?? candidate
        : candidate;
    }
  }
  return branch;
};
