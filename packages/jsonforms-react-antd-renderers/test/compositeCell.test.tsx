import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const schema: any = {
  type: 'object',
  properties: {
    people: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          firstName: { type: 'string', title: 'First name' },
          address: {
            type: 'object',
            title: 'Address',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
            },
          },
          phoneNumbers: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const uischema: any = {
  type: 'Control',
  scope: '#/properties/people',
  options: {
    table: true,
    cells: {
      address: { summary: { type: 'Control', scope: '#/properties/street' } },
      phoneNumbers: { summary: { type: 'Control', scope: '#' } },
    },
  },
};

const data = {
  people: [
    {
      firstName: 'Ada',
      address: { street: '12 St James', city: 'London' },
      phoneNumbers: ['+44 1', '+44 2', '+44 3'],
    },
  ],
};

const render = (cellsOption = uischema.options.cells) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={{
          ...uischema,
          options: { ...uischema.options, cells: cellsOption },
        }}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
      />
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('composite cells in the table', () => {
  it('summarises an object column from its summary scope', () => {
    const { container, unmount } = render();
    expect(container.textContent).toContain('12 St James');
    unmount();
  });

  // scope '#' resolves each array item, so the summary previews values and
  // reports how many were left over.
  it('previews an array column from its summary scope', () => {
    const { container, unmount } = render();
    expect(container.textContent).toContain('+44 1, +44 2 (+1 more)');
    unmount();
  });

  it('falls back to a count when no summary scope is given', () => {
    const { container, unmount } = render({
      address: { summary: { type: 'Control', scope: '#/properties/street' } },
      phoneNumbers: {},
    });
    expect(container.textContent).toContain('3 items');
    unmount();
  });

  // The table drops array properties from its columns; a cells entry keeps one.
  it('renders an array column, which the table skips by default', () => {
    const { container, unmount } = render();
    expect(container.textContent).toContain('Phone Numbers');
    unmount();
  });

  it('leaves scalar columns to their own cells', () => {
    const { container, unmount } = render();
    // the composite cell would have rendered "Not set" plus an Edit button
    expect(container.textContent).not.toContain('Not set');
    unmount();
  });
});

it('asks before removing a populated composite and cancels without clearing', () => {
  const { container, unmount } = render();
  try {
    const button = container.querySelector<HTMLButtonElement>('button[aria-label="Remove Address"]')!;
    act(() => button.click());
    const dialog = document.querySelector('[data-confirm="delete"]');
    expect(dialog).toBeTruthy();
    const cancel = Array.from(dialog!.querySelectorAll('button')).find(b => b.textContent === 'No')!;
    act(() => cancel.click());
    expect(container.textContent).toContain('12 St James');
  } finally { unmount(); container.remove(); }
});
