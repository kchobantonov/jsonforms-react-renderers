import { readFileSync } from 'node:fs';
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

const render = (cellsOption = uischema.options.cells, formSchema = schema, formData = data, formUi = uischema) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={formData}
        schema={formSchema}
        uischema={{
          ...formUi,
          options: { ...formUi.options, cells: cellsOption },
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

it('shows nested object and array validation in composite cells', () => {
  const invalidSchema = JSON.parse(JSON.stringify(schema));
  invalidSchema.properties.people.items.properties.address.required = ['postalCode'];
  invalidSchema.properties.people.items.properties.phoneNumbers.items.minLength = 20;
  const { container, unmount } = render(undefined, invalidSchema);
  expect(container.querySelector('[id="people.0.address-cell-errors"]')?.getAttribute('aria-label')).toContain('postalCode');
  expect(container.querySelector('[id="people.0.phoneNumbers-cell-errors"]')?.getAttribute('aria-label')).toContain('20');
  unmount();
});

it('renders combinator cells with errors only on the invalid example row', () => {

  const load = (name: string) => JSON.parse(readFileSync(require.resolve(
    '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/' + name + '.json'
  ), 'utf8'));
  const exampleSchema = load('schema');
  const exampleData = load('data');
  const exampleUi = load('uischema').elements[1].elements[2].elements[0];
  const { container, unmount } = render(exampleUi.options.cells, exampleSchema, exampleData, exampleUi);
  try {
    for (const field of ['contact', 'experience', 'oneOfContact', 'anyOfContact', 'allOfContact']) {
      expect(container.querySelector(`[id="applicants.0.${field}-cell-errors"]`)).toBeTruthy();
      expect(container.querySelector(`[id="applicants.1.${field}-cell-errors"]`)).toBeNull();
    }
    for (const label of ['OneOf contact', 'AnyOf contact', 'AllOf contact']) {
      const edit = container.querySelector(`[aria-label="Edit ${label}"]`) as HTMLButtonElement;
      expect(edit).toBeTruthy();
      act(() => edit.click());
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog).toBeTruthy();
      expect(dialog.textContent).not.toContain('No applicable renderer');
      expect(dialog.textContent).not.toContain('Full name');
      const cancel = Array.from(dialog.querySelectorAll('button')).find(el => el.textContent === 'Cancel')!;
      act(() => cancel.click());
    }
  } finally { unmount(); }
});

it.each([false, true])('shows a Label edit action only with explicit detail (detail=%s)', (withDetail) => {

  const presentation = {
    type: 'Control', scope: '#/properties/people', options: {
      table: true,
      columnDefs: [{ field: 'preview', scope: '#', headerName: 'Preview' }],
      cells: { preview: { summary: { type: 'Label', text: 'Row presentation' }, ...(withDetail ? { detail: { type: 'VerticalLayout', elements: [] } } : {}) } },
    },
  };
  const { container, unmount } = render(presentation.options.cells, schema, data, presentation);
  try {
    expect(container.textContent).toContain('Row presentation');
    expect(container.textContent).toContain('Preview');
    const edit = container.querySelector<HTMLButtonElement>('[aria-label^="Edit "]');
    expect(Boolean(edit)).toBe(withDetail);
    const label = Array.from(container.querySelectorAll('span')).find(el => el.textContent === 'Row presentation');
    act(() => label?.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    if (edit) {
      act(() => edit.click());
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    }
    expect(container.querySelector('[aria-label^="Remove "]')).toBeNull();
  } finally { unmount(); }
});
