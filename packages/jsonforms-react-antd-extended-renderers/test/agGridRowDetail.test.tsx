import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { AntdAgGridControlRenderer } from '../src/renderers/AntdAgGridControlRenderer';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
const captured: { props?: any } = {};
vi.mock(
  '../../jsonforms-react-extended-renderers/node_modules/ag-grid-react',
  () => ({
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
  })
);
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
const mount = async (rowDetail: any, readonly = false) => {
  captured.props = undefined;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onRowClicked = vi.fn();
  act(() =>
    root.render(
      <JsonForms
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
              rowDetail: {
                ...rowDetail,
                detail: { type: 'Control', scope: '#/properties/name' },
              },
              agGridOptions: { onRowClicked },
            },
          } as any
        }
        renderers={[
          ...antdRenderers,
          { tester: extendedAgGridTester, renderer: AntdAgGridControlRenderer },
        ]}
        cells={antdCells}
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
    await input('Applied');
    await click(button('Apply'));
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
    expect(button('Apply').disabled).toBe(true);
  } finally {
    app.close();
  }
});
