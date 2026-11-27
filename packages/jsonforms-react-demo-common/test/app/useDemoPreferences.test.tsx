// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vite-plus/test';
import { useDemoPreferences } from '../../src/app/useDemoPreferences';

it('waits for stored preferences before writing and merges renderer settings with provider defaults', async () => {
  let restore!: (stored: string) => void;
  const storage = {
    getItem: () =>
      new Promise<string>((resolve) => {
        restore = resolve;
      }),
    setItem: vi.fn(),
  };
  function Demo() {
    const preferences = useDemoPreferences({
      rendererName: 'demo',
      initialLayout: 'default',
      initialProviderSettings: { density: 'compact' },
      settingsStorage: storage,
    });
    return (
      <button onClick={() => preferences.setMode('light')}>
        {preferences.mode}
      </button>
    );
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(() => root.render(<Demo />));
    expect(storage.setItem).not.toHaveBeenCalled();
    await act(() =>
      restore(
        JSON.stringify({
          version: 1,
          mode: 'dark',
          locale: 'bg',
          layout: 'demo-and-data',
          rendererSettings: { radius: 4 },
        }),
      ),
    );
    expect(container.textContent).toBe('dark');
    act(() => container.querySelector('button')!.click());
    const [key, stored] = storage.setItem.mock.lastCall!;
    expect(key).toBe('jsonforms-react-demo:demo:settings');
    expect(JSON.parse(stored)).toEqual({
      version: 1,
      mode: 'light',
      locale: 'bg',
      layout: 'demo-and-data',
      rendererSettings: { density: 'compact', radius: 4 },
    });
  } finally {
    act(() => root.unmount());
  }
});
