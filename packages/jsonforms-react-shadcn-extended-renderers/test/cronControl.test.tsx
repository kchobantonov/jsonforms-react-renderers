import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import {
  ShadcnCronControl,
  cronControlTester,
} from '../src/renderers/CronControlRenderer';
import { shadcnExtendedRenderers } from '../src';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
let root: Root;
let container: HTMLDivElement;
let write: ReturnType<typeof vi.fn>;
const render = (data?: string, extra: any = {}) =>
  act(() =>
    root.render(
      <JsonFormsContext.Provider
        value={{ i18n: { locale: extra.locale ?? 'en' } } as any}
      >
        <ShadcnCronControl
          {...({
            data,
            schema: { type: 'string', format: 'cron' },
            uischema: { type: 'Control', scope: '#' },
            path: 'schedule',
            label: 'Schedule',
            enabled: true,
            visible: true,
            handleChange: write,
            ...extra,
          } as any)}
        />
      </JsonFormsContext.Provider>
    )
  );
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (el) => (el.getAttribute('aria-label') ?? el.textContent) === name
  )!;
const click = (name: string) => act(() => button(name).click());
const edit = (value: string, selector = 'input[aria-label="Expression"]') =>
  act(() => {
    const input = document.querySelector<HTMLInputElement>(selector)!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
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

it.each([{ format: 'cron' }, {}])(
  'selects cron through schema or UI options: %j',
  (schema) => {
    expect(
      cronControlTester(
        {
          type: 'Control',
          scope: '#',
          options: schema.format ? {} : { format: 'cron' },
        },
        { type: 'string', ...schema },
        { rootSchema: {}, config: {} }
      )
    ).toBe(3);
  }
);
it('registers the specialized cron renderer', () =>
  expect(
    shadcnExtendedRenderers.some((entry) => entry.tester === cronControlTester)
  ).toBe(true));
it('does not select ordinary text', () =>
  expect(
    cronControlTester(
      { type: 'Control', scope: '#' },
      { type: 'string' },
      { rootSchema: {}, config: {} }
    )
  ).toBe(-1));
it.each([undefined, '0 0 9 * * MON', '0 0 9 L * ?'])(
  'does not rewrite untouched %s',
  (value) => {
    render(value);
    click('Choose a schedule');
    click('Apply');
    expect(write).not.toHaveBeenCalled();
  }
);
it('cancels draft edits', () => {
  render('0 0 9 * * *');
  click('Choose a schedule');
  edit('0 0 10 * * *');
  click('Cancel');
  expect(write).not.toHaveBeenCalled();
});
it('applies draft edits', () => {
  render('0 0 9 * * *');
  click('Choose a schedule');
  edit('0 0 10 * * *');
  expect(write).not.toHaveBeenCalled();
  click('Apply');
  expect(write).toHaveBeenCalledWith('schedule', '0 0 10 * * *');
});
it('prevents applying invalid expressions', () => {
  render();
  click('Choose a schedule');
  edit('invalid');
  expect(button('Apply').disabled).toBe(true);
  expect(document.querySelector('[role="alert"]')).toBeTruthy();
});
it('commits immediately without actions', () => {
  render(undefined, {
    uischema: { type: 'Control', scope: '#', options: { showActions: false } },
  });
  click('Choose a schedule');
  edit('0 0 10 * * *');
  expect(write).toHaveBeenCalledWith('schedule', '0 0 10 * * *');
  expect(button('Apply')).toBeUndefined();
});
it.each([{ readonly: true }, { enabled: false }])(
  'honors disabled state %j',
  (extra) => {
    render('0 0 9 * * *', extra);
    expect(button('Choose a schedule').disabled).toBe(true);
    expect(container.querySelector('input')!.disabled).toBe(true);
    expect(button('Clear value')).toBeUndefined();
  }
);
it('clears to undefined', () => {
  render('0 0 9 * * *');
  click('Clear value');
  expect(write).toHaveBeenCalledWith('schedule', undefined);
});
it('honors visibility', () => {
  render(undefined, { visible: false });
  expect(container.innerHTML).toBe('');
});
it('writes directly typed expressions', () => {
  render();
  edit('0 0 8 * * *', 'input');
  expect(write).toHaveBeenCalledWith('schedule', '0 0 8 * * *');
});
it('uses English fallback after removing German messages', () => {
  render(undefined, { locale: 'de' });
  expect(button('Choose a schedule')).toBeTruthy();
});
it('offers editable fields for advanced syntax', () => {
  render('0 0 9 L * ?');
  click('Choose a schedule');
  expect(document.querySelector('input[value="L"]')).toBeTruthy();
});
it('changes a selected hour without rewriting unrelated fields', () => {
  render('0 0 9 * * MON');
  click('Choose a schedule');
  click('Hours');
  const checkbox = document.querySelector<HTMLButtonElement>(
    '[role="checkbox"][aria-label="Hours 10"]'
  )!;
  expect(checkbox).toBeTruthy();
  act(() => checkbox.click());
  // Checkbox choices stage edits while the original form value is unchanged.
  expect(write).not.toHaveBeenCalled();
  const draft = document.querySelector<HTMLInputElement>(
    'input[aria-label="Expression"]'
  )!;
  expect(draft.value).toBe('0 0 9,10 * * MON');
});
