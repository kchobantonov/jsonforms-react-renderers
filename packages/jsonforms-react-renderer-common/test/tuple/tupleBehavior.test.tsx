import React, { act } from 'react';
import { update, updateErrors } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import { useTupleField } from '../../src/tuple/useTupleField';
import { useTupleAdditionalItems } from '../../src/tuple/useTupleAdditionalItems';
import {
  useTupleControl,
  tuplePositionEntry,
  TuplePositionContext,
} from '../../src/tuple/useTupleControl';
import { TupleControlContent } from '../../src/tuple/TupleControlContent';
import { TupleField } from '../../src/tuple/TupleField';
let cleanup = () => {};
afterEach(() => cleanup());
const fieldProps = (overrides: any = {}) => ({
  schema: { type: 'string' },
  prefix: [{ type: 'string' }],
  index: 0,
  arrayPath: 'pair',
  rootSchema: { type: 'object' },
  uischema: { type: 'Control', scope: '#', label: 'Position' },
  enabled: true,
  ...overrides,
});
const mountField = (overrides: any = {}, data: any = { pair: ['old'] }) => {
  const view = mountHook(() => useTupleField(fieldProps(overrides) as any), {
    data,
  });
  cleanup = view.unmount;
  return view;
};
it('forwards unrelated actions but blocks edits when disabled', () => {
  const view = mountField({ enabled: false });
  act(() => view.current.intercept(updateErrors([])));
  expect(view.dispatch).toHaveBeenCalledOnce();
  act(() => view.current.intercept(update('pair.0', () => 'new')));
  expect(view.context.core?.data.pair).toEqual(['old']);
});
it.each([
  [{ type: 'string' }, '', undefined],
  [{ type: 'number' }, 0, 'required'],
  [{ type: 'object' }, {}, undefined],
  [{ type: 'array' }, [], undefined],
])(
  'clears a tuple position without creating a sparse array %j',
  (schema, expected, message) => {
    const view = mountField({ schema });
    act(() => view.current.intercept(update('pair.0', () => undefined)));
    if (message) expect(view.current.message).toBeTruthy();
    else expect(view.context.core?.data.pair).toEqual([expected]);
  },
);
it('fills missing prefix positions atomically and refuses an uninitializable prefix', () => {
  const view = mountField(
    {
      index: 2,
      prefix: [{ type: 'string' }, { type: 'integer' }, { type: 'string' }],
    },
    { pair: [] },
  );
  act(() => view.current.intercept(update('pair.2', () => 'last')));
  expect(view.context.core?.data.pair).toEqual(['', 0, 'last']);
  view.unmount();
  const blocked = mountField(
    { index: 1, prefix: [false, { type: 'string' }] },
    { pair: [] },
  );
  act(() => blocked.current.intercept(update('pair.1', () => 'last')));
  expect(blocked.current.message).toContain('1');
  expect(blocked.context.core?.data.pair).toEqual([]);
});
it.each(['name', '0.name'])(
  'creates a nested container and preserves sibling data for %s',
  (relative) => {
    const view = mountField({ schema: true }, { pair: [] });
    act(() =>
      view.current.intercept(update(`pair.0.${relative}`, () => 'nested')),
    );
    const value = view.context.core?.data.pair[0];
    expect(relative === 'name' ? value.name : value[0].name).toBe('nested');
    act(() =>
      view.current.intercept(update(`pair.0.${relative}`, () => undefined)),
    );
    expect(
      relative === 'name'
        ? view.context.core?.data.pair[0].name
        : view.context.core?.data.pair[0][0].name,
    ).toBeUndefined();
  },
);
it('edits root tuples and resolves label/detail metadata', () => {
  const view = mountField(
    {
      arrayPath: '',
      schema: { type: 'object' },
      uischema: {
        type: 'Control',
        scope: '#',
        label: 'Details',
        options: { detail: { type: 'VerticalLayout', elements: [] } },
      },
    },
    [],
  );
  expect(view.current.complex).toBe(true);
  expect(view.current.label).toBe('Details');
  act(() => view.current.setOpen(true));
  expect(view.current.open).toBe(true);
  act(() => view.current.intercept(update('0.name', () => 'root')));
  expect(view.context.core?.data).toEqual([{ name: 'root' }]);
});
const mountTail = (overrides: any = {}) => {
  const props = {
    definition: { prefix: [{ type: 'string' }], tail: { type: 'integer' } },
    data: ['first', 2, 3],
    schema: { type: 'array' },
    rootSchema: {},
    options: { confirmation: { delete: 'never' } },
    enabled: true,
    onChange: vi.fn(),
    ...overrides,
  };
  const view = mountHook(() => useTupleAdditionalItems(props as any));
  cleanup = view.unmount;
  return { view, props };
};
it('adds a tail value and deletes only trailing positions', () => {
  const { view, props } = mountTail();
  expect(view.current.visibleIndices).toEqual([1, 2]);
  act(() => view.current.add());
  expect(props.onChange).toHaveBeenCalledWith(['first', 2, 3, 0]);
  act(() => view.current.deletion.request(0));
  expect(props.onChange).toHaveBeenCalledTimes(1);
  act(() => view.current.deletion.request(1));
  expect(props.onChange).toHaveBeenLastCalledWith(['first', 3]);
});
it.each([
  [
    { data: [], definition: { prefix: [{ type: 'string' }], tail: true } },
    ['', ''],
  ],
  [{ data: [], definition: { prefix: [], tail: {} } }, ['']],
])(
  'fills the prefix before adding an unconstrained tail %j',
  (overrides, expected) => {
    const { view, props } = mountTail(overrides);
    act(() => view.current.add());
    expect(props.onChange).toHaveBeenCalledWith(expected);
  },
);
it.each([
  { data: [], definition: { prefix: [false], tail: true } },
  { data: [], definition: { prefix: [], tail: false } },
])('reports an uninitializable position or tail %j', (overrides) => {
  const { view, props } = mountTail(overrides);
  act(() => view.current.add());
  expect(view.current.message).toBeTruthy();
  expect(props.onChange).not.toHaveBeenCalled();
});
it.each([
  { enabled: false },
  { options: { disableAdd: true, disableRemove: true } },
  { schema: { maxItems: 3, minItems: 3 } },
  { definition: { prefix: [], tail: false } },
])('exposes tuple-tail restrictions %j', (overrides) => {
  const { view } = mountTail(overrides);
  expect(view.current.canAdd).toBe(false);
});
it('lets restrict=false edit beyond the validation bounds', () => {
  const { view } = mountTail({
    schema: { maxItems: 0, minItems: 10 },
    options: { restrict: false },
  });
  expect(view.current.canAdd).toBe(true);
  expect(view.current.canDelete).toBe(true);
});
const tupleProps = (overrides: any = {}) => ({
  data: ['a', 1],
  enabled: true,
  errors: '',
  path: 'pair',
  rootSchema: {},
  schema: {
    type: 'array',
    items: [{ type: 'string', title: 'Name' }, { type: 'integer' }],
    additionalItems: false,
  },
  uischema: { type: 'Control', scope: '#/properties/pair' },
  ...overrides,
});
it('resolves tuple labels, fallback schemas, config and registered complex details', () => {
  let props = tupleProps({
    config: { jsonformsExtended: { tuple: { vertical: true } } },
  });
  const view = mountHook(() => useTupleControl(props as any));
  cleanup = view.unmount;
  expect(view.current.vertical).toBe(true);
  expect(view.current.positionLabel(0)).toContain('1');
  expect(view.current.fieldUiSchema(0)).toMatchObject({ label: 'Name' });
  expect(view.current.fieldSchema(10)).toBe(true);
  props = tupleProps({
    schema: { type: 'array', items: [{ type: 'object' }] },
    uischemas: [
      { tester: null },
      {
        tester: () => 10,
        uischema: { type: 'Group', label: 'Registered', elements: [] },
      },
    ],
    uischema: { type: 'Control', scope: '#', options: { vertical: false } },
  });
  view.rerender();
  expect(view.current.fieldUiSchema(0)).toMatchObject({
    type: 'Group',
    label: 'Registered',
  });
  props = tupleProps({ schema: { type: 'string' }, data: undefined });
  view.rerender();
  expect(view.current.definition).toBeUndefined();
  expect(view.current.values).toEqual([]);
  expect(view.current.fieldSchema(0)).toBe(true);
});
it('reports errors for positions omitted by authored layouts', () => {
  const props = tupleProps({
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/items/0' }],
        },
      },
    },
  });
  const view = mountHook(() => useTupleControl(props as any));
  cleanup = view.unmount;
  view.rerender({
    core: {
      ...view.context.core!,
      errors: [
        {
          keyword: 'type',
          instancePath: '/pair/1',
          schemaPath: '',
          params: {},
          message: 'must be integer',
        },
      ],
    },
  });
  expect(view.current.shownErrors).toContain('Item 2');
  expect(view.current.shownErrors).toContain('must be integer');
});
it('dispatches whole and nested position scopes and ignores invalid positions', () => {
  const render = vi.fn(() => <span>whole</span>);
  const within = vi.fn(() => <span>nested</span>);
  const Renderer = tuplePositionEntry.renderer as React.ComponentType<any>;
  let schema: any = { type: 'Control', scope: '#/items/0' };
  const view = mountHook(() => null, {
    render: () => (
      <TuplePositionContext.Provider
        value={{ count: 1, render, renderWithin: within }}
      >
        <Renderer uischema={schema} />
      </TuplePositionContext.Provider>
    ),
  });
  cleanup = view.unmount;
  expect(view.container.textContent).toBe('whole');
  schema = { type: 'Control', scope: '#/prefixItems/0/properties/name' };
  view.rerender();
  expect(within).toHaveBeenLastCalledWith(0, '#/properties/name');
  schema = { type: 'Control', scope: '#/items/9' };
  view.rerender();
  expect(view.container.textContent).toBe('');
  schema = { type: 'Control', scope: '#/properties/invalid' };
  view.rerender();
  expect(view.container.textContent).toBe('');
  expect(
    tuplePositionEntry.tester(
      { type: 'Control', scope: '#/items/0' } as any,
      {},
      {} as any,
    ),
  ).toBe(9999);
  expect(
    tuplePositionEntry.tester({ type: 'Label' } as any, {}, {} as any),
  ).toBe(-1);
});
it('renders generic tuple fields, tails, vertical styles and diagnostics', () => {
  let props = tupleProps({
    schema: {
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: { type: 'string' },
    },
    handleChange: vi.fn(),
  });
  const Field = ({ index }: any) => <span>field {index}</span>;
  const Tail = ({ onChange, renderItem, positionLabel }: any) => (
    <button onClick={() => onChange(['changed'])}>
      {positionLabel(1)}
      {renderItem(1)}
    </button>
  );
  const view = mountHook(() => useTupleControl(props as any), {
    render: (model) => (
      <TupleControlContent
        props={props as any}
        model={model}
        TupleField={Field}
        TupleAdditionalItems={Tail}
        diagnostic={(message) => <p>{message}</p>}
        gap={8}
      />
    ),
  });
  cleanup = view.unmount;
  expect(view.container.textContent).toContain('field 0');
  act(() => view.container.querySelector('button')!.click());
  expect(props.handleChange).toHaveBeenCalledWith('pair', ['changed']);
  props = tupleProps({ schema: { type: 'string' } });
  view.rerender();
  expect(view.container.textContent).toContain('Tuple');
});
it.each([false, { type: 'string' }, { type: 'object' }])(
  'renders forbidden, primitive and complex tuple field presentations %j',
  (schema) => {
    const props = fieldProps({ schema, options: {} });
    const Dialog = ({ open, onApply, onClose }: any) =>
      open ? (
        <>
          <button onClick={() => onApply({ changed: true })}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </>
      ) : null;
    const view = mountHook(() => null, {
      data: { pair: [{ original: true }] },
      render: () => (
        <TupleField
          {...(props as any)}
          CompositeDetailDialog={Dialog}
          gap={8}
          legendStyle={{}}
          renderEditButton={(label, disabled, open) => (
            <button disabled={disabled} onClick={open}>
              {label}
            </button>
          )}
          renderError={(message) => <p role='alert'>{message}</p>}
        />
      ),
    });
    cleanup = view.unmount;
    if (schema === false)
      expect(view.container.querySelector('[role=alert]')).not.toBeNull();
    if (typeof schema === 'object' && schema.type === 'object') {
      act(() => view.container.querySelector('button')!.click());
      act(() =>
        Array.from(view.container.querySelectorAll('button'))
          .find((button) => button.textContent === 'Apply')!
          .click(),
      );
      expect(view.context.core?.data.pair).toEqual([{ changed: true }]);
      act(() => view.container.querySelector('button')!.click());
      act(() =>
        Array.from(view.container.querySelectorAll('button'))
          .find((button) => button.textContent === 'Cancel')!
          .click(),
      );
      expect(view.container.textContent).not.toContain('Apply');
    }
  },
);
