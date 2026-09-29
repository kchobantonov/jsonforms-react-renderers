import type { ControlProps } from '@jsonforms/core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnDateControl } from '../../src/controls/DateControl';
import { renderMarkup } from '../render';

const props = {
  data: '1985-06-02',
  description: 'Your birth date',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'birthDate',
  label: 'Birth Date',
  path: 'birthDate',
  required: true,
  rootSchema: { type: 'object' },
  schema: { type: 'string', format: 'date' },
  uischema: { type: 'Control', scope: '#/properties/birthDate' },
  visible: true,
} as ControlProps;

describe('ShadcnDateControl', () => {
  it('renders a Shadcn date-picker trigger instead of a native date input', () => {
    const markup = renderMarkup(<ShadcnDateControl {...props} />);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('Jun');
    expect(markup).not.toContain('type="date"');
    expect(markup).toContain('aria-label="Clear date"');
  });

  it('opens the Shadcn calendar popover', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<ShadcnDateControl {...props} />));
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('#shadcn-jsonforms-birthDate')
        ?.click();
    });

    expect(
      document.body.querySelector('[data-slot="calendar"]')
    ).not.toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });
});

it('uses month and year controls and preserves the configured save and display formats', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const handleChange = vi.fn();
  try {
    await act(async () =>
      root.render(
        <ShadcnDateControl
          {...props}
          data='2024-01'
          handleChange={handleChange}
          uischema={{
            ...props.uischema,
            options: {
              views: ['year', 'month'],
              dateFormat: 'YYYY.MM',
              dateSaveFormat: 'YYYY-MM',
            },
          }}
        />
      )
    );
    expect(container.textContent).toContain('2024.01');
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('#shadcn-jsonforms-birthDate')!
        .click()
    );
    expect(document.body.querySelector('[data-slot="calendar"]')).toBeNull();
    expect(
      document.body.querySelector('[aria-label="Month"]')!.textContent
    ).toContain('January');
    expect(
      document.body.querySelector('[aria-label="Year"]')!.textContent
    ).toContain('2024');
    expect(handleChange).not.toHaveBeenCalled();
    await act(async () =>
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Apply')!
        .click()
    );
    expect(handleChange).toHaveBeenCalledWith('birthDate', '2024-01');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
