import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import {
  ShadcnDurationControl,
  durationControlTester,
} from '../src/renderers/DurationControlRenderer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
let root: Root;
let container: HTMLDivElement;
let write: ReturnType<typeof vi.fn>;
const draw = (data?: string, extra: any = {}, locale = 'en') =>
  act(() =>
    root.render(
      <JsonFormsContext.Provider value={{ i18n: { locale } } as any}>
        <ShadcnDurationControl
          {...({
            schema: { type: 'string', format: 'duration' },
            uischema: { type: 'Control', scope: '#' },
            path: 'duration',
            label: 'Duration',
            enabled: true,
            visible: true,
            data,
            handleChange: write,
            ...extra,
          } as any)}
        />
      </JsonFormsContext.Provider>
    )
  );
const button = (name: string) =>
  Array.from(document.querySelectorAll('button')).find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent) === name
  )!;
const click = (name: string) => act(() => button(name).click());
const edit = (label: string, value: string) =>
  act(() => {
    const el = document.querySelector<HTMLInputElement>(
      `input[aria-label="${label}"]`
    )!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  write = vi.fn();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
it.each([true, false])(
  'selects schema and UI duration formats: %s',
  (schemaBased) => {
    expect(
      durationControlTester(
        {
          type: 'Control',
          scope: '#',
          options: schemaBased ? {} : { format: 'duration' },
        },
        { type: 'string', ...(schemaBased ? { format: 'duration' } : {}) },
        { rootSchema: {}, config: {} }
      )
    ).toBe(3);
  }
);
it('shows only populated component units', () => {
  draw('P2DT3H');
  click('Choose a duration');
  expect(document.querySelector('input[aria-label="Days"]')).toBeTruthy();
  expect(document.querySelector('input[aria-label="Hours"]')).toBeTruthy();
  expect(document.querySelector('input[aria-label="Minutes"]')).toBeNull();
});
it.each(['P1DT0H', 'P0W', 'PT90M'])('preserves untouched %s', (data) => {
  draw(data);
  click('Choose a duration');
  click('Apply');
  expect(write).not.toHaveBeenCalled();
});
it('cancels changes', () => {
  draw('PT1H');
  click('Choose a duration');
  edit('Hours', '3');
  click('Cancel');
  expect(write).not.toHaveBeenCalled();
});
it('applies values above clock limits without normalization', () => {
  draw('PT1M');
  click('Choose a duration');
  edit('Minutes', '90');
  expect(write).not.toHaveBeenCalled();
  click('Apply');
  expect(write).toHaveBeenCalledWith('duration', 'PT90M');
});
it('switches to weeks without mixing components', () => {
  draw('P2D');
  click('Choose a duration');
  click('Weeks');
  expect(document.querySelector('input[aria-label="Days"]')).toBeNull();
  edit('Weeks', '3');
  click('Apply');
  expect(write).toHaveBeenCalledWith('duration', 'P3W');
});
it('removes units from the draft', () => {
  draw('P2DT3H');
  click('Choose a duration');
  click('Remove Days');
  click('Apply');
  expect(write).toHaveBeenCalledWith('duration', 'PT3H');
});
it('supports immediate edits', () => {
  draw('PT1H', {
    uischema: { type: 'Control', scope: '#', options: { showActions: false } },
  });
  click('Choose a duration');
  edit('Hours', '2');
  expect(write).toHaveBeenCalledWith('duration', 'PT2H');
  expect(button('Apply')).toBeUndefined();
});
it.each([{ enabled: false }, { readonly: true }])(
  'honors disabled state: %j',
  (extra) => {
    draw('PT1H', extra);
    expect(button('Choose a duration').disabled).toBe(true);
    expect(button('Clear value')).toBeUndefined();
  }
);
it('clears to undefined', () => {
  draw('PT1H');
  click('Clear value');
  expect(write).toHaveBeenCalledWith('duration', undefined);
});
it('preserves supplied validation errors', () => {
  draw('PT1H', { errors: 'Server validation error' });
  expect(container.textContent).toContain('Server validation error');
});
it('translates unit names', () => {
  draw('PT1H', {}, 'bg');
  const trigger = container.querySelector('button')!;
  act(() => trigger.click());
  expect(document.querySelector('input[aria-label="Часове"]')).toBeTruthy();
});
