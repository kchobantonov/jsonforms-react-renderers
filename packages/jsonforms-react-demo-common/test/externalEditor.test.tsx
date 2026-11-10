// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { it, expect, vi } from 'vite-plus/test';
import { ExternalEditor } from '../src/app/ExternalEditor';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, options }: any) => (
    <textarea
      aria-label={options.ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

it('retains invalid drafts and only publishes parsed external objects', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onChange = vi.fn();
  try {
    act(() =>
      root.render(
        <ExternalEditor
          value='{"settings":{}}'
          locale='en'
          onChange={onChange}
        />,
      ),
    );
    const input = host.querySelector('textarea')!;
    input.value = '{"settings":{"readonly":true},"host":{"name":"A"}}';
    act(() => Simulate.change(input));
    expect(onChange).toHaveBeenLastCalledWith(
      '{"settings":{"readonly":true},"host":{"name":"A"}}',
      { settings: { readonly: true }, host: { name: 'A' } },
    );
    input.value = '{';
    act(() => Simulate.change(input));
    expect(onChange).toHaveBeenLastCalledWith('{', undefined);
    act(() =>
      root.render(<ExternalEditor value='{' locale='en' onChange={onChange} />),
    );
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(input.value).toBe('{');
    act(() =>
      root.render(
        <ExternalEditor
          value='{"settings":{"readonly":false},"host":{"name":"A"}}'
          locale='bg'
          onChange={onChange}
        />,
      ),
    );
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.textContent).toContain('Външни данни');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
