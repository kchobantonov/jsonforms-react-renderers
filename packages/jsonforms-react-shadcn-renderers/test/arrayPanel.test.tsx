import { ShadcnArrayFrame } from '../../jsonforms-react-shadcn-extended-renderers/src/renderers/ShadcnArrayFrame';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../src';

it.each(['table', 'expandable', 'list'])(
  'collapses the %s array without remounting its contents',
  (kind) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const schema = {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' } } },
    };
    const uischema = {
      type: kind === 'list' ? 'ListWithDetail' : 'Control',
      scope: '#',
      label: 'Rows',
      options: {
        collapsible: true,
        collapsed: true,
        ...(kind === 'table' ? { table: true } : { detail: 'GENERATED' }),
      },
    };
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={schema}
            uischema={uischema}
            data={[{ name: 'Keep' }]}
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        )
      );
      const toggle = container.querySelector<HTMLButtonElement>(
        'button[aria-controls][aria-label="Rows"]'
      )!;
      const body = document.getElementById(
        toggle.getAttribute('aria-controls')!
      )!;
      expect(body.hidden).toBe(true);
      const child = body.firstElementChild;
      act(() => toggle.click());
      expect(body.hidden).toBe(false);
      expect(body.firstElementChild).toBe(child);
      act(() => toggle.click());
      expect(body.hidden).toBe(true);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);

it('keeps the AG Grid frame contents mounted while collapsing', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <ShadcnArrayFrame label='Grid' options={{ collapsible: true }}>
          <div data-grid>Grid contents</div>
        </ShadcnArrayFrame>
      )
    );
    const grid = container.querySelector('[data-grid]')!;
    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-controls]'
    )!;
    const body = document.getElementById(
      toggle.getAttribute('aria-controls')!
    )!;
    act(() => toggle.click());
    expect(body.hidden).toBe(true);
    expect(container.querySelector('[data-grid]')).toBe(grid);
    act(() => toggle.click());
    expect(body.hidden).toBe(false);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
