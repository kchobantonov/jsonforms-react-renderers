import React, { act } from 'react';
import { useJsonForms } from '@jsonforms/react';
import { update } from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  useAdditionalPropertyEntries,
  useAdditionalPropertyActions,
  type AdditionalPropertiesProps,
} from '../../src/objects/useAdditionalPropertyEntries';
import {
  DynamicPropertyProvider,
  useDynamicProperty,
  clearedDynamicPropertyValue,
} from '../../src/objects/dynamicProperties';

const mounted: { unmount(): void }[] = [];
afterEach(() => mounted.splice(0).forEach((view) => view.unmount()));
function setup(
  patch: Partial<AdditionalPropertiesProps> = {},
  name = 'new',
  error?: string,
) {
  let props: AdditionalPropertiesProps = {
    data: { fixed: 'keep', extra: 'remove' },
    schema: {
      type: 'object',
      properties: { fixed: { type: 'string' } },
      additionalProperties: { type: 'string', default: 'added' },
    },
    rootSchema: {},
    path: 'object',
    enabled: true,
    label: 'Object',
    uischema: { type: 'Control', scope: '#' },
    handleChange: vi.fn(),
    ...patch,
  };
  const setName = vi.fn();
  const view = mountHook(() => {
    const entries = useAdditionalPropertyEntries(props);
    const actions = useAdditionalPropertyActions(props, entries, {
      restrict: props.uischema.options?.restrict !== false,
      propertyName: name,
      propertyNameError: error,
      setNewPropertyName: setName,
    });
    return { entries, actions };
  });
  mounted.push(view);
  return {
    view,
    setName,
    get props() {
      return props;
    },
    rerender(next: Partial<AdditionalPropertiesProps>) {
      props = { ...props, ...next };
      view.rerender();
    },
  };
}

describe('additional property discovery and actions', () => {
  it('separates declared and additional keys and follows immutable parent updates', () => {
    const { view, rerender } = setup();
    expect(view.current.entries.reservedPropertyNames).toEqual(['fixed']);
    expect(view.current.entries.additionalKeys).toEqual(['extra']);
    expect(view.current.entries.additionalPropertyItems[0].propertyName).toBe(
      'extra',
    );
    rerender({ data: { fixed: 'keep', later: 42 } });
    expect(view.current.entries.additionalKeys).toEqual(['later']);
  });
  it.each([null, undefined, [], 'value', 3])(
    'handles non-object data %s',
    (data) => {
      const { view } = setup({
        data,
        schema: { type: 'object', additionalProperties: false },
      });
      expect(view.current.entries.objectData).toBeUndefined();
      expect(view.current.entries.additionalKeys).toEqual([]);
      expect(view.current.entries.shouldShow).toBe(false);
    },
  );
  it('allows unspecified properties only with an explicit option', () => {
    const { view, rerender } = setup({
      data: {},
      schema: { type: 'object' },
      config: { allowAdditionalPropertiesIfMissing: true },
    });
    expect(view.current.entries.allowIfMissing).toBe(true);
    expect(view.current.entries.shouldShow).toBe(true);
    rerender({ schema: { type: 'object', additionalProperties: false } });
    expect(view.current.entries.allowIfMissing).toBe(false);
  });
  it('adds schema defaults and resets the draft name', () => {
    const { view, props, setName } = setup();
    act(view.current.actions.addProperty);
    expect(props.handleChange).toHaveBeenCalledWith('object', {
      fixed: 'keep',
      extra: 'remove',
      new: 'added',
    });
    expect(setName).toHaveBeenCalledWith('');
  });
  it.each(['', 'a.b', '__proto__'])(
    'preserves the literal key %s when adding',
    (name) => {
      const { view, props } = setup({}, name);
      act(view.current.actions.addProperty);
      const value = vi.mocked(props.handleChange).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(Object.hasOwn(value, name)).toBe(true);
      expect(value[name]).toBe('added');
    },
  );
  it.each([
    { enabled: false },
    { readonly: true },
    {
      schema: {
        type: 'object',
        maxProperties: 2,
        minProperties: 2,
        additionalProperties: true,
      },
    },
  ])('blocks guarded actions %#', (patch) => {
    const { view, props } = setup(patch);
    expect(view.current.actions.addPropertyDisabled).toBe(true);
    expect(view.current.actions.removePropertyDisabled).toBe(true);
    act(view.current.actions.addProperty);
    act(() => view.current.actions.removeProperty('extra'));
    expect(props.handleChange).not.toHaveBeenCalled();
  });
  it('blocks invalid names and required or declared property removal', () => {
    const { view, props } = setup(
      {
        schema: {
          type: 'object',
          properties: { fixed: {} },
          required: ['extra'],
          additionalProperties: true,
        },
      },
      'bad',
      'invalid',
    );
    act(view.current.actions.addProperty);
    act(() => {
      view.current.actions.removeProperty('extra');
      view.current.actions.removeProperty('fixed');
      view.current.actions.removeProperty('missing');
    });
    expect(props.handleChange).not.toHaveBeenCalled();
  });
  it('deletes a scalar extra property while respecting disableRemove', () => {
    const { view, props, rerender } = setup({
      uischema: {
        type: 'Control',
        scope: '#',
        options: { disableRemove: true },
      },
    });
    act(() => view.current.actions.removeProperty('extra'));
    expect(props.handleChange).not.toHaveBeenCalled();
    rerender({ uischema: { type: 'Control', scope: '#' } });
    act(() => view.current.actions.removeProperty('extra'));
    expect(props.handleChange).toHaveBeenCalledWith('object', {
      fixed: 'keep',
    });
  });
  it('permits schema count and required overrides through restrict false', () => {
    const { view, props } = setup({
      schema: {
        type: 'object',
        minProperties: 2,
        maxProperties: 2,
        required: ['extra'],
        additionalProperties: true,
      },
      uischema: { type: 'Control', scope: '#', options: { restrict: false } },
    });
    act(view.current.actions.addProperty);
    act(() => view.current.actions.removeProperty('extra'));
    expect(props.handleChange).toHaveBeenCalledTimes(2);
  });
});

describe('dynamic property context', () => {
  it.each([true, false])(
    'protects only the exact property path when schema is supplied: %s',
    (supplied) => {
      let child!: ReturnType<typeof useJsonForms>;
      let exact = false;
      let nested = true;
      function Child() {
        child = useJsonForms();
        exact = useDynamicProperty('extra');
        nested = useDynamicProperty('extra.child');
        return null;
      }
      const view = mountHook(() => null, {
        data: { extra: { child: 'old' } },
        render: () => (
          <DynamicPropertyProvider
            path='extra'
            schema={supplied ? { type: 'string', default: 'seed' } : undefined}
          >
            <Child />
          </DynamicPropertyProvider>
        ),
      });
      mounted.push(view);
      expect(exact).toBe(true);
      expect(nested).toBe(false);
      act(() => child.dispatch!(update('extra.child', () => undefined)));
      expect(view.context.core?.data).toEqual({ extra: {} });
      act(() => child.dispatch!(update('extra', () => undefined)));
      expect(view.context.core?.data).toEqual(supplied ? { extra: '' } : {});
      act(() => child.dispatch!(update('extra', () => 'new')));
      expect(view.context.core?.data).toEqual({ extra: 'new' });
    },
  );
  it.each([
    [{ type: 'string', default: 'seed' }, 'old', ''],
    [{}, 'old', ''],
    [{ type: 'integer', default: 7 }, 3, 7],
    [{}, 3, {}],
    [{ type: 'object' }, {}, {}],
  ])('clears using type-appropriate values %#', (schema, previous, expected) =>
    expect(clearedDynamicPropertyValue(schema, schema, previous)).toEqual(
      expected,
    ),
  );
});
