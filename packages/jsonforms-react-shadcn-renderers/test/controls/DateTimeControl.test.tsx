import { JsonFormsContext } from '@jsonforms/react';
import type { ControlProps } from '@jsonforms/core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnDateTimeControl } from '../../src/controls/DateTimeControl';
import { renderMarkup } from '../support/render';

const props = {
  data: '2026-08-29T13:45:00-04:00',
  description: 'Appointment date and time',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'appointment',
  label: 'Appointment',
  path: 'appointment',
  required: true,
  rootSchema: { type: 'object' },
  schema: { type: 'string', format: 'date-time' },
  uischema: { type: 'Control', scope: '#/properties/appointment' },
  visible: true,
} as ControlProps;

// Native Date is an independent oracle for the renderer's local display of an instant.
const localDateTime = (value: string) => {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

describe('ShadcnDateTimeControl', () => {
  it('renders a combined Shadcn picker instead of datetime-local', () => {
    const markup = renderMarkup(
      <JsonFormsContext.Provider value={{ i18n: { locale: 'en' } }}>
        <ShadcnDateTimeControl {...props} />
      </JsonFormsContext.Provider>,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('Aug');
    expect(markup).toContain(localDateTime(props.data).slice(11));
    expect(markup).not.toContain('datetime-local');
    expect(markup).toContain('aria-label="Clear date and time"');
    expect(markup).toContain('group-hover:opacity-100');
    expect(markup).toContain('group-focus-within:opacity-100');
  });

  it('opens one popover containing both Shadcn pickers', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<ShadcnDateTimeControl {...props} />));
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('#shadcn-jsonforms-appointment')
        ?.click();
    });

    expect(
      document.body.querySelector('[data-slot="calendar"]'),
    ).not.toBeNull();
    expect(
      document.body.querySelector('[data-slot="time-picker"]'),
    ).not.toBeNull();
    expect(
      document.body.querySelector('input[type="datetime-local"]'),
    ).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  it.each([
    '2026-08-29T13:45:00-04:00',
    '2026-08-29T17:45:00Z',
    '2026-01-01T00:15:00+05:30',
    '2026-12-31T23:45:00-04:00',
  ])(
    'displays %s in local time without rewriting it on mount or open',
    async (data) => {
      const container = document.createElement('div');
      document.body.append(container);
      const root = createRoot(container);
      const handleChange = vi.fn();
      const instant = new Date(data);
      try {
        await act(async () =>
          root.render(
            <ShadcnDateTimeControl
              {...props}
              data={data}
              handleChange={handleChange}
              uischema={{
                ...props.uischema,
                options: { dateTimeFormat: 'YYYY-MM-DD HH:mm' },
              }}
            />,
          ),
        );
        const trigger = container.querySelector<HTMLButtonElement>(
          '#shadcn-jsonforms-appointment',
        )!;
        expect(trigger.textContent).toBe(localDateTime(data));
        await act(async () => trigger.click());
        expect(
          document.querySelector<HTMLInputElement>('input[aria-label="Hours"]')!
            .value,
        ).toBe(String(instant.getHours()));
        expect(
          document.querySelector<HTMLInputElement>(
            'input[aria-label="Minutes"]',
          )!.value,
        ).toBe(String(instant.getMinutes()));
        expect(handleChange).not.toHaveBeenCalled();
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    },
  );
});
