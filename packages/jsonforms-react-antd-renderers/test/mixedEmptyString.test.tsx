import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

it.each(
  [false, true].flatMap((nested) =>
    [false, true].flatMap((typing) =>
      ['string', 'number', 'integer'].map((type) => ({ nested, typing, type }))
    )
  )
)(
  'preserves mixed $type when clearing (nested=$nested, typing=$typing)',
  async ({ nested, typing, type }) => {
    const initial = type === 'string' ? 'hello' : type === 'number' ? 3.5 : 3;
    const empty = type === 'string' ? '' : 0;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let latest: any;
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={
              nested
                ? {
                    type: 'object',
                    properties: { value: {}, sibling: { type: 'string' } },
                  }
                : {}
            }
            data={nested ? { value: initial, sibling: 'keep' } : initial}
            uischema={{
              type: 'Control',
              scope: nested ? '#/properties/value' : '#',
            }}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={(event) => {
              latest = event.data;
            }}
          />
        )
      );
      const clear = host.querySelector<HTMLButtonElement>(
        'button[aria-label="Clear value"]'
      );
      expect(clear).not.toBeNull();
      if (typing) {
        const input = Array.from(host.querySelectorAll('input')).find(
          (input) => input.value === String(initial)
        )!;
        await act(async () => {
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value'
          )!.set!.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 400));
        });
      } else await act(async () => clear!.click());
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
      expect(nested ? latest.value : latest).toBe(empty);
      expect(host.querySelector('[role="combobox"]')).not.toBeNull();
      expect(host.textContent).toContain(type);
      if (type !== 'string') {
        // Clearing zero again must also leave zero visible in the input.
        await act(async () =>
          host
            .querySelector<HTMLButtonElement>(
              'button[aria-label="Clear value"]'
            )!
            .click()
        );
        expect(
          host.querySelector<HTMLInputElement>(
            'input[role="spinbutton"], input[type="number"]'
          )!.value
        ).toMatch(/^0(?:\.0+)?$/);
      }
      const typeClear = host.querySelector<HTMLElement>('.ant-select-clear');
      expect(typeClear).toBeTruthy();
      await act(async () =>
        typeClear!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      );
      await act(async () => typeClear!.click());
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
      expect(nested ? latest.value : latest).toBeUndefined();
      if (nested) expect(latest.sibling).toBe('keep');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
