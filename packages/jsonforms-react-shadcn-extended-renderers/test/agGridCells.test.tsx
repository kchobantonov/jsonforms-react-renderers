import { readFileSync } from 'node:fs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src';
const schema = JSON.parse(
  readFileSync(
    require.resolve(
      '@chobantonov/jsonforms-extended-spec/examples/array-controls/schema.json'
    ),
    'utf8'
  )
);
const data = JSON.parse(
  readFileSync(
    require.resolve(
      '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json'
    ),
    'utf8'
  )
);
const ui = JSON.parse(
  readFileSync(
    require.resolve(
      '@chobantonov/jsonforms-extended-spec/examples/array-controls/uischema.json'
    ),
    'utf8'
  )
);

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: any) => (
    <div data-testid='grid'>
      {props.rowData.map((row: any) => (
        <div key={row.index}>
          {props.columnDefs
            .filter((col: any) => col.cellRenderer)
            .map((col: any) => (
              <div key={col.colId}>{col.cellRenderer({ data: row })}</div>
            ))}
        </div>
      ))}
    </div>
  ),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

it('dispatches every spec grid column through the shadcn cells registry', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const category = ui.elements[1].elements!.find(
    (item) => item.name === 'cells'
  )!;
  const grid = category.elements!.find(
    (item) => item.options?.variant === 'ag-grid'
  )!;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={data}
          uischema={grid as any}
          renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
          cells={[...shadcnExtendedCells, ...shadcnCells]}
        />
      )
    );
    await vi.waitFor(async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(container.querySelector('[data-testid="grid"]')).toBeTruthy();
    });
    const add = container.querySelector('button[aria-label="Add row"]')!;
    expect(add.querySelector('svg')).toBeTruthy();
    expect(add.textContent).toBe('');
    expect(add.getAttribute('title')).toBe('Add row');
    expect(container.textContent).not.toContain('No applicable cell');
    expect(container.textContent).toContain(data.staff[0].address.street);
    expect(container.textContent).toContain(data.staff[0].phoneNumbers[0]);
    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(2);
    expect(
      container.querySelectorAll('[aria-label="Choose a duration"]')
    ).toHaveLength(2);
    expect(container.querySelectorAll('.shadcn-jsonforms-cell')).toHaveLength(
      10
    );
    expect(
      container.querySelectorAll('[aria-label^="Edit "]')
    ).not.toHaveLength(0);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
