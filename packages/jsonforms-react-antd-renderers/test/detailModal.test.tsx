import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DetailModal } from '../src/complex/DetailModal';

it('maximizes a manually resized dialog and restores its width without remounting the editor', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <DetailModal open title='Edit' options={{ width: 900, resizable: true }}>
        <input defaultValue='Draft' />
      </DetailModal>,
    ),
  );
  const container = document.querySelector<HTMLElement>(
    '.ant-modal-container',
  )!;
  const input = container.querySelector('input');
  // Native CSS resize changes inline geometry without a React render.
  container.style.width = '600px';
  act(() =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="Maximize dialog"]')!
      .click(),
  );
  expect(container.style.width).toBe('100%');
  expect(document.querySelector<HTMLElement>('.ant-modal')!.style.width).toBe(
    'calc(100vw - 32px)',
  );
  act(() =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="Restore dialog"]')!
      .click(),
  );
  expect(container.style.width).toBe('600px');
  expect(container.querySelector('input')).toBe(input);
  act(() => root.unmount());
  host.remove();
});

it.each([false, true])(
  'clears the remembered resize on close (maximized: %s)',
  (closeWhileMaximized) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const render = (open: boolean) =>
      act(() =>
        root.render(
          <React.StrictMode>
            <DetailModal
              open={open}
              title='Edit'
              options={{ width: 900, resizable: true }}
            >
              <input defaultValue='Draft' />
            </DetailModal>
          </React.StrictMode>,
        ),
      );
    try {
      render(true);
      const container = document.querySelector<HTMLElement>(
        '.ant-modal-container',
      )!;
      container.style.width = '600px';
      act(() =>
        document
          .querySelector<HTMLButtonElement>('[aria-label="Maximize dialog"]')!
          .click(),
      );
      if (!closeWhileMaximized) {
        act(() =>
          document
            .querySelector<HTMLButtonElement>('[aria-label="Restore dialog"]')!
            .click(),
        );
        expect(container.style.width).toBe('600px');
      }
      render(false);
      render(true);
      const reopened = document.querySelector<HTMLElement>(
        '.ant-modal-container',
      )!;
      expect(reopened.style.width).toBe('');
      expect(
        document.querySelector<HTMLElement>('.ant-modal')!.style.width,
      ).toBe('900px');
      expect(
        document.querySelector('[aria-label="Maximize dialog"]'),
      ).not.toBeNull();
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
