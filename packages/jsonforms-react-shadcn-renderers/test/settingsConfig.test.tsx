import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';

it('applies live text restrictions and description visibility from config', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (enabled: boolean) =>
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: 'string', maxLength: 3, description: 'Help text' }}
          uischema={{ type: 'Control', scope: '#' }}
          data='abc'
          config={{ restrict: enabled, showUnfocusedDescription: enabled }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
  try {
    render(true);
    expect(host.querySelector('input')?.maxLength).toBe(3);
    expect(host.textContent).toContain('Help text');
    render(false);
    expect(host.querySelector('input')?.hasAttribute('maxlength')).toBe(false);
    expect(host.textContent).not.toContain('Help text');
  } finally {
    act(() => root.unmount());
  }
});

it.each([true, false])(
  'uses collapseNewItems=%s for the first added item',
  (collapseNewItems) => {
    const host = document.createElement('div');
    const root = createRoot(host);
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          }}
          uischema={{
            type: 'Control',
            scope: '#',
            options: { detail: 'GENERATED' },
          }}
          data={[]}
          config={{ collapseNewItems }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    try {
      act(() =>
        (
          host.querySelector('button[aria-label="Add"]') as HTMLButtonElement
        ).click()
      );
      const trigger = host.querySelector(
        '.shadcn-jsonforms-array-item button[aria-expanded]'
      );
      expect(trigger?.getAttribute('aria-expanded')).toBe(
        String(!collapseNewItems)
      );
    } finally {
      act(() => root.unmount());
    }
  }
);

it('hides descendant header summaries without hiding direct array errors', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (hide: boolean) =>
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          }}
          uischema={{
            type: 'Control',
            scope: '#',
            label: 'Items',
            options: { detail: 'GENERATED' },
          }}
          data={[{}]}
          config={{ hideArraySummaryValidation: hide }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
  try {
    render(false);
    const header = () =>
      host.querySelector('.shadcn-jsonforms-array-header')?.innerHTML ?? '';
    expect(header()).toContain('Some items contain errors');
    render(true);
    expect(header()).not.toContain('Some items contain errors');
    expect(header()).toContain('2');
  } finally {
    act(() => root.unmount());
  }
});
