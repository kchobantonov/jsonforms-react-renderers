import type { ControlProps } from '@jsonforms/core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnTimeControl } from '../../src/controls/TimeControl';
import { renderMarkup } from '../support/render';

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
    expect(markup).toContain('group-hover:opacity-100');
    expect(markup).toContain('group-focus-within:opacity-100');
  });

  it('opens the segmented Shadcn time picker', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<ShadcnTimeControl {...props} />));
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('#shadcn-jsonforms-startTime')
        ?.click();
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

it('lets explicit time views choose the segmented columns', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <ShadcnTimeControl
          {...props}
          uischema={{
            ...props.uischema,
            options: { timeFormat: 'HH:mm:ss', views: ['hours'] },
          }}
        />,
      ),
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button')!.click(),
    );
    expect(document.querySelector('input[aria-label="Hours"]')).not.toBeNull();
    expect(document.querySelector('input[aria-label="Minutes"]')).toBeNull();
    expect(document.querySelector('input[aria-label="Seconds"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
