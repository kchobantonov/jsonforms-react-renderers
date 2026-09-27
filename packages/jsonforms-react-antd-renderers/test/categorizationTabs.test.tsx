import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  The tabs variant of `Categorization`.

  antd keeps a tab panel mounted once it has been visited, so each panel has to
  render *its own* category. A panel that renders whatever is currently
  selected looks right while only one tab has ever been opened, and then starts
  duplicating the selected category into every panel it has left behind.
*/

class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

const schema = {
  type: 'object',
  properties: {
    contactName: { type: 'string', title: 'Contact name' },
    phone: { type: 'string', title: 'Phone' },
    notes: { type: 'string', title: 'Notes' },
  },
};

const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Contact',
      elements: [{ type: 'Control', scope: '#/properties/contactName' }],
    },
    {
      type: 'Category',
      label: 'Reach',
      elements: [{ type: 'Control', scope: '#/properties/phone' }],
    },
    {
      type: 'Category',
      label: 'Notes',
      elements: [{ type: 'Control', scope: '#/properties/notes' }],
    },
  ],
};

const data = {
  contactName: 'Ada Lovelace',
  phone: '555-0100',
  notes: 'Prefers email',
};

const draw = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={uischema as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );

  /** Every input in the tab body, visited panels included. */
  const values = () =>
    Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(
      (input) => input.value
    );

  return {
    container,
    values,
    click: (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
    },
    /** The one panel antd marks active - what the user is actually looking at. */
    activeText: () =>
      container.querySelector('.ant-tabs-content-active')?.textContent ?? '',
    unmount: () => act(() => root.unmount()),
  };
};

describe('categorization as tabs', () => {
  it('shows the selected category', () => {
    const view = draw();
    expect(view.values()).toEqual(['Ada Lovelace']);
    view.click('Reach');
    expect(view.activeText()).toContain('Phone');
    view.unmount();
  });

  /*
    The regression. Before, every panel rendered `categories[active]`, so
    visiting a second tab left the first panel - still mounted, merely hidden -
    rendering the second category as well.
  */
  it('does not duplicate the selected category into the panels it left behind', () => {
    const view = draw();
    view.click('Reach');
    expect(view.values()).toEqual(['Ada Lovelace', '555-0100']);
    view.click('Notes');
    expect(view.values()).toEqual([
      'Ada Lovelace',
      '555-0100',
      'Prefers email',
    ]);
    view.unmount();
  });

  /*
    Going back must not rebuild the panel either: a category keeps whatever
    state its controls hold, which is the reason antd leaves them mounted.
  */
  it('keeps each panel bound to its own category when navigating back', () => {
    const view = draw();
    view.click('Reach');
    const phone = view.container.querySelector<HTMLInputElement>(
      '.ant-tabs-content-active input'
    );
    view.click('Contact');
    expect(view.activeText()).toContain('Contact name');
    view.click('Reach');
    expect(view.container.querySelector('.ant-tabs-content-active input')).toBe(
      phone
    );
    view.unmount();
  });
});
