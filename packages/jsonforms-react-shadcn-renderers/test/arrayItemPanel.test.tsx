import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';
it('uses custom labels for expandable item headers and preserves mounted inputs', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const schema = {
    type: 'array',
    items: { type: 'object', properties: { message: { type: 'string' } } },
  };
  const uischema = {
    type: 'Control',
    scope: '#',
    options: {
      elementLabelProp: 'message',
      detail: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/message' }],
      },
    },
  };
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={[{ message: 'First message' }, { message: 'Second message' }]}
          renderers={shadcnRenderers}
        />
      )
    );
    const triggers = host.querySelectorAll<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]'
    );
    expect(triggers).toHaveLength(2);
    expect(triggers[0].getAttribute('aria-label')).toBe('First message');
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
    const input = host.querySelector('input');
    act(() => triggers[0].click());
    expect(host.querySelector('input')).toBe(input);
    expect(
      host.querySelector<HTMLElement>('[data-slot="collapsible-content"]')
        ?.hidden
    ).toBe(true);
    expect(triggers[0].querySelector('[aria-label="Remove"]')).toBeNull();
    expect(
      triggers[0].parentElement?.querySelector(
        '.absolute.right-10 [aria-label="Remove"]'
      )
    ).not.toBeNull();
  } finally {
    act(() => root.unmount());
  }
});
