import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { shadcnRenderers, shadcnCells } from '../../src';

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
function draw(
  value: unknown,
  toggle = false,
  disabled = false,
  translated = false,
) {
  const changes = vi.fn();
  act(() =>
    root.render(
      <JsonForms
        schema={{ type: 'object', properties: { agreed: { type: 'boolean' } } }}
        uischema={
          {
            type: 'Control',
            scope: '#/properties/agreed',
            options: { toggle },
          } as any
        }
        data={{ agreed: value }}
        readonly={disabled}
        renderers={shadcnRenderers}
        cells={shadcnCells}
        onChange={changes}
        i18n={
          translated
            ? {
                translate: createTranslator((key, fallback) =>
                  key === 'boolean.notSet' ? 'Не е зададено' : fallback,
                ),
              }
            : undefined
        }
      />,
    ),
  );
  return changes;
}
describe.each([false, true])('boolean control toggle=%s', (toggle) => {
  it.each([true, false, undefined, null, 'false', 'true', 0, 1, '', {}])(
    'preserves typed value %j on mount and distinguishes missing or invalid data',
    (value) => {
      const changes = draw(value, toggle);
      const control = host.querySelector<HTMLElement>(
        toggle ? '[role=switch]' : '[role=checkbox]',
      )!;
      expect(control.getAttribute('aria-checked')).toBe(
        typeof value === 'boolean' ? String(value) : toggle ? 'false' : 'mixed',
      );
      expect(
        changes.mock.calls.every(
          ([change]) =>
            JSON.stringify(change.data) === JSON.stringify({ agreed: value }),
        ),
      ).toBe(true);
      if (toggle && typeof value !== 'boolean') {
        const descriptions = (control.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent);
        expect(descriptions).toContain(
          value === undefined || value === null
            ? 'Not set'
            : 'Not a true or false value',
        );
      }
    },
  );
  it('writes actual booleans and respects readonly', async () => {
    const changes = draw(undefined, toggle);
    act(() =>
      host
        .querySelector<HTMLButtonElement>(
          toggle ? '[role=switch]' : '[role=checkbox]',
        )!
        .click(),
    );
    await vi.waitFor(() =>
      expect(changes.mock.calls.at(-1)?.[0].data.agreed).toBe(true),
    );
    draw(false, toggle, true);
    const control = host.querySelector<HTMLButtonElement>(
      toggle ? '[role=switch]' : '[role=checkbox]',
    )!;
    expect(control.disabled).toBe(true);
  });
});
it('translates the missing switch state', () => {
  draw(undefined, true, false, true);
  expect(host.textContent).toContain('Не е зададено');
});
