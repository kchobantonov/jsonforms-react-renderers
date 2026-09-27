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

/**
 * The cells registry holds bare inputs - they draw no Form.Item of their own -
 * so a cell shows validation state only if its frame supplies it. Both the
 * table and the grid must show the compact form: an error border and an icon
 * carrying the message, never an inline message that grows the row.
 */
const schema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['firstName'],
    properties: {
      firstName: { type: 'string', title: 'First name' },
      lastName: { type: 'string', title: 'Last name' },
    },
  },
};

// one valid row, one missing the required property
const data = [{ firstName: 'Ada', lastName: 'Lovelace' }, { lastName: 'Hopper' }];

afterEach(() => {
  document.body.innerHTML = '';
});

const render = async (options: Record<string, unknown>) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={{ type: 'Control', scope: '#', options } as any}
          renderers={[
            ...antdRenderers,
            {
              tester: extendedAgGridTester,
              renderer: AntdAgGridControlRenderer,
            },
          ]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  await flushUntil(() =>
    Boolean(container.querySelector('.ant-form-item-has-error'))
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

// Outside a cell nothing is suppressed: the same control keeps its label and
// spells the message out underneath. Without this the cell assertions would
// also pass on a renderer that simply never shows errors anywhere.
describe('control (not in a cell)', () => {
  it('shows the label and the message inline', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider>
          <JsonForms
            data={{}}
            schema={
              {
                type: 'object',
                required: ['firstName'],
                properties: {
                  firstName: { type: 'string', title: 'First name' },
                },
              } as any
            }
            uischema={
              { type: 'Control', scope: '#/properties/firstName' } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await flushUntil(() =>
      Boolean(container.querySelector('.ant-form-item-has-error'))
    );
    const item = container.querySelector('.ant-form-item-has-error')!;
    expect(item.querySelector('.ant-form-item-label')!.textContent).toContain(
      'First name'
    );
    expect(item.querySelector('.ant-form-item-explain')!.textContent).toMatch(
      /required/i
    );
    act(() => root.unmount());
  });
});

describe.each([
  ['table', { table: true }],
  ['ag-grid', { variant: 'ag-grid' }],
])('%s cell validation', (_name, options) => {
  it('marks the invalid cell with an error state', async () => {
    const view = await render(options);
    expect(
      view.container.querySelectorAll('.ant-form-item-has-error').length
    ).toBe(1);
    view.unmount();
  });

  it('carries the message on a feedback icon, not as inline text', async () => {
    const view = await render(options);
    const item = view.container.querySelector('.ant-form-item-has-error')!;
    expect(item.querySelector('.ant-form-item-feedback-icon')).toBeTruthy();
    // an explanation rendered under the control is what grows the row
    expect(item.querySelector('.ant-form-item-explain')).toBeNull();
    expect(item.textContent).not.toMatch(/required/i);
    view.unmount();
  });

  // Label suppression is not asserted here: the cells registry components
  // draw no Form.Item of their own, so no label ever reaches a cell and the
  // assertion would hold even with cell mode switched off (verified). The
  // real guard is cellMode.test.tsx in jsonforms-react-antd-renderers, which
  // puts a control renderer inside a CellModeProvider.
  it('keeps the whole cell to one row, with no explanation block', async () => {
    const view = await render(options);
    expect(
      view.container.querySelectorAll('.ant-form-item-explain').length
    ).toBe(0);
    view.unmount();
  });
});
