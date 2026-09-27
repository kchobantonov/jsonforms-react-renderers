import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import {
  tupleControlTester,
  tupleDefinition,
  tupleEmptyValue,
  tupleInitialValue,
  tupleRenderSchema,
} from '../src/util/tuple';

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 400) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const setNativeValue = (field: HTMLInputElement, value: string) =>
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!.call(field, value);

interface RenderOptions {
  properties: Record<string, any>;
  data?: Record<string, unknown>;
  options?: Record<string, unknown>;
  uischemas?: any[];
  property?: string;
}

const render = ({
  properties,
  data = {},
  options,
  uischemas,
  property = 'pair',
}: RenderOptions) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const schema = { type: 'object', properties };
  let latest: any = data;

  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: `#/properties/${property}`,
              ...(options ? { options } : {}),
            } as any
          }
          uischemas={uischemas}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );

  const fields = () =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-tuple-field]'));
  const inputs = () =>
    Array.from(container.querySelectorAll<HTMLInputElement>('input'));

  const type = async (field: HTMLInputElement, text: string) => {
    act(() => field.focus());
    setNativeValue(field, text);
    act(() => {
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    /*
      Two flushes, not one long one. The control debounces its commit by 300ms;
      that dispatch re-renders the form, and JsonForms only reports the new data
      to `onChange` from an effect afterwards. Effects run when an `act` block
      ends, so a single 800ms window sees the commit but never the report -
      which looks exactly like a write that did not happen.
    */
    await settle();
    await settle();
  };

  const click = async (element: Element | null) => {
    act(() => {
      (element as HTMLElement)?.click();
    });
    await settle(60);
  };

  return {
    container,
    fields,
    inputs,
    type,
    click,
    stored: () => latest[property],
    text: () => container.textContent ?? '',
    unmount: () => act(() => root.unmount()),
  };
};

const pairSchema = {
  type: 'array',
  items: [
    { type: 'string', title: 'Product code' },
    { type: 'integer', title: 'Quantity', minimum: 1 },
  ],
  additionalItems: false,
};

// ---------------------------------------------------------------- selection

describe('recognizing a tuple schema', () => {
  const context = (root: any) => ({ rootSchema: root, config: {} });
  const control = (options?: Record<string, unknown>) =>
    ({ type: 'Control', scope: '#/properties/pair', options } as any);

  it('takes a draft-07 positional array with no variant asked for', () => {
    const root = { type: 'object', properties: { pair: pairSchema } };
    expect(tupleControlTester(control(), root as any, context(root))).toBe(25);
  });

  it('takes a 2020-12 prefixItems array, and reads items as the tail', () => {
    const schema = {
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
      items: { type: 'string' },
    };
    const definition = tupleDefinition(schema as any)!;
    expect(definition.prefix).toHaveLength(2);
    // Read the other way round, one position would become every position.
    expect(definition.tail).toEqual({ type: 'string' });
  });

  it('defaults an absent tail to open in both dialects', () => {
    expect(
      tupleDefinition({ type: 'array', items: [{ type: 'string' }] } as any)!
        .tail
    ).toBe(true);
    expect(
      tupleDefinition({
        type: 'array',
        prefixItems: [{ type: 'string' }],
      } as any)!.tail
    ).toBe(true);
  });

  it('closes the tail when the schema forbids one', () => {
    expect(tupleDefinition(pairSchema as any)!.tail).toBe(false);
  });

  /*
    Section 18: equal bounds alone "do not change the presentation of existing
    uniform-array controls".
  */
  it('leaves a uniform fixed-length array alone unless asked', () => {
    const uniform = {
      type: 'array',
      items: { type: 'number' },
      minItems: 3,
      maxItems: 3,
    };
    expect(tupleDefinition(uniform as any)).toBeUndefined();
    const root = { type: 'object', properties: { pair: uniform } };
    expect(tupleControlTester(control(), root as any, context(root))).toBe(-1);
  });

  it('expands a uniform fixed-length array when the variant asks', () => {
    const definition = tupleDefinition(
      {
        type: 'array',
        items: { type: 'number' },
        minItems: 3,
        maxItems: 3,
      } as any,
      true
    )!;
    expect(definition.prefix).toHaveLength(3);
    expect(definition.prefix[0]).toEqual({ type: 'number' });
    // A uniform tuple is exactly as long as it declares.
    expect(definition.tail).toBe(false);
  });

  it('refuses to guess a count from unequal or missing bounds', () => {
    for (const bounds of [
      { minItems: 2, maxItems: 3 },
      { minItems: 2 },
      { maxItems: 2 },
      {},
      { minItems: -1, maxItems: -1 },
      { minItems: 1.5, maxItems: 1.5 },
    ]) {
      expect(
        tupleDefinition(
          { type: 'array', items: { type: 'number' }, ...bounds } as any,
          true
        )
      ).toBeUndefined();
    }
  });

  it('is not a tuple if it is not an array', () => {
    expect(tupleDefinition({ type: 'object' } as any, true)).toBeUndefined();
  });

  /*
    The renderer must still win for an unsupported configuration, because
    section 18 requires a diagnostic and something has to render it.
  */
  it('still claims a control that asked for the variant it cannot have', () => {
    const uniform = { type: 'array', items: { type: 'number' } };
    const root = { type: 'object', properties: { pair: uniform } };
    expect(
      tupleControlTester(
        control({ variant: 'tuple' }),
        root as any,
        context(root)
      )
    ).toBe(25);
  });

  it('ignores anything that is not a control', () => {
    const root = { type: 'object', properties: { pair: pairSchema } };
    expect(
      tupleControlTester(
        { type: 'VerticalLayout' } as any,
        root as any,
        context(root)
      )
    ).toBe(-1);
  });
});

// ------------------------------------------------------- initial and empty

describe('what a position starts and ends life as', () => {
  const root = { type: 'object' } as any;

  it('uses the supported type initial value', () => {
    expect(tupleInitialValue({ type: 'string' }, root)).toBe('');
    expect(tupleInitialValue({ type: 'number' }, root)).toBe(0);
    expect(tupleInitialValue({ type: 'integer' }, root)).toBe(0);
    expect(tupleInitialValue({ type: 'boolean' }, root)).toBe(false);
    expect(tupleInitialValue({ type: 'null' }, root)).toBeNull();
    expect(tupleInitialValue({ type: 'array' }, root)).toEqual([]);
  });

  it('prefers an explicit default, deep-copied', () => {
    const schema = { type: 'object', default: { a: [1] } } as any;
    const first = tupleInitialValue(schema, root) as any;
    const second = tupleInitialValue(schema, root) as any;
    expect(first).toEqual({ a: [1] });
    // Two positions sharing a schema must not share its default object.
    expect(first.a).not.toBe(second.a);
  });

  it('gives no answer where the schema has none', () => {
    expect(tupleInitialValue(true, root)).toBeUndefined();
    expect(tupleInitialValue({}, root)).toBeUndefined();
    expect(
      tupleInitialValue({ type: ['string', 'number'] } as any, root)
    ).toBeUndefined();
  });

  /*
    "Absence and emptiness are distinct." Clearing is not the same question as
    initializing: a number initializes to 0 but has no empty value at all.
  */
  it('distinguishes an empty value from an initial one', () => {
    expect(tupleEmptyValue({ type: 'string' }, root)).toBe('');
    expect(tupleEmptyValue({ type: 'object' }, root)).toEqual({});
    expect(tupleEmptyValue({ type: 'array' }, root)).toEqual([]);
    expect(tupleEmptyValue({ type: 'number' }, root)).toBeUndefined();
    expect(tupleEmptyValue({ type: 'integer' }, root)).toBeUndefined();
    expect(tupleEmptyValue({ type: 'boolean' }, root)).toBeUndefined();
    expect(
      tupleEmptyValue({ type: ['string', 'null'] } as any, root)
    ).toBeNull();
  });

  it('names every type for an unconstrained position, so the mixed control takes it', () => {
    expect(tupleRenderSchema(true).type).toContain('object');
    expect(tupleRenderSchema({}).type).toContain('null');
    expect(tupleRenderSchema({ type: 'string' })).toEqual({ type: 'string' });
  });
});

// ---------------------------------------------------------------- rendering

describe('rendering the declared positions', () => {
  it('draws one field per position, titled from its schema', () => {
    const { fields, text, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3] },
    });
    expect(fields()).toHaveLength(2);
    expect(text()).toContain('Product code');
    expect(text()).toContain('Quantity');
    unmount();
  });

  it('falls back to a localized position label, numbered from one', () => {
    const { text, unmount } = render({
      properties: {
        pair: {
          type: 'array',
          items: [{ type: 'string' }, { type: 'string' }],
        },
      },
    });
    // The data path stays zero-based; only what is shown is one-based.
    expect(text()).toContain('Item 1');
    expect(text()).toContain('Item 2');
    unmount();
  });

  it('renders every position even when the data is missing', () => {
    const { fields, stored, unmount } = render({
      properties: { pair: pairSchema },
      data: {},
    });
    expect(fields()).toHaveLength(2);
    // Rendering must not populate the array.
    expect(stored()).toBeUndefined();
    unmount();
  });

  it('lays out in a row by default and a column when asked', () => {
    const row = render({ properties: { pair: pairSchema } });
    expect(
      row.container.querySelector<HTMLElement>('[data-tuple-fields]')!.style
        .flexDirection
    ).toBe('row');
    row.unmount();

    const column = render({
      properties: { pair: pairSchema },
      options: { vertical: true },
    });
    expect(
      column.container.querySelector<HTMLElement>('[data-tuple-fields]')!.style
        .flexDirection
    ).toBe('column');
    column.unmount();
  });

  it('draws a border by default and drops it on request', () => {
    const bordered = render({ properties: { pair: pairSchema } });
    expect(
      bordered.container.querySelector<HTMLElement>('[data-tuple-control]')!
        .style.border
    ).not.toBe('');
    bordered.unmount();

    const bare = render({
      properties: { pair: pairSchema },
      options: { showBorder: false },
    });
    expect(
      bare.container.querySelector<HTMLElement>('[data-tuple-control]')!.style
        .border
    ).toBe('');
    bare.unmount();
  });

  it('reports an unsupported configuration instead of guessing', () => {
    const { container, text, unmount } = render({
      properties: { pair: { type: 'array', items: { type: 'number' } } },
      options: { variant: 'tuple' },
    });
    expect(container.querySelector('[data-tuple-diagnostic]')).toBeTruthy();
    expect(text()).toContain('positional schemas');
    unmount();
  });
});

// ------------------------------------------------------------------ writing

describe('editing a position', () => {
  it('writes at its own index', async () => {
    const { inputs, type, stored, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3] },
    });
    await type(inputs()[0], 'B-02');
    expect(stored()).toEqual(['B-02', 3]);
    unmount();
  });

  /*
    The example from section 18: "for schemas [string, integer], editing the
    second field to 30 while data is [] produces ["", 30]".
  */
  it('fills the positions before it, in one update', async () => {
    const { inputs, type, stored, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: [] },
    });
    await type(inputs()[1], '30');
    expect(stored()).toEqual(['', 30]);
    unmount();
  });

  it('fills a numeric prefix with zero, not with a hole', async () => {
    const { inputs, type, stored, unmount } = render({
      properties: {
        pair: {
          type: 'array',
          items: [
            { type: 'number', title: 'X' },
            { type: 'number', title: 'Y' },
          ],
          additionalItems: false,
        },
      },
      data: { pair: [] },
    });
    await type(inputs()[1], '34');
    const value = stored();
    expect(value).toEqual([0, 34]);
    // A hole would still have length 2 but no own property at index 0.
    expect(Object.prototype.hasOwnProperty.call(value, '0')).toBe(true);
    unmount();
  });

  it('holds the edit and names the blocking position when it cannot fill one', async () => {
    const { inputs, type, stored, text, unmount } = render({
      properties: {
        pair: {
          type: 'array',
          // No single supported type, so no initial value exists for it.
          items: [{ type: ['string', 'number'] }, { type: 'string' }],
          additionalItems: false,
        },
      },
      data: { pair: [] },
    });
    const last = inputs()[inputs().length - 1];
    await type(last, 'later');
    expect(stored()).toEqual([]);
    expect(text()).toContain('Item 1');
    unmount();
  });

  it('keeps an empty string when a string position is cleared', async () => {
    const { inputs, type, stored, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3] },
    });
    await type(inputs()[0], '');
    // Never spliced, never a hole, never undefined in the slot.
    expect(stored()).toEqual(['', 3]);
    unmount();
  });

  it('holds a cleared number as a draft rather than writing a zero', async () => {
    const { inputs, type, stored, container, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3] },
    });
    await type(inputs()[1], '');
    expect(stored()).toEqual(['A-01', 3]);
    expect(container.querySelector('[data-tuple-draft]')).toBeTruthy();
    unmount();
  });
});

// ---------------------------------------------------------- additional items

describe('the additional items section', () => {
  const withTail = {
    type: 'array',
    items: [
      { type: 'string', title: 'Record ID' },
      { type: 'boolean', title: 'Approved' },
    ],
    additionalItems: { type: 'string', title: 'Note' },
    minItems: 2,
    maxItems: 4,
  };

  it('is absent when the schema forbids a tail and the data has none', () => {
    const { container, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3] },
    });
    expect(container.querySelector('[data-tuple-additional]')).toBeNull();
    unmount();
  });

  it('appends a trailing value using the tail schema', async () => {
    const { container, click, stored, unmount } = render({
      properties: { pair: withTail },
      data: { pair: ['A-01', false] },
    });
    await click(container.querySelector('[data-tuple-add]'));
    expect(stored()).toEqual(['A-01', false, '']);
    unmount();
  });

  it('offers Delete only past the declared prefix', async () => {
    const { container, click, stored, unmount } = render({
      properties: { pair: withTail },
      data: { pair: ['A-01', false, 'Call first'] },
    });
    // There is no Delete affordance on a declared position at all, which is
    // what makes "no Add, Delete, or Reorder actions for the declared
    // positions" true of the interface rather than only of the handler.
    expect(container.querySelector('[data-tuple-delete="0"]')).toBeNull();
    expect(container.querySelector('[data-tuple-delete="1"]')).toBeNull();
    await click(container.querySelector('[data-tuple-delete="2"]'));
    expect(stored()).toEqual(['A-01', false]);
    unmount();
  });

  it('stops adding at maxItems while restrict is on', () => {
    const { container, unmount } = render({
      properties: { pair: withTail },
      data: { pair: ['A-01', false, 'a', 'b'] },
      options: { restrict: true },
    });
    expect(
      container.querySelector<HTMLButtonElement>('[data-tuple-add]')!.disabled
    ).toBe(true);
    unmount();
  });

  it('reports rather than prevents when restrict is off', () => {
    const { container, unmount } = render({
      properties: { pair: withTail },
      data: { pair: ['A-01', false, 'a', 'b'] },
      options: { restrict: false },
    });
    expect(
      container.querySelector<HTMLButtonElement>('[data-tuple-add]')!.disabled
    ).toBe(false);
    unmount();
  });

  it('honours disableAdd and disableRemove', () => {
    const { container, unmount } = render({
      properties: { pair: withTail },
      data: { pair: ['A-01', false, 'a'] },
      options: { disableAdd: true, disableRemove: true },
    });
    expect(
      container.querySelector<HTMLButtonElement>('[data-tuple-add]')!.disabled
    ).toBe(true);
    expect(
      container.querySelector<HTMLButtonElement>('[data-tuple-delete="2"]')!
        .disabled
    ).toBe(true);
    unmount();
  });

  /*
    "If the tail is forbidden or existing values exceed the permitted count,
    preserve those values and expose ... an explicit corrective removal action;
    never truncate on load."
  */
  it('keeps an excess value a closed schema forbids, and offers to remove it', async () => {
    const { container, click, stored, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 3, 'remove me'] },
    });
    expect(stored()).toEqual(['A-01', 3, 'remove me']);
    const remove = container.querySelector('[data-tuple-delete="2"]');
    expect(remove).toBeTruthy();
    // Add stays shut: the schema still forbids a tail.
    expect(
      container.querySelector<HTMLButtonElement>('[data-tuple-add]')!.disabled
    ).toBe(true);
    await click(remove);
    expect(stored()).toEqual(['A-01', 3]);
    unmount();
  });
});

// ----------------------------------------------------------------- validation

describe('where errors appear', () => {
  it('puts an array-level error beneath the tuple, not on its positions', async () => {
    const { container, unmount } = render({
      properties: {
        pair: { ...pairSchema, minItems: 2 },
      },
      data: { pair: ['A-01'] },
    });
    await settle(60);
    const explain = container.querySelector('.ant-form-item-explain');
    expect(explain?.textContent).toContain('2 items');
    // The positions themselves are not marked invalid by an array-length error.
    const fieldErrors = container.querySelectorAll(
      '[data-tuple-field] .ant-form-item-has-error'
    );
    expect(fieldErrors).toHaveLength(0);
    unmount();
  });

  it('puts a position error beside that position', async () => {
    const { container, unmount } = render({
      properties: { pair: pairSchema },
      data: { pair: ['A-01', 0] },
    });
    await settle(60);
    const invalid = container.querySelectorAll(
      '[data-tuple-field] .ant-form-item-has-error'
    );
    expect(invalid.length).toBeGreaterThan(0);
    // and it is the second position, not the first
    expect(
      container
        .querySelector('[data-tuple-field="0"]')!
        .querySelector('.ant-form-item-has-error')
    ).toBeNull();
    unmount();
  });
});

// ------------------------------------------------------------ complex values

describe('a complex position', () => {
  const complexSchema = {
    type: 'array',
    items: [
      {
        type: 'object',
        title: 'Address',
        properties: {
          street: { type: 'string', title: 'Street' },
          city: { type: 'string', title: 'City' },
        },
      },
      { type: 'array', title: 'Phone numbers', items: { type: 'string' } },
    ],
    additionalItems: false,
  };

  const uischemas = [
    {
      tester: (schema: any) => (schema.title === 'Address' ? 10 : -1),
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          summary: { type: 'Control', scope: '#/properties/street' },
          detail: {
            type: 'VerticalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/street' },
              { type: 'Control', scope: '#/properties/city' },
            ],
          },
        },
      },
    },
  ];

  it('shows a summary from the registered descriptor, with an edit action', () => {
    const { container, text, unmount } = render({
      properties: { pair: complexSchema },
      data: { pair: [{ street: 'Main Street' }, ['+359 2 123 4567']] },
      uischemas,
    });
    expect(text()).toContain('Main Street');
    expect(container.querySelector('[aria-label="Edit Address"]')).toBeTruthy();
    unmount();
  });

  it('says so when a position has no value, without creating one', () => {
    const { text, stored, unmount } = render({
      properties: { pair: complexSchema },
      data: {},
      uischemas,
    });
    expect(text()).toContain('Not set');
    expect(stored()).toBeUndefined();
    unmount();
  });

  it('summarises an array position by count when nothing previews it', () => {
    const { text, unmount } = render({
      properties: { pair: complexSchema },
      data: { pair: [{ street: 'Main Street' }, ['a', 'b']] },
      uischemas,
    });
    expect(text()).toContain('2 items');
    unmount();
  });

  it('opens a dialog that writes nothing until it is applied', async () => {
    const { container, click, stored, unmount } = render({
      properties: { pair: complexSchema },
      data: { pair: [{ street: 'Main Street' }, []] },
      uischemas,
    });
    await click(container.querySelector('[aria-label="Edit Address"]'));
    expect(document.body.textContent).toContain('City');
    expect(stored()).toEqual([{ street: 'Main Street' }, []]);
    unmount();
  });
});

/*
  `options.detail` — a UI schema that places the fixed positions.

  The same name and the same meaning every other container control gives it: a
  UI schema whose scopes resolve against this control's own schema. For a tuple
  that is `#/items/N`, and `#/items/N/...` to reach inside a position.

  Not `options.layout` - the specification reserves that for how a control
  sizes itself inside **its parent**.

  Positions keep going through `TupleField` wherever the layout puts them, so a
  position stays a position - label, complex summary, dialog - rather than
  degrading into an ordinary control.
*/
describe('a supplied position layout', () => {
  const triple = {
    type: 'array',
    title: 'Survey point',
    items: [
      { type: 'number', title: 'Latitude' },
      { type: 'number', title: 'Longitude' },
      { type: 'number', title: 'Elevation' },
    ],
    minItems: 3,
    additionalItems: false,
  };
  const draw = (layout?: any, data: any = { pair: [45.5, -122.6, 15.2] }) =>
    render({
      properties: { pair: triple },
      data,
      options: layout ? { detail: layout } : undefined,
    });

  /*
    Scoped to the fields region: the tuple's own Form.Item labels the whole
    control ("Survey point") and would otherwise be counted as a position.
  */
  const labelled = (view: ReturnType<typeof render>) =>
    Array.from(
      view.container.querySelectorAll('[data-tuple-fields] .ant-form-item')
    )
      .map((item) => item.querySelector('label')?.textContent ?? '')
      .filter(Boolean);

  it('is not used when absent, leaving the default row', async () => {
    const view = draw();
    await settle(60);
    expect(labelled(view)).toEqual(['Latitude', 'Longitude', 'Elevation']);
    expect(view.container.querySelector('[data-tuple-layout]')).toBeNull();
    view.unmount();
  });

  /*
    The point of the feature: position order in the form need not be position
    order in the data. The *values* are what prove the binding survived the
    reorder - Longitude still reads -122.6 after moving to the front.
  */
  it('reorders the positions without moving the data', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/items/1' },
        { type: 'Control', scope: '#/items/0' },
        { type: 'Control', scope: '#/items/2' },
      ],
    });
    await settle(60);
    expect(labelled(view)).toEqual(['Longitude', 'Latitude', 'Elevation']);
    const values = view.inputs().map((input) => input.value);
    expect(values).toEqual(['-122.6', '45.5', '15.2']);
    // The stored array is untouched: this is presentation, not reordering.
    expect(view.stored()).toEqual([45.5, -122.6, 15.2]);
    view.unmount();
  });

  /*
    The layout is dispatched, not interpreted, so a Group here is the ordinary
    Group renderer - with the collapse state, indicators and everything else it
    already does. Re-implementing a layout inside the tuple would have meant
    reproducing all of that.
  */
  it('renders a real Group, with its label', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Group',
          label: 'Ground position',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                { type: 'Control', scope: '#/items/0' },
                { type: 'Control', scope: '#/items/1' },
              ],
            },
          ],
        },
        { type: 'Control', scope: '#/items/2' },
      ],
    });
    await settle(60);
    expect(view.text()).toContain('Ground position');
    expect(
      view.container.querySelectorAll('.ant-card-head-title').length
    ).toBeGreaterThan(0);
    expect(labelled(view)).toEqual(['Latitude', 'Longitude', 'Elevation']);
    view.unmount();
  });

  /* `prefixItems` is the draft 2020-12 spelling of the same thing. */
  it('accepts either scope spelling', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/prefixItems/2' }],
    });
    await settle(60);
    expect(labelled(view)).toEqual(['Elevation']);
    view.unmount();
  });

  /*
    Omitting a position is allowed, and is the reason the next three tests
    exist. The data behind a hidden position is still validated - "hiding a
    control does not discard its underlying errors or exempt its data from
    validation" - so an error there would otherwise leave the form invalid with
    nothing on screen saying why. The tuple reports it instead, named, because
    the field that would have identified it is not drawn.
  */
  describe('a position the layout leaves out', () => {
    const bounded = {
      type: 'array',
      title: 'Survey point',
      items: [
        { type: 'number', title: 'Latitude' },
        { type: 'number', title: 'Longitude', minimum: 0 },
        { type: 'number', title: 'Elevation' },
      ],
      minItems: 3,
      additionalItems: false,
    };
    const drawBounded = (layout: any, values: number[]) =>
      render({
        properties: { pair: bounded },
        data: { pair: values },
        options: { detail: layout },
      });
    const messages = (view: ReturnType<typeof render>) =>
      Array.from(view.container.querySelectorAll('.ant-form-item-explain')).map(
        (item) => item.textContent ?? ''
      );

    it('still reports its error, naming the position', async () => {
      const view = drawBounded(
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/items/0' },
            { type: 'Control', scope: '#/items/2' },
          ],
        },
        [45.5, -122.6, 15.2]
      );
      await settle(60);
      expect(labelled(view)).toEqual(['Latitude', 'Elevation']);
      // Named, because the field it belongs to is not on screen.
      expect(messages(view)).toContain('Longitude: must be >= 0');
      view.unmount();
    });

    /* Shown positions keep reporting beside themselves, once. */
    it('does not duplicate the message when the position is shown', async () => {
      const view = drawBounded(
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/items/1' },
            { type: 'Control', scope: '#/items/0' },
          ],
        },
        [45.5, -122.6, 15.2]
      );
      await settle(60);
      const shown = messages(view);
      expect(shown).toContain('must be >= 0');
      expect(shown).not.toContain('Longitude: must be >= 0');
      view.unmount();
    });

    it('says nothing when the hidden position is valid', async () => {
      const view = drawBounded(
        {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/items/1' }],
        },
        [45.5, 122.6, 15.2]
      );
      await settle(60);
      expect(messages(view)).toHaveLength(0);
      view.unmount();
    });
  });

  /*
    A scope may reach *into* a position, not just name one. Everything in the
    layout resolves against the tuple, so `#/items/0` is a position and
    `#/items/0/properties/city` is a field inside it - one scope base, however
    deep you go.
  */
  describe('a scope reaching inside a position', () => {
    const mixed = {
      type: 'array',
      title: 'Pickup',
      items: [
        {
          type: 'object',
          title: 'Address',
          properties: {
            street: { type: 'string', title: 'Street' },
            city: { type: 'string', title: 'City' },
          },
        },
        { type: 'number', title: 'Rank' },
      ],
      additionalItems: false,
    };
    const drawMixed = (layout: any) =>
      render({
        properties: { pair: mixed },
        data: { pair: [{ street: 'Main Street', city: 'Portland' }, 3] },
        options: { detail: layout },
      });

    it('renders the field the scope points at', async () => {
      const view = drawMixed({
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/items/0/properties/city' }],
      });
      await settle(60);
      expect(labelled(view)).toEqual(['City']);
      expect(view.inputs().map((input) => input.value)).toEqual(['Portland']);
      view.unmount();
    });

    /*
      This is the case that does not work by dispatching alone. A tester
      resolves a scope only when the enclosing schema is an object -
      `schemaMatches` guards on `hasType(schema, 'object')` - and a tuple's is
      an array, so the control would be handed the whole array schema, match
      no renderer and render blank. The position renderer re-roots it.
    */
    it('mixes whole positions with paths inside them', async () => {
      const view = drawMixed({
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/items/1' },
          { type: 'Control', scope: '#/items/0/properties/city' },
          { type: 'Control', scope: '#/items/0' },
        ],
      });
      await settle(60);
      expect(labelled(view)).toEqual(['Rank', 'City']);
      // The whole-position element still gets the complex-position treatment.
      expect(
        view.container.querySelector('[aria-label="Edit Address"]')
      ).toBeTruthy();
      view.unmount();
    });

    it('writes through to the right place in the data', async () => {
      const view = drawMixed({
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/items/0/properties/city' }],
      });
      await settle(60);
      await view.type(view.inputs()[0], 'Salem');
      expect(view.stored()).toEqual([
        { street: 'Main Street', city: 'Salem' },
        3,
      ]);
      view.unmount();
    });
  });

  /*
    The two `detail`s live on different elements and do different jobs, and
    this is the test that keeps them apart:

    - on the **tuple's** Control, `detail` lays out the positions, scoped
      against the tuple (`#/items/N`);
    - on a **position's** Control, which the registry supplies, `detail` is
      that position's dialog, scoped against the position's value.

    A tuple-wide `detail` is deliberately *not* forwarded into the position
    lookup. It used to be, applying one dialog layout to every complex position
    whatever its schema - and crashing on an array-typed one.
  */
  it('leaves a position dialog to the registry', async () => {
    const view = render({
      properties: {
        pair: {
          type: 'array',
          title: 'Pickup',
          items: [
            {
              type: 'object',
              title: 'Address',
              properties: {
                street: { type: 'string', title: 'Street' },
                city: { type: 'string', title: 'City' },
              },
            },
            { type: 'number', title: 'Rank' },
          ],
          additionalItems: false,
        },
      },
      data: { pair: [{ street: 'Main Street', city: 'Portland' }, 3] },
      uischemas: [
        {
          tester: (schema: any) => (schema.title === 'Address' ? 10 : -1),
          uischema: {
            type: 'Control',
            scope: '#',
            options: {
              summary: { type: 'Control', scope: '#/properties/street' },
              // Scoped against the POSITION's value, not the tuple.
              detail: {
                type: 'VerticalLayout',
                elements: [{ type: 'Control', scope: '#/properties/city' }],
              },
            },
          },
        },
      ],
      // Scoped against the TUPLE. The two must not be confused.
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/items/1' },
            { type: 'Control', scope: '#/items/0' },
          ],
        },
      },
    });
    await settle(60);

    // The tuple's detail placed the positions: Rank first.
    expect(labelled(view)).toEqual(['Rank']);
    expect(view.text()).toContain('Main Street');

    // The registry's detail still supplies the dialog: City, not Street.
    await view.click(
      view.container.querySelector('[aria-label="Edit Address"]')
    );
    await settle(60);
    const dialog = document.querySelector('.ant-modal');
    expect(dialog).toBeTruthy();
    const dialogLabels = Array.from(dialog!.querySelectorAll('label')).map(
      (label) => label.textContent
    );
    expect(dialogLabels).toContain('City');
    view.unmount();
  });

  /* A layout may show part of a tuple; the rest is absent, not blank. */
  it('renders only the positions it names', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/items/2' }],
    });
    await settle(60);
    expect(labelled(view)).toEqual(['Elevation']);
    expect(view.inputs().map((input) => input.value)).toEqual(['15.2']);
    view.unmount();
  });

  /* A position the schema does not declare renders nothing, rather than
     inventing one or throwing. */
  it('ignores an index the schema does not declare', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/items/9' },
        { type: 'Control', scope: '#/items/0' },
      ],
    });
    await settle(60);
    expect(labelled(view)).toEqual(['Latitude']);
    view.unmount();
  });

  /*
    Same rule as the object control's detail: an object with no `type` is not a
    layout, so it is ignored and the default row is used.
  */
  it('ignores a position layout object with no type', async () => {
    const view = draw({
      elements: [{ type: 'Control', scope: '#/items/2' }],
    } as any);
    await settle(60);
    expect(labelled(view)).toEqual(['Latitude', 'Longitude', 'Elevation']);
    view.unmount();
  });

  /* `vertical` describes the default row or column, which a layout replaces. */
  it('supersedes the vertical option', async () => {
    const view = render({
      properties: { pair: triple },
      data: { pair: [45.5, -122.6, 15.2] },
      options: {
        vertical: true,
        detail: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/items/1' }],
        },
      },
    });
    await settle(60);
    expect(labelled(view)).toEqual(['Longitude']);
    view.unmount();
  });

  /*
    A position inside a layout is still a tuple position: editing it writes to
    its own index, not to the slot it appears in.
  */
  it('writes to the position, not to where it is shown', async () => {
    const view = draw({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/items/2' },
        { type: 'Control', scope: '#/items/0' },
      ],
    });
    await settle(60);
    // The first field on screen is Elevation, which is index 2.
    await view.type(view.inputs()[0], '99');
    expect(view.stored()).toEqual([45.5, -122.6, 99]);
    view.unmount();
  });
});
