import { createRequire } from 'node:module';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

// Exercise the real dependency resolved by antd, including its unmount cleanup.
const require = createRequire(import.meta.url);
const requireAntd = createRequire(require.resolve('antd'));
const useDelayState = requireAntd('@rc-component/util/lib/hooks/useDelayState')
  .default as (
  initial: number,
) => [
  number,
  (value: number, delay: { ms: number } | { frame: number }) => void,
];

afterEach(() => vi.useRealTimers());

describe('antd delayed state lifecycle', () => {
  it.each([{ ms: 100 }, { frame: 2 }])(
    'cancels pending %j updates on unmount',
    (delay) => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const root = createRoot(container);
      let update: ReturnType<typeof useDelayState>[1];
      function Probe() {
        const [value, setValue] = useDelayState(0);
        React.useLayoutEffect(() => {
          update = setValue;
        }, [setValue]);
        return <span>{value}</span>;
      }
      try {
        act(() =>
          root.render(
            <React.StrictMode>
              <Probe />
            </React.StrictMode>,
          ),
        );
        act(() => update(1, delay));
        act(() => vi.runAllTimers());
        expect(container.textContent).toBe('1');
        act(() => update(2, delay));
        expect(vi.getTimerCount()).toBeGreaterThan(0);
      } finally {
        act(() => root.unmount());
      }
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
