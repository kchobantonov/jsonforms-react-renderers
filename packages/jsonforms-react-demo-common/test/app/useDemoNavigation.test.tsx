// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExampleDescription } from '@jsonforms/examples';
import { expect, it, vi } from 'vite-plus/test';
import {
  routeFromLocation,
  useDemoNavigation,
} from '../../src/app/useDemoNavigation';

it('restores the example and active tab together on browser navigation', () => {
  const examples: ExampleDescription[] = ['first', 'second'].map((name) => ({
    name,
    label: name,
    data: {},
    schema: {},
    uischema: { type: 'VerticalLayout', elements: [] },
  }));
  const load = vi.fn();
  const originalUrl = window.location.href;
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const container = document.createElement('div');
  const root = createRoot(container);
  function Demo() {
    const state = useDemoNavigation(
      examples,
      routeFromLocation(examples),
      load,
      'default',
    );
    return (
      <output>
        {state.isHome ? 'home' : state.currentExample.name}/{state.activeTab}
      </output>
    );
  }
  try {
    window.history.replaceState(null, '', '#first');
    act(() => root.render(<Demo />));
    expect(container.textContent).toBe('first/demo');
    act(() => {
      window.history.pushState(null, '', '#second?active-tab=schema');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(load).toHaveBeenCalledWith(1);
    expect(container.textContent).toBe('second/schema');
    act(() => {
      window.history.replaceState(null, '', '#');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(container.textContent).toBe('home/demo');
    expect(load).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    window.history.replaceState(null, '', originalUrl);
    vi.unstubAllGlobals();
  }
});
