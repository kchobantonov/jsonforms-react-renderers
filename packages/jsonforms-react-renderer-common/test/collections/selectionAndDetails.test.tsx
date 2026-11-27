import React, { act } from 'react';
import { update, updateErrors } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  useRowDetail,
  createRowDetailFrame,
  createRowDetailToggle,
} from '../../src/collections/rowDetail';
import { useTableSelection } from '../../src/collections/useTableSelection';
import { useArrayPanelState } from '../../src/collections/useArrayPanelState';
let cleanup = () => {};
afterEach(() => cleanup());
const rowSchema = { type: 'object', properties: { name: { type: 'string' } } };
const schema = {
  type: 'object',
  properties: { rows: { type: 'array', items: rowSchema, minItems: 1 } },
};
const rows = [{ name: 'one' }, { name: 'two' }, { name: 'three' }];
const mountSelection = (overrides: any = {}) => {
  const remove = vi.fn();
  const props = {
    path: 'rows',
    schema: rowSchema,
    uischema: {
      type: 'Control',
      scope: '#/properties/rows',
      options: { confirmation: { delete: 'always' } },
    },
    enabled: true,
    removeItems: vi.fn(() => remove),
    ...overrides,
  };
  const view = mountHook(() => useTableSelection(props), {
    schema,
    data: { rows },
  });
  cleanup = view.unmount;
  return { view, props, remove };
};
it('confirms selected-row deletion with descending indices and clears the selection', () => {
  const { view, props, remove } = mountSelection();
  act(() => view.current.setSelected([0, 2]));
  expect(view.current.canDelete).toBe(true);
  act(() => view.current.request());
  expect(view.current.confirming).toBe(true);
  expect(remove).not.toHaveBeenCalled();
  act(() => view.current.confirm());
  expect(props.removeItems).toHaveBeenCalledWith('rows', [2, 0]);
  expect(remove).toHaveBeenCalledOnce();
  expect(view.current.selected).toEqual([]);
});
it('cancels deletion and ignores stale row selections after external replacement', () => {
  const { view, remove } = mountSelection();
  act(() => view.current.setSelected([1]));
  act(() => view.current.request());
  act(() => view.current.cancel());
  expect(remove).not.toHaveBeenCalled();
  expect(view.current.selected).toEqual([1]);
  act(() => view.current.request());
  view.replaceData({ rows: [{ name: 'replacement' }] });
  expect(view.current.confirming).toBe(false);
  act(() => view.current.confirm());
  expect(remove).not.toHaveBeenCalled();
  expect(view.current.selected).toEqual([]);
});
it('honors the never confirmation policy', () => {
  const { view, remove } = mountSelection({
    uischema: {
      type: 'Control',
      scope: '#/properties/rows',
      options: { confirmation: { delete: 'never' } },
    },
  });
  act(() => view.current.setSelected([1]));
  act(() => view.current.request());
  expect(remove).toHaveBeenCalledOnce();
  expect(view.current.confirming).toBe(false);
});
it.each([
  { enabled: false },
  { readonly: true },
  { disableRemove: true },
  { removeItems: undefined },
  { config: { disableRemove: true } },
  { config: { restrict: true } },
])('enforces table deletion permissions and minItems %j', (overrides) => {
  const { view, remove } = mountSelection(overrides);
  act(() => view.current.setSelected([0, 1, 2]));
  expect(view.current.canDelete).toBe(false);
  act(() => view.current.request());
  act(() => view.current.confirm());
  expect(remove).not.toHaveBeenCalled();
});
it.each([{ indices: [] }, { indices: [-1] }, { indices: [3] }])(
  'refuses invalid table selections %j',
  ({ indices }) => {
    const { view } = mountSelection();
    act(() => view.current.setSelected(indices));
    expect(view.current.canDelete).toBe(false);
  },
);
it('handles a missing collection without inventing rows', () => {
  const { view } = mountSelection();
  view.replaceData({});
  act(() => view.current.setSelected([0]));
  expect(view.current.canDelete).toBe(false);
});
const mountDetail = (presentation = 'dialog', overrides: any = {}) => {
  const props = {
    path: 'rows',
    schema: rowSchema,
    rootSchema: schema,
    enabled: true,
    uischema: {
      type: 'Control',
      scope: '#/properties/rows',
      options: { rowDetail: { presentation } },
    },
    ...overrides,
  };
  const view = mountHook(() => useRowDetail(props), { schema, data: { rows } });
  cleanup = view.unmount;
  return { view, props };
};
it('isolates row edits and flushes pending writes before Apply', () => {
  const { view } = mountDetail();
  act(() => view.current.open(1));
  const content = view.current.content as React.ReactElement<any>;
  const dispatch = content.props.value.dispatch;
  act(() => dispatch(update('rows.1.name', () => 'draft')));
  expect(view.context.core?.data.rows[1].name).toBe('two');
  const provider = (view.current.content as React.ReactElement<any>).props
    .children;
  const pending = {
    flush: vi.fn(() => dispatch(update('rows.1.name', () => 'flushed'))),
    cancel: vi.fn(),
  };
  provider.props.changes.add(pending);
  act(() => view.current.apply());
  expect(view.context.core?.data.rows[1].name).toBe('flushed');
  expect(view.context.core?.data.rows[0]).toEqual(rows[0]);
  expect(view.current.selection).toBeUndefined();
  expect(pending.cancel).toHaveBeenCalledOnce();
});
it('ignores unrelated row updates and applies no unchanged value', () => {
  const { view } = mountDetail();
  act(() => view.current.apply());
  act(() => view.current.open(0));
  const dispatch = (view.current.content as React.ReactElement<any>).props.value
    .dispatch;
  act(() => dispatch(update('rows.2.name', () => 'wrong')));
  act(() => dispatch(updateErrors([])));
  act(() => view.current.apply());
  expect(view.dispatch).not.toHaveBeenCalled();
});
it.each([
  { readonly: true },
  { enabled: false },
  { schema: { ...rowSchema, readOnly: true } },
])('allows inspection while preventing row mutation %j', (overrides) => {
  const { view } = mountDetail('dialog', overrides);
  act(() => view.current.open(0));
  expect(view.current.enabled).toBe(false);
  act(() =>
    (view.current.content as React.ReactElement<any>).props.value.dispatch(
      update('rows.0.name', () => 'wrong'),
    ),
  );
  act(() => view.current.apply());
  expect(view.dispatch).not.toHaveBeenCalled();
});
it('holds a dialog draft on external conflict and cancels without writing', () => {
  const { view } = mountDetail();
  act(() => view.current.open(0));
  view.replaceData({ rows: [{ name: 'external' }, ...rows.slice(1)] });
  expect(view.current.conflict).toBe(true);
  act(() => view.current.apply());
  expect(view.dispatch).not.toHaveBeenCalled();
  act(() => view.current.close());
  expect(view.current.selection).toBeUndefined();
});
it('tracks panel selection through reorder and in-place replacement, and clears removed items', () => {
  const { view } = mountDetail('panel');
  act(() => view.current.open(1));
  view.replaceData({ rows: [rows[1], rows[0], rows[2]] });
  expect(view.current.selection?.index).toBe(0);
  view.replaceData({ rows: [{ name: 'edited' }, rows[0], rows[2]] });
  expect((view.current.selection?.source as any)?.name).toBe('edited');
  view.replaceData({ rows: [rows[0]] });
  expect(view.current.selection).toBeUndefined();
});
it('renders frame variants and a localized panel toggle', () => {
  const { view, props } = mountDetail('panel');
  const Frame = createRowDetailFrame(
    ({ state }) => <span>dialog {state.selection?.index}</span>,
    ({ children }) => <section>{children}panel</section>,
  );
  const Toggle = createRowDetailToggle(({ label, toggle, expanded }) => (
    <button aria-expanded={expanded} onClick={toggle}>
      {label}
    </button>
  ));
  view.unmount();
  const frameView = mountHook(() => useRowDetail(props), {
    schema,
    data: { rows },
    render: (state) => (
      <Frame state={state}>
        <Toggle state={state} />
        content
      </Frame>
    ),
  });
  cleanup = frameView.unmount;
  expect(frameView.container.textContent).toContain('panel');
  act(() => frameView.container.querySelector('button')!.click());
  expect(frameView.current.panelOpen).toBe(false);
  props.uischema.options.rowDetail.presentation = 'dialog';
  frameView.rerender();
  expect(frameView.container.textContent).toContain('dialog');
  expect(frameView.container.querySelector('button')).toBeNull();
  props.uischema.options = undefined;
  frameView.rerender();
  expect(frameView.container.textContent).toBe('content');
});
it('resolves array-panel precedence and reacts to changed initial settings', () => {
  let options: any = { collapsible: true, collapsed: true };
  let config: any = {};
  const view = mountHook(() => useArrayPanelState(options, config));
  cleanup = view.unmount;
  expect(view.current.collapsed).toBe(true);
  act(() => view.current.toggle());
  expect(view.current.collapsed).toBe(false);
  options = { collapsible: true, collapsed: false };
  view.rerender();
  options = { collapsible: true, collapsed: true };
  view.rerender();
  expect(view.current.collapsed).toBe(true);
  options = {};
  config = { jsonformsExtended: { collapsible: true, collapsed: false } };
  view.rerender();
  expect(view.current.collapsible).toBe(true);
  config = {};
  view.rerender();
  expect(view.current.collapsed).toBe(false);
});
