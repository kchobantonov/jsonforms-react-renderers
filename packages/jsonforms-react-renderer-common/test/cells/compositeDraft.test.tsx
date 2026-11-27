import { act } from 'react';
import { update, updateErrors } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  hasInvalidCompositeEditorDraft,
  useCompositeDraft,
} from '../../src/cells/useCompositeDraft';
import { preventsEmpty } from '../../src/cells/compositeActions';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (
  overrides: any = {},
  data: any = { row: { name: 'original' }, other: 'kept' },
) => {
  let props = {
    open: true,
    path: 'row',
    schema: { type: 'object' },
    enabled: true,
    options: {},
    t: (_: string, fallback?: string) => fallback,
    onClose: vi.fn(),
    onApply: vi.fn(),
    ...overrides,
  };
  const view = mountHook(() => useCompositeDraft(props), { data });
  cleanup = view.unmount;
  return {
    view,
    props,
    rerender: (patch: any) => {
      props = { ...props, ...patch };
      view.rerender();
    },
  };
};
it('isolates edits, flushes pending writes and applies only the selected object', () => {
  const { view, props, rerender } = mount();
  const pending = {
    flush: vi.fn(() =>
      view.current.context.dispatch!(update('row.name', () => 'flushed')),
    ),
    cancel: vi.fn(),
    isPending: () => true,
  };
  act(() => view.current.context.dispatch!(update('row.name', () => 'draft')));
  expect(view.context.core?.data.row.name).toBe('original');
  view.current.pending.add(pending);
  act(() => {
    view.current.apply();
    rerender({ open: false });
  });
  expect(props.onApply).toHaveBeenCalledWith({ name: 'flushed' });
  expect(props.onClose).toHaveBeenCalledOnce();
});
it('cancels pending writes and discards changes', () => {
  const { view, props, rerender } = mount();
  const pending = { flush: vi.fn(), cancel: vi.fn(), isPending: () => true };
  view.current.pending.add(pending);
  act(() => {
    view.current.cancel();
    rerender({ open: false });
  });
  expect(pending.cancel).toHaveBeenCalledOnce();
  expect(props.onApply).not.toHaveBeenCalled();
});
it('does not publish unchanged drafts and detects external conflicts', () => {
  const { view, props, rerender } = mount();
  expect(view.current.canApply).toBe(true);
  view.replaceData({ row: { name: 'external' } });
  expect(view.current.conflicted).toBe(true);
  expect(view.current.canApply).toBe(false);
  view.replaceData({ row: { name: 'original' }, other: 'changed' });
  expect(view.current.conflicted).toBe(false);
  act(() => {
    view.current.apply();
    rerender({ open: false });
  });
  expect(props.onApply).not.toHaveBeenCalled();
});
it.each([
  ['row.other', false],
  ['other', false],
  ['row.name', true],
])('accepts updates only within the draft path %s', (path, accepted) => {
  const { view } = mount();
  const previous = view.current.draft;
  act(() =>
    view.current.context.dispatch!(
      path === 'row.other'
        ? updateErrors([])
        : update(path as string, () => 'next'),
    ),
  );
  expect(view.current.draft !== previous).toBe(accepted);
});
it.each([false, true])(
  'clears arrays and objects according to their kind %s',
  (array) => {
    const { view } = mount(
      { schema: { type: array ? 'array' : 'object' } },
      { row: array ? ['a'] : { a: 1 } },
    );
    expect(view.current.canEmpty).toBe(true);
    act(() => view.current.clear());
    expect(view.current.draft?.data.row).toEqual(array ? [] : {});
  },
);
it.each([
  { enabled: false },
  { options: { disableRemove: true } },
  { schema: { minProperties: 1 } },
])('enforces draft edit restrictions %j', (overrides) => {
  const { view } = mount(overrides);
  expect(view.current.canEmpty).toBe(false);
  if (overrides.enabled === false) {
    act(() => view.current.context.dispatch!(update('row', () => {})));
    expect(view.current.draft?.data.row).toEqual({ name: 'original' });
  }
});
it('handles closed and root drafts, custom labels, and editor syntax errors', () => {
  const { view, rerender } = mount({
    open: false,
    path: '',
    options: { restrict: false },
  });
  expect(view.current.draft).toBeUndefined();
  act(() => view.current.context.dispatch!(update('', () => {})));
  rerender({ open: true });
  expect(view.current.canEmpty).toBe(true);
  expect(view.current.buttonLabel('Save draft', 'composite.apply')).toBe(
    'Save draft',
  );
  expect(view.current.buttonLabel(undefined, 'composite.cancel')).toBe(
    'Cancel',
  );
  view.rerender({
    core: {
      ...view.context.core!,
      additionalErrors: [
        {
          instancePath: '/row',
          keyword: 'editor',
          params: { source: 'monaco' },
          schemaPath: '',
          message: 'invalid',
        },
      ],
    },
  });
  expect(
    hasInvalidCompositeEditorDraft(view.context.core?.additionalErrors, 'row'),
  ).toBe(true);
});
it.each([
  [undefined, false, false],
  [{ allOf: [{ required: ['x'] }] }, false, true],
  [{ minProperties: 1 }, false, true],
  [{ required: [] }, false, false],
  [{ minItems: 1 }, true, true],
  [{ contains: {}, minContains: 0 }, true, false],
  [{ contains: {} }, true, true],
  [{}, true, false],
])('determines empty-value constraints %j', (schema, array, expected) =>
  expect(preventsEmpty(schema as any, array as boolean)).toBe(expected),
);
it.each([
  ['/row', 'row', true],
  ['/row/child', 'row', true],
  ['/row2', 'row', false],
  ['/a~1b/~0key', 'a/b.~key', true],
])('matches editor error scopes %s', (instancePath, path, expected) => {
  expect(
    hasInvalidCompositeEditorDraft(
      [{ instancePath, params: { source: 'monaco' } } as any],
      path,
    ),
  ).toBe(expected);
  expect(
    hasInvalidCompositeEditorDraft(
      [{ instancePath, params: { source: 'server' } } as any],
      path,
    ),
  ).toBe(false);
});
