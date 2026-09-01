import type { ControlProps } from '@jsonforms/core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnTimeControl } from '../../src/controls/TimeControl';
import { renderMarkup } from '../render';

const props = {
  data: '13:45:00',
  description: 'Start time',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'startTime',
  label: 'Start Time',
  path: 'startTime',
  required: false,
  rootSchema: { type: 'object' },
  schema: { type: 'string', format: 'time' },
  uischema: { type: 'Control', scope: '#/properties/startTime' },
  visible: true,
} as ControlProps;

describe('ShadcnTimeControl', () => {
  it('renders a Shadcn time-picker trigger instead of a native time input', () => {
    const markup = renderMarkup(<ShadcnTimeControl {...props} />);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('13:45');
    expect(markup).not.toContain('type="time"');
    expect(markup).toContain('aria-label="Clear time"');
  });

  it('opens the segmented Shadcn time picker', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<ShadcnTimeControl {...props} />));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('#shadcn-jsonforms-startTime')?.click();
    });

    const picker = document.body.querySelector('[data-slot="time-picker"]');
    expect(picker).not.toBeNull();
    expect(picker?.querySelector('input[type="time"]')).toBeNull();
    expect(picker?.querySelector('input[aria-label="Hours"]')).not.toBeNull();
    expect(picker?.querySelector('input[aria-label="Minutes"]')).not.toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });
});
