import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';

it.each([false, true])(
  'reports invalid boolean table cells locally (toggle=%s)',
  async (toggle) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(
          <JsonForms
            schema={{
              type: 'object',
              properties: {
                team: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { active: { type: 'boolean' } },
                  },
                },
              },
            }}
            uischema={{
              type: 'Control',
              scope: '#/properties/team',
              options: { cells: { active: { toggle } } },
            }}
            data={{ team: [{ active: true }, { active: 'false' }] }}
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        );
      });
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
      expect(
        rows[0].querySelector('[aria-label="must be boolean"]')
      ).toBeNull();
      expect(
        rows[1].querySelectorAll('[aria-label="must be boolean"]')
      ).toHaveLength(1);
      expect(rows[1].querySelector('[aria-invalid="true"]')).not.toBeNull();
      const control = rows[1].querySelector(
        '[aria-invalid="true"]'
      ) as HTMLElement;
      await act(async () => control.click());
      expect(
        rows[1].querySelector('[aria-label="must be boolean"]')
      ).toBeNull();
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);
