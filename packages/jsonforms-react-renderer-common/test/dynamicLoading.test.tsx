import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
const { load } = vi.hoisted(() => ({ load: vi.fn<() => Promise<void>>() }));
vi.mock('../src/dynamicRuntime', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/dynamicRuntime')>()),
  dynamicUiExpressionsReady: () => false,
  loadDynamicUiExpressions: load,
}));
import { DynamicUiProvider } from '../src/DynamicUiProvider';
let host: HTMLDivElement;
let root: Root;
let resolve: () => void;
let reject: (error: Error) => void;
const prepare = () =>
  load.mockImplementation(
    () =>
      new Promise<void>((yes, no) => {
        resolve = yes;
        reject = no;
      }),
  );
beforeEach(() => {
  load.mockReset();
  prepare();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (enabled: boolean) =>
  act(async () =>
    root.render(
      <DynamicUiProvider
        config={{ jsonformsExtended: { dynamic: { enabled } } }}
      >
        <input aria-label='Draft' defaultValue='Initial' />
      </DynamicUiProvider>,
    ),
  );
it('does not load disabled forms and holds initial editors until ready', async () => {
  await render(true);
  expect(load).toHaveBeenCalledTimes(1);
  expect(host.querySelector('input')).toBeNull();
  await act(async () => resolve());
  expect(host.querySelector('input')).not.toBeNull();
});
it('preserves an existing draft and ignores completion after disabling', async () => {
  await render(false);
  expect(load).not.toHaveBeenCalled();
  const input = host.querySelector('input')!;
  input.value = 'Unfinished';
  await render(true);
  expect(host.querySelector('input')).toBe(input);
  expect(input.closest('[inert]')).not.toBeNull();
  await render(false);
  await act(async () => resolve());
  expect(host.querySelector('input')).toBe(input);
  expect(input.value).toBe('Unfinished');
  expect(input.closest('[inert]')).toBeNull();
});
it('shows load failure without opening editors and retries on a new activation', async () => {
  await render(true);
  await act(async () => reject(new Error('Chunk unavailable')));
  expect(host.querySelector('[role=alert]')?.textContent).toContain(
    'Unable to load',
  );
  expect(host.querySelector('input')).toBeNull();
  await render(false);
  await render(true);
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => resolve());
  expect(host.querySelector('[role=alert]')).toBeNull();
  expect(host.querySelector('input')?.closest('[inert]')).toBeNull();
});

it('restores focus after a loading lock but respects an outside focus change', async () => {
  await render(false);
  const input = host.querySelector('input')!;
  input.focus();
  await render(true);
  input.blur(); // DOM test environment does not implement browser inert focus removal.
  await act(async () => resolve());
  expect(document.activeElement).toBe(input);
});

it('does not steal outside focus when loading completes', async () => {
  await render(false);
  const input = host.querySelector('input')!;
  input.focus();
  const outside = document.createElement('button');
  document.body.append(outside);
  try {
    await render(true);
    outside.focus();
    await act(async () => resolve());
    expect(document.activeElement).toBe(outside);
  } finally {
    outside.remove();
  }
});
