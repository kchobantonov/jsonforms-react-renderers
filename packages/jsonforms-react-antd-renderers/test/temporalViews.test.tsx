import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/* Arrow properties rather than methods: an empty method body trips lint. */
class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

/** Opens the picker and reports which time columns it drew. */
const columnsFor = async (schemaFormat: string, options: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{}}
          schema={
            {
              type: 'object',
              properties: { at: { type: 'string', format: schemaFormat } },
            } as any
          }
          uischema={
            { type: 'Control', scope: '#/properties/at', options } as any
          }
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
  });
  const input = container.querySelector<HTMLInputElement>('input')!;
  await act(async () => {
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    input.focus();
  });
  await settle(150);
  const count = document.querySelectorAll(
    '.ant-picker-time-panel-column'
  ).length;
  await act(() => root.unmount());
  return count;
};

describe('`views` selects the time columns a picker draws', () => {
  it('drops the seconds column when views omits it', async () => {
    const withSeconds = await columnsFor('time', {
      timeFormat: 'HH:mm:ss',
      views: ['hours', 'minutes', 'seconds'],
    });
    const withoutSeconds = await columnsFor('time', {
      timeFormat: 'HH:mm:ss',
      views: ['hours', 'minutes'],
    });
    expect(withSeconds, 'no time panel rendered').toBeGreaterThan(0);
    expect(withoutSeconds).toBe(withSeconds - 1);
  });

  /*
    The display format still decides when `views` names no time view - a
    date-only array must not blank the panel.
  */
  it('leaves the format in charge when views names no time view', async () => {
    const fromFormat = await columnsFor('time', { timeFormat: 'HH:mm:ss' });
    const dateOnlyViews = await columnsFor('time', {
      timeFormat: 'HH:mm:ss',
      views: ['year', 'month'],
    });
    expect(dateOnlyViews).toBe(fromFormat);
  });
});
