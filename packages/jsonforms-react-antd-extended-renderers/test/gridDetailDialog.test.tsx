import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { AntdAgGridControlRenderer } from '../src/renderers/AntdAgGridControlRenderer';
import { flushUntil } from './support/flush';

const schema: any = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      address: {
        type: 'object',
        title: 'Address',
        properties: {
          street: { type: 'string', title: 'Street' },
          city: { type: 'string', title: 'City' },
        },
      },
    },
  },
};

const uischema: any = {
  type: 'Control',
  scope: '#',
  options: {
    variant: 'ag-grid',
    cells: {
      address: {
        summary: { type: 'Control', scope: '#/properties/street' },
        detail: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/street' },
            { type: 'Control', scope: '#/properties/city' },
          ],
        },
      },
    },
  },
};

const openDetail = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={[{ name: 'Ada', address: { street: '12 St James', city: 'London' } }]}
          schema={schema}
          uischema={uischema}
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
  await flushUntil(
    () => Boolean(container.querySelector('[aria-label^="Edit"]'))
  );
  const edit = container.querySelector<HTMLElement>('[aria-label^="Edit"]');
  act(() => edit!.click());
  return { unmount: () => act(() => root.unmount()) };
};

describe('grid composite detail dialog', () => {
  // Regression: the dialog is a React child of the cell, so it inherited the
  // grid's cell mode and rendered its fields label-less, even though antd
  // portals the modal elsewhere in the DOM.
  it('shows field labels inside the dialog', async () => {
    const { unmount } = await openDetail();
    const dialog = document.querySelector('.ant-modal');
    expect(dialog).toBeTruthy();
    expect(dialog!.textContent).toContain('Street');
    expect(dialog!.textContent).toContain('City');
    unmount();
  });
});
