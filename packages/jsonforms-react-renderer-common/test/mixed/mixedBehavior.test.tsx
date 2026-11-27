import { act } from 'react';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import { useMixedRenderer } from '../../src/mixed/useMixedRenderer';
import {
  canDeleteMixedTreeNode,
  canRenameMixedTreeNode,
  mixedParentNode,
} from '../../src/mixed/mixedTreeActions';
import {
  changeMixedNodeType,
  resolveMixedNodeEditor,
} from '../../src/mixed/mixedNodeEditor';
import { buildMixedTree, findMixedTreeNode } from '../../src/mixed/mixedTree';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (
  data: any = { note: 'old', other: { name: 'nested' } },
  overrides: any = {},
) => {
  let props: any = {
    data,
    path: 'value',
    schema: {
      type: [
        'object',
        'array',
        'string',
        'number',
        'integer',
        'boolean',
        'null',
      ],
      additionalProperties: true,
    },
    rootSchema: {},
    uischema: { type: 'Control', scope: '#' },
    enabled: true,
    visible: true,
    label: 'Payload',
    errors: '',
    handleChange: vi.fn(),
    ...overrides,
  };
  const request = vi.fn();
  const view = mountHook(() => useMixedRenderer(props, request), {
    data: { value: data },
  });
  cleanup = view.unmount;
  return {
    view,
    request,
    get props() {
      return props;
    },
    rerender: (patch: any) => {
      props = { ...props, ...patch };
      view.rerender();
    },
  };
};
it('selects and navigates mixed nodes using their full data paths', () => {
  const { view } = mount();
  expect(view.current.selectedType).toBe('object');
  act(() => view.current.navigation.selectPath('value.other.name'));
  expect(view.current.selectedPath).toEqual(['other', 'name']);
  act(() => view.current.navigation.selectPath('unrelated'));
  expect(view.current.selectedPath).toEqual(['other', 'name']);
  expect(
    view.current.detailProps.withoutControlLabel({
      type: 'Control',
      scope: '#',
    } as any),
  ).toMatchObject({ label: false });
  expect(
    view.current.detailProps.withoutControlLabel({ type: 'Group' } as any),
  ).toEqual({ type: 'Group' });
});
it('confirms deletion and retains newer external data while a prompt is pending', () => {
  const { view, request, props, rerender } = mount();
  const node = findMixedTreeNode(view.current.tree!, ['note'])!;
  expect(view.current.canRenameNode(node)).toBe(true);
  act(() => view.current.deleteNode(node));
  expect(request).toHaveBeenCalledOnce();
  const perform = request.mock.calls[0][0].perform;
  rerender({ data: { note: 'external' } });
  act(perform);
  expect(props.handleChange).not.toHaveBeenCalled();
});
it('deletes and renames the selected key without changing siblings', () => {
  const { view, props, request } = mount();
  const node = findMixedTreeNode(view.current.tree!, ['note'])!;
  act(() => view.current.renameNode(node, 'renamed'));
  expect(props.handleChange).toHaveBeenCalledWith('value', {
    renamed: 'old',
    other: { name: 'nested' },
  });
  act(() => view.current.deleteNode(node));
  act(request.mock.calls[0][0].perform);
  expect(props.handleChange).toHaveBeenLastCalledWith('value', {
    other: { name: 'nested' },
  });
});
it('resets a disappeared selection and derives scalar errors and detail fallbacks', () => {
  const { view, rerender } = mount();
  act(() => view.current.setSelectedPath(['other']));
  rerender({ data: { note: 'new' } });
  expect(view.current.selectedPath).toEqual([]);
  rerender({ data: 1.5, schema: { type: ['integer', 'string'] } });
  act(() => view.current.selectorProps.onChange('integer'));
  expect(view.current.numericError).toBeTruthy();
  rerender({ data: undefined, errors: 'Choose a type' });
  expect(view.current.selectorProps.fullWidth).toBe(true);
  expect(view.current.selectorProps.error).toBe('Choose a type');
  act(() => view.current.navigation.selectPath('value.other'));
  expect(view.current.selectedPath).toEqual([]);
});
it('treats structured layout config as a default and respects readonly permissions', () => {
  const { view } = mount(
    {},
    {
      readonly: true,
      config: { jsonformsExtended: { mixed: { structuredLayout: 'inline' } } },
    },
  );
  expect(view.current.structuredLayout).toBe('inline');
  expect(view.current.selectorProps.disabled).toBe(true);
  expect(view.current.canDeleteNode(view.current.tree!)).toBe(false);
});
it.each(['string', 'number', 'integer', 'object', 'array'] as const)(
  'changes a mixed scalar to %s through the confirmation policy',
  (type) => {
    const { view, request, props } = mount('old');
    act(() => view.current.selectorProps.onChange(type));
    if (type === 'string') expect(request).not.toHaveBeenCalled();
    else {
      expect(request).toHaveBeenCalledOnce();
      act(request.mock.calls[0][0].perform);
      expect(props.handleChange).toHaveBeenCalledWith(
        'value',
        type === 'object' ? {} : type === 'array' ? [] : 0,
      );
    }
  },
);
it('changes numeric selection without rewriting its value and confirms scalar removal', () => {
  const { view, request, props } = mount(1.5);
  act(() => view.current.selectorProps.onChange('integer'));
  expect(request).not.toHaveBeenCalled();
  expect(view.current.numericError).toBeTruthy();
  act(() => view.current.selectorProps.onChange(undefined));
  act(request.mock.calls[0][0].perform);
  expect(props.handleChange).toHaveBeenCalledWith('value', undefined);
});
it('does not remove a mixed array slot when the selected type is cleared', () => {
  const { view, request } = mount('old', { path: '0' });
  view.replaceData(['old']);
  expect(view.current.selectorProps.clearable).toBe(false);
  act(() => view.current.selectorProps.onChange(undefined));
  expect(request).not.toHaveBeenCalled();
});
it.each([
  [{ required: ['note'] }, true, false, false],
  [{ minProperties: 2 }, true, false, false],
  [{ minProperties: 1 }, true, false, true],
  [{}, false, false, false],
  [{}, true, true, false],
  [{ required: ['note'] }, true, false, true, false],
])(
  'enforces mixed object deletion constraints %j',
  (constraints, enabled, readonly, expected, restrict = true) => {
    const schema = {
      type: 'object',
      additionalProperties: true,
      ...(constraints as object),
    };
    const tree = buildMixedTree({ note: 'x', other: 'y' }, schema, {}, 'root');
    const node = findMixedTreeNode(tree, ['note'])!;
    expect(
      canDeleteMixedTreeNode(
        tree,
        node,
        {},
        enabled as boolean,
        readonly as boolean,
        restrict,
      ),
    ).toBe(expected);
    expect(mixedParentNode(undefined, node)).toBeUndefined();
    expect(canDeleteMixedTreeNode(undefined, node, {}, true, false, true)).toBe(
      false,
    );
    expect(canDeleteMixedTreeNode(tree, tree, {}, true, false, true)).toBe(
      false,
    );
  },
);
it.each([0, 1, 2])('enforces minimum array size %s', (minItems) => {
  const tree = buildMixedTree(
    ['a', 'b'],
    { type: 'array', items: { type: 'string' }, minItems },
    {},
    'root',
  );
  expect(
    canDeleteMixedTreeNode(tree, tree.children[0], {}, true, false, true),
  ).toBe(minItems < 2);
  expect(canRenameMixedTreeNode(tree.children[0], true, false)).toBe(false);
});
it.each(['string', 'object', 'array', 'null', 'integer'] as const)(
  'resolves a selected node editor for %s',
  (type) => {
    const values: any = {
      string: 'x',
      object: { x: 1 },
      array: [1],
      null: null,
      integer: 3,
    };
    const tree = buildMixedTree(
      { value: values[type] },
      {
        type: 'object',
        additionalProperties: {
          type: ['string', 'object', 'array', 'null', 'number'],
        },
      },
      {},
      'root',
    );
    const node = tree.children[0];
    const editor = resolveMixedNodeEditor(node, 'root', {});
    expect(editor.nodePath).toBe('root.value');
    expect(editor.isNestedPrimitive).toBe(
      !['object', 'array', 'null'].includes(type),
    );
    const change = vi.fn();
    changeMixedNodeType(node, undefined, 'root.value', {}, change);
    expect(change).not.toHaveBeenCalled();
    changeMixedNodeType(node, 'string', 'root.value', {}, change);
    expect(change).toHaveBeenCalledWith('root.value', '');
  },
);
