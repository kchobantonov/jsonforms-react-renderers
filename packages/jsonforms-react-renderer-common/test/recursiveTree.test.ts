import { describe, expect, it } from 'vitest';
import {
  buildRecursiveTree,
  recursiveTreeSelection,
} from '../src/recursiveTree';
const schema: any = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    children: { type: 'array', items: { $ref: '#' } },
  },
};
const build = (data: any) =>
  buildRecursiveTree(data, schema, schema, 'children', 'name', 'Root');
describe('recursive node projection', () => {
  it('walks finite data through recursive references, omitting scalar and array entries', () => {
    const tree = build({
      name: 'Root',
      children: [{ name: 'Folder', children: [{ name: 'Leaf' }] }],
    });
    expect(tree.children.map((n) => n.label)).toEqual(['Folder']);
    expect(tree.children[0].children[0].path).toEqual([
      'children',
      0,
      'children',
      0,
    ]);
    expect(tree.children[0].children[0].schema).toEqual(schema);
  });
  it('keeps a selected node when an earlier sibling is deleted or nodes are reordered', () => {
    const a = { name: 'a' },
      b = { name: 'b' },
      c = { name: 'c' };
    const before = build({ children: [a, b, c] });
    const after = build({ children: [c, b] });
    expect(
      recursiveTreeSelection(after, before.children[1], before).path
    ).toEqual(['children', 1]);
    const reordered = build({ children: [b, c] });
    expect(
      recursiveTreeSelection(reordered, before.children[1], before).path
    ).toEqual(['children', 0]);
  });
  it('selects the parent when a selected node is removed, rather than the next sibling', () => {
    const a = { name: 'a' },
      b = { name: 'b' };
    const before = build({ children: [a, b] });
    const after = build({ children: [b] });
    expect(recursiveTreeSelection(after, before.children[0], before)).toBe(
      after
    );
  });
  it('keeps the node selected across immutable field edits and handles empty nodes', () => {
    const before = build({ children: [{}] });
    const after = build({ children: [{ name: 'Edited' }] });
    expect(recursiveTreeSelection(after, before.children[0], before)).toBe(
      after.children[0]
    );
    expect(before.children[0].label).toBe('1');
  });
});
