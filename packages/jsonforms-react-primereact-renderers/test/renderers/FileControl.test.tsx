import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import FileControl, { fileControlTester } from '../../src/controls/FileControl';

describe('compact file control', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const render = (data: string | undefined, readonly = false) =>
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: 'string', format: 'binary' }}
          uischema={{ type: 'Control', scope: '#' }}
          data={data}
          readonly={readonly}
          renderers={[{ tester: fileControlTester, renderer: FileControl }]}
        />,
      ),
    );
  it('shows stored filenames and follows external replacement', () => {
    render('data:text/plain;filename=report%20one.txt;base64,QQ==');
    expect(
      container.querySelector<HTMLInputElement>('input.p-inputtext')?.value,
    ).toBe('report one.txt');
    render('data:text/plain;filename=second.txt;base64,Qg==');
    expect(
      container.querySelector<HTMLInputElement>('input.p-inputtext')?.value,
    ).toBe('second.txt');
    render(undefined);
    expect(
      container.querySelector<HTMLInputElement>('input.p-inputtext')?.value,
    ).toBe('');
    expect(container.querySelector('[aria-label="Clear value"]')).toBeNull();
  });
  it('reveals clear only on hover or focus and prevents readonly mutation', () => {
    render('data:text/plain;filename=report.txt;base64,QQ==');
    const clear = container.querySelector<HTMLButtonElement>(
      '[aria-label="Clear value"]',
    )!;
    expect(clear.style.opacity).toBe('0');
    act(() => clear.focus());
    expect(clear.style.opacity).toBe('1');
    render('data:text/plain;filename=report.txt;base64,QQ==', true);
    expect(container.querySelector('[aria-label="Clear value"]')).toBeNull();
    expect(
      container.querySelector<HTMLInputElement>('input[type="file"]')?.disabled,
    ).toBe(true);
  });
});
