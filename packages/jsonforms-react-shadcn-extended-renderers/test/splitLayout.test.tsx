import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  createExtendedRenderers,
  sharedSplitLayoutTester,
} from '@chobantonov/jsonforms-react-extended-renderers';

describe('shared split layout', () => {
  it.each(['HorizontalLayout', 'VerticalLayout'])(
    'renders and resizes %s without changing form data',
    async (type) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
      const uischema = {
        type,
        options: { variant: 'splitter', height: '26rem' },
        elements: [{ type: 'Spacer' }, { type: 'Spacer' }, { type: 'Spacer' }],
      };
      const original = JSON.stringify(uischema);
      try {
        await act(async () =>
          root.render(
            <JsonForms
              schema={{}}
              data={{}}
              uischema={uischema}
              renderers={createExtendedRenderers()}
            />
          )
        );
        const handles =
          container.querySelectorAll<HTMLElement>('[role="separator"]');
        expect(handles).toHaveLength(2);
        expect(handles[0].getAttribute('aria-orientation')).toBe(
          type === 'HorizontalLayout' ? 'vertical' : 'horizontal'
        );
        if (type === 'VerticalLayout')
          expect(
            (container.firstElementChild as HTMLElement).style.height
          ).toBe('26rem');
        const before = Number(handles[0].getAttribute('aria-valuenow'));
        await act(async () =>
          handles[0].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles: true,
              key: type === 'HorizontalLayout' ? 'ArrowRight' : 'ArrowDown',
            })
          )
        );
        expect(
          Number(handles[0].getAttribute('aria-valuenow'))
        ).toBeGreaterThan(before);
        expect(JSON.stringify(uischema)).toBe(original);
      } finally {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
      }
    }
  );
  it('does not claim ordinary layouts', () => {
    expect(
      sharedSplitLayoutTester({ type: 'HorizontalLayout' }, {}, undefined)
    ).toBe(-1);
  });
});
