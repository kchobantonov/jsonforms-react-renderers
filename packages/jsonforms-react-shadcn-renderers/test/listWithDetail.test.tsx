import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';
it('renders the issue 1713 list inside categorization and delegates its nested detail', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const schema = {
    type: 'object',
    required: ['experiments'],
    properties: {
      experiments: {
        type: 'array',
        items: { type: 'object', properties: { ID: { type: 'string' } } },
      },
    },
  };
  const uischema = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Experiments',
        elements: [
          {
            type: 'ListWithDetail',
            scope: '#/properties/experiments',
            options: {
              labelRef: '#/items/properties/ID',
              detail: {
                type: 'Categorization',
                elements: [
                  {
                    type: 'Category',
                    label: 'Sequential',
                    elements: [{ type: 'Control', scope: '#/properties/ID' }],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          uischema={uischema as any}
          data={{}}
          renderers={shadcnRenderers}
        />
      )
    );
    expect(host.textContent).not.toContain('No applicable renderer');
    expect(host.textContent).toContain('No data');
    expect(host.querySelector('.shadcn-jsonforms-array-errors')).not.toBeNull();
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[aria-label="Add"]')!.click()
    );
    expect(host.querySelector('input')).not.toBeNull();
    expect(host.textContent).toContain('Sequential');
    expect(host.textContent).not.toContain('No applicable renderer');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('shows avatars and per-item delete actions, and respects hideAvatar', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const schema = {
    type: 'array',
    items: { type: 'object', properties: { ID: { type: 'string' } } },
  };
  const uischema = {
    type: 'ListWithDetail',
    scope: '#',
    options: {
      labelRef: '#/items/properties/ID',
      confirmation: { delete: 'never' },
    },
  };
  const render = (hideAvatar: boolean) =>
    root.render(
      <JsonForms
        schema={schema}
        uischema={uischema as any}
        data={[{ ID: 'First' }, { ID: 'Second' }]}
        config={{ hideAvatar, confirmation: false }}
        renderers={shadcnRenderers}
      />
    );
  try {
    await act(async () => render(false));
    const list = host.querySelector('[data-slot="item-group"]')!;
    expect(list.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2);
    expect(
      list.querySelectorAll('[data-slot="item-actions"] button')
    ).toHaveLength(2);
    expect(
      host.querySelector('[role="tabpanel"] [aria-label="Delete"]')
    ).toBeNull();
    await act(async () =>
      list
        .querySelector<HTMLButtonElement>('button[aria-label="Second"]')!
        .click()
    );
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('Second');
    await act(async () => render(true));
    expect(list.querySelectorAll('[data-slot="avatar"]')).toHaveLength(0);
    await act(async () =>
      list
        .querySelector<HTMLButtonElement>('[data-slot="item-actions"] button')!
        .click()
    );
    expect(list.querySelectorAll('[data-slot="item"]')).toHaveLength(1);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
