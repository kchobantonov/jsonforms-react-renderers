import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
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
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(container.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(
      5
    );
    const edit = Array.from(container.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Edit details'
    )!;
    expect(edit).toBeTruthy();
    const actionButtons = edit.closest('td')!.querySelectorAll('button');
    expect(actionButtons[0]).toBe(edit);
    expect(actionButtons.length).toBe(1);
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
      container.querySelector<HTMLInputElement>(
        'tbody input:not([type="checkbox"])'
      )?.value
    ).toBe('Person 1');
    const cancel = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Cancel'
    )!;
    act(() => cancel.click());
    expect(
      container.querySelector<HTMLInputElement>(
        'tbody input:not([type="checkbox"])'
      )?.value
    ).toBe('Person 1');
    const next = container.querySelector<HTMLButtonElement>(
      '.ant-pagination-next button'
    )!;
    expect(next).toBeTruthy();
    const first = container.querySelector<HTMLInputElement>(
      'tbody input:not([type="checkbox"])'
    )!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(first, 'Before paging');
      first.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => next.click());
    expect(
      container.querySelector<HTMLInputElement>(
        'tbody input:not([type="checkbox"])'
      )?.value
    ).toBe('Person 6');
    act(() =>
      container
        .querySelector<HTMLButtonElement>('.ant-pagination-prev button')!
        .click()
    );
    expect(
      container.querySelector<HTMLInputElement>(
        'tbody input:not([type="checkbox"])'
      )?.value
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
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(container.querySelector('input[value="Fixed"]')).toBeTruthy();
    expect(container.querySelector('input[value="Person 5"]')).toBeTruthy();
    expect(container.querySelector('input[value="Person 6"]')).toBeNull();
    const collection = container.querySelector(
      '.jsonforms-additional-properties'
    )!;
    const list = collection.querySelector(
      '.jsonforms-additional-properties-list'
    )!;
    const footer = collection.querySelector('[data-collection-footer]')!;
    expect(footer).toBeTruthy();
    expect(
      list.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  } finally {
    act(() => root.unmount());
  }
});

it.each([
  ['right', false],
  ['bottom', false],
  ['right', true],
  ['bottom', true],
])(
  'shows generated row details in the %s panel (collapsed: %s)',
  (placement, collapsed) => {
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
                rowDetail: { presentation: 'panel', placement, collapsed },
              },
            }}
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      if (collapsed) {
        expect(container.textContent).not.toContain('Select an item');
        act(() =>
          container
            .querySelector<HTMLButtonElement>(
              'button[aria-label="Show details"]'
            )!
            .click()
        );
      }
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
      expect(
        container.querySelector(
          'tbody tr[aria-current="true"] input[value="Person 1"]'
        )
      ).not.toBeNull();
      const toggle = (label: string) =>
        container.querySelector<HTMLButtonElement>(
          `button[aria-label="${label}"]`
        )!;
      act(() => toggle('Hide details').click());
      expect(container.querySelectorAll('input[value="Person 1"]').length).toBe(
        1
      );
      expect(toggle('Show details').getAttribute('aria-expanded')).toBe(
        'false'
      );
      expect(
        container.querySelector('tbody tr[aria-current="true"]')
      ).toBeNull();
      act(() =>
        container.querySelector<HTMLTableRowElement>('tbody tr')!.click()
      );
      expect(toggle('Show details').getAttribute('aria-expanded')).toBe(
        'false'
      );
      expect(
        container.querySelector('tbody tr[aria-current="true"]')
      ).toBeNull();
      act(() =>
        container
          .querySelector<HTMLInputElement>(
            'tbody input:not([type="checkbox"])'
          )!
          .click()
      );
      expect(toggle('Show details').getAttribute('aria-expanded')).toBe(
        'false'
      );
      expect(
        container.querySelector('tbody tr[aria-current="true"]')
      ).toBeNull();
      act(() => edit.click());
      expect(toggle('Hide details').getAttribute('aria-expanded')).toBe('true');
      expect(container.querySelectorAll('input[value="Person 1"]').length).toBe(
        2
      );
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
          renderers={antdRenderers}
          cells={antdCells}
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
      container.querySelector<HTMLInputElement>(
        'tbody input:not([type="checkbox"])'
      )?.value
    ).toBe('Committed');
    expect(container.querySelector('input[value="Person 2"]')).toBeTruthy();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it.each(['never', 'always'])(
  'deletes checked rows respecting minItems and %s confirmation',
  (policy) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const rows = [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }];
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{ ...schema, minItems: 2 }}
            data={rows}
            uischema={{
              type: 'Control',
              scope: '#',
              options: {
                table: true,
                restrict: true,
                confirmation: { delete: policy },
              },
            }}
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      const deleteButton = () =>
        container.querySelector<HTMLButtonElement>(
          'button[aria-label="Delete selected rows"]'
        )!;
      const checks = () =>
        Array.from(
          container.querySelectorAll<HTMLElement>(
            'tbody tr[data-row-key] input[type="checkbox"], tbody button[role="checkbox"]'
          )
        );
      expect(deleteButton().disabled).toBe(true);
      act(() => checks()[0].click());
      expect(deleteButton().disabled).toBe(false);
      act(() => checks()[1].click());
      expect(deleteButton().disabled).toBe(true);
      act(() => checks()[1].click());
      act(() => deleteButton().click());
      if (policy === 'always') {
        expect(container.querySelector('input[value="One"]')).not.toBeNull();
        const dialog = document.querySelector(
          '[role="dialog"], [role="alertdialog"]'
        )!;
        expect(dialog).not.toBeNull();
        const confirm = Array.from(dialog.querySelectorAll('button')).find(
          (button) =>
            button.textContent === 'Delete selected rows' ||
            button.textContent === 'Delete' ||
            button.textContent === 'Yes'
        )!;
        act(() => confirm.click());
      }
      expect(container.querySelector('input[value="One"]')).toBeNull();
      expect(container.querySelector('input[value="Two"]')).not.toBeNull();
      expect(deleteButton().disabled).toBe(true);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);

it.each(['readonly', 'disableRemove'])(
  'disables table selection for %s',
  (restriction) => {
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={schema}
            data={data}
            readonly={restriction === 'readonly'}
            uischema={{
              type: 'Control',
              scope: '#',
              options: {
                table: true,
                disableRemove: restriction === 'disableRemove',
              },
            }}
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      expect(
        container.querySelector<HTMLButtonElement>(
          'button[aria-label="Delete selected rows"]'
        )!.disabled
      ).toBe(true);
      const checks = container.querySelectorAll<HTMLInputElement>(
        'tbody input[type="checkbox"], tbody button[role="checkbox"]'
      );
      expect(checks.length).toBeGreaterThan(0);
      checks.forEach((checkbox) => expect(checkbox.disabled).toBe(true));
    } finally {
      act(() => root.unmount());
    }
  }
);

it('selects and orders summary columns while retaining all detail fields', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          }}
          data={[
            { name: 'Ada', email: 'ada@example.com', notes: 'Detail only' },
          ]}
          uischema={{
            type: 'Control',
            scope: '#',
            options: {
              table: true,
              columnDefs: [
                { field: 'email', width: 220 },
                { field: 'name', minWidth: 170, maxWidth: 300 },
              ],
              rowDetail: { presentation: 'dialog' },
            },
          }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    const headers = Array.from(container.querySelectorAll('th')).map(
      (cell) => cell.textContent
    );
    expect(
      headers.filter((text) => text === 'Email' || text === 'Name')
    ).toEqual(['Email', 'Name']);
    const resize = container.querySelector<HTMLElement>(
      '[role="separator"][aria-label="Resize Name column"]'
    )!;
    expect(resize).not.toBeNull();
    act(() =>
      resize.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      )
    );
    expect(resize.closest('th')!.style.width).toBe('300px');
    act(() =>
      resize.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      )
    );
    expect(resize.closest('th')!.style.width).toBe('170px');
    const emailHeader = container.querySelector<HTMLElement>(
      'th[data-column-key="email"]'
    )!;
    const selectionHeader = container.querySelector<HTMLElement>('thead th')!;
    vi.spyOn(emailHeader, 'getBoundingClientRect').mockReturnValue({
      width: 220,
    } as DOMRect);
    vi.spyOn(selectionHeader, 'getBoundingClientRect').mockReturnValue({
      width: 40,
    } as DOMRect);
    vi.spyOn(resize.closest('th')!, 'getBoundingClientRect').mockReturnValue({
      width: 170,
    } as DOMRect);
    resize.setPointerCapture = vi.fn();
    resize.hasPointerCapture = () => true;
    resize.releasePointerCapture = vi.fn();
    act(() =>
      resize.dispatchEvent(
        new MouseEvent('pointerdown', {
          clientX: 100,
          button: 0,
          bubbles: true,
        })
      )
    );
    act(() =>
      resize.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 140, bubbles: true })
      )
    );
    expect(resize.closest('th')!.style.width).toBe('210px');
    expect(emailHeader.style.width).toBe('220px');
    act(() =>
      resize.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    );

    expect(container.querySelector('input[value="Detail only"]')).toBeNull();
    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Edit details"]')!
        .click()
    );
    expect(
      document.querySelector('[role="dialog"] input[value="Detail only"]')
    ).not.toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
