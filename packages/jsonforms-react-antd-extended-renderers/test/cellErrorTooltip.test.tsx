import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { flushUntil } from './support/flush';

/**
 * An antd Tooltip cannot be opened in jsdom - rc-trigger needs layout APIs
 * jsdom does not implement, and no pointer/mouse/focus event opens it (probed).
 * So the wiring is checked instead of the hover: Tooltip is replaced with a
 * stub that renders its title, which proves the feedback icon is wrapped in a
 * tooltip carrying the validation message.
 */
vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  const React = await vi.importActual<any>('react');
  return {
    ...actual,
    Tooltip: ({ title, children }: any) =>
      React.createElement(
        'span',
        { 'data-testid': 'tooltip' },
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  };
});

import { ConfigProvider } from 'antd';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdAgGridControlRenderer } from '../src/renderers/AntdAgGridControlRenderer';

const schema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['firstName'],
    properties: {
      firstName: { type: 'string', title: 'First name' },
    },
  },
};

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
          data={[{ firstName: 'Ada' }, {}]}
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

describe.each([
  ['table', { table: true }],
  ['ag-grid', { variant: 'ag-grid' }],
])('%s cell error tooltip', (_name, options) => {
  it('wraps the feedback icon in a tooltip carrying the message', async () => {
    const view = await render(options);
    const item = view.container.querySelector('.ant-form-item-has-error')!;
    const tooltip = item.querySelector('[data-testid="tooltip"]')!;
    expect(tooltip).toBeTruthy();
    // the tooltip's own content is the validation message (JSON Forms words
    // it differently per context, so match the substance rather than the text)
    expect(
      tooltip.querySelector('[data-testid="tooltip-title"]')!.textContent
    ).toMatch(/required/i);
    // and it is the feedback icon that it wraps
    expect(tooltip.querySelector('.anticon-exclamation-circle')).toBeTruthy();
    view.unmount();
  });

  it('names the icon with the message, so it is not hover-only', async () => {
    const view = await render(options);
    const icon = view.container.querySelector(
      '.ant-form-item-has-error .anticon-exclamation-circle'
    )!;
    expect(icon.getAttribute('aria-label')).toMatch(/required/i);
    view.unmount();
  });
});
