import { AntdArrayFrame } from '../../jsonforms-react-antd-extended-renderers/src/renderers/AntdArrayFrame';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { ArrayPanel } from '../src/layouts/ArrayPanel';

it('keeps array editors mounted and honors an explicit false override', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const render = (options: any) =>
    act(() =>
      root.render(
        <ArrayPanel
          title='Rows'
          panelLabel='Rows'
          options={options}
          config={{ jsonformsExtended: { collapsible: true, collapsed: true } }}
        >
          <input defaultValue='Keep' />
        </ArrayPanel>
      )
    );
  try {
    render({});
    const input = container.querySelector('input')!;
    expect(input.parentElement!.hidden).toBe(true);
    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-expanded]')!
        .click()
    );
    expect(input.parentElement!.hidden).toBe(false);
    expect(container.querySelector('input')).toBe(input);
    render({ collapsible: false });
    expect(container.querySelector('button[aria-expanded]')).toBeNull();
    expect(input.parentElement!.hidden).toBe(false);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('keeps the AG Grid frame contents mounted while collapsing', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <AntdArrayFrame label='Grid' options={{ collapsible: true }}>
          <div data-grid>Grid contents</div>
        </AntdArrayFrame>
      )
    );
    const grid = container.querySelector('[data-grid]')!;
    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-controls]'
    )!;
    const body = document.getElementById(
      toggle.getAttribute('aria-controls')!
    )!;
    act(() => toggle.click());
    expect(body.hidden).toBe(true);
    expect(container.querySelector('[data-grid]')).toBe(grid);
    act(() => toggle.click());
    expect(body.hidden).toBe(false);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
