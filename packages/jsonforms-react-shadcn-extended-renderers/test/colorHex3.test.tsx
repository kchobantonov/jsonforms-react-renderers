import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { ShadcnColorControl } from '../src/renderers/ColorControlRenderer';

it.each([
  ['picker', '#ed5050', '#e55'],
  ['picker', '#c47878', '#c77'],
  ['text', '#aabbcc', '#abc'],
  ['text', '#ABC', '#abc'],
  ['text', '', undefined],
])('saves hex3 from %s: %s', (kind, value, expected) => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const handleChange = vi.fn();
  act(() =>
    root.render(
      <ShadcnColorControl
        {...({
          visible: true,
          enabled: true,
          path: 'color',
          label: 'Color',
          data: '#123',
          errors: '',
          schema: {},
          uischema: { options: { colorSaveFormat: 'hex3' } },
          handleChange,
        } as any)}
      />
    )
  );
  expect(handleChange).not.toHaveBeenCalled();
  const input = host.querySelector<HTMLInputElement>(
    kind === 'picker' ? 'input[type="color"]' : 'input:not([type="color"])'
  )!;
  act(() => {
    input.value = value!;
    Simulate.change(input);
  });
  expect(handleChange).toHaveBeenLastCalledWith('color', expected);
  act(() => root.unmount());
});

it('rejects transparency without changing stored data and honors global hex3 configuration', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const handleChange = vi.fn();
  act(() =>
    root.render(
      <ShadcnColorControl
        {...({
          visible: true,
          enabled: true,
          path: 'color',
          label: 'Color',
          data: '#123',
          errors: '',
          schema: {},
          config: { jsonformsExtended: { colorSaveFormat: 'hex3' } },
          uischema: { options: {} },
          handleChange,
        } as any)}
      />
    )
  );
  const input = host.querySelector<HTMLInputElement>(
    'input:not([type="color"])'
  )!;
  act(() => {
    input.value = '#11223380';
    Simulate.change(input);
  });
  expect(handleChange).not.toHaveBeenCalled();
  expect(input.value).toBe('#11223380');
  expect(host.textContent).toContain(
    'Three-digit hex cannot store transparency'
  );
  expect(
    host.querySelector<HTMLInputElement>('input[type="color"]')!.disabled
  ).toBe(true);
  act(() => root.unmount());
});

it('shows a checkerboard only for an empty color without writing fallback black', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const handleChange = vi.fn();
  try {
    for (const data of [undefined, '#123', '']) {
      act(() =>
        root.render(
          <ShadcnColorControl
            {...({
              visible: true,
              enabled: true,
              path: 'color',
              label: 'Color',
              data,
              errors: '',
              schema: {},
              uischema: { options: {} },
              handleChange,
            } as any)}
          />
        )
      );
      expect(Boolean(host.querySelector('[data-color-empty-swatch]'))).toBe(
        !data
      );
      expect(host.querySelector('input[type="color"]')).not.toBeNull();
    }
    expect(handleChange).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
  }
});
