import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createShadcnExtendedRenderers } from '../src';

it.each(['HorizontalLayout', 'VerticalLayout'])(
  'uses host Resizable components for %s',
  (type) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{}}
            data={{}}
            renderers={createShadcnExtendedRenderers()}
            uischema={
              {
                type,
                options: { variant: 'splitter', height: '26rem' },
                elements: [{ type: 'Spacer' }, { type: 'Spacer' }],
              } as any
            }
          />
        )
      );
      expect(
        container.querySelector('[data-slot="resizable-panel-group"]')
      ).not.toBeNull();
      expect(
        container.querySelectorAll('[data-slot="resizable-panel"]')
      ).toHaveLength(2);
      expect(
        container.querySelectorAll('[data-slot="resizable-handle"]')
      ).toHaveLength(1);
      if (type === 'VerticalLayout')
        expect((container.firstElementChild as HTMLElement).style.height).toBe(
          '26rem'
        );
    } finally {
      act(() => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
    }
  }
);
