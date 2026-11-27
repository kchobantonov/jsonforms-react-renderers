import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vite-plus/test';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../../src';

const schema = {
  type: 'object',
  properties: {
    secret: { type: 'string', format: 'password' },
    appointment: { type: 'string', format: 'date-time' },
  },
};
const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/secret',
      options: {
        startAdornment: { kind: 'icon', icon: 'lock', label: 'Secret' },
        endAdornment: {
          kind: 'icon',
          icon: 'information',
          label: 'Help',
          tooltip: 'Keep private',
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/appointment',
      options: {
        startAdornment: 'At',
        endAdornment: { kind: 'text', text: 'local' },
      },
    },
  ],
};

describe('Antd input adornments', () => {
  it('keeps password and date-time controls between their outer adornments', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={{ secret: 'hunter2', appointment: '2026-11-21T12:00:00' }}
          renderers={antdRenderers}
          cells={antdCells}
        />,
      ),
    );

    const frames = container.querySelectorAll<HTMLElement>(
      '[data-input-adornments]',
    );
    expect(frames).toHaveLength(2);
    const password = frames[0];
    expect(
      password
        .querySelector('[data-adornment-group="start"]')
        ?.firstElementChild?.getAttribute('data-adornment'),
    ).toBe('start');
    expect(
      password
        .querySelector('[data-adornment-group="end"]')
        ?.firstElementChild?.getAttribute('data-adornment'),
    ).toBe('end');
    expect(password.querySelector('input[type="password"]')).toBeTruthy();
    expect(password.querySelector('[data-password-toggle]')).toBeTruthy();
    expect(
      password
        .querySelector('[data-adornment="end"]')
        ?.getAttribute('aria-label'),
    ).toBe('Help');
    expect(
      password.querySelector('[data-adornment="end"] [role="tooltip"]')
        ?.textContent,
    ).toBe('Keep private');

    const dateTime = frames[1];
    expect(
      dateTime.querySelector('[data-adornment="start"]')?.textContent,
    ).toBe('At');
    expect(dateTime.querySelector('[data-adornment="end"]')?.textContent).toBe(
      'local',
    );
    expect(dateTime.querySelector('input')).toBeTruthy();
    act(() => root.unmount());
    container.remove();
  });
});
