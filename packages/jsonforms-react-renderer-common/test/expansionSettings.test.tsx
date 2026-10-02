import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { resolveCollapsed, useGroupExpansion } from '../src/groupState';
import { useCategorySelection } from '../src/categoryState';

it('shares Group defaults with mixed frames and preserves user expansion', () => {
  const root = createRoot(document.createElement('div'));
  let state: ReturnType<typeof useGroupExpansion>;
  let options: any = {};
  let config: any = { jsonformsExtended: { collapsed: true } };
  const Harness = () => {
    state = useGroupExpansion({ type: 'Control', options }, config, true);
    return null;
  };
  const render = () => act(() => root.render(<Harness />));
  render();
  expect(state!.collapsed).toBe(true);
  act(() => state.setExpanded(true));
  render();
  expect(state!.collapsed).toBe(false);
  options = { collapsed: true, collapsible: false };
  render();
  expect(state!.collapsed).toBe(false);
  expect(state!.collapsible).toBe(false);
  options = { collapsed: false };
  config = { jsonformsExtended: { collapsed: true } };
  render();
  expect(state!.collapsed).toBe(false);
  act(() => root.unmount());
});

it.each([
  [true, {}, true, -1],
  [true, { collapsed: false }, true, 0],
  [false, { collapsed: true }, true, -1],
  [false, {}, true, 0],
  [true, {}, false, 0],
  [true, { initial: 'second' }, true, 1],
])(
  'accordion initialization %j %j closable=%j',
  (collapsed, options, closable, expected) => {
    const root = createRoot(document.createElement('div'));
    let state: ReturnType<typeof useCategorySelection>;
    const Harness = () => {
      state = useCategorySelection(
        {
          type: 'Categorization',
          options,
          elements: [
            { type: 'Category', label: 'First', name: 'first', elements: [] },
            { type: 'Category', label: 'Second', name: 'second', elements: [] },
          ],
        } as any,
        {},
        undefined,
        { jsonformsExtended: { collapsed } },
        undefined,
        closable
      );
      return null;
    };
    act(() => root.render(<Harness />));
    expect(state!.active).toBe(expected);
    act(() => state.select(1));
    act(() => root.render(<Harness />));
    expect(state!.active).toBe(1);
    act(() => root.unmount());
  }
);

it.each(['group', 'mixed', 'accordion', 'array'] as const)(
  '%s collapse defaults honor local, component and shared precedence',
  (component) => {
    const config = {
      jsonformsExtended: {
        collapsed: true,
        [component]: { collapsed: false },
      },
    };
    expect(resolveCollapsed({}, config, component)).toBe(false);
    expect(resolveCollapsed({ collapsed: true }, config, component)).toBe(true);
    expect(
      resolveCollapsed(
        {},
        { jsonformsExtended: { collapsed: true } },
        component
      )
    ).toBe(true);
    expect(resolveCollapsed({}, { collapsed: true }, component)).toBe(false);
  }
);
