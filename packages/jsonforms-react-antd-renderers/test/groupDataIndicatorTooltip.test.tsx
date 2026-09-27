import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import { i18nDefaults } from '../src/util/i18nDefaults';

// An antd Tooltip cannot be opened in jsdom: rc-trigger needs layout APIs jsdom
// does not implement, and no pointer or focus event opens one. Replace it with
// a stub that renders its title, which checks the wiring rather than the hover.
vi.mock('antd', async () => {
  const antd = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...antd,
    Tooltip: ({ title, children, trigger }: any) => (
      <span data-tooltip={String(title)} data-tooltip-trigger={String(trigger)}>
        {children}
      </span>
    ),
  };
});

const schema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      properties: { phone: { type: 'string' } },
    },
  },
};

const uischema = {
  type: 'Group',
  label: 'Emergency contact',
  options: { collapsible: true, collapsed: true, showDataIndicator: true },
  elements: [
    { type: 'Control', scope: '#/properties/contact/properties/phone' },
  ],
};

const render = (data: any, i18n?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema as any}
        uischema={uischema as any}
        renderers={antdRenderers}
        cells={antdCells}
        i18n={i18n}
        onChange={() => undefined}
      />
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

const withData = { contact: { phone: '112' } };

describe('group data-presence indicator tooltip', () => {
  it('explains the marker instead of leaving a bare dot', () => {
    const { container, unmount } = render(withData);
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]');
    expect(dot).toBeTruthy();
    const tooltip = dot!.closest('[data-tooltip]');
    expect(tooltip?.getAttribute('data-tooltip')).toBe('Section contains data');
    unmount();
  });

  it('uses one string for the tooltip and the accessible name', () => {
    const { container, unmount } = render(withData);
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]');
    expect(dot!.getAttribute('aria-label')).toBe(
      dot!.closest('[data-tooltip]')!.getAttribute('data-tooltip')
    );
    unmount();
  });

  it('opens on keyboard focus as well as hover', () => {
    const { container, unmount } = render(withData);
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]');
    // Reachable by keyboard at all...
    expect(dot!.tabIndex).toBe(0);
    // ...and the tooltip actually listens for focus, not only hover.
    const trigger = dot!
      .closest('[data-tooltip-trigger]')!
      .getAttribute('data-tooltip-trigger');
    expect(trigger).toContain('focus');
    expect(trigger).toContain('hover');
    unmount();
  });

  it('translates through the form translator', () => {
    const { container, unmount } = render(withData, {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'group.dataIndicator' ? 'Разделът съдържа данни' : fallback
      ),
    });
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]');
    expect(dot!.getAttribute('aria-label')).toBe('Разделът съдържа данни');
    unmount();
  });

  it('falls back to the default when the key is untranslated', () => {
    const { container, unmount } = render(withData, {
      locale: 'en',
      translate: createTranslator((_key, fallback) => fallback),
    });
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]');
    expect(dot!.getAttribute('aria-label')).toBe(
      i18nDefaults['group.dataIndicator']
    );
    unmount();
  });

  it('shows nothing at all when the group holds no data', () => {
    const { container, unmount } = render({});
    expect(container.querySelector('[data-group-indicator]')).toBeNull();
    unmount();
  });
});
