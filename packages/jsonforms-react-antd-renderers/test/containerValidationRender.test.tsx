import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

vi.mock('antd', async () => {
  const antd = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...antd,
    // antd tooltips cannot open in jsdom; render the title so the wiring is
    // checkable.
    Tooltip: ({ title, children }: any) => (
      <span data-tooltip={String(title)}>{children}</span>
    ),
  };
});

// antd's Tabs measures itself through rc-resize-observer, which jsdom does not
// implement. Same stub groupState.test.tsx uses.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {
      /* jsdom has no layout to observe */
    }
    unobserve() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
  }
);

const schema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      required: ['name', 'phone'],
      properties: {
        name: { type: 'string', minLength: 1 },
        phone: { type: 'string', minLength: 7 },
      },
    },
    other: { type: 'string' },
  },
};

const group = (options: Record<string, unknown>) => ({
  type: 'Group',
  label: 'Emergency contact',
  options,
  elements: [
    { type: 'Control', scope: '#/properties/contact/properties/name' },
    { type: 'Control', scope: '#/properties/contact/properties/phone' },
  ],
});

const render = (uischema: any, data: any, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema as any}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        config={config}
        onChange={() => undefined}
      />
    )
  );
  const marker = container.querySelector<HTMLElement>(
    '[data-container-validation-indicator]'
  );
  return { container, marker, unmount: () => act(() => root.unmount()) };
};

const invalid = { contact: { name: 'Mira', phone: '112' } };
const valid = { contact: { name: 'Mira', phone: '+359 2 000' } };

describe('container error indicator', () => {
  it('is off by default on a Group, so existing forms are unchanged', () => {
    const { marker, unmount } = render(group({}), invalid);
    expect(marker).toBeNull();
    unmount();
  });

  it('marks a Group whose descendant fails, even while collapsed', () => {
    const { marker, unmount } = render(
      group({
        showValidationIndicator: true, showValidationIndicatorCount: true,
        collapsible: true,
        collapsed: true,
      }),
      invalid
    );
    expect(marker).toBeTruthy();
    expect(marker!.getAttribute('data-error-count')).toBe('1');
    unmount();
  });

  it('says nothing when everything below it is valid', () => {
    const { marker, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true }),
      valid
    );
    expect(marker).toBeNull();
    unmount();
  });

  it('ignores errors outside the group', () => {
    const outside = {
      type: 'Group',
      label: 'Elsewhere',
      options: { showValidationIndicator: true, showValidationIndicatorCount: true },
      elements: [{ type: 'Control', scope: '#/properties/other' }],
    };
    const { marker, unmount } = render(outside, invalid);
    expect(marker).toBeNull();
    unmount();
  });

  it('turns on globally through the namespaced config key', () => {
    const { marker, unmount } = render(group({}), invalid, {
      jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
    });
    expect(marker).toBeTruthy();
    unmount();
  });

  it('lets an explicit element false beat the global default', () => {
    const { marker, unmount } = render(
      group({ showValidationIndicator: false }),
      invalid,
      { jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true } }
    );
    expect(marker).toBeNull();
    unmount();
  });

  it('carries a localized accessible name and a tooltip', () => {
    const { marker, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true }),
      invalid
    );
    expect(marker!.getAttribute('aria-label')).toBe('1 error in this section');
    expect(
      marker!.closest('[data-tooltip]')?.getAttribute('data-tooltip')
    ).toBe('1 error in this section');
    expect(marker!.tabIndex).toBe(0);
    unmount();
  });

  it('marks the category containing the failure', () => {
    const uischema = {
      type: 'Categorization',
      options: { showValidationIndicator: true, showValidationIndicatorCount: true },
      elements: [
        {
          type: 'Category',
          label: 'Contact',
          options: { showValidationIndicator: true, showValidationIndicatorCount: true },
          elements: [group({})],
        },
      ],
    };
    const { container, unmount } = render(uischema, invalid);
    expect(
      container.querySelector('[data-container-validation-indicator]')
    ).toBeTruthy();
    unmount();
  });

  it('follows the error as a field changes, not just its first state', () => {
    // The reported bug. Clearing the phone turns a minLength error on
    // /contact/phone into a required error on /contact, which ajv reports on
    // the containing object. Matching raw instancePaths made the indicator
    // vanish; core's getControlPath relocates it back to contact.phone.
    const ui = group({ showValidationIndicator: true, showValidationIndicatorCount: true });
    const shown = render(ui, invalid);
    expect(shown.marker!.getAttribute('data-error-count')).toBe('1');
    shown.unmount();

    const cleared = render(ui, { contact: { name: 'Mira' } });
    expect(cleared.marker).toBeTruthy();
    expect(cleared.marker!.getAttribute('data-error-count')).toBe('1');
    cleared.unmount();
  });

  it('counts every failing field in the section', () => {
    const { marker, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true }),
      { contact: { name: '', phone: '112' } }
    );
    expect(marker!.getAttribute('data-error-count')).toBe('2');
    expect(marker!.getAttribute('aria-label')).toBe('2 errors in this section');
    unmount();
  });

  it('counts two missing required fields as two', () => {
    const { marker, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true }),
      { contact: {} }
    );
    expect(marker!.getAttribute('data-error-count')).toBe('2');
    unmount();
  });

  it('counts one underlying error once, however many controls bind it', () => {
    // Two Controls on the same property: one invalid value, one error object,
    // so one is counted. Fixing either fixes both.
    const twice = {
      type: 'Group',
      label: 'Twice',
      options: { showValidationIndicator: true, showValidationIndicatorCount: true },
      elements: [
        { type: 'Control', scope: '#/properties/contact/properties/phone' },
        { type: 'Control', scope: '#/properties/contact/properties/phone' },
      ],
    };
    const { marker, unmount } = render(twice, invalid);
    expect(marker!.getAttribute('data-error-count')).toBe('1');
    unmount();
  });

  it('can drop the count, keeping only the marker', () => {
    const { marker, unmount } = render(
      group({
        showValidationIndicator: true,
        showValidationIndicatorCount: false,
      }),
      { contact: { name: '', phone: '112' } }
    );
    expect(marker).toBeTruthy();
    expect(marker!.getAttribute('data-error-count')).toBeNull();
    expect(marker!.getAttribute('aria-label')).toBe(
      'This section contains errors'
    );
    unmount();
  });

  it('draws both markers the same way: SVG in one icon box', () => {
    const { container, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true, showDataIndicator: true }),
      invalid
    );
    const error = container.querySelector<HTMLElement>(
      '[data-container-validation-indicator]'
    )!;
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]')!;
    for (const marker of [error, dot]) {
      // Same mechanism, not a glyph beside an icon: an SVG sized in em, so
      // both take their box from fontSize and their color from currentColor.
      const svg = marker.querySelector('svg')!;
      expect(svg).toBeTruthy();
      expect(svg.getAttribute('width')).toBe('1em');
      expect(svg.getAttribute('height')).toBe('1em');
      expect(marker.textContent).toBe('');
    }
    unmount();
  });

  it('cannot stretch the header: icons are body size with no leading', () => {
    const { container, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true, showDataIndicator: true }),
      invalid
    );
    const row = container.querySelector<HTMLElement>(
      '[data-group-indicators]'
    )!;
    const error = container.querySelector<HTMLElement>(
      '[data-container-validation-indicator]'
    )!;
    // jsdom has no layout to measure, so assert the guards that keep the
    // inline boxes from adding height: no leading on the row or the markers,
    // and a font size no larger than the body text they sit beside.
    expect(row.style.lineHeight).toBe('0');
    expect(error.style.lineHeight).toBe('0');
    expect(parseInt(error.style.fontSize, 10)).toBeLessThanOrEqual(14);
    unmount();
  });

  it('keeps both markers on one centre line, with a gap', () => {
    const { container, unmount } = render(
      group({ showValidationIndicator: true, showValidationIndicatorCount: true, showDataIndicator: true }),
      invalid
    );
    const error = container.querySelector<HTMLElement>(
      '[data-container-validation-indicator]'
    )!;
    const dot = container.querySelector<HTMLElement>('[data-group-indicator]')!;
    // jsdom has no layout, so assert the arrangement rather than positions:
    // a shared flex row, and a dot sized like the icon instead of a glyph
    // sitting on a text baseline.
    const row = container.querySelector<HTMLElement>('[data-group-indicators]');
    expect(row).toBeTruthy();
    expect(row!.contains(error)).toBe(true);
    expect(row!.contains(dot)).toBe(true);
    expect(row!.getAttribute('style')).toContain('align-items: center');
    expect(row!.getAttribute('style')).toMatch(/gap: \d/);
    expect(dot.textContent).toBe('');
    unmount();
  });
});
