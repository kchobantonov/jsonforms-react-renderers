import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';

it.each(['group', 'tabs', 'stepper', 'accordion'])(
  'shows a translated icon and focus tooltip for %s',
  async (presentation) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const elements = [{ type: 'Control', scope: '#/properties/name' }];
    const options = {
      showValidationIndicator: true,
      collapsible: true,
      collapsed: true,
    };
    const ui =
      presentation === 'group'
        ? { type: 'Group', label: 'Contact', options, elements }
        : {
            type: 'Categorization',
            options: { variant: presentation },
            elements: [
              { type: 'Category', label: 'Contact', options, elements },
            ],
          };
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string' } },
            }}
            data={{}}
            uischema={ui}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            i18n={{
              translate: (key, fallback) =>
                key === 'validation.containerError'
                  ? 'Section: {count} problem'
                  : fallback,
            }}
          />
        )
      );
      const icon = host.querySelector<HTMLElement>(
        '[data-container-validation-indicator]'
      )!;
      expect(icon).toBeTruthy();
      expect(icon.querySelector('svg')).toBeTruthy();
      expect(icon.getAttribute('data-error-count')).toBe('1');
      expect(icon.getAttribute('aria-label')).toBe('Section: 1 problem');
      await act(async () => {
        icon.focus();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        'Section: 1 problem'
      );
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('keeps an icon with a generic translated tooltip when counts are disabled', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          }}
          data={{}}
          uischema={{
            type: 'Group',
            options: {
              showValidationIndicator: true,
              showValidationIndicatorCount: false,
            },
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          }}
          renderers={shadcnRenderers}
          i18n={{
            translate: (key, fallback) =>
              key === 'validation.containerHasErrors'
                ? 'Please review this section'
                : fallback,
          }}
        />
      )
    );
    const icon = host.querySelector('[data-container-validation-indicator]')!;
    expect(icon.getAttribute('aria-label')).toBe('Please review this section');
    expect(icon.hasAttribute('data-error-count')).toBe(false);
  } finally {
    act(() => root.unmount());
  }
});
