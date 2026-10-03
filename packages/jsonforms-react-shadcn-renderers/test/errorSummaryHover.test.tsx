import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../src';
import { ErrorIndicator } from '../src/complex/ErrorIndicator';
it('opens the icon-only descendant summary on focus', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: {
              comments: {
                type: 'array',
                items: { type: 'string', minLength: 3 },
              },
            },
          }}
          data={{ comments: ['a', 'b', 'c', 'd'] }}
          uischema={{
            type: 'Control',
            scope: '#/properties/comments',
            options: { table: true },
          }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    const icons = host.querySelectorAll<HTMLButtonElement>(
      '.shadcn-jsonforms-array-errors, .shadcn-jsonforms-cell-error'
    );
    expect(icons).toHaveLength(5);
    icons.forEach((icon) => {
      expect(icon.textContent).toBe('');
      expect(icon.querySelector('svg')).toBeTruthy();
    });
    await act(async () => icons[0].focus());
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        'Some items contain errors.'
      )
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('uses the usual control message in a simple tooltip for one cell error', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: 'array', items: { type: 'string', minLength: 3 } }}
          data={['a']}
          uischema={{ type: 'Control', scope: '#', options: { table: true } }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    const icon = host.querySelector<HTMLButtonElement>(
      '.shadcn-jsonforms-cell-error'
    )!;
    await act(async () => {
      icon.focus();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      icon.getAttribute('aria-label')
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('expands a detailed summary with more than three errors', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{ type: 'array', items: { type: 'string', minLength: 3 } }}
          data={['a', 'b', 'c', 'd']}
          uischema={{ type: 'SummaryTest' }}
          renderers={[
            {
              tester: () => 100,
              renderer: () => <ErrorIndicator errors='Invalid items' path='' />,
            },
          ]}
        />
      )
    );
    await act(async () => host.querySelector('button')!.focus());
    const summary = document.querySelector('[role="dialog"]')!;
    expect(summary.textContent).toContain('4 errors');
    expect(summary.querySelectorAll('li')).toHaveLength(3);
    const more = Array.from(summary.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show 1 more'
    )!;
    act(() => more.click());
    expect(summary.querySelectorAll('li')).toHaveLength(4);
    expect(summary.textContent).toContain('Show less');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
