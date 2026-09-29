import { readFileSync } from 'node:fs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  shadcnExtendedCells,
  shadcnExtendedRenderers,
  createFormsAjv,
} from '../src';
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      require.resolve(`@chobantonov/jsonforms-extended-spec/examples/temporal-controls/${name}.json`),
      'utf8'
    )
  );
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
it('mounts the complete temporal example including the canonical tuple fixture', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    expect(() =>
      act(() =>
        root.render(
          <JsonForms
            schema={fixture('schema')}
            uischema={fixture('uischema')}
            data={fixture('data')}
            ajv={createFormsAjv()}
            renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
            cells={[...shadcnExtendedCells, ...shadcnCells]}
          />
        )
      )
    ).not.toThrow();
    expect(container.textContent).toContain('In other structures');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
