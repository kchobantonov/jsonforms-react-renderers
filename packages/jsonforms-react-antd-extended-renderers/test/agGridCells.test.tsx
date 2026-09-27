import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { antdRenderers, antdCells } from '@chobantonov/jsonforms-react-antd-renderers';
import { AntdAgGridControlRenderer } from '../src/renderers/AntdAgGridControlRenderer';
import { flushUntil } from './support/flush';

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      quantity: { type: 'integer' },
      address: {
        type: 'object',
        title: 'Address',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
        },
      },
    },
  },
};
const uischema = {
  type: 'Control',
  scope: '#',
  options: {
    variant: 'ag-grid',
    // uischema-supplied column defs are merged onto the generated ones
    cells: {
      address: { summary: { type: 'Control', scope: '#/properties/street' } },
    },
    agGridOptions: {
      columnDefs: [
        { field: 'quantity', width: 120 },
        { field: 'name', width: 200 },
        { field: 'address', width: 220 },
      ],
    },
  },
};

const renderGrid = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={[
            {
              name: 'First item',
              quantity: 2,
              address: { street: '12 St James', city: 'London' },
            },
          ]}
          schema={schema as any}
          uischema={uischema as any}
          renderers={[
            ...antdRenderers,
            { tester: extendedAgGridTester, renderer: AntdAgGridControlRenderer },
          ]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  // the grid renderer is lazy, and ag-grid renders its cells asynchronously
  await flushUntil(() => container.querySelectorAll('.ag-cell').length > 0);
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('AG Grid cells', () => {
  // Regression: dispatching a cell with the ARRAY schema instead of the item
  // schema means the field scope resolves to nothing, so cells render no
  // control at all (and in a real browser, a whole nested grid).
  it('renders the field control inside a data cell', async () => {
    const { container, unmount } = await renderGrid();
    const nameCell = Array.from(container.querySelectorAll('.ag-cell')).find(
      (el) => el.getAttribute('col-id') === 'name'
    );
    expect(nameCell).toBeTruthy();
    // Cells dispatch through the cells registry, so there is deliberately no
    // Form.Item wrapper - that is what kept rows taller than a single line.
    const input = nameCell!.querySelector<HTMLInputElement>('input');
    expect(input).toBeTruthy();
    // Presence alone is not enough: with a mis-composed path the control still
    // renders, just bound to nothing, so assert it actually shows the row data.
    expect(input!.value).toBe('First item');
    unmount();
  });

  it('honours uischema column defs (order and width)', async () => {
    const { container, unmount } = await renderGrid();
    const headers = Array.from(
      container.querySelectorAll('.ag-header-cell[col-id]')
    )
      .map((el) => el.getAttribute('col-id'))
      .filter((id) => id === 'name' || id === 'quantity');
    // the uischema lists quantity first, so the generated order is overridden
    expect(headers).toEqual(['quantity', 'name']);
    unmount();
  });

  // Regression: dispatching a renderer instead of a cell picks the object
  // renderer, which inlines the entire detail form inside the cell.
  it('summarises a composite column instead of inlining its detail', async () => {
    const { container, unmount } = await renderGrid();
    const cell = Array.from(container.querySelectorAll('.ag-cell')).find(
      (el) => el.getAttribute('col-id') === 'address'
    );
    expect(cell).toBeTruthy();
    expect(cell!.textContent).toContain('12 St James');
    // the detail form would have rendered the city input too
    expect(cell!.querySelectorAll('input').length).toBe(0);
    unmount();
  });

  it('renders exactly one grid, never one per cell', async () => {
    const { container, unmount } = await renderGrid();
    expect(container.querySelectorAll('.ag-root').length).toBe(1);
    for (const cell of Array.from(container.querySelectorAll('.ag-cell'))) {
      expect(cell.querySelector('.ag-root')).toBeNull();
    }
    unmount();
  });
});
