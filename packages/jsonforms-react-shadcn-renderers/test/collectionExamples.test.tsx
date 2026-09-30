import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
const schema = {
  type: 'array',
  items: { type: 'object', properties: { name: { type: 'string' } } },
};
const data = Array.from({ length: 12 }, (_, i) => ({
  name: 'Person ' + (i + 1),
}));
it('limits table rows and opens an isolated whole-row dialog', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          uischema={{
            type: 'Control',
            scope: '#',
            options: {
              table: true,
              pagination: { pageSize: 5 },
              rowDetail: { presentation: 'dialog' },
            },
          }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
    const edit = Array.from(container.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Edit details'
    )!;
    expect(edit).toBeTruthy();
    act(() => edit.click());
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    expect(dialog.querySelector<HTMLInputElement>('input')?.value).toBe(
      'Person 1'
    );
    const input = dialog.querySelector<HTMLInputElement>('input')!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'Draft');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(
      container.querySelector<HTMLInputElement>('tbody input')?.value
    ).toBe('Person 1');
    const cancel = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Cancel'
    )!;
    act(() => cancel.click());
    expect(
      container.querySelector<HTMLInputElement>('tbody input')?.value
    ).toBe('Person 1');
    const next = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Next page"]'
    )!;
    expect(next).toBeTruthy();
    const first = container.querySelector<HTMLInputElement>('tbody input')!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(first, 'Before paging');
      first.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => next.click());
    expect(
      container.querySelector<HTMLInputElement>('tbody input')?.value
    ).toBe('Person 6');
    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')!
        .click()
    );
    expect(
      container.querySelector<HTMLInputElement>('tbody input')?.value
    ).toBe('Before paging');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
it('paginates dynamic properties while retaining declared fields', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: { fixed: { type: 'string' } },
            additionalProperties: { type: 'string' },
          }}
          data={{
            fixed: 'Fixed',
            ...Object.fromEntries(data.map((p, i) => ['extra' + i, p.name])),
          }}
          uischema={{
            type: 'Control',
            scope: '#',
            options: { additionalProperties: { pagination: { pageSize: 5 } } },
          }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(container.querySelector('input[value="Fixed"]')).toBeTruthy();
    expect(container.querySelector('input[value="Person 5"]')).toBeTruthy();
    expect(container.querySelector('input[value="Person 6"]')).toBeNull();
  } finally {
    act(() => root.unmount());
  }
});

it.each(['right', 'bottom'])(
  'shows generated row details in the %s panel',
  (placement) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={schema}
            data={data}
            uischema={{
              type: 'Control',
              scope: '#',
              options: {
                table: true,
                rowDetail: { presentation: 'panel', placement },
              },
            }}
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        )
      );
      expect(container.textContent).toContain('Select an item');
      const edit = Array.from(container.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === 'Edit details'
      )!;
      act(() => edit.click());
      expect(container.textContent).not.toContain('Select an item');
      expect(
        container.querySelectorAll('input[value="Person 1"]').length
      ).toBeGreaterThan(1);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      const rows = container.querySelectorAll<HTMLTableRowElement>('tbody tr');
      act(() => rows[1].click());
      expect(container.querySelectorAll('input[value="Person 2"]').length).toBe(2);
      expect(container.querySelectorAll('input[value="Person 1"]').length).toBe(1);
      act(() => rows[0].querySelector<HTMLInputElement>('input')!.click());
      expect(container.querySelectorAll('input[value="Person 1"]').length).toBe(2);
      expect(container.querySelectorAll('input[value="Person 2"]').length).toBe(1);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);

it('applies a row draft without overwriting other rows', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          uischema={{
            type: 'Control',
            scope: '#',
            options: { table: true, rowDetail: { presentation: 'dialog' } },
          }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    act(() =>
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.getAttribute('aria-label') === 'Edit details')!
        .click()
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    const input = dialog.querySelector<HTMLInputElement>('input')!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'Committed');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() =>
      Array.from(dialog.querySelectorAll('button'))
        .find((b) => b.textContent === 'Apply')!
        .click()
    );
    expect(
      container.querySelector<HTMLInputElement>('tbody input')?.value
    ).toBe('Committed');
    expect(container.querySelector('input[value="Person 2"]')).toBeTruthy();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
