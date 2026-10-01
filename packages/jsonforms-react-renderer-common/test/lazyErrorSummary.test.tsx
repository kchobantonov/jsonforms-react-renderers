import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { expect, it, vi } from 'vitest';
import { useAdditionalPropertyErrors, usePathErrorIndicator, useErrorSummary, useErrorSummaryCount } from '../src/errorSummary';
it('counts immediately but translates details only when opened and reuses stable renders', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const translateError = vi.fn(() => 'Localized error');
  const context = { core: { errors: [{ instancePath: '/items/0/name', schemaPath: '#', keyword: 'custom', params: {}, message: 'Invalid' }] },
    i18n: { translateError } } as any;
  const Probe = ({ open }: { open: boolean }) => {
    const count = useErrorSummaryCount('Invalid', 'items');
    const entries = useErrorSummary('Invalid', 'items', open);
    return <span>{count}:{entries.length}</span>;
  };
  const render = (open: boolean) => act(() => root.render(<JsonFormsContext.Provider value={context}><Probe open={open} /></JsonFormsContext.Provider>));
  try {
    render(false);
    expect(host.textContent).toBe('1:0');
    expect(translateError).not.toHaveBeenCalled();
    render(true);
    expect(host.textContent).toBe('1:1');
    expect(translateError).toHaveBeenCalledOnce();
    render(true);
    expect(translateError).toHaveBeenCalledOnce();
  } finally { act(() => root.unmount()); }
});

it('separates direct array errors and child notices, with opt-in counts and object-only feedback', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const errors = [
    { instancePath: '/items', schemaPath: '#', keyword: 'minItems', params: { limit: 2 }, message: 'Too few items' },
    { instancePath: '/items/0', schemaPath: '#', keyword: 'required', params: { missingProperty: 'file' }, message: 'File required' },
  ];
  const translateError = vi.fn((error) => error.message);
  const Probe = ({ count, children }: any) => <span>{usePathErrorIndicator('items', { showValidationIndicatorCount: count }, children)}</span>;
  const render = (count: boolean, children: boolean) => act(() => root.render(
    <JsonFormsContext.Provider value={{ core: { errors }, i18n: { translateError } } as any}><Probe count={count} children={children} /></JsonFormsContext.Provider>
  ));
  try {
    render(false, true);
    expect(host.textContent).toBe('Too few items\nSome items contain errors.');
    expect(translateError).toHaveBeenCalledTimes(1);
    render(true, true);
    expect(host.textContent).toBe('Too few items\n1 error in items.');
    render(false, false);
    expect(host.textContent).toBe('Too few items');
  } finally { act(() => root.unmount()); }
});

it('reports disallowed literal property names only for their owning object', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const error = (instancePath: string, name: string) => ({ instancePath, schemaPath: '#', keyword: 'additionalProperties', params: { additionalProperty: name }, message: 'Not allowed' });
  const Probe = () => <span>{useAdditionalPropertyErrors('routing')}</span>;
  const render = (errors: any[]) => act(() => root.render(<JsonFormsContext.Provider value={{ core: { errors }, i18n: { translateError: () => 'Localized rejection' } } as any}><Probe /></JsonFormsContext.Provider>));
  try {
    render([error('/routing', 'legacy.zone'), error('/other', 'ignored')]);
    expect(host.textContent).toBe('legacy.zone: Localized rejection');
    render([]);
    expect(host.textContent).toBe('');
  } finally { act(() => root.unmount()); }
});
