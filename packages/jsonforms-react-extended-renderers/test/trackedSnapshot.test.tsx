import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { proxy } from 'valtio';
import DynamicJSXRenderer, {
  useTrackedSnapshot,
} from '../src/components/DynamicJSXRenderer';

it('tracks literal keys and replacements of the template data container', async () => {
  const state = proxy({ __val__: { 'a.b': 'literal', a: { b: 'nested' } } });
  const host = document.createElement('div');
  const root = createRoot(host);
  const Probe = () => {
    const snapshot = useTrackedSnapshot(state);
    return (
      <output>
        {snapshot['a.b']} / {snapshot.a.b}
      </output>
    );
  };
  try {
    await act(async () => root.render(<Probe />));
    expect(host.textContent).toBe('literal / nested');
    await act(async () => {
      state.__val__['a.b'] = 'edited';
    });
    expect(host.textContent).toBe('edited / nested');
    await act(async () => {
      state.__val__ = { 'a.b': 'replaced', a: { b: 'new' } };
    });
    expect(host.textContent).toBe('replaced / new');
    await act(async () => {
      state.__val__.a.b = 'updated';
    });
    expect(host.textContent).toBe('replaced / updated');
  } finally {
    act(() => root.unmount());
  }
});

it('updates primitive and null template data', async () => {
  const state = proxy<{ __val__: string | null }>({ __val__: 'initial' });
  const host = document.createElement('div');
  const root = createRoot(host);
  const Probe = () => <output>{useTrackedSnapshot(state) ?? 'empty'}</output>;
  try {
    await act(async () => root.render(<Probe />));
    await act(async () => {
      state.__val__ = 'replacement';
    });
    expect(host.textContent).toBe('replacement');
    await act(async () => {
      state.__val__ = null;
    });
    expect(host.textContent).toBe('empty');
  } finally {
    act(() => root.unmount());
  }
});

it('updates URL policy without remounting the compiled template or its input', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const source = `function Template() {
    const [count, setCount] = React.useState(0);
    return <div><input defaultValue="initial" /><button onClick={() => setCount(count + 1)}>{count}</button><a href="/details">Details</a></div>;
  }`;
  const render = (allowRelative: boolean) =>
    act(() =>
      root.render(
        <DynamicJSXRenderer
          jsxTemplate={source}
          props={{}}
          urlPolicy={{
            allowedSchemes: ['https'],
            allowRelative,
            allowImageDataUrls: false,
          }}
        />,
      ),
    );
  try {
    render(true);
    const input = host.querySelector('input')!;
    input.value = 'unsaved';
    act(() => host.querySelector('button')!.click());
    expect(host.querySelector('a')!.getAttribute('href')).toBe('/details');
    render(false);
    expect(host.querySelector('input')).toBe(input);
    expect(input.value).toBe('unsaved');
    expect(host.querySelector('button')!.textContent).toBe('1');
    expect(host.querySelector('a')!.hasAttribute('href')).toBe(false);
  } finally {
    act(() => root.unmount());
  }
});
