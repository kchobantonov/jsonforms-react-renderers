import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import { UI_SCHEMA_CYCLE_DIAGNOSTIC } from '../src/util/uiSchemaCycle';

/**
 * A UI-schema registry entry that resolves to itself.
 *
 * `ObjectRenderer` asks the registry for the UI schema of the object it is
 * rendering and dispatches the answer **at the same path**. If the answer is a
 * `Control` matching that same schema, the dispatch selects `ObjectRenderer`
 * again, which asks the registry the same question - and React builds the tree
 * until the heap runs out.
 *
 * **A regression here does not fail, it aborts.** Nothing throws: an
 * infinitely deep tree is legal, so the process dies with
 * "JavaScript heap out of memory" and no stack worth reading. If this file
 * takes the run down rather than failing, that is what happened, and the guard
 * in `util/uiSchemaCycle.tsx` is where to look.
 *
 * This was recorded for a long time as a *tuple* defect that struck only when
 * a dialog was opened. It is neither: no tuple and no dialog are needed, and
 * it is the entry with the **least** configuration that hangs.
 */

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 120) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const objectSchema = {
  type: 'object',
  properties: {
    address: {
      type: 'object',
      title: 'Address',
      properties: {
        street: { type: 'string', title: 'Street' },
        city: { type: 'string', title: 'City' },
      },
    },
  },
} as any;

const addressTester = (schema: any) => (schema.title === 'Address' ? 10 : -1);

const draw = (entry: unknown, schema: any = objectSchema, uischema?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{
            address: { street: 'Main Street', city: 'Portland' },
            pair: [{ street: 'Main Street', city: 'Portland' }, 3],
          }}
          schema={schema}
          uischema={
            uischema ?? {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/address' }],
            }
          }
          uischemas={[{ tester: addressTester, uischema: entry as any }]}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

const values = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(
    (input) => input.value
  );

/*
  The four registry shapes, and which of them used to hang. The pattern is
  worth keeping visible: the more an entry declares, the safer it was.
*/
const selfResolving = [
  ['no options at all', { type: 'Control', scope: '#' }],
  ['an empty options object', { type: 'Control', scope: '#', options: {} }],
  [
    'summary but no detail',
    {
      type: 'Control',
      scope: '#',
      options: { summary: { type: 'Control', scope: '#/properties/street' } },
    },
  ],
] as const;

describe.each(selfResolving)(
  'a Control registry entry with %s',
  (_name, entry) => {
    it('renders instead of exhausting the heap', async () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const view = draw(entry);
      await settle();

      // The generated layout was used, so the object's fields are on screen.
      expect(values(view.container)).toEqual(['Main Street', 'Portland']);
      warn.mockRestore();
      view.unmount();
    }, 15000);

    it('says what it refused and why', async () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const view = draw(entry);
      await settle();

      const said = warn.mock.calls.map((call) => String(call[0])).join('\n');
      expect(said).toContain(UI_SCHEMA_CYCLE_DIAGNOSTIC);
      // Names the path, so an author can find the entry that did it.
      expect(said).toContain('address');
      warn.mockRestore();
      view.unmount();
    }, 15000);
  }
);

describe('entries the guard must not touch', () => {
  /*
    A Control carrying `options.detail` never loops: core's `findUISchema`
    returns that detail before it consults the registry. It must keep winning
    over the generated layout, or the guard has broken the feature it protects.
  */
  it('uses a Control entry that carries options.detail', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw({
      type: 'Control',
      scope: '#',
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/city' }],
        },
      },
    });
    await settle();

    // Only City - which is the detail's doing, not the generated layout's.
    expect(values(view.container)).toEqual(['Portland']);
    expect(
      warn.mock.calls.map((call) => String(call[0])).join('\n')
    ).not.toContain(UI_SCHEMA_CYCLE_DIAGNOSTIC);
    warn.mockRestore();
    view.unmount();
  });

  it('uses a layout entry', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw({
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/city' }],
    });
    await settle();

    expect(values(view.container)).toEqual(['Portland']);
    expect(
      warn.mock.calls.map((call) => String(call[0])).join('\n')
    ).not.toContain(UI_SCHEMA_CYCLE_DIAGNOSTIC);
    warn.mockRestore();
    view.unmount();
  });

  /*
    Two objects of the same schema side by side are not a cycle. The guard is
    scoped to ancestors, which is why it is context rather than a module-level
    set - a shared set would refuse the second one.
  */
  it('renders two siblings of the same schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const schema = {
      type: 'object',
      properties: {
        first: objectSchema.properties.address,
        second: objectSchema.properties.address,
      },
    } as any;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{
              first: { street: 'Main Street', city: 'Portland' },
              second: { street: 'Second Street', city: 'Salem' },
            }}
            schema={schema}
            uischema={
              {
                type: 'VerticalLayout',
                elements: [
                  { type: 'Control', scope: '#/properties/first' },
                  { type: 'Control', scope: '#/properties/second' },
                ],
              } as any
            }
            uischemas={[
              {
                tester: addressTester,
                uischema: {
                  type: 'VerticalLayout',
                  elements: [{ type: 'Control', scope: '#/properties/city' }],
                } as any,
              },
            ]}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();

    expect(values(container)).toEqual(['Portland', 'Salem']);
    expect(
      warn.mock.calls.map((call) => String(call[0])).join('\n')
    ).not.toContain(UI_SCHEMA_CYCLE_DIAGNOSTIC);
    warn.mockRestore();
    act(() => root.unmount());
  });
});

/*
  The shape this was originally reported as: a tuple position whose editor
  comes from the registry, with the dialog opened. It is the same defect one
  level down - the dialog's body dispatches the entry, which reaches
  `ObjectRenderer` - so it is fixed by the same guard.
*/
describe('a tuple position whose registry entry resolves to itself', () => {
  const tupleSchema = {
    type: 'object',
    properties: {
      pair: {
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
          { type: 'number', title: 'Rank' },
        ],
        additionalItems: false,
      },
    },
  } as any;

  it.each(selfResolving)(
    'survives opening the dialog with %s',
    async (_name, entry) => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const view = draw(entry, tupleSchema, {
        type: 'Control',
        scope: '#/properties/pair',
      });
      await settle();

      const edit = Array.from(
        view.container.querySelectorAll<HTMLButtonElement>('button')
      ).find((button) =>
        (button.getAttribute('aria-label') ?? '').toLowerCase().includes('edit')
      );
      expect(edit, 'no edit action on the complex position').toBeTruthy();
      act(() => edit!.click());
      await settle(250);

      // The dialog is open and showing the position's fields.
      expect(document.querySelector('.ant-modal')).toBeTruthy();
      warn.mockRestore();
      view.unmount();
    },
    15000
  );
});
