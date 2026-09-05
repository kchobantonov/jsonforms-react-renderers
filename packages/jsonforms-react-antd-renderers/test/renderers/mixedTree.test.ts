import {
  buildMixedTree,
  deleteMixedTreeNode,
  renameMixedTreeNode,
} from '../../src/complex/mixed/mixedTree';

describe('mixed tree mutations', () => {
  it('deletes an array item without changing the original data', () => {
    const data = ['first', { nested: true }, 'last'];

    expect(deleteMixedTreeNode(data, [1])).toEqual(['first', 'last']);
    expect(data).toEqual(['first', { nested: true }, 'last']);
  });

  it('deletes a nested object property without changing its siblings', () => {
    const data = { object: { keep: 1, remove: 2 }, sibling: true };

    expect(deleteMixedTreeNode(data, ['object', 'remove'])).toEqual({
      object: { keep: 1 },
      sibling: true,
    });
  });

  it('renames a nested property while preserving order and value', () => {
    const data = { object: { before: 1, oldName: { value: 2 }, after: 3 } };

    expect(renameMixedTreeNode(data, ['object', 'oldName'], 'newName')).toEqual(
      {
        object: { before: 1, newName: { value: 2 }, after: 3 },
      }
    );
  });

  it('resolves recursive schemas inherited through additionalProperties', () => {
    const rootSchema = {
      $id: 'https://example.com/recursive-schema',
      type: ['object', 'boolean'],
      properties: {
        properties: {
          type: 'object',
          additionalProperties: { $ref: '#' },
        },
      },
    };

    const tree = buildMixedTree(
      { properties: { name: { type: 'string' } } },
      rootSchema,
      rootSchema
    );
    const nameNode = tree.children[0].children[0];

    expect(nameNode.path).toEqual(['properties', 'name']);
    expect(nameNode.schema).toBe(rootSchema);
  });
});
