import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnRenderers,
  ShadcnAnyOfStringOrEnumControl,
  anyOfStringOrEnumControlTester,
} from '../../src';
const schema = { anyOf: [{ type: 'string' }, { enum: ['foo', 'bar'] }] };
it('selects the suggestion input instead of anyOf tabs', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() =>
    root.render(
      <JsonForms
        schema={{ type: 'object', properties: { foo: schema } }}
        data={{ foo: 'custom' }}
        renderers={shadcnRenderers}
      />
    )
  );
  expect(host.querySelector('[role="tablist"]')).toBeNull();
  expect(host.querySelector('input')?.value).toBe('custom');
  expect(
    Array.from(host.querySelectorAll('datalist option')).map((o) =>
      o.getAttribute('value')
    )
  ).toEqual(['foo', 'bar']);
  expect(host.querySelector('input')?.getAttribute('list')).toBe(
    host.querySelector('datalist')?.id
  );
  act(() => root.unmount());
});
it('accepts arbitrary text, suggestions, and clearing', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const handleChange = vi.fn();
  act(() =>
    root.render(
      <ShadcnAnyOfStringOrEnumControl
        {...({
          schema,
          data: 'foo',
          visible: true,
          enabled: true,
          uischema: { type: 'Control', scope: '#' },
          path: 'foo',
          label: 'Foo',
          handleChange,
        } as any)}
      />
    )
  );
  const input = host.querySelector('input')!;
  for (const value of ['custom text', 'bar', '']) {
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
    expect(handleChange).toHaveBeenLastCalledWith('foo', value || undefined);
  }
  act(() => root.unmount());
});
it('leaves mixed-type alternatives to the generic anyOf renderer', () => {
  expect(
    anyOfStringOrEnumControlTester(
      { type: 'Control', scope: '#' },
      { anyOf: [{ type: 'number' }, { enum: ['foo'] }] },
      { rootSchema: {}, config: {} }
    )
  ).toBe(-1);
});
