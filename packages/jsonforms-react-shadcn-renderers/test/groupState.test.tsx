import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { GroupLayout, RuleEffect } from '@jsonforms/core';
import { groupHasData, hasGroupValue } from '../src/util/groupState';
import { ShadcnGroupLayout as GroupComponent } from '../src/layouts/GroupLayout';

const group: GroupLayout = {
  type: 'Group',
  label: 'Details',
  options: { collapsible: true, collapsed: true, showDataIndicator: true },
  elements: [{ type: 'Control', scope: '#/properties/value' }],
};
const renderers = [
  {
    tester: (ui: any) => (ui.type === 'Group' ? 10 : -1),
    renderer: withJsonFormsLayoutProps(GroupComponent),
  },
  {
    tester: (ui: any) => (ui.type === 'Control' ? 10 : -1),
    renderer: () => <input aria-label='Child' defaultValue='preserved' />,
  },
];

describe('Group collapse and data indicator', () => {
  it('keeps the cover and heading visible while the card body collapses', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const action = vi.fn();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const regions = {
      ...group,
      cover: {
        type: 'ImageView',
        src: '/supplier.jpg',
        alt: 'Supplier premises',
      },
      header: [{ type: 'Label', text: 'Verified' }],
      footer: [{ type: 'Button', label: 'Verify', action: 'verifySupplier' }],
    } as GroupLayout;
    const regionRenderers = [
      ...renderers,
      {
        tester: (ui: any) => (ui.type === 'ImageView' ? 10 : -1),
        renderer: () => <img src='/supplier.jpg' alt='Supplier premises' />,
      },
      {
        tester: (ui: any) => (ui.type === 'Label' ? 10 : -1),
        renderer: () => <span>Verified</span>,
      },
      {
        tester: (ui: any) => (ui.type === 'Button' ? 10 : -1),
        renderer: () => (
          <button type='button' onClick={action}>
            Verify
          </button>
        ),
      },
    ];
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{ type: 'object', properties: { value: {} } }}
            data={{ value: 'kept' }}
            uischema={regions}
            renderers={regionRenderers}
          />,
        ),
      );
      const trigger = container.querySelector<HTMLElement>('[aria-expanded]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(
        container.querySelector('[data-group-cover] img')?.getAttribute('alt'),
      ).toBe('Supplier premises');
      expect(
        container.querySelector('[data-group-header]')?.textContent,
      ).toContain('Verified');
      expect(container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Verified');
      expect(container.textContent).not.toContain('Details');
      expect(container.querySelector('[data-slot="card-header"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="card-content"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="card-footer"]')).not.toBeNull();
      const button = container.querySelector<HTMLButtonElement>(
        '[data-group-footer] button',
      )!;
      expect(button).not.toBeNull();
      expect(trigger.contains(button)).toBe(false);
      expect(
        trigger.contains(container.querySelector('[data-group-header]')),
      ).toBe(false);
      expect(
        container.querySelector('[data-group-cover]')?.closest('[hidden]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-group-header]')?.closest('[hidden]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-group-footer]')?.closest('[hidden]'),
      ).not.toBeNull();
      await act(async () => trigger.click());
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await act(async () => button.click());
      expect(action).toHaveBeenCalledOnce();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
    }
  });

  it('recognizes meaningful values and ignores empty containers', () => {
    for (const value of [false, 0, 'text', [false], { count: 0 }])
      expect(hasGroupValue(value)).toBe(true);
    for (const value of [undefined, null, '', '  ', [], {}, { empty: [] }])
      expect(hasGroupValue(value)).toBe(false);
  });
  it('checks only bound descendants, including escaped scopes and nested paths', () => {
    const nested: GroupLayout = {
      type: 'Group',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/a~1b',
              rule: {
                effect: RuleEffect.HIDE,
                condition: { scope: '#', schema: {} },
              },
            },
          ],
        } as any,
      ],
    };
    expect(groupHasData(nested, { unrelated: 'yes' })).toBe(false);
    expect(groupHasData(nested, { rows: [{ 'a/b': false }] }, 'rows.0')).toBe(
      true,
    );
    expect(groupHasData(nested, { rows: [{ 'a/b': '' }] }, 'rows.0')).toBe(
      false,
    );
  });
  it('preserves mounted children and user collapse state, reacts to options and data', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const render = async (ui = group, value: unknown = 0, config = {}) => {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{ type: 'object', properties: { value: {} } }}
            data={{ value }}
            uischema={ui}
            config={config}
            renderers={renderers}
          />,
        ),
      );
    };
    const toggle = () =>
      container.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    try {
      await render();
      const input = container.querySelector('input')!;
      const content = document.getElementById(
        toggle().getAttribute('aria-controls')!,
      )!;
      expect(content.hidden).toBe(true);
      expect(container.querySelector('fieldset, legend')).toBeNull();
      expect(
        container.querySelector('div[data-slot="collapsible"]'),
      ).not.toBeNull();
      expect(toggle().getAttribute('data-slot')).toBe('collapsible-trigger');
      expect(content.getAttribute('data-slot')).toBe('collapsible-content');
      expect(container.querySelectorAll('button')).toHaveLength(1);
      expect(
        toggle().querySelector('.shadcn-jsonforms-group-title')?.textContent,
      ).toBe('Details');
      expect(
        toggle().querySelector(
          '.shadcn-jsonforms-group-actions [data-group-indicator]',
        ),
      ).not.toBeNull();
      expect(toggle().querySelector('svg')).not.toBeNull();
      expect(toggle().getAttribute('aria-label')).toBe('Details');
      expect(container.querySelector('[data-group-indicator]')).not.toBeNull();
      await act(async () => toggle().click());
      expect(content.hidden).toBe(false);
      input.value = 'local edit';
      await render(group, false);
      expect(content.hidden).toBe(false);
      expect(container.querySelector('[data-group-indicator]')).not.toBeNull();
      await act(async () => toggle().click());
      expect(content.hidden).toBe(true);
      expect(container.querySelector('input')).toBe(input);
      expect(input.value).toBe('local edit');
      await render(group, '  ');
      expect(container.querySelector('[data-group-indicator]')).toBeNull();
      await render({
        ...group,
        options: { ...group.options, collapsed: false },
      });
      expect(content.hidden).toBe(false);
      await render({ ...group, options: { collapsed: true } });
      expect(toggle()).toBeNull();
      expect(content.hidden).toBe(false);
      await render({ ...group, options: {} }, 0, {
        jsonformsExtended: { collapsible: true, collapsed: true },
      });
      expect(content.hidden).toBe(true);
      await render({
        ...group,
        options: { collapsible: 'true', collapsed: true },
      });
      expect(toggle()).toBeNull();
      expect(content.hidden).toBe(false);
      await render({
        ...group,
        rule: {
          effect: RuleEffect.HIDE,
          condition: { scope: '#', schema: {} },
        },
      });
      expect(container.querySelector('input')).toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
    }
  });
});
