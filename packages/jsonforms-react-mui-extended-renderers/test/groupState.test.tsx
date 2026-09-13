import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { GroupLayout, RuleEffect } from '@jsonforms/core';
import { groupHasData, hasGroupValue } from '../src/util/groupState';
import { MuiGroupRendererComponent as GroupComponent } from '../src/renderers/MuiGroupRenderer';

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
      true
    );
    expect(groupHasData(nested, { rows: [{ 'a/b': '' }] }, 'rows.0')).toBe(
      false
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
      }
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
          />
        )
      );
    };
    const toggle = () =>
      container.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    try {
      await render();
      const input = container.querySelector('input')!;
      const content = document.getElementById(
        toggle().getAttribute('aria-controls')!
      )!;
      expect(content.hidden).toBe(true);
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
        collapsible: true,
        collapsed: true,
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
