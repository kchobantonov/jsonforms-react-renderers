import { Layout, RuleEffect } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createExtendedRenderers,
  horizontalLayoutWidths,
  horizontalColumnsLayoutTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { splitLayoutTester } from '../src';

describe('horizontal column allocation', () => {
  test.each([
    [[4], [4], [0]],
    [[undefined], [16], [0]],
    [
      [4, 'auto'],
      [4, 12],
      [0, 0],
    ],
    [
      [4, null, undefined],
      [4, 6, 6],
      [0, 0, 0],
    ],
    [
      [4, 4],
      [4, 4],
      [0, 0],
    ],
    [
      [16, 'auto'],
      [16, 16],
      [0, 1],
    ],
    [
      [12, 8, 'auto'],
      [12, 8, 8],
      [0, 1, 1],
    ],
    [
      ['auto', 'auto', 'auto'],
      [16 / 3, 16 / 3, 16 / 3],
      [0, 0, 0],
    ],
    [Array(10).fill('auto'), Array(10).fill(1.6), Array(10).fill(0)],
    [
      [14, 'auto', 'auto'],
      [14, 2, 16],
      [0, 0, 1],
    ],
  ])('allocates %j in document order', (values, columns, rows) => {
    const result = horizontalLayoutWidths(values);
    expect(result.map((item) => item.columns)).toEqual(columns);
    expect(result.map((item) => item.row)).toEqual(rows);
  });

  test.each([1, 17, -2, 4.5, '4', '', false, {}, NaN, Infinity])(
    'diagnoses %s and falls back to Auto without rewriting it',
    (invalid) => {
      const values = Object.freeze([4, invalid]);
      const result = horizontalLayoutWidths(values);
      expect(result.map((item) => item.columns)).toEqual([4, 12]);
      expect(result[0].diagnostic).toBeUndefined();
      expect(result[1].diagnostic).toContain('integer from 2 through 16');
      expect(values[1]).toBe(invalid);
    }
  );

  test('includes gaps without normalizing fixed-only rows', () => {
    expect(horizontalLayoutWidths([4])[0].style.flex).toBe(
      '0 0 calc(25% - 1rem * 0)'
    );
    expect(
      horizontalLayoutWidths([4, 4]).map((item) => item.style.flex)
    ).toEqual(['0 0 calc(25% - 1rem * 0.25)', '0 0 calc(25% - 1rem * 0.25)']);
    expect(horizontalLayoutWidths([])).toEqual([]);
  });
});

const render = (layout: Layout, data = {}) => {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <JsonForms
      schema={{}}
      uischema={layout}
      data={data}
      renderers={createExtendedRenderers()}
    />
  );
  return container;
};

describe('horizontal layout rendering', () => {
  test('allocates presentation elements and nested layouts, ignoring parent columns', () => {
    const container = render({
      type: 'HorizontalLayout',
      options: { columns: 2 },
      elements: [
        { type: 'Spacer', options: { columns: 4 } },
        {
          type: 'HorizontalLayout',
          elements: [{ type: 'Separator' }],
        } as Layout,
      ],
    });
    expect(
      Array.from(container.querySelectorAll('[data-columns]')).map((el) =>
        el.getAttribute('data-columns')
      )
    ).toEqual(['4', '12', '16']);
    expect(container.querySelector('hr')).not.toBeNull();
  });

  test('releases hidden children before wrapping and keeps disabled children', () => {
    const layout: Layout = {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Spacer',
          options: { columns: 12 },
          rule: {
            effect: RuleEffect.SHOW,
            condition: { scope: '#/properties/show', schema: { const: true } },
          },
        },
        {
          type: 'Separator',
          options: { columns: 8 },
          rule: {
            effect: RuleEffect.DISABLE,
            condition: { scope: '#', schema: {} },
          },
        },
        { type: 'Spacer' },
      ],
    };
    const shown = render(layout, { show: true });
    expect(shown.querySelectorAll('[data-columns-row]')).toHaveLength(2);
    const hidden = render(layout, { show: false });
    expect(hidden.querySelectorAll('[data-columns-row]')).toHaveLength(1);
    expect(
      Array.from(hidden.querySelectorAll('[data-columns]')).map((el) =>
        el.getAttribute('data-columns')
      )
    ).toEqual(['8', '8']);
    expect(hidden.querySelector('hr')).not.toBeNull();
    expect(render(layout, { show: true }).innerHTML).toBe(shown.innerHTML);
  });

  test('exposes invalid option diagnostics and hides the whole layout', () => {
    const layout: Layout = {
      type: 'HorizontalLayout',
      elements: [{ type: 'Spacer', options: { columns: '4' } }],
    };
    expect(
      render(layout)
        .querySelector('[data-columns-diagnostic]')
        ?.getAttribute('data-columns')
    ).toBe('16');
    expect(
      render({
        ...layout,
        rule: {
          effect: RuleEffect.HIDE,
          condition: { scope: '#', schema: {} },
        },
      }).innerHTML
    ).toBe('');
  });

  test('selects horizontal layouts below split layouts without affecting vertical layouts', () => {
    expect(
      horizontalColumnsLayoutTester({ type: 'VerticalLayout' }, {}, undefined)
    ).toBe(-1);
    const split = {
      type: 'HorizontalLayout',
      options: { variant: 'splitter' },
    };
    expect(horizontalColumnsLayoutTester(split, {}, undefined)).toBeLessThan(
      splitLayoutTester(split, {}, undefined)
    );
  });
});
