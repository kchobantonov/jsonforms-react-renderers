import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { GroupLayout, RuleEffect } from '@jsonforms/core';
import {
  boundDataPaths,
  collectBoundPaths,
  groupHasData,
  hasGroupValue,
} from '../../src/util/groupState';
import { GroupLayoutRenderer as GroupComponent } from '../../src/layouts/GroupLayout';

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
      const button = container.querySelector<HTMLButtonElement>(
        '[data-group-footer] button',
      )!;
      expect(button).not.toBeNull();
      expect(trigger.contains(button)).toBe(false);
      expect(
        trigger.contains(container.querySelector('[data-group-header]')),
      ).toBe(false);
      const card = container.querySelector('[data-group-frame]')!;
      expect(card.closest('.ant-collapse-item')).toBeNull();
      expect(card.contains(button)).toBe(true);
      expect(card.contains(container.querySelector('[data-group-cover]'))).toBe(
        true,
      );
      const cover = card.querySelector('[data-group-cover]')!;
      const header = card.querySelector('[data-group-header]')!;
      expect(
        cover.compareDocumentPosition(header) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(header.querySelector('.ant-card-meta')).not.toBeNull();
      expect(card.querySelector('.ant-card-head')).toBeNull();
      expect(container.querySelectorAll('[data-group-header]')).toHaveLength(1);
      expect(
        card.querySelector<HTMLElement>('[data-group-body]')?.style.display,
      ).toBe('none');
      await act(async () => trigger.click());
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(
        card.querySelector<HTMLElement>('[data-group-body]')?.style.display,
      ).not.toBe('none');
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
      container.querySelector<HTMLElement>(
        '.ant-collapse-header[role="button"]',
      )!;
    try {
      await render();
      const input = container.querySelector('input')!;
      expect(container.querySelector('.ant-collapse')).not.toBeNull();
      expect(container.querySelector('.ant-card')).toBeNull();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(toggle().textContent).toContain('Details');
      expect(toggle().tabIndex).toBe(0);
      expect(container.querySelector('[data-group-indicator]')).not.toBeNull();
      await act(async () => toggle().click());
      expect(toggle()?.getAttribute('aria-expanded') ?? 'true').toBe('true');
      await act(async () =>
        toggle().dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            bubbles: true,
          }),
        ),
      );
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      await act(async () => toggle().click());
      input.value = 'local edit';
      await render(group, false);
      expect(toggle()?.getAttribute('aria-expanded') ?? 'true').toBe('true');
      expect(container.querySelector('[data-group-indicator]')).not.toBeNull();
      await act(async () => toggle().click());
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(container.querySelector('input')).toBe(input);
      expect(input.value).toBe('local edit');
      await render(group, '  ');
      expect(container.querySelector('[data-group-indicator]')).toBeNull();
      await render({
        ...group,
        options: { ...group.options, collapsed: false },
      });
      expect(toggle()?.getAttribute('aria-expanded') ?? 'true').toBe('true');
      await render({ ...group, options: { collapsed: true } });
      expect(toggle()).toBeNull();
      expect(container.querySelector('.ant-card')).not.toBeNull();
      expect(toggle()?.getAttribute('aria-expanded') ?? 'true').toBe('true');
      await render({ ...group, options: {} }, 0, {
        jsonformsExtended: { collapsible: true, collapsed: true },
      });
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      await render({
        ...group,
        options: { collapsible: 'true', collapsed: true },
      });
      expect(toggle()).toBeNull();
      expect(container.querySelector('.ant-card')).not.toBeNull();
      expect(toggle()?.getAttribute('aria-expanded') ?? 'true').toBe('true');
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

describe('bound-path collection', () => {
  const nested: GroupLayout = {
    type: 'Group',
    elements: [
      {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/a' },
          {
            type: 'HorizontalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/b/properties/c' },
            ],
          },
        ],
      },
      { type: 'Label', text: 'not bound' } as any,
    ],
  };

  it('collects every bound descendant through intervening layouts', () => {
    expect(collectBoundPaths(nested).map((p) => p.segments)).toEqual([
      ['a'],
      ['b', 'c'],
    ]);
  });

  it('serves both indicators from one traversal', () => {
    // The data indicator resolves `segments` against the container context;
    // an error indicator looks the absolute paths up in an error index. Same
    // walk, same cache.
    const paths = collectBoundPaths(nested);
    expect(paths.map((p) => p.relative)).toEqual(['a', 'b.c']);
    expect(boundDataPaths(nested)).toEqual(['a', 'b.c']);
    expect(boundDataPaths(nested, 'items.3')).toEqual([
      'items.3.a',
      'items.3.b.c',
    ]);
  });

  it('gives an error index the paths it needs, boundaries included', () => {
    // An ancestor index built from /items/10/a contains items, items.10 and
    // items.10.a - never items.1 - so a sibling item cannot match.
    const index = new Set(['', 'items', 'items.10', 'items.10.a']);
    expect(boundDataPaths(nested, 'items.10').some((p) => index.has(p))).toBe(
      true,
    );
    expect(boundDataPaths(nested, 'items.1').some((p) => index.has(p))).toBe(
      false,
    );
  });

  it('splits each scope once and reuses the result', () => {
    // Identity, not equality: the scope strings are static, so re-splitting
    // them on every render was pure waste.
    expect(collectBoundPaths(nested)).toBe(collectBoundPaths(nested));
  });

  it('caches per element, so a different element is collected separately', () => {
    const other: GroupLayout = {
      type: 'Group',
      elements: [{ type: 'Control', scope: '#/properties/z' }],
    };
    expect(collectBoundPaths(other).map((p) => p.segments)).toEqual([['z']]);
    expect(collectBoundPaths(other)).not.toBe(collectBoundPaths(nested));
  });

  it('resolves the item context once for a group inside an array', () => {
    const data = { items: [{ a: '' }, { a: 'filled' }] };
    expect(groupHasData(nested, data, 'items.0')).toBe(false);
    expect(groupHasData(nested, data, 'items.1')).toBe(true);
  });
});
