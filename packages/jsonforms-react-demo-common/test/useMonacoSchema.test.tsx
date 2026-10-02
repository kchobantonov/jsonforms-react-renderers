// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { useMonacoSchema } from '../src/app/useMonacoSchema';
const { defaults } = vi.hoisted(() => ({
  defaults: {
    diagnosticsOptions: { schemas: [] as any[] },
    setDiagnosticsOptions: vi.fn(),
  },
}));
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => ({ languages: { json: { jsonDefaults: defaults } } }),
}));
function Probe({ schema }: { schema: string }) {
  useMonacoSchema(schema);
  return null;
}
it('removes only the demo schema on clear and preserves false schemas and malformed drafts', () => {
  const other = {
    uri: 'inmemory://other/schema.json',
    schema: { type: 'number' },
  };
  defaults.diagnosticsOptions = { schemas: [other] };
  defaults.setDiagnosticsOptions.mockImplementation((next) => {
    defaults.diagnosticsOptions = next;
  });
  const root = createRoot(document.createElement('div'));
  try {
    act(() => root.render(<Probe schema='{"type":"object"}' />));
    expect(defaults.diagnosticsOptions.schemas).toHaveLength(2);
    act(() => root.render(<Probe schema='' />));
    expect(defaults.diagnosticsOptions.schemas).toEqual([other]);
    act(() => root.render(<Probe schema='false' />));
    expect(defaults.diagnosticsOptions.schemas[1].schema).toBe(false);
    act(() => root.render(<Probe schema='{' />));
    expect(defaults.diagnosticsOptions.schemas[1].schema).toBe(false);
  } finally {
    act(() => root.unmount());
  }
});
