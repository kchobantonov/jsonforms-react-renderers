import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AntdClearableInput } from '../../src/antd-controls/AntdClearableInput';

describe('Ant Design clearable input wrapper', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('reveals a populated clear action on keyboard focus', () => {
    act(() => {
      root.render(
        <AntdClearableInput data='Accountant' enabled onClear={vi.fn()}>
          <input />
        </AntdClearableInput>
      );
    });
    const input = container.querySelector('input') as HTMLInputElement;
    const button = container.querySelector(
      'button[aria-label="Clear value"]'
    ) as HTMLButtonElement;

    expect(button.style.opacity).toBe('0');
    act(() => input.focus());
    expect(button.style.opacity).toBe('1');
  });

  it('does not expose a clear action for an empty value', () => {
    act(() => {
      root.render(
        <AntdClearableInput data={undefined} enabled onClear={vi.fn()}>
          <input />
        </AntdClearableInput>
      );
    });
    expect(container.querySelector('button[aria-label="Clear value"]')).toBeNull();
  });
});
