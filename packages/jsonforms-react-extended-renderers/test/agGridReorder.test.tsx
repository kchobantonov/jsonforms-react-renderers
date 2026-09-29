import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { flushUntil } from './support/flush';

/**
 * ag-grid is replaced by a stub that records the props it was handed.
 * Drag-and-drop cannot be driven through jsdom, so the reorder guard is
 * exercised the way the grid would exercise it - by invoking the callbacks the
 * renderer installs - and the check is on what reaches the form data.
 */
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

const schema = {
  type: 'array',
  items: { type: 'object', properties: { name: { type: 'string' } } },
};
const data = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];

// The renderer set only has to supply chrome; none of it is under test here.
const AgGridControlRenderer = createAgGridControlRenderer({
  Frame: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
});

const render = async (options: Record<string, unknown>) => {
  captured.props = undefined;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema as any}
        uischema={
          {
            type: 'Control',
            scope: '#',
            options: { variant: 'ag-grid', ...options },
          } as any
        }
        renderers={[
          { tester: extendedAgGridTester, renderer: AgGridControlRenderer },
        ]}
        cells={[]}
        onChange={() => undefined}
      />
    )
  );
  await flushUntil(() => Boolean(captured.props));
  // What the grid is handed back is the observable result of a data change.
  const order = () =>
    (captured.props.rowData as { value: { name: string } }[]).map(
      (row) => row.value.name
    );
  return { order, unmount: () => act(() => root.unmount()) };
};

const dragEvent = (from: number, to: number) => ({
  node: { data: { index: from } },
  overNode: { data: { index: to } },
  api: { clearFocusedCell: () => undefined },
});
const sortEvent = (sort: string | null) => ({
  api: { getColumnState: () => [{ colId: 'name', sort }] },
});

describe('ag-grid reordering', () => {
  it('adds a drag column only when showSortButtons is set', async () => {
    const without = await render({});
    expect(captured.props.columnDefs.some((c: any) => c.rowDrag)).toBe(false);
    without.unmount();

    const withButtons = await render({ showSortButtons: true });
    expect(captured.props.columnDefs[0]).toMatchObject({
      colId: '$drag',
      rowDrag: true,
      sortable: false,
    });
    withButtons.unmount();
  });

  it('reorders the data on drop while the grid is unsorted', async () => {
    const { order, unmount } = await render({ showSortButtons: true });
    expect(captured.props.suppressRowDrag).toBe(false);
    expect(order()).toEqual(['a', 'b', 'c']);
    act(() => captured.props.onRowDragEnd(dragEvent(0, 2)));
    expect(order()).toEqual(['b', 'c', 'a']);
    unmount();
  });

  // A sort makes the visible order differ from the data order, so a drop
  // position no longer names a data index. Reordering has to stay off.
  it('suppresses dragging and ignores a drop once a column is sorted', async () => {
    const { order, unmount } = await render({ showSortButtons: true });
    act(() => captured.props.onSortChanged(sortEvent('asc')));
    await flushUntil(() => captured.props.suppressRowDrag === true);

    act(() => captured.props.onRowDragEnd(dragEvent(0, 2)));
    expect(order()).toEqual(['a', 'b', 'c']);

    act(() => captured.props.onSortChanged(sortEvent(null)));
    await flushUntil(() => captured.props.suppressRowDrag === false);
    unmount();
  });

  it('suppresses dragging while a filter is active', async () => {
    const { order, unmount } = await render({ showSortButtons: true });
    act(() =>
      captured.props.onFilterChanged({
        api: { getFilterModel: () => ({ name: { filter: 'a' } }) },
      })
    );
    await flushUntil(() => captured.props.suppressRowDrag === true);
    act(() => captured.props.onRowDragEnd(dragEvent(0, 2)));
    expect(order()).toEqual(['a', 'b', 'c']);
    unmount();
  });
});

it('preserves explicit column widths instead of flex shrinking them', async () => {
  const { unmount } = await render({
    agGridOptions: { columnDefs: [{ field: 'name', width: 240 }] },
  });
  expect(captured.props.columnDefs[0]).toMatchObject({ width: 240, flex: 0 });
  unmount();
});
it('allows explicitly requested flex sizing', async () => {
  const { unmount } = await render({
    agGridOptions: { columnDefs: [{ field: 'name', width: 240, flex: 2 }] },
  });
  expect(captured.props.columnDefs[0]).toMatchObject({ width: 240, flex: 2 });
  unmount();
});

it('preserves cell renderer identity across form data updates', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const uischema = {
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid' },
  };
  const renderers = [
    { tester: extendedAgGridTester, renderer: AgGridControlRenderer },
  ];
  const cells: any[] = [];
  const draw = (name: string) =>
    act(() =>
      root.render(
        <JsonForms
          data={[{ name }]}
          schema={schema as any}
          uischema={uischema}
          renderers={renderers}
          cells={cells}
        />
      )
    );
  try {
    draw('a');
    await flushUntil(() => Boolean(captured.props?.columnDefs));
    const renderer = captured.props.columnDefs[0].cellRenderer;
    for (const name of ['ab', 'abc', 'abcd']) {
      draw(name);
      await flushUntil(() => captured.props.rowData[0].value.name === name);
      expect(captured.props.columnDefs[0].cellRenderer).toBe(renderer);
    }
  } finally {
    act(() => root.unmount());
  }
});
