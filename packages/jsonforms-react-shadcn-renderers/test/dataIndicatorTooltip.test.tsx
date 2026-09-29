import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';

it.each(['group', 'accordion', 'stepper', 'tabs'])(
  'localizes the %s data indicator tooltip and accessible name on locale changes',
  (variant) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const section = {
      type: variant === 'group' ? 'Group' : 'Category',
      label: 'Details',
      options: { collapsible: true, collapsed: true, showDataIndicator: true },
      elements: [{ type: 'Control', scope: '#/properties/value' }],
    };
    const uischema =
      variant === 'group'
        ? section
        : {
            type: 'Categorization',
            options: { variant },
            elements: [section],
          };
    const render = (locale: string, custom?: string) => {
      act(() =>
        root.render(
          <JsonForms
            schema={{
              type: 'object',
              properties: { value: { type: 'string' } },
            }}
            data={{ value: 'Present' }}
            uischema={uischema as any}
            renderers={shadcnRenderers}
            i18n={{
              locale,
              translate: (key, fallback) =>
                key === 'group.dataIndicator' && custom ? custom : fallback,
            }}
          />
        )
      );
    };
    try {
      for (const [locale, custom, expected] of [
        ['en', undefined, 'Section contains data'],
        ['bg', undefined, 'Секцията съдържа данни'],
        ['bg', 'Custom data hint', 'Custom data hint'],
        ['unknown', undefined, 'Section contains data'],
      ]) {
        render(locale!, custom);
        const indicator = container.querySelector(
          '[data-group-indicator], [data-category-data-indicator]'
        );
        expect(indicator).not.toBeNull();
        expect(indicator!.getAttribute('title')).toBe(expected);
        expect(indicator!.getAttribute('aria-label')).toBe(expected);
      }
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);
