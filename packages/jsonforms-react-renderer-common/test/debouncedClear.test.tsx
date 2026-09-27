import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedChange } from '../src/debounce';

/** Minimal consumer of the hook, so the race can be driven directly. */
const Probe = ({
  handleChange,
  data,
  api,
}: {
  handleChange: (path: string, value: any) => void;
  data: any;
  api: { type?: (v: string) => void; clear?: () => void; input?: any };
}) => {
  const [input, onChange, onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    'field'
  );
  api.type = (value: string) => onChange({ target: { value } } as any);
  api.clear = onClear;
  api.input = input;
  return null;
};

const mountProbe = (data: any = 'committed') => {
  const handleChange = vi.fn();
  const api: { type?: (v: string) => void; clear?: () => void; input?: any } =
    {};
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(<Probe handleChange={handleChange} data={data} api={api} />)
  );
  return { api, handleChange, unmount: () => act(() => root.unmount()) };
};

describe('clearing a debounced control', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not let a queued keystroke restore the cleared value', () => {
    const { api, handleChange, unmount } = mountProbe();

    // Type, then clear before the 300ms debounce fires.
    act(() => api.type!('typed while editing'));
    act(() => api.clear!());
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('field', undefined);

    // Let the window that the keystroke was queued in elapse.
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The old text must not come back on its own.
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).not.toHaveBeenCalledWith(
      'field',
      'typed while editing'
    );
    unmount();
  });

  it('still commits a keystroke that is not followed by a clear', () => {
    const { api, handleChange, unmount } = mountProbe();
    act(() => api.type!('kept'));
    expect(handleChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(handleChange).toHaveBeenCalledWith('field', 'kept');
    unmount();
  });

  it('clears immediately, without waiting for the debounce', () => {
    const { api, handleChange, unmount } = mountProbe();
    act(() => api.clear!());
    expect(handleChange).toHaveBeenCalledWith('field', undefined);
    unmount();
  });

  it('survives clear, retype, clear', () => {
    const { api, handleChange, unmount } = mountProbe();
    act(() => api.type!('one'));
    act(() => api.clear!());
    act(() => api.type!('two'));
    act(() => api.clear!());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(
      handleChange.mock.calls.every(([, value]) => value === undefined)
    ).toBe(true);
    unmount();
  });
});
