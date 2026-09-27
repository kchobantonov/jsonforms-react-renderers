import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedChange } from '../src/util/debounce';

/*
  §18 "Pending edits, commit timing, and cancellation":

    Disposal must leave no stale write callback active. Do not blindly flush
    on unmount: it can recreate deleted data or write into a different item.

    Cancel or invalidate queued work whose target was removed, rebound, or
    superseded. Guard against writes to an obsolete array index after
    reorder/deletion... The path alone is insufficient evidence that the
    original target still exists.

  Two different failures, and only one of them is an unmount. An array row is
  keyed by its path (`ArrayLayout` uses `key={childPath}`), so deleting item 0
  does **not** unmount the control at `items.0` - it re-renders it with the
  former item 1's data. Nothing is disposed, and the queued write still fires.
*/

const Probe = ({
  handleChange,
  data,
  path = 'field',
  api,
}: {
  handleChange: (path: string, value: any) => void;
  data: any;
  path?: string;
  api: { type?: (v: string) => void };
}) => {
  const [, onChange] = useDebouncedChange(handleChange, '', data, path);
  api.type = (value: string) => onChange({ target: { value } } as any);
  return null;
};

const mountProbe = (data: any = 'first', path = 'items.0.name') => {
  const handleChange = vi.fn();
  const api: { type?: (v: string) => void } = {};
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = (nextData: any, nextPath = path) =>
    act(() =>
      root.render(
        <Probe
          handleChange={handleChange}
          data={nextData}
          path={nextPath}
          api={api}
        />
      )
    );
  render(data);
  return {
    api,
    handleChange,
    render,
    unmount: () => act(() => root.unmount()),
  };
};

describe('disposing a debounced control', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not write after the control is unmounted', () => {
    const { api, handleChange, unmount } = mountProbe();

    act(() => api.type!('typed then navigated away'));
    unmount();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Not flushed either: flushing on unmount recreates deleted data.
    expect(handleChange).not.toHaveBeenCalled();
  });

  /*
    The specification's own worked example. The row is not unmounted, so this
    is not fixed by cleaning up on disposal: the value at the path changed
    underneath the control, which is the evidence that its target is gone.
  */
  it('does not write into the item that took the deleted one’s place', () => {
    const { api, handleChange, render } = mountProbe('first');

    act(() => api.type!('edit meant for the first item'));
    // Item 0 is deleted; the former item 1 moves into its place. Same path,
    // same key, same mounted control - different item.
    render('second');
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(handleChange).not.toHaveBeenCalled();
  });

  /*
    And the same when the control is rebound to another path outright, which
    is what a `key` on something other than the path produces.
  */
  it('does not write to a path it is no longer bound to', () => {
    const { api, handleChange, render } = mountProbe('first', 'items.0.name');

    act(() => api.type!('edit meant for item 0'));
    render('second', 'items.1.name');
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      handleChange.mock.calls.map(([p]) => p),
      'a queued edit reached a path it was not typed into'
    ).not.toContain('items.0.name');
  });

  /* The ordinary path must still commit - this is the control that guards it. */
  it('still commits an edit nothing interfered with', () => {
    const { api, handleChange } = mountProbe('first');

    act(() => api.type!('a normal edit'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(handleChange).toHaveBeenCalledWith('items.0.name', 'a normal edit');
  });
});

/*
  Why there is no end-to-end version of the case above.

  One was written: render a real `ArrayLayout`, type into the first row, click
  its delete inside the 300ms window, and check the edit did not land on the
  row that moved up. It passed against the unfixed hook, which is the only
  interesting thing about it — it never entered the window. With real timers
  the debounce elapsed while the click was being dispatched, so the edit
  committed *before* the deletion; with fake timers the synthetic `input`
  event stopped reaching the control at all, though the delete click still
  worked, so nothing was ever queued. Either way the assertion read the right
  answer for the wrong reason.

  The three tests above drive the hook directly, which is where the guard
  lives, and each of them fails when it is removed. The structural claim they
  rest on — that `ArrayLayout` keys rows by path, so deleting item 0 re-renders
  the control at `items.0` rather than unmounting it — is read from
  `ArrayLayout.tsx`'s `key={childPath}`, and is why case (3) has to exist at
  all.
*/
