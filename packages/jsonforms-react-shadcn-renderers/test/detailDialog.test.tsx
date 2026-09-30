import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, DialogHeader, DialogTitle } from '@jsonforms-react-shadcn-ui/dialog';
import { DetailDialogContent } from '../src/complex/DetailDialogContent';

it('focuses the dialog and restores configured dimensions after maximizing', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<Dialog open><DetailDialogContent open options={{ width: 720, height: 500, resizable: true }}>
    <DialogHeader><DialogTitle>Edit</DialogTitle></DialogHeader>
    <input defaultValue='Name' /><div><button>Apply</button></div>
  </DetailDialogContent></Dialog>));
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(document.activeElement).toBe(dialog);
  expect(dialog.style.width).toBe('720px');
  expect(dialog.style.translate).toBe('-50% -50%');
  expect(dialog.style.display).toBe('flex');
  expect(dialog.style.transitionProperty).toBe('none');
  expect(dialog.style.resize).toBe('both');
  expect(dialog.querySelector<HTMLElement>('[data-detail-dialog-body]')!.getAttribute('data-slot')).toBe('scroll-area');
  expect(dialog.querySelector('[data-detail-dialog-footer]')!.textContent).toBe('Apply');
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Maximize dialog"]')!.click());
  expect(dialog.style.width).toBe('calc(100vw - 32px)');
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Restore dialog"]')!.click());
  expect(dialog.style.width).toBe('720px');
  expect(dialog.style.height).toBe('500px');
  act(() => root.unmount());
  host.remove();
});
