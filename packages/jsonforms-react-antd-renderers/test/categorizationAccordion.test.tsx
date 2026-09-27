import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { NOT_APPLICABLE } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import { categorizationAccordionTester } from '../src/layouts/CategorizationAccordionLayout';

// antd's Collapse measures its panels, and its open/close motion runs effects
// that React only flushes when the act environment is declared - without the
// flag the motion's node ref is still undefined when its effect runs.
class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
// Without this React does not flush passive effects when `act` exits, and the
// accordion wires its panel relationships in one.
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

/*
  No `vi.restoreAllMocks()` here. `test/renderers/MatchMediaMock.ts` - this
  package's vitest setup file - installs `window.matchMedia` as a `vi.fn()`,
  so restoring all mocks strips its implementation and every later render dies
  in antd's responsive observer, which calls `addEventListener` on whatever
  `matchMedia` returned. Spies in this file restore themselves instead.
*/

const schema = {
  type: 'object',
  properties: {
    contactName: { type: 'string', title: 'Contact name', minLength: 3 },
    phone: { type: 'string', title: 'Phone' },
    notes: { type: 'string', title: 'Notes' },
    isBusiness: { type: 'boolean', title: 'Business account' },
  },
};

const category = (
  name: string,
  label: string,
  scope: string,
  rule?: unknown
) => ({
  type: 'Category',
  name,
  label,
  ...(rule ? { rule } : {}),
  elements: [{ type: 'Control', scope }],
});

const accordion = (options: Record<string, unknown> = {}, rules: any = {}) => ({
  type: 'Categorization',
  options: { variant: 'accordion', ...options },
  elements: [
    category('contact', 'Contact', '#/properties/contactName', rules.contact),
    category('reach', 'Reach', '#/properties/phone', rules.reach),
    category('notes', 'Notes', '#/properties/notes', rules.notes),
  ],
});

const render = (uischema: any, data: any = {}, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const draw = (formData: any) =>
    act(() =>
      root.render(
        // Motion off: rc-motion attaches transition listeners to a node it
        // looks up after the effect runs, which jsdom never produces for a
        // collapsing panel. It also makes aria-expanded deterministic instead
        // of mid-animation.
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={formData}
            schema={schema as any}
            uischema={uischema}
            config={config}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
  draw(data);
  const headers = () =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-collapse-header'));
  const header = (label: string) =>
    headers().find((element) => element.textContent?.includes(label))!;
  const openLabels = () =>
    headers()
      .filter((element) => element.getAttribute('aria-expanded') === 'true')
      .map((element) => element.textContent?.trim());
  return {
    container,
    headers,
    header,
    openLabels,
    click: (label: string) => act(() => header(label).click()),
    /** Re-renders with different data, to move a visibility rule. */
    rerender: (formData: any) => draw(formData),
    unmount: () => act(() => root.unmount()),
  };
};

describe('accordion selection', () => {
  const rank = (uischema: any) =>
    categorizationAccordionTester(
      uischema,
      schema as any,
      {
        rootSchema: schema,
      } as any
    );

  it('is selected by variant accordion, above tabs and stepper', () => {
    // The spec requires this explicit match to take precedence over the
    // generic Categorization renderer; it used to fall through to tabs.
    expect(rank(accordion())).toBe(3);
  });

  it('is not selected without the variant, or for another variant', () => {
    expect(rank({ ...accordion(), options: {} })).toBe(NOT_APPLICABLE);
    expect(rank(accordion({ variant: 'stepper' }))).toBe(NOT_APPLICABLE);
  });

  it('is not selected without Category children', () => {
    expect(
      rank({
        type: 'Categorization',
        options: { variant: 'accordion' },
        elements: [{ type: 'Label', text: 'not a category' }],
      })
    ).toBe(NOT_APPLICABLE);
  });

  it('wins over the tabs renderer in a real form', () => {
    const { container, headers, unmount } = render(accordion());
    expect(headers()).toHaveLength(3);
    expect(container.querySelector('.ant-tabs')).toBeNull();
    unmount();
  });
});

describe('at most one category is open', () => {
  it('opens the first visible category by default', () => {
    const { openLabels, unmount } = render(accordion());
    expect(openLabels()).toEqual(['Contact']);
    unmount();
  });

  it('opens the category named by options.initial', () => {
    const { openLabels, unmount } = render(accordion({ initial: 'notes' }));
    expect(openLabels()).toEqual(['Notes']);
    unmount();
  });

  it('falls back to the first category and warns when initial is unknown', () => {
    // "Missing target falls back to first visible category with diagnostic."
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const { openLabels, unmount } = render(accordion({ initial: 'nowhere' }));
      expect(openLabels()).toEqual(['Contact']);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('options.initial "nowhere"')
      );
      unmount();
    } finally {
      warn.mockRestore();
    }
  });

  it('closes the previous category when another is opened', () => {
    const { click, openLabels, unmount } = render(accordion());
    click('Notes');
    expect(openLabels()).toEqual(['Notes']);
    unmount();
  });

  it('closes the open category when its own header is activated', () => {
    /*
      This is where the project differs from section 8, which says "activating
      the already-open header leaves it open; no multiple-open or all-closed
      mode is defined". Here an accordion can be closed entirely, so a reader
      can put a long form out of the way. See Adjustment 10.2.
    */
    const { click, openLabels, unmount } = render(accordion());
    expect(openLabels()).toEqual(['Contact']);
    click('Contact');
    expect(openLabels()).toEqual([]);
    unmount();
  });

  it('never opens two at once', () => {
    // All-closed is allowed; two-open is not. Exclusivity is enforced here
    // rather than by antd's `accordion` prop.
    const { click, openLabels, unmount } = render(accordion());
    click('Notes');
    expect(openLabels()).toEqual(['Notes']);
    click('Reach');
    expect(openLabels()).toEqual(['Reach']);
    unmount();
  });

  it('reopens after being closed', () => {
    const { click, openLabels, unmount } = render(accordion());
    click('Contact');
    expect(openLabels()).toEqual([]);
    click('Contact');
    expect(openLabels()).toEqual(['Contact']);
    unmount();
  });

  it('stays closed when an unrelated category is hidden', () => {
    /*
      Closing is a state the reader chose, so the "selected category became
      hidden, open another" fallback must not quietly undo it. That is why an
      explicit close is a distinct value rather than "no selection yet".
    */
    const hideReach = {
      effect: 'SHOW',
      condition: {
        scope: '#/properties/isBusiness',
        schema: { const: true },
        failWhenUndefined: true,
      },
    };
    const { click, openLabels, rerender, unmount } = render(
      accordion({}, { reach: hideReach }),
      { isBusiness: true }
    );
    click('Contact');
    expect(openLabels()).toEqual([]);
    rerender({ isBusiness: false });
    expect(openLabels()).toEqual([]);
    unmount();
  });
});

describe('visibility', () => {
  const hideWhenNotBusiness = {
    effect: 'SHOW',
    condition: {
      scope: '#/properties/isBusiness',
      schema: { const: true },
      failWhenUndefined: true,
    },
  };

  it('leaves a hidden category out entirely', () => {
    const { headers, unmount } = render(
      accordion({}, { reach: hideWhenNotBusiness }),
      { isBusiness: false }
    );
    expect(headers().map((h) => h.textContent?.trim())).toEqual([
      'Contact',
      'Notes',
    ]);
    unmount();
  });

  it('opens another category when the open one is hidden', () => {
    // "When the selected category becomes hidden, select an available visible
    // category" - rather than leaving the index pointing at a different one.
    const { openLabels, unmount } = render(
      accordion({ initial: 'reach' }, { reach: hideWhenNotBusiness }),
      { isBusiness: false }
    );
    expect(openLabels()).toEqual(['Contact']);
    unmount();
  });

  it('opens nothing when no category is visible', () => {
    const hidden = { effect: 'HIDE', condition: { scope: '#', schema: true } };
    const { headers, openLabels, unmount } = render(
      accordion({}, { contact: hidden, reach: hidden, notes: hidden })
    );
    expect(headers()).toHaveLength(0);
    expect(openLabels()).toEqual([]);
    unmount();
  });
});

describe('accordion content', () => {
  it('keeps closed panels mounted, so their data and validation survive', () => {
    // "Closing a category preserves its data and validation" - and an
    // unmounted subtree would take its controls' pending writes with it.
    const { container, unmount } = render(accordion(), {
      contactName: 'Jo',
      phone: '555',
    });
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    expect(values).toContain('555');
    unmount();
  });

  it('reports a closed category’s error on its header', () => {
    const { header, unmount } = render(
      accordion(),
      { contactName: 'Jo' },
      // Namespaced, per Adjustment 1: this is a project extension, not a core
      // or Material convention.
      { jsonformsExtended: { showValidationIndicator: true } }
    );
    expect(
      header('Contact').querySelector('[data-category-indicators]')
    ).toBeTruthy();
    unmount();
  });

  it('shows the data indicator on a header holding data', () => {
    const { header, unmount } = render(
      accordion(),
      { notes: 'Call back Tuesday' },
      { jsonformsExtended: { showDataIndicator: true } }
    );
    expect(
      header('Notes').querySelector('[data-category-data-indicator]')
    ).toBeTruthy();
    expect(
      header('Reach').querySelector('[data-category-data-indicator]')
    ).toBeNull();
    unmount();
  });

  it('uses accessible disclosure semantics, with the panel relationship', () => {
    /*
      rc-collapse gives `role="button"` and `aria-expanded` but never ties a
      header to its panel, and antd's own `accordion` prop would swap the
      disclosure role for `role="tab"` with no tablist. Both halves are
      asserted here, so a change in antd's panel structure - which the
      relationship wiring depends on - fails instead of quietly regressing.
    */
    const { container, headers, unmount } = render(accordion());
    expect(headers().map((h) => h.getAttribute('role'))).toEqual([
      'button',
      'button',
      'button',
    ]);
    expect(headers().map((h) => h.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    const panelId = headers()[0].getAttribute('aria-controls')!;
    expect(panelId).toBeTruthy();
    const panel = container.querySelector(`[id="${panelId}"]`)!;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe(headers()[0].id);
    unmount();
  });

  it('is operable from the keyboard', () => {
    const { header, openLabels, unmount } = render(accordion());
    expect(header('Notes').tabIndex).toBe(0);
    act(() => {
      header('Notes').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });
    expect(openLabels()).toEqual(['Notes']);
    unmount();
  });
});

describe('where the indicators sit', () => {
  const withIndicators = {
    contactName: 'Jo',
    notes: 'Gate code 4417',
  };
  const config = {
    jsonformsExtended: {
      showValidationIndicator: true,
      showDataIndicator: true,
    },
  };

  it('puts them at the end of an accordion header, as a Group does', () => {
    /*
      An accordion header is the same shape as a collapsible Group's - a
      full-width bar with a trailing edge - so the status belongs in the same
      place. They were briefly rendered after the label instead, which left two
      collapsible sections in one form marking themselves differently.
    */
    const { header, unmount } = render(accordion(), withIndicators, config);
    const extra = header('Contact').querySelector('.ant-collapse-extra');
    expect(extra?.querySelector('[data-category-indicators]')).toBeTruthy();
    // ...and not tucked in beside the words.
    const title = header('Contact').querySelector('.ant-collapse-title');
    expect(title?.querySelector('[data-category-indicators]')).toBeNull();
    unmount();
  });

  it('keeps them beside the label on a tab, which has no trailing edge', () => {
    const tabs = { ...accordion(), options: {} };
    const { container, unmount } = render(tabs, withIndicators, config);
    const tab = Array.from(
      container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
    ).find((element) => element.textContent?.includes('Contact'))!;
    expect(tab.querySelector('[data-category-indicators]')).toBeTruthy();
    unmount();
  });
});
