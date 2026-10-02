import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { flushUntil } from './support/flush';

// Capture the actual column definitions supplied to AG Grid.
const captured: { props?: any } = {};
// No JSX in the factory: it is hoisted above the imports, so `React` is not in
// scope yet when it runs.
vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: any) => {
    captured.props = props;
    return null;
  },
}));

import { extendedAgGridTester } from '../src/util/editorControls';
import { createAgGridControlRenderer } from '../src/renderers/AgGridControlRenderer';

it('supplies only filenames as the default grid filter values', async () => {
  const root = createRoot(document.createElement('div'));
  const file = { type: 'string', format: 'binary' };
  const value = 'data:text/plain;filename=receipt.txt;base64,c2VjcmV0';
  const Renderer = createAgGridControlRenderer({
    Frame: ({ children }: any) => <div>{children}</div>,
    Button: ({ children }: any) => <button>{children}</button>,
  });
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file,
                files: { type: 'array', items: file },
              },
            },
          }}
          data={[{ file: value, files: [value] }]}
          uischema={{
            type: 'Control',
            scope: '#',
            options: { variant: 'ag-grid' },
          }}
          renderers={[{ tester: extendedAgGridTester, renderer: Renderer }]}
        />
      )
    );
    await flushUntil(() => Boolean(captured.props));
    for (const field of ['file', 'files']) {
      const column = captured.props.columnDefs.find(
        (entry: any) => entry.colId === field
      );
      expect(column.valueGetter({ data: captured.props.rowData[0] })).toBe(
        'receipt.txt'
      );
    }
  } finally {
    act(() => root.unmount());
  }
});
