import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  shadcnRenderers,
  shadcnCells,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  MaskControlRenderer,
  maskControlTester,
} from '../src/renderers/MaskControlRenderer';
let cleanup = () => {};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('formats loaded data, commits edits and clears', () => {
  vi.useFakeTimers();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let data: any;
  act(() =>
    root.render(
      <JsonForms
        schema={{ type: 'object', properties: { phone: { type: 'string' } } }}
        uischema={{
          type: 'Control',
          scope: '#/properties/phone',
          options: { mask: '+### ###', returnMaskedValue: true },
        }}
        data={{ phone: '+123 456' }}
        renderers={[
          { tester: maskControlTester, renderer: MaskControlRenderer },
          ...shadcnRenderers,
        ]}
        cells={shadcnCells}
        onChange={(event) => {
          data = event.data;
        }}
      />
    )
  );
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  act(() => vi.runAllTimers());
  const input = container.querySelector('input')!;
  expect(input.hasAttribute('data-mask-input')).toBe(true);
  expect(input.value).toBe('+123 456');
  expect(data.phone).toBe('+123 456');
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, '+987654');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => vi.runAllTimers());
  expect(input.value).toBe('+987 654');
  expect(data.phone).toBe('+987 654');
  act(() =>
    (
      container.querySelector('[aria-label="Clear value"]') as HTMLButtonElement
    ).click()
  );
  act(() => vi.runAllTimers());
  expect(data.phone).toBeUndefined();
});
