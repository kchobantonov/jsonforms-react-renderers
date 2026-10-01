import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';
const fixture = (name: string) => JSON.parse(readFileSync(require.resolve('@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/' + name + '.json'), 'utf8'));
it('mounts the official Draft-07 metaschema with schema-document data', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() => root.render(<JsonForms schema={fixture('schema')} data={fixture('data')} uischema={fixture('uischema')} renderers={shadcnRenderers} cells={shadcnCells} />));
    expect(container.textContent).not.toContain('No applicable renderer found');
    expect(container.querySelector('input')).not.toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
