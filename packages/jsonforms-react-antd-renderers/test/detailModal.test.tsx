import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DetailModal } from '../src/complex/DetailModal';

it('maximizes a manually resized dialog and restores its width without remounting the editor', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<DetailModal open title='Edit' options={{ width: 900, resizable: true }}>
    <input defaultValue='Draft' />
  </DetailModal>));
  const container = document.querySelector<HTMLElement>('.ant-modal-container')!;
  const input = container.querySelector('input');
  // Native CSS resize changes inline geometry without a React render.
  container.style.width = '600px';
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Maximize dialog"]')!.click());
  expect(container.style.width).toBe('100%');
  expect(document.querySelector<HTMLElement>('.ant-modal')!.style.width).toBe('calc(100vw - 32px)');
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Restore dialog"]')!.click());
  expect(container.style.width).toBe('600px');
  expect(container.querySelector('input')).toBe(input);
  act(() => root.unmount());
  host.remove();
});
