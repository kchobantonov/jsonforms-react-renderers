import { expect, it } from 'vite-plus/test';
import type { UISchemaElement } from '@jsonforms/core';
import {
  createDynamicTreeResolver,
  dynamicPresentation,
} from '../src/dynamicTree';
import { createDynamicUiResolver } from '../src/dynamicUi';
import { conditionalLayout } from '../src/conditionalFields';

const control = {
  type: 'Control',
  scope: '#/properties/a',
  $dynamic: { scope: { bind: 'external.scope' }, label: { bind: 'item.name' } },
};
const makeResolver = (external: Record<string, unknown>, item?: unknown) => {
  const cache = new WeakMap<
    UISchemaElement,
    ReturnType<typeof createDynamicUiResolver>
  >();
  return (element: UISchemaElement) => {
    let resolve = cache.get(element);
    if (!resolve) {
      resolve = createDynamicUiResolver();
      cache.set(element, resolve);
    }
    return resolve(element, { data: {}, external, item, path: '' });
  };
};
it('resolves scopes before conditional filtering without mutating authored children', () => {
  const ui = { type: 'Group', elements: [control] };
  const tree = createDynamicTreeResolver();
  const effective = tree(ui, makeResolver({ scope: '#/properties/b' }));
  const filtered = conditionalLayout(
    effective,
    { properties: { b: {} } },
    new Set(['a', 'b']),
  ) as typeof ui;
  expect(filtered.elements).toHaveLength(1);
  expect(filtered.elements[0].scope).toBe('#/properties/b');
  expect(ui.elements[0].scope).toBe('#/properties/a');
  const presented = dynamicPresentation(filtered.elements[0]);
  expect(presented?.element).toBe(filtered.elements[0]);
});
it('keeps unchanged branches and stable repeated views, then updates only changed branches', () => {
  const external = { scope: '#/properties/b' };
  const resolve = makeResolver(external);
  const tree = createDynamicTreeResolver();
  const staticChild = { type: 'Label', text: 'Static' };
  const ui = { type: 'Group', elements: [staticChild, control] };
  const first = tree(ui, resolve) as typeof ui;
  expect(tree(ui, resolve)).toBe(first);
  expect(first.elements[0]).toBe(staticChild);
  const next = tree(ui, makeResolver({ scope: '#/properties/c' })) as typeof ui;
  expect(next).not.toBe(first);
  expect(next.elements[0]).toBe(staticChild);
});
it('leaves detail boundaries authored and resolves the reused detail separately per item', () => {
  const detail = { type: 'Group', elements: [control] };
  const parent = {
    type: 'Control',
    scope: '#/properties/rows',
    options: { detail },
  };
  const tree = createDynamicTreeResolver();
  expect(tree(parent, makeResolver({}))).toBe(parent);
  const row1 = tree(detail, makeResolver({}, { name: 'Ada' })) as typeof detail;
  const row2 = tree(
    detail,
    makeResolver({}, { name: 'Grace' }),
  ) as typeof detail;
  expect((row1.elements[0] as any).label).toBe('Ada');
  expect((row2.elements[0] as any).label).toBe('Grace');
  expect(parent.options.detail).toBe(detail);
});
it('does not reapply a resolved overlay while handing it to dispatch', () => {
  const tree = createDynamicTreeResolver();
  const first = tree(control, makeResolver({ scope: '#/properties/b' }));
  expect(
    tree(first, () => {
      throw new Error('must not reevaluate');
    }),
  ).toBe(first);
});
it('does not follow a cyclic structural child indefinitely', () => {
  const ui: any = { type: 'Group', elements: [] };
  ui.elements.push(ui);
  expect(createDynamicTreeResolver()(ui, makeResolver({}))).toBe(ui);
});

it('redispatch preserves a filtered root with its own overlay and authored identity', () => {
  const ui = {
    type: 'Group',
    $dynamic: { label: { bind: 'external.label' } },
    elements: [{ type: 'Control', scope: '#/properties/a' }],
  };
  const tree = createDynamicTreeResolver();
  const view = tree(ui, makeResolver({ label: 'Effective' }));
  const filtered = conditionalLayout(view, { properties: {} }, new Set(['a']));
  expect((filtered as any).elements).toEqual([]);
  expect(dynamicPresentation(filtered)?.element).toBe(filtered);
  expect(
    tree(filtered, () => {
      throw new Error('must not restore authored children');
    }),
  ).toBe(filtered);
});

import { hasDynamicTree } from '../src/dynamicTree';
it('caches absence without reevaluating or traversing static branches on repeated calls', () => {
  let reads = 0;
  const ui = {
    type: 'Group',
    get elements() {
      reads++;
      return [{ type: 'Label', text: 'Static' }];
    },
  };
  const tree = createDynamicTreeResolver();
  expect(hasDynamicTree(ui)).toBe(false);
  const initialReads = reads;
  for (let i = 0; i < 1000; i++) {
    expect(hasDynamicTree(ui)).toBe(false);
    expect(
      tree(ui, () => {
        throw new Error('static schemas must not resolve');
      }),
    ).toBe(ui);
  }
  expect(reads).toBe(initialReads);
});
it('does not treat dynamic metadata inside a reusable detail as a parent selection dependency', () => {
  expect(
    hasDynamicTree({
      type: 'Control',
      options: {
        detail: { type: 'Group', $dynamic: { label: { bind: 'item.name' } } },
      },
    }),
  ).toBe(false);
});

it('invalidates the static fast path for a replacement authored schema', () => {
  const staticUi = { type: 'Group', elements: [{ type: 'Label' }] };
  expect(hasDynamicTree(staticUi)).toBe(false);
  const replacement = {
    ...staticUi,
    elements: [
      { type: 'Label', $dynamic: { text: { bind: 'external.label' } } },
    ],
  };
  expect(hasDynamicTree(replacement)).toBe(true);
});
