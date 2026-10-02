import { beforeAll, afterAll, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { flushUntil } from './support/flush';

/**
 * The detail dialog edits an isolated draft: nothing reaches the form data
 * until Apply, and Clear stages the empty value without closing.
 */
const schema = (address: Record<string, unknown>) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      address: { type: 'object', title: 'Address', ...address },
    },
  },
});

const uischema = (cellOptions: Record<string, unknown>) => ({
  type: 'Control',
  scope: '#',
  options: {
    table: true,
    cells: {
      address: {
        summary: { type: 'Control', scope: '#/properties/street' },
        detail: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/street' },
            { type: 'Control', scope: '#/properties/city' },
          ],
        },
        ...cellOptions,
      },
    },
  },
});

// antd portals every modal to document.body, and unmounting the React root
// does not always take the portal with it. Without this, a later test finds
// the previous test's dialog and asserts against the wrong buttons.
afterEach(() => {
  document.body.innerHTML = '';
});

const properties = {
  properties: { street: { type: 'string' }, city: { type: 'string' } },
};

const open = async (
  addressSchema: Record<string, unknown> = properties,
  cellOptions: Record<string, unknown> = {}
) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const data = [
    { name: 'Ada', address: { street: '12 St James', city: 'London' } },
  ];
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={data}
          schema={schema(addressSchema) as any}
          uischema={uischema(cellOptions) as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data }) => {
            latest = data;
          }}
        />
      </ConfigProvider>
    )
  );
  await flushUntil(() =>
    Boolean(container.querySelector('[aria-label^="Edit"]'))
  );
  act(() =>
    container.querySelector<HTMLElement>('[aria-label^="Edit"]')!.click()
  );
  await flushUntil(() => Boolean(document.querySelector('.ant-modal-footer')));

  const footer = () => document.querySelector('.ant-modal-footer')!;
  const button = (text: string) =>
    Array.from(footer().querySelectorAll('button')).find((element) =>
      element.textContent?.includes(text)
    );
  // JsonForms debounces its onChange by 10ms, and the text controls debounce
  // their writes by 300ms, so settling has to outlast both.
  const settle = async (ms = 400) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  };
  const click = async (element: HTMLElement) => {
    act(() => element.click());
    await settle();
  };
  const type = async (label: string, text: string, wait = true) => {
    const field = Array.from(
      document.querySelectorAll<HTMLInputElement>('.ant-modal input')
    ).find((input) =>
      input
        .closest('.ant-form-item')
        ?.querySelector('label')
        ?.textContent?.includes(label)
    )!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    act(() => {
      setter.call(field, text);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (wait) await settle();
  };
  return {
    button,
    click,
    type,
    settle,
    isOpen: () => Boolean(document.querySelector('.ant-modal-wrap')),
    address: () => latest[0].address,
    unmount: () => act(() => root.unmount()),
  };
};

describe('composite detail dialog', () => {
  it('offers Cancel and Apply, and no Remove', async () => {
    const dialog = await open();
    expect(dialog.button('Cancel')).toBeDefined();
    expect(dialog.button('Apply')).toBeDefined();
    expect(dialog.button('Remove')).toBeUndefined();
    expect(dialog.button('Clear')).toBeUndefined();
    dialog.unmount();
  });

  // Reported: typing in a field closed the dialog, because the edit reached
  // the form data, re-rendered the row and remounted the cell.
  it('stays open while typing, and leaves the form data alone', async () => {
    const dialog = await open();
    await dialog.type('Street', '9 Bedford Row');
    expect(dialog.isOpen()).toBe(true);
    expect(dialog.address().street).toBe('12 St James');
    dialog.unmount();
  });

  it('Apply commits the edit', async () => {
    const dialog = await open();
    await dialog.type('Street', '9 Bedford Row');
    await dialog.click(dialog.button('Apply')!);
    expect(dialog.address().street).toBe('9 Bedford Row');
    expect(dialog.isOpen()).toBe(false);
    dialog.unmount();
  });

  // The text controls debounce their writes by 300ms. Applying straight away
  // must flush what they are still holding rather than drop it.
  it('Apply flushes a keystroke the control has not written yet', async () => {
    const dialog = await open();
    await dialog.type('Street', '9 Bedford Row', false);
    await dialog.click(dialog.button('Apply')!);
    expect(dialog.address().street).toBe('9 Bedford Row');
    dialog.unmount();
  });

  it('Cancel discards the edit', async () => {
    const dialog = await open();
    await dialog.type('Street', '9 Bedford Row');
    await dialog.click(dialog.button('Cancel')!);
    expect(dialog.address().street).toBe('12 St James');
    expect(dialog.isOpen()).toBe(false);
    dialog.unmount();
  });

  it('Clear empties the draft, keeps the dialog open, and needs Apply', async () => {
    const dialog = await open(properties, { showEmptyButton: true });
    const clear = dialog.button('Clear')!;
    expect(clear.disabled).toBe(false);
    await dialog.click(clear);
    expect(dialog.isOpen()).toBe(true);
    expect(dialog.address()).toEqual({ street: '12 St James', city: 'London' });
    await dialog.click(dialog.button('Apply')!);
    expect(dialog.address()).toEqual({});
    dialog.unmount();
  });

  // Emptying would leave data the schema rejects, so the button is offered
  // but not usable - the same rule the Svelte dialog applies.
  it('disables Clear when the schema requires a property', async () => {
    const dialog = await open(
      { ...properties, required: ['street'] },
      { showEmptyButton: true }
    );
    expect(dialog.button('Clear')!.disabled).toBe(true);
    dialog.unmount();
  });

  it('honours restrict:false to allow clearing anyway', async () => {
    const dialog = await open(
      { ...properties, required: ['street'] },
      { showEmptyButton: true, restrict: false }
    );
    expect(dialog.button('Clear')!.disabled).toBe(false);
    dialog.unmount();
  });

  it('takes okLabel/cancelLabel/emptyLabel overrides', async () => {
    const dialog = await open(properties, {
      showEmptyButton: true,
      emptyLabel: 'Empty it',
      cancelLabel: 'Discard',
      okLabel: 'Save',
    });
    expect(dialog.button('Empty it')).toBeDefined();
    expect(dialog.button('Discard')).toBeDefined();
    expect(dialog.button('Save')).toBeDefined();
    dialog.unmount();
  });
});

// jsdom has no layout observer; dialog behavior does not depend on measured sizes.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterAll(() => vi.unstubAllGlobals());
