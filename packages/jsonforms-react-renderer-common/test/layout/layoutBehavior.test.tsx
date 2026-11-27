import React, { act } from 'react';
import { RuleEffect, createAjv, type UISchemaElement } from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  itemOptionsOf,
  itemSizing,
  containerStyle,
  resolveGap,
  resolveGridColumns,
  resolveWrap,
} from '../../src/layout/layoutSizing';
import {
  useGroupState,
  useGroupExpansion,
  useGroupHeaderTitle,
} from '../../src/layout/groupState';
import {
  useEffectiveElements,
  withAjvProps,
} from '../../src/layout/layoutContext';
import {
  useUiSchemaCycleGuard,
  UiSchemaCycleProvider,
} from '../../src/core/uiSchemaCycle';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((view) => view.unmount());
  vi.restoreAllMocks();
});
const element = (layout: unknown): UISchemaElement => ({
  type: 'Control',
  options: { layout },
});

describe('layout sizing fallbacks and constraints', () => {
  it.each([undefined, null, false, '', 'bad', -1, Infinity, 0, 1.5])(
    'rejects invalid grid %s and respects configured fallbacks',
    (gridColumns) => {
      expect(
        resolveGridColumns({ gridColumns } as any, {
          jsonformsExtended: { layoutDefaults: { gridColumns: 8 } },
        }),
      ).toBe(8);
      expect(
        resolveGridColumns(undefined, {
          jsonformsExtended: { layoutDefaults: { gridColumns } },
        }),
      ).toBe(16);
    },
  );
  it.each([undefined, null, '', -1, Infinity, false])(
    'ignores invalid dimensions %s with useful diagnostics',
    (value) => {
      const layout = {
        width: value,
        height: value,
        minWidth: value,
        maxWidth: value,
        minHeight: value,
        maxHeight: value,
      };
      for (const direction of ['row', 'column'] as const) {
        const result = itemSizing(element(layout), direction, 16, 8);
        expect(result.style.flex).toBe(
          direction === 'row' ? '1 1 0' : '0 0 auto',
        );
        expect(result.diagnostics.length).toBe(
          value === undefined ? 0 : value === null ? 4 : 5,
        );
      }
    },
  );
  it.each(['minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const)(
    'applies valid %s without changing the sizing mode',
    (constraint) => {
      const result = itemSizing(
        element({ [constraint]: '10rem', weight: 2 }),
        'row',
        16,
        8,
        120,
      );
      expect(result.style[constraint]).toBe('10rem');
      expect(result.style.flex).toBe('2 1 0');
    },
  );
  it.each([0, -1, 1.5, Infinity, '2'])('diagnoses unusable span %s', (span) => {
    expect(
      itemSizing(element({ span }), 'row', 16, 8).diagnostics[0],
    ).toContain('positive integer');
  });
  it.each([0, -1, Infinity, NaN, '2'])(
    'diagnoses unusable weight %s',
    (weight) => {
      expect(
        itemSizing(element({ weight }), 'column', 16, 8).diagnostics[0],
      ).toContain('finite number');
    },
  );
  it('applies fixed > span > weight > auto and vertical span diagnostics', () => {
    expect(
      itemSizing(element({ width: 0, span: 4, weight: 2 }), 'row', 16, 8).style
        .flex,
    ).toBe('0 0 0px');
    expect(itemSizing(element({ span: 99 }), 'row', 16, 8)).toEqual({
      style: { minWidth: 0, flex: '0 0 100%' },
      diagnostics: ['`span` 99 exceeds gridColumns 16; clamped to 16.'],
    });
    expect(
      itemSizing(element({ span: 4, weight: 2 }), 'column', 16, 8),
    ).toEqual({
      style: { minWidth: 0, flex: '2 1 auto' },
      diagnostics: ['`span` has no effect in a vertical layout; ignored.'],
    });
    expect(itemSizing(undefined, 'row', 16, 8, 100).style.minWidth).toBe(
      '100px',
    );
    expect(
      itemSizing(element({ minWidth: 0 }), 'row', 16, 8, 100).style.minWidth,
    ).toBe('0px');
  });
  it('resolves spacers along the parent main axis unless layout hints override them', () => {
    expect(
      itemSizing({ type: 'Spacer', size: 24 } as any, 'row', 16, 8).style.flex,
    ).toBe('0 0 24px');
    expect(
      itemSizing({ type: 'Spacer', size: '2rem' } as any, 'column', 16, 8).style
        .flex,
    ).toBe('0 0 2rem');
    expect(
      itemSizing(
        { type: 'Spacer', size: 24, options: { layout: { weight: 3 } } } as any,
        'row',
        16,
        8,
      ).style.flex,
    ).toBe('3 1 0');
    expect(
      itemOptionsOf({ type: 'Control', options: { layout: 'bad' } }),
    ).toBeUndefined();
  });
  it('honors explicit false and zero before defaults, then renderer defaults', () => {
    const config = {
      jsonformsExtended: { layoutDefaults: { gap: '2rem', wrap: true } },
    };
    expect(resolveGap({ gap: 0 }, config, 'row')).toBe(0);
    expect(resolveGap(undefined, config, 'column')).toBe('2rem');
    expect(
      resolveGap(undefined, undefined, 'column', { row: 1, column: 2 }),
    ).toBe(2);
    expect(resolveWrap({ wrap: false }, config)).toBe(false);
    expect(resolveWrap(undefined, config)).toBe(true);
    expect(
      resolveWrap(undefined, { jsonformsExtended: { layoutDefaults: 'bad' } }),
    ).toBe(false);
    expect(
      containerStyle(
        { align: 'end', justify: 'space-evenly', wrap: true },
        {},
        'row',
      ),
    ).toMatchObject({
      alignItems: 'flex-end',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
    });
  });
});

describe('layout hook behavior', () => {
  it('tracks collapse options, data presence, and changes to authored initial state', () => {
    let ui: UISchemaElement = {
      type: 'Group',
      options: { collapsible: true, collapsed: true, showDataIndicator: true },
      elements: [{ type: 'Control', scope: '#/properties/name' }],
    } as any;
    const view = mountHook(() => useGroupState(ui, 'nested'), {
      data: { nested: { name: 'present' } },
    });
    mounted.push(view);
    expect(view.current).toMatchObject({ collapsed: true, hasData: true });
    act(view.current.toggle);
    expect(view.current.collapsed).toBe(false);
    ui = { ...ui, options: { ...ui.options, collapsed: false } };
    view.rerender();
    expect(view.current.collapsed).toBe(false);
    view.replaceData({ nested: { name: '' } });
    expect(view.current.hasData).toBe(false);
    ui = { ...ui, options: {} };
    view.rerender();
    expect(view.current.collapsible).toBe(false);
  });
  it('inherits expansion defaults and translated header labels', () => {
    let header: UISchemaElement[] | undefined;
    const view = mountHook(() => ({
      expansion: useGroupExpansion(
        { type: 'Group' },
        { jsonformsExtended: { collapsible: true, collapsed: true } },
      ),
      title: useGroupHeaderTitle('', header),
    }));
    mounted.push(view);
    expect(view.current.expansion.collapsed).toBe(true);
    expect(view.current.title).toBeUndefined();
    header = [{ type: 'Label', text: 'Header' } as any];
    view.rerender();
    expect(view.current.title).toBe('Header');
    header = [{ type: 'Label', i18n: 'header', text: 'Fallback' } as any];
    view.rerender();
    expect(view.current.title).toBe('Fallback');
  });
  it('removes hidden children and safely retains malformed author rules', () => {
    let elements = [
      { type: 'Control' },
      null,
      {
        type: 'Control',
        rule: {
          effect: RuleEffect.HIDE,
          condition: { scope: '#', schema: { const: true } },
        },
      },
    ] as UISchemaElement[];
    const view = mountHook(() => useEffectiveElements(elements, ''), {
      data: true,
    });
    mounted.push(view);
    expect(view.current).toHaveLength(1);
    elements = [
      {
        type: 'Control',
        rule: {
          effect: RuleEffect.HIDE,
          condition: { scope: '#', schema: { type: 'invalid' } },
        },
      },
    ] as any;
    view.rerender();
    expect(view.current).toHaveLength(1);
    view.rerender({ core: undefined });
    expect(view.current).toHaveLength(1);
  });
  it('injects the exact parent Ajv instance', () => {
    const ajv = createAjv();
    let actual: unknown;
    const Component = withAjvProps<{ label: string }>(
      ({ ajv: value, label }) => {
        actual = value;
        return <span>{label}</span>;
      },
    );
    const view = mountHook(() => null, {
      context: { core: { ajv } as any },
      render: () => <Component label='injected' />,
    });
    mounted.push(view);
    expect(actual).toBe(ajv);
    expect(view.container.textContent).toBe('injected');
  });
  it('detects only ancestor cycles at the same path and warns once per effect', () => {
    let ui: UISchemaElement | undefined = {
      type: 'Control',
      scope: '#',
    } as any;
    let nestedPath = '';
    let cycle = false;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Child() {
      cycle = useUiSchemaCycleGuard(ui, nestedPath, 'Test').cycle;
      return null;
    }
    const view = mountHook(() => useUiSchemaCycleGuard(ui, '', 'Test'), {
      render: (result) => (
        <UiSchemaCycleProvider stack={result.stack}>
          <Child />
        </UiSchemaCycleProvider>
      ),
    });
    mounted.push(view);
    expect(cycle).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    nestedPath = 'child';
    view.rerender();
    expect(cycle).toBe(false);
    ui = undefined;
    view.rerender();
    expect(view.current.cycle).toBe(false);
  });
});
