import dayjs from 'dayjs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createAjv } from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { shadcnCells, shadcnRenderers } from '../../src';

// The third-party widgets are replaced so their offered dates and completed
// selections can be inspected. Renderer selection, options, serialization,
// bounds and form updates run through the real renderer registry.
vi.mock('@jsonforms-react-shadcn-ui/calendar', () => ({
  Calendar: ({ disabled, onSelect }: any) => (
    <div>
      {[10, 11, 12, 13].map((day) => {
        const date = new Date(2026, 10, day);
        return (
          <button
            key={day}
            data-test-day={day}
            disabled={typeof disabled === 'function' && disabled(date)}
            onClick={() => onSelect(date)}
          >
            {day}
          </button>
        );
      })}
    </div>
  ),
}));
vi.mock('../../src/components/TimePicker', () => ({
  TimePicker: ({ onChange, useSeconds }: any) => (
    <div data-test-seconds={String(useSeconds)}>
      {['07:05:09', '10:30:45', '18:00:00'].map((time) => (
        <button key={time} data-test-time={time} onClick={() => onChange(time)}>
          {time}
        </button>
      ))}
    </div>
  ),
}));

let dispose = () => {};
afterEach(() => dispose());
const mount = (
  format: string,
  value: string,
  options: any = {},
  bounds: any = {},
  config: any = { restrict: true },
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let latest: any = { value };
  let errors: any[] = [];
  const render = (nextConfig = config, nextBounds = bounds) =>
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: { value: { type: 'string', format, ...nextBounds } },
          }}
          data={{ value }}
          uischema={{ type: 'Control', scope: '#/properties/value', options }}
          config={nextConfig}
          renderers={shadcnRenderers}
          cells={shadcnCells}
          onChange={(event) => {
            latest = event.data;
            errors = event.errors ?? [];
          }}
        />,
      ),
    );
  render();
  dispose = () => {
    act(() => root.unmount());
    container.remove();
  };
  const settle = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  };
  return {
    container,
    render,
    settle,
    value: () => latest.value,
    errors: () => errors,
    open: () =>
      act(() =>
        container
          .querySelector<HTMLButtonElement>('#shadcn-jsonforms-value')!
          .click(),
      ),
    pick: async (time: string) => {
      act(() =>
        document
          .querySelector<HTMLButtonElement>(`[data-test-time="${time}"]`)!
          .click(),
      );
      await settle();
    },
  };
};

describe('temporal spec contracts matching the Ant Design picker cases', () => {
  it.each([
    { bounds: { formatMinimum: '2026-11-11' }, enabled: [11, 12, 13] },
    { bounds: { formatMaximum: '2026-11-12' }, enabled: [10, 11, 12] },
    { bounds: { formatExclusiveMinimum: '2026-11-11' }, enabled: [12, 13] },
    { bounds: { formatExclusiveMaximum: '2026-11-12' }, enabled: [10, 11] },
    {
      bounds: { formatMinimum: '2026-11-12', formatMaximum: '2026-11-11' },
      enabled: [],
    },
  ])('offers the dates permitted by $bounds', ({ bounds, enabled }) => {
    const view = mount('date', '2026-11-11', {}, bounds);
    view.open();
    expect(
      Array.from(
        document.querySelectorAll<HTMLButtonElement>('[data-test-day]'),
      )
        .filter((button) => !button.disabled)
        .map((button) => Number(button.dataset.testDay)),
    ).toEqual(enabled);
  });

  it.each([
    { config: { restrict: false }, options: {}, enabled: [10, 11, 12, 13] },
    {
      config: { restrict: true },
      options: { restrict: false },
      enabled: [10, 11, 12, 13],
    },
    {
      config: { restrict: false },
      options: { restrict: true },
      enabled: [12, 13],
    },
  ])(
    'respects the effective restrict option $options over $config',
    ({ config, options, enabled }) => {
      const view = mount(
        'date',
        '2026-11-11',
        options,
        { formatMinimum: '2026-11-12' },
        config,
      );
      view.open();
      expect(
        Array.from(
          document.querySelectorAll<HTMLButtonElement>('[data-test-day]'),
        )
          .filter((button) => !button.disabled)
          .map((button) => Number(button.dataset.testDay)),
      ).toEqual(enabled);
    },
  );

  it('retains an out-of-range committed date instead of clamping on mount', async () => {
    const view = mount(
      'date',
      '2026-11-10',
      {},
      { formatMinimum: '2026-11-12' },
    );
    await view.settle();
    expect(view.value()).toBe('2026-11-10');
  });

  it('writes a valid RFC3339 time with seconds and an offset', async () => {
    const view = mount('time', '08:00:00Z');
    view.open();
    await view.pick('10:30:45');
    expect(view.value()).toMatch(/^10:30:00[+-]\d{2}:\d{2}$/);
    expect(view.errors()).toEqual([]);
  });

  it.each([
    {
      options: { timeFormat: 'HH:mm:ss' },
      seconds: true,
      expected: /^10:30:45/,
    },
    { options: { timeFormat: 'HH:mm' }, seconds: false, expected: /^10:30:00/ },
    {
      options: { timeFormat: 'HH:mm:ss', views: ['hours', 'minutes'] },
      seconds: false,
      expected: /^10:30:00/,
    },
    {
      options: { timeFormat: 'HH:mm', views: ['hours', 'minutes', 'seconds'] },
      seconds: true,
      expected: /^10:30:45/,
    },
  ])(
    'uses display precision and explicit views $options',
    async ({ options, seconds, expected }) => {
      const view = mount('time', '08:00:09Z', options);
      view.open();
      expect(
        document
          .querySelector('[data-test-seconds]')
          ?.getAttribute('data-test-seconds'),
      ).toBe(String(seconds));
      await view.pick('10:30:45');
      expect(view.value()).toMatch(expected);
    },
  );

  it('honors a global custom save format', async () => {
    const view = mount('time', '08:00', {}, {}, { timeSaveFormat: 'HH:mm' });
    view.open();
    await view.pick('10:30:45');
    expect(view.value()).toBe('10:30');
  });

  it('prevents a completed time commit outside its bounds', async () => {
    const view = mount(
      'time',
      '10:00:00Z',
      {},
      {
        formatMinimum: dayjs().hour(9).minute(0).second(0).format('HH:mm:ssZ'),
        formatMaximum: dayjs().hour(17).minute(0).second(0).format('HH:mm:ssZ'),
      },
    );
    view.open();
    await view.pick('07:05:09');
    expect(view.value()).toBe('10:00:00Z');
    await view.pick('10:30:45');
    expect(view.value()).toMatch(/^10:30:00[+-]/);
    await view.pick('18:00:00');
    expect(view.value()).toMatch(/^10:30:00[+-]/);
  });

  it('repairs a legacy time missing its offset on the next completed edit', async () => {
    const view = mount('time', '08:00:00');
    view.open();
    await view.pick('10:30:45');
    expect(view.errors()).toEqual([]);
  });

  it('keeps an invalid stored time visible until it is edited', () => {
    const view = mount('time', 'invalid time');
    expect(view.container.textContent).toContain('invalid time');
  });

  it('writes a valid date-time with the configured save format', async () => {
    const view = mount('date-time', '2026-11-11T08:00:00Z', {
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    });
    view.open();
    await view.pick('10:30:45');
    expect(view.value()).toMatch(/^2026-11-11T10:30:45[+-]\d{2}:\d{2}$/);
    expect(view.errors()).toEqual([]);
  });
});

it('updates a referenced date bound when its sibling changes without clamping data', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  dispose = () => {
    act(() => root.unmount());
    container.remove();
  };
  let latest: any;
  const ajv = createAjv({ $data: true });
  const render = (start: string) =>
    act(() =>
      root.render(
        <JsonForms
          ajv={ajv}
          schema={{
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              value: {
                type: 'string',
                format: 'date',
                formatMinimum: { $data: '1/start' },
              } as any,
            },
          }}
          data={{ start, value: '2026-11-11' }}
          config={{ restrict: true }}
          uischema={{ type: 'Control', scope: '#/properties/value' }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />,
      ),
    );
  render('2026-11-11');
  act(() =>
    container
      .querySelector<HTMLButtonElement>('#shadcn-jsonforms-value')!
      .click(),
  );
  expect(
    document.querySelector<HTMLButtonElement>('[data-test-day="11"]')!.disabled,
  ).toBe(false);
  render('2026-11-13');
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
  expect(
    document.querySelector<HTMLButtonElement>('[data-test-day="11"]')!.disabled,
  ).toBe(true);
  expect(
    document.querySelector<HTMLButtonElement>('[data-test-day="13"]')!.disabled,
  ).toBe(false);
  expect(latest.value).toBe('2026-11-11');
});

it('diagnoses an explicit save format that cannot satisfy the schema', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    mount('time', '08:00:00Z', { timeSaveFormat: 'H:mm' });
    expect(warn.mock.calls.flat().join(' ')).toContain(
      'temporal.saveFormatInvalid',
    );
  } finally {
    warn.mockRestore();
  }
});
