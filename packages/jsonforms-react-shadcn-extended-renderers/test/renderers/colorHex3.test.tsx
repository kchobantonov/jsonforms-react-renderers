import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { ShadcnColorControl } from '../../src/renderers/ColorControlRenderer';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const openPicker = (host: HTMLElement) =>
  act(() =>
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Color picker"]')!
      .click(),
  );

it.each([
  ['picker', '51', '#35a'],
  ['picker', '68', '#45a'],
  ['text', '#aabbcc', '#abc'],
  ['text', '#ABC', '#abc'],
  ['text', '', undefined],
])('saves hex3 from %s: %s', (kind, value, expected) => {
  const host = document.createElement('div');
  document.body.append(host);
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
          data: kind === 'picker' ? '#2255aa' : '#123',
          errors: '',
          schema: {},
          uischema: { options: { colorSaveFormat: 'hex3' } },
          handleChange,
        } as any)}
      />,
    ),
  );
  expect(handleChange).not.toHaveBeenCalled();
  if (kind === 'picker') openPicker(host);
  const input = document.querySelector<HTMLInputElement>(
    kind === 'picker' ? 'input[aria-label="Color R"]' : 'input:not([type])',
  )!;
  act(() => {
    input.value = value!;
    Simulate.change(input);
  });
  expect(handleChange).toHaveBeenLastCalledWith('color', expected);
  act(() => root.unmount());
  host.remove();
});

it('rejects transparency without changing stored data and honors global hex3 configuration', () => {
  const host = document.createElement('div');
  document.body.append(host);
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
      />,
    ),
  );
  const input = host.querySelector<HTMLInputElement>(
    'input:not([type="color"])',
  )!;
  act(() => {
    input.value = '#11223380';
    Simulate.change(input);
  });
  expect(handleChange).not.toHaveBeenCalled();
  expect(input.value).toBe('#11223380');
  expect(host.textContent).toContain(
    'Three-digit hex cannot store transparency',
  );
  openPicker(host);
  expect(
    document.querySelector<HTMLInputElement>('input[aria-label="Color R"]')!
      .disabled,
  ).toBe(true);
  act(() => root.unmount());
  host.remove();
});

it('shows a checkerboard only for an empty color without writing fallback black', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const handleChange = vi.fn();
  try {
    let opened = false;
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
          />,
        ),
      );
      if (!opened) {
        openPicker(host);
        opened = true;
      }
      expect(Boolean(host.querySelector('[data-color-empty-swatch]'))).toBe(
        !data,
      );
      expect(
        document.querySelector('input[aria-label="Color R"]'),
      ).not.toBeNull();
      expect(document.querySelector('input[type="color"]')).toBeNull();
    }
    expect(handleChange).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('clears a populated color from the picker footer', () => {
  const host = document.createElement('div');
  document.body.append(host);
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
          data: '#2255aa',
          errors: '',
          schema: {},
          uischema: { options: {} },
          handleChange,
        } as any)}
      />,
    ),
  );
  openPicker(host);
  expect(document.querySelector('input[type="color"]')).toBeNull();
  expect(document.querySelector('[role="slider"]')).not.toBeNull();
  expect(document.querySelector('input[type="range"]')).not.toBeNull();
  const clear = document.querySelector<HTMLButtonElement>(
    '[data-color-panel-clear]',
  );
  expect(clear?.textContent).toBe('Clear value');
  act(() => clear!.click());
  expect(handleChange).toHaveBeenCalledWith('color', undefined);
  act(() => root.unmount());
  host.remove();
});

it('edits the spectrum with the keyboard in the same panel', () => {
  const host = document.createElement('div');
  document.body.append(host);
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
          data: '#2255aa',
          errors: '',
          schema: {},
          uischema: { options: {} },
          handleChange,
        } as any)}
      />,
    ),
  );
  openPicker(host);
  const spectrum = document.querySelector<HTMLElement>('[role="slider"]')!;
  act(() => Simulate.keyDown(spectrum, { key: 'ArrowRight' }));
  expect(handleChange).toHaveBeenCalledWith(
    'color',
    expect.stringMatching(/^#[0-9a-f]{6}$/),
  );
  act(() => root.unmount());
  host.remove();
});

it.each([
  [undefined, {}, false],
  ['#2255aa', { clearable: false }, false],
  ['#2255aa', {}, true],
] as const)(
  'gates the picker footer for %s and %j',
  (data, options, readonly) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() =>
      root.render(
        <ShadcnColorControl
          {...({
            visible: true,
            enabled: true,
            readonly,
            path: 'color',
            label: 'Color',
            data,
            errors: '',
            schema: {},
            uischema: { options },
            handleChange: vi.fn(),
          } as any)}
        />,
      ),
    );
    const trigger = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Color picker"]',
    )!;
    expect(trigger.disabled).toBe(readonly);
    if (!readonly) openPicker(host);
    expect(document.querySelector('[data-color-panel-clear]')).toBeNull();
    act(() => root.unmount());
    host.remove();
  },
);
