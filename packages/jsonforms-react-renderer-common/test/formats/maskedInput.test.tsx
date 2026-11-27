import React, { act, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { useMaskedInput } from '../../src/formats/useMaskedInput';
import { mountHook } from '../support/hooks';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (
  options: any = { mask: '###-###' },
  data: any = '',
  mode: 'defer' | 'commit' = 'defer',
  schema: any = {},
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const changes = vi.fn();
  let model!: ReturnType<typeof useMaskedInput>;
  const Harness = () => {
    const field = useRef<HTMLInputElement>(null);
    const [stored, setStored] = useState(data);
    model = useMaskedInput(
      {
        data: stored,
        uischema: { type: 'Control', scope: '#', options },
        config: {},
        path: 'value',
        schema,
        handleChange: (path, value) => {
          changes(path, value);
          setStored(value);
        },
      },
      () => field.current,
      mode,
    );
    return (
      <input
        ref={field}
        value={model.display}
        onChange={model.onChange}
        onCompositionStart={model.onCompositionStart}
        onCompositionEnd={model.onCompositionEnd}
      />
    );
  };
  act(() => root.render(<Harness />));
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  const input = container.querySelector('input')!;
  const edit = (text: string, inputType = 'insertText') =>
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, text);
      input.setSelectionRange(text.length, text.length);
      input.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType }),
      );
    });
  return {
    input,
    edit,
    changes,
    get model() {
      return model;
    },
  };
};
it('masks displayed text while committing the raw value and maintaining the caret', () => {
  const view = mount();
  view.edit('1234');
  expect(view.input.value).toBe('123-4');
  expect(view.changes).toHaveBeenLastCalledWith('value', '1234');
  expect(view.input.selectionStart).toBe(5);
  view.edit('123-', 'deleteContentBackward');
  expect(view.changes).toHaveBeenLastCalledWith('value', '123');
  act(() => view.model.onClear());
  expect(view.input.value).toBe('');
  expect(view.changes).toHaveBeenLastCalledWith('value', undefined);
});
it('can return formatted values and display externally supplied data', () => {
  const view = mount({ mask: '###-###', returnMaskedValue: true }, '123-456');
  expect(view.input.value).toBe('123-456');
  view.edit('9876');
  expect(view.changes).toHaveBeenLastCalledWith('value', '987-6');
});
it('rejects overlong stored values and restores the accepted display and caret', () => {
  const view = mount({ mask: '###-###', restrict: true }, '123', 'defer', {
    maxLength: 3,
  });
  view.edit('1234');
  expect(view.changes).not.toHaveBeenCalled();
  expect(view.input.value).toBe('123');
  expect(view.input.selectionStart).toBe(3);
});
it.each(['defer', 'commit'] as const)(
  'handles IME composition in %s mode without filtering active drafts',
  (mode) => {
    const view = mount({ mask: '###' }, '', mode);
    act(() => view.model.onCompositionStart());
    view.edit('12a');
    if (mode === 'defer') {
      expect(view.changes).not.toHaveBeenCalled();
      expect(view.input.value).toBe('12a');
    } else expect(view.changes).toHaveBeenLastCalledWith('value', '12');
    act(() =>
      view.model.onCompositionEnd({
        currentTarget: view.input,
        nativeEvent: {},
      } as any),
    );
    expect(view.changes).toHaveBeenLastCalledWith('value', '12');
    expect(view.input.value).toBe('12');
  },
);
it('works as an unmasked input and clears to absence', () => {
  const view = mount({}, false);
  expect(view.input.value).toBe('');
  view.edit('hello');
  expect(view.changes).toHaveBeenLastCalledWith('value', 'hello');
  view.edit('');
  expect(view.changes).toHaveBeenLastCalledWith('value', undefined);
});
it('uses event values when an adapter cannot provide a live input', () => {
  const changes = vi.fn();
  const view = mountHook(() =>
    useMaskedInput(
      {
        data: '',
        config: {},
        uischema: { type: 'Control', scope: '#', options: { mask: '###' } },
        path: 'x',
        schema: {},
        handleChange: changes,
      },
      () => null,
      'defer',
    ),
  );
  cleanup = view.unmount;
  act(() =>
    view.current.onChange({
      currentTarget: { value: '12a' },
      nativeEvent: {},
    } as any),
  );
  expect(changes).toHaveBeenCalledWith('x', '12');
});
it('warns once for an invalid custom mask token pattern', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = mount({ mask: 'XX', tokens: { X: { pattern: '[' } } });
    view.edit('ab');
    expect(warn).toHaveBeenCalledOnce();
  } finally {
    warn.mockRestore();
  }
});
