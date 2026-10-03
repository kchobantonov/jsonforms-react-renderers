import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnRenderers,
  shadcnCells,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { ShadcnAgGridControlRenderer } from '../src/renderers/ShadcnAgGridControlRenderer';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
const captured: { props?: any } = {};
vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: any) => {
    captured.props = props;
    return (
      <div>
        {props.rowData.map((row: any) => (
          <div key={row.index}>
            {props.columnDefs
              .filter((col: any) => col.colId === '$detail')
              .map((col: any) => (
                <React.Fragment key={col.colId}>
                  {col.cellRenderer({ data: row })}
                </React.Fragment>
              ))}
          </div>
        ))}
      </div>
    );
  },
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const wait = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
};
const click = async (button: Element) => {
  act(() => (button as HTMLElement).click());
  await wait();
};
const input = async (value: string) => {
  const el = document.querySelector<HTMLInputElement>('input')!;
  expect(el).toBeTruthy();
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait();
};
const button = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(
    (el) => el.textContent?.trim() === text
  )!;
const mount = async (
  rowDetail: any,
  readonly = false,
  columnOptions = {},
  invalid = false
) => {
  captured.props = undefined;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onRowClicked = vi.fn();
  act(() =>
    root.render(
      <JsonForms
        config={{ jsonformsExtended: { dynamicValues: { enabled: true } } }}
        data={{
          rows: [
            { name: 'First', hidden: 'Keep' },
            { name: 'Second', hidden: 'Also keep' },
          ],
        }}
        schema={{
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                required: invalid ? ['missing'] : [],
                properties: {
                  name: { type: 'string' },
                  hidden: { type: 'string' },
                },
              },
            },
          },
        }}
        readonly={readonly}
        uischema={
          {
            type: 'Control',
            scope: '#/properties/rows',
            options: {
              variant: 'ag-grid',
              ...columnOptions,
              rowDetail: {
                ...rowDetail,
                detail: { type: 'Control', scope: '#/properties/name' },
              },
              agGridOptions: { onRowClicked },
            },
          } as any
        }
        renderers={[
          ...shadcnRenderers,
          {
            tester: extendedAgGridTester,
            renderer: ShadcnAgGridControlRenderer,
          },
        ]}
        cells={shadcnCells}
      />
    )
  );
  for (let i = 0; i < 30 && !captured.props; i++) await wait();
  expect(captured.props).toBeTruthy();
  return {
    onRowClicked,
    close: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
};
it('uses the custom row form with a nested source path and stages dialog changes', async () => {
  const app = await mount({ presentation: 'dialog' });
  try {
    await click(document.querySelectorAll('[aria-label="Edit details"]')[1]);
    expect(document.querySelectorAll('input')).toHaveLength(1);
    expect(document.querySelector<HTMLInputElement>('input')!.value).toBe(
      'Second'
    );
    await input('Changed');
    expect(captured.props.rowData[1].value.name).toBe('Second');
    await click(button('Cancel'));
    expect(captured.props.rowData[1].value.name).toBe('Second');
    await click(document.querySelectorAll('[aria-label="Edit details"]')[1]);
    const nameRenderer = captured.props.columnDefs.find(
      (column: any) => column.colId === 'name'
    ).cellRenderer;
    await input('Applied');
    await click(button('Apply'));
    expect(
      captured.props.columnDefs.find((column: any) => column.colId === 'name')
        .cellRenderer
    ).toBe(nameRenderer);
    expect(captured.props.rowData.map((r: any) => r.value)).toEqual([
      { name: 'First', hidden: 'Keep' },
      { name: 'Applied', hidden: 'Also keep' },
    ]);
  } finally {
    app.close();
  }
});
it.each(['right', 'bottom'])(
  'edits live in the %s panel using source indices and keeps checkbox selection separate',
  async (placement) => {
    const app = await mount({
      presentation: 'panel',
      placement,
      collapsed: true,
    });
    try {
      act(() =>
        captured.props.onRowClicked({ data: { index: 1 }, rowIndex: 0 })
      );
      expect(app.onRowClicked).toHaveBeenCalled();
      expect(document.querySelector('input')).toBeNull();
      await click(document.querySelector('[aria-label="Show details"]')!);
      expect(document.querySelector<HTMLInputElement>('input')!.value).toBe(
        'Second'
      );
      act(() =>
        captured.props.onSelectionChanged({
          api: { getSelectedRows: () => [{ index: 0 }] },
        })
      );
      await input('Live');
      expect(captured.props.rowData[1].value.name).toBe('Live');
      expect(captured.props.rowData[0].value.name).toBe('First');
    } finally {
      app.close();
    }
  }
);
it('allows read-only inspection without applying changes', async () => {
  const app = await mount({ presentation: 'dialog' }, true);
  try {
    await click(document.querySelectorAll('[aria-label="Edit details"]')[0]);
    expect(document.querySelector<HTMLInputElement>('input')!.value).toBe(
      'First'
    );
    expect(document.activeElement?.getAttribute('role')).toBe('dialog');
    expect(button('Apply').disabled).toBe(true);
  } finally {
    app.close();
  }
});

it('reveals the added row page once, using its sorted display index', async () => {
  const app = await mount({ presentation: 'dialog' });
  try {
    const add = Array.from(document.querySelectorAll('button')).find((el) =>
      /add/i.test(el.getAttribute('aria-label') ?? el.title)
    );
    expect(add).toBeTruthy();
    await click(add!);
    expect(captured.props.rowData).toHaveLength(3);
    const api = {
      getRowNode: vi.fn(() => ({ rowIndex: 7 })),
      paginationGetPageSize: () => 5,
      paginationGoToPage: vi.fn(),
      ensureIndexVisible: vi.fn(),
    };
    act(() => captured.props.onRowDataUpdated({ api }));
    expect(api.getRowNode).toHaveBeenCalledWith('2');
    expect(api.paginationGoToPage).toHaveBeenCalledWith(1);
    expect(api.ensureIndexVisible).toHaveBeenCalledWith(7);
    act(() => captured.props.onRowDataUpdated({ api }));
    expect(api.paginationGoToPage).toHaveBeenCalledTimes(1);
  } finally {
    app.close();
  }
});

it('binds a presentation column to the source row instead of a synthetic property', async () => {
  const app = await mount({ presentation: 'dialog' }, false, {
    columnDefs: [{ field: 'preview', scope: '#', headerName: 'Preview' }],
    cells: {
      preview: {
        summary: {
          type: 'Label',
          text: '{name}',
          options: { interpolate: true, textParams: { name: '{item.name}' } },
        },
      },
    },
  });
  try {
    const column = captured.props.columnDefs.find(
      (c: any) => c.colId === 'preview'
    );
    expect(column.headerName).toBe('Preview');
    const rows = [...captured.props.rowData].reverse();
    const sorted = rows.sort((a: any, b: any) =>
      column
        .valueGetter({ data: a })
        .localeCompare(column.valueGetter({ data: b }))
    );
    expect(sorted.map((row: any) => row.value.name)).toEqual([
      'First',
      'Second',
    ]);
    expect(column.valueGetter({ data: sorted[0] })).toBe('First');
    const element = column.cellRenderer({ data: { index: 1 } });
    expect(element.props.path).toBe('rows.1');
    expect(
      element.props.children.props.children.props.schema.properties.name
    ).toEqual({ type: 'string' });
    expect(
      element.props.children.props.children.props.uischema.options.summaryOnly
    ).toBe(true);
  } finally {
    app.close();
  }
});

it('shows descendant row errors beside the grid heading', async () => {
  const mounted = await mount({}, false, {}, true);
  try {
    const heading = document.querySelector('.shadcn-jsonforms-array h3');
    expect(heading).toBeTruthy();
    const indicator = heading!.parentElement!.querySelector('button');
    expect(indicator?.getAttribute('aria-label')).toBe(
      'Some items contain errors.'
    );
  } finally {
    mounted.close();
  }
});
