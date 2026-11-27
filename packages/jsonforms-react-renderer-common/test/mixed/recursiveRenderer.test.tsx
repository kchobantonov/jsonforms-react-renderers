import React, { act } from 'react';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  createRecursiveTreeRenderer,
  recursiveTreeTester,
  type MixedTreeProps,
} from '../../src/mixed/RecursiveTreeRenderer';
let cleanup = () => {};
afterEach(() => cleanup());
const schema: any = {
  type: 'object',
  definitions: {
    node: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
        children: { type: 'array', items: { $ref: '#/definitions/node' } },
      },
    },
  },
  properties: { tree: { $ref: '#/definitions/node' } },
};
const initial = () => ({
  tree: { name: 'Root', children: [{ name: 'Child', children: [] }] },
});
const mount = (overrides: any = {}) => {
  let tree!: MixedTreeProps;
  const request = vi.fn();
  const Renderer = createRecursiveTreeRenderer(
    (props) => {
      tree = props;
      return (
        <div>
          {props.renderIndicator?.(props.root)}
          {props.root.children.map((node, index) => (
            <span key={index}>{props.renderIndicator?.(node)}</span>
          ))}
        </div>
      );
    },
    ({ count }) => <span>errors {count}</span>,
    ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    () => ({ request, dialog: <span>confirm</span> }),
  );
  let ui: any = {
    type: 'Control',
    scope: '#/properties/tree',
    options: {
      recursiveTree: { childrenProperty: 'children', labelProperty: 'name' },
    },
  };
  const view = mountHook(() => null, {
    schema,
    data: initial(),
    context: overrides,
    render: () => <Renderer schema={schema} uischema={ui} path='' />,
  });
  cleanup = view.unmount;
  return {
    view,
    request,
    get tree() {
      return tree;
    },
    updateUI: (patch: any) => {
      ui = { ...ui, ...patch };
      view.rerender();
    },
  };
};
it('selects nodes, validates names and renames only the selected field', () => {
  const model = mount();
  const child = model.tree.root.children[0];
  expect(model.tree.canRename(child)).toBe(true);
  expect(model.tree.validateRename(child, ' ')).toBeTruthy();
  expect(model.tree.validateRename(child, 'x')).toBeTruthy();
  expect(model.tree.validateRename(child, 'New name')).toBeUndefined();
  act(() => model.tree.onSelect(child));
  expect(model.tree.selectedPath).toEqual(child.path);
  act(() => model.tree.onRename(child, 'Renamed'));
  expect(model.view.context.core?.data.tree.children[0].name).toBe('Renamed');
});
it('confirms child deletion and rechecks identity after an external replacement', () => {
  const model = mount();
  const child = model.tree.root.children[0];
  expect(model.tree.canDelete(model.tree.root)).toBe(false);
  expect(model.tree.canDelete(child)).toBe(true);
  act(() => model.tree.onDelete(child));
  expect(model.request).toHaveBeenCalledOnce();
  model.view.replaceData({
    tree: { name: 'Root', children: [{ name: 'Replacement', children: [] }] },
  });
  act(model.request.mock.calls[0][0].perform);
  expect(model.view.context.core?.data.tree.children[0].name).toBe(
    'Replacement',
  );
});
it('deletes the selected child when permissions and identity still match', () => {
  const model = mount();
  const child = model.tree.root.children[0];
  act(() => model.tree.onDelete(child));
  act(model.request.mock.calls[0][0].perform);
  expect(model.view.context.core?.data.tree.children).toEqual([]);
});
it.each([true, false])(
  'enforces inherited readonly and selection recovery %s',
  (readonly) => {
    const model = mount({ readonly });
    const child = model.tree.root.children[0];
    expect(model.tree.canDelete(child)).toBe(!readonly);
    expect(model.tree.canRename(child)).toBe(!readonly);
    act(() => model.tree.onSelect(child));
    model.view.replaceData({ tree: { name: 'Root', children: [] } });
    expect(model.tree.selectedPath).toEqual([]);
  },
);
it('requires schema-declared writable names and respects minimum child counts', () => {
  const model = mount();
  const next = structuredClone(schema);
  next.definitions.node.properties.name = { const: 'Fixed' };
  next.definitions.node.properties.children.minItems = 1;
  model.view.rerender({ core: { ...model.view.context.core!, schema: next } });
  const child = model.tree.root.children[0];
  expect(model.tree.canRename(child)).toBe(false);
  expect(model.tree.canDelete(child)).toBe(false);
});
it('selects only a correctly authored recursive-tree control', () => {
  expect(
    recursiveTreeTester(
      {
        type: 'Control',
        options: {
          recursiveTree: {
            childrenProperty: 'children',
            labelProperty: 'name',
          },
        },
      } as any,
      {},
      {} as any,
    ),
  ).toBe(30);
  for (const ui of [
    { type: 'Group' },
    { type: 'Control' },
    { type: 'Control', options: { recursiveTree: { childrenProperty: 0 } } },
  ])
    expect(recursiveTreeTester(ui as any, {}, {} as any)).toBe(-1);
});
