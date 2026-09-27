import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';

/**
 * How an array's **own** error reaches the screen.
 *
 * An antd Tooltip cannot be opened in jsdom - rc-trigger needs layout APIs
 * jsdom does not implement - so the wiring is checked instead of the hover,
 * with a stub that renders its title. Same technique as
 * `cellErrorTooltip.test.tsx`.
 */
vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  const React = await vi.importActual<any>('react');
  return {
    ...actual,
    Tooltip: ({ title, children }: any) =>
      React.createElement(
        'span',
        { 'data-testid': 'tooltip' },
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  };
});

import { ConfigProvider } from 'antd';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/array-controls/schema.json';

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 150) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/* Just the reviewers array, so nothing else contributes an error. */
const reviewersSchema = {
  type: 'object',
  properties: { reviewers: (schema as any).properties.reviewers },
} as any;

const uischema = {
  type: 'Control',
  scope: '#/properties/reviewers',
} as any;

const draw = async (reviewers: unknown[]) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{ reviewers }}
          schema={reviewersSchema}
          uischema={uischema}
          validationMode='ValidateAndShow'
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  await settle();
  return { container, unmount: () => act(() => root.unmount()) };
};

const tooltips = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-testid="tooltip-title"]')).map(
    (node) => node.textContent ?? ''
  );

describe('an array-level error', () => {
  /*
    "Provide an accessible explanation of array-level errors near the array,
    including when it has no items." The empty case is the one that matters:
    there is no item to hang the failure on.
  */
  it('is explained beside the array when it has no items at all', async () => {
    const view = await draw([]);
    expect(tooltips(view.container).join('\n')).toContain('must contain');
    view.unmount();
  });

  it('is explained when items exist but none match', async () => {
    const view = await draw([{ name: 'Ada Fenn', lead: false }]);
    expect(tooltips(view.container).join('\n')).toContain('must contain');
    view.unmount();
  });

  it('goes away once an item matches', async () => {
    const view = await draw([{ name: 'Ada Fenn', lead: true }]);
    expect(tooltips(view.container).join('\n')).not.toContain('must contain');
    view.unmount();
  });

  /*
    The spec asks for an **accessible** explanation, and a hover-only tooltip
    is not one: the icon renders a count and nothing else, so a screen reader
    announced "1" with no way to find out what was wrong. The message is now
    the icon's accessible name as well - the same fix, and the same reasoning,
    as the cell feedback icon in `util/cellMode.tsx`.
  */
  it('is announced, not only shown on hover', async () => {
    const view = await draw([]);
    const named = Array.from(
      view.container.querySelectorAll('[aria-label]')
    ).map((node) => node.getAttribute('aria-label') ?? '');
    expect(
      named.join('\n'),
      'the array error is reachable only by hovering'
    ).toContain('must contain');
    view.unmount();
  });
});
