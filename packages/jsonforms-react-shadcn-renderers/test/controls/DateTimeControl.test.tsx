import type { ControlProps } from '@jsonforms/core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnDateTimeControl } from '../../src/controls/DateTimeControl';
import { renderMarkup } from '../render';

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

describe('ShadcnDateTimeControl', () => {
  it('renders a combined Shadcn picker instead of datetime-local', () => {
    const markup = renderMarkup(<ShadcnDateTimeControl {...props} />);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('Aug');
    expect(markup).toContain('13:45');
    expect(markup).not.toContain('datetime-local');
    expect(markup).toContain('aria-label="Clear date and time"');
  });

  it('opens one popover containing both Shadcn pickers', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<ShadcnDateTimeControl {...props} />));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('#shadcn-jsonforms-appointment')?.click();
    });

    expect(document.body.querySelector('[data-slot="calendar"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="time-picker"]')).not.toBeNull();
    expect(document.body.querySelector('input[type="datetime-local"]')).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });
});
