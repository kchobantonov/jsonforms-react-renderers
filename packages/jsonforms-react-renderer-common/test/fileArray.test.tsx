import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { FileArrayInput, fileArrayTester } from '../src/FileArrayInput';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (restrict: boolean, initial: string[] = ['old'], extra = {}, inputProps = {}) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let current = initial;
  const schema = {
    type: 'array',
    minItems: 1,
    maxItems: 2,
    items: { type: 'string', contentEncoding: 'base64' },
    ...extra,
  };
  const Harness = () => {
    const [data, setData] = useState(initial);
    current = data;
    return (
      <FileArrayInput
        {...({
          schema,
          rootSchema: schema,
          data,
          path: 'files',
          id: 'files',
          visible: true,
          enabled: true,
          config: {},
          uischema: { type: 'Control', scope: '#', options: { restrict } },
          errors: '',
          handleChange: (_: string, value: string[]) => setData(value),
          ...inputProps,
        } as any)}
      />
    );
  };
  act(() => root.render(<Harness />));
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  return {
    container,
    data: () => current,
    select: async (names: string[]) => {
      const input = container.querySelector('input')!;
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: names.map(
          (name) => new File([name], name, { type: 'text/plain' })
        ),
      });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    },
  };
};
it('reports rejected cell selections locally without marking stored data invalid', async () => {
  const Feedback = ({ message, severity, cell }: any) => (
    <button data-feedback={severity} data-cell={String(cell)} aria-label={message} />
  );
  const view = mount(true, ['old'], {}, { cell: true, FeedbackComponent: Feedback });
  await view.select(['one.txt', 'two.txt']);
  expect(view.data()).toEqual(['old']);
  expect(view.container.querySelector('input')?.getAttribute('aria-invalid')).toBe('false');
  const feedback = view.container.querySelector('[data-feedback="warning"]');
  expect(feedback?.getAttribute('data-cell')).toBe('true');
  expect(feedback?.getAttribute('aria-label')).toContain('existing files were kept');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
it('selects file arrays including referenced items without claiming ordinary arrays', () => {
  const schema = {
    type: 'array',
    items: { $ref: '#/definitions/file' },
    definitions: { file: { type: 'string', format: 'binary' } },
  } as any;
  expect(
    fileArrayTester({ type: 'Control', scope: '#' } as any, schema, {
      rootSchema: schema,
    } as any)
  ).toBe(7);
  const ordinary = { type: 'array', items: { type: 'string' } } as any;
  expect(
    fileArrayTester({ type: 'Control', scope: '#' } as any, ordinary, {
      rootSchema: ordinary,
    } as any)
  ).toBe(-1);
});
it('blocks additions above maxItems and removal below minItems when restricted', async () => {
  const c = mount(true);
  expect(c.container.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')!.disabled).toBe(true);
  await c.select(['a', 'b']);
  expect(c.data()).toEqual(['old']);
  expect(c.container.querySelector('[role=alert]')!.textContent).toContain('2');
});
it('appends a batch in order and permits count violations when unrestricted', async () => {
  const c = mount(false);
  await c.select(['a', 'b']);
  expect(c.data()).toEqual(['old', 'YQ==', 'Yg==']);
  for (let i = 0; i < 3; i++)
    act(() => c.container.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')!.click());
  expect(c.data()).toEqual([]);
});
it('appends within maxItems and removes only one duplicate occurrence', async () => {
  const c = mount(true, [], { minItems: 0, maxItems: 3 });
  await c.select(['a', 'b', 'a']);
  expect(c.data()).toEqual(['YQ==', 'Yg==', 'YQ==']);
  act(() => c.container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Remove "]')[2].click());
  expect(c.data()).toEqual(['YQ==', 'Yg==']);
});
it('honors uniqueItems when appending encoded files', async () => {
  const c = mount(true, ['YQ=='], { uniqueItems: true });
  await c.select(['a', 'b']);
  expect(c.data()).toEqual(['YQ==', 'Yg==']);
});

it('opens the real file input when Select File is clicked', () => {
  const c = mount(false);
  const input = c.container.querySelector('input')!;
  const click = vi.spyOn(input, 'click').mockImplementation(() => {});
  act(() => c.container.querySelector('button')!.click());
  expect(click).toHaveBeenCalledOnce();
});
it('clears all files when unrestricted and blocks clear-all below minItems', () => {
  let c = mount(false, ['a', 'b']);
  act(() => (c.container.querySelector('[aria-label="Clear all files"]') as HTMLButtonElement).click());
  expect(c.data()).toEqual([]);
  cleanup();
  c = mount(true, ['a', 'b']);
  expect((c.container.querySelector('[aria-label="Clear all files"]') as HTMLButtonElement).disabled).toBe(true);
});

it('places clear-all last and reveals it on hover or focus within the field', () => {
  const c = mount(false, ['a']);
  const clear = c.container.querySelector('[aria-label="Clear all files"]') as HTMLButtonElement;
  expect(clear.parentElement!.lastElementChild).toBe(clear);
  expect(clear.style.opacity).toBe('0');
  act(() => c.container.querySelector('button')!.focus());
  expect(clear.style.opacity).toBe('1');
  act(() => c.container.querySelector('button')!.blur());
  expect(clear.style.opacity).toBe('0');
  act(() => clear.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  expect(clear.style.opacity).toBe('1');
});
