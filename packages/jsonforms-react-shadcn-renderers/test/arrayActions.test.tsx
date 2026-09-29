import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';

describe('array action contract', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const render = (options: any = {}, extra: any = {}) => {
    const onChange = vi.fn();
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          }}
          data={['Ada']}
          uischema={{ type: 'Control', scope: '#', options }}
          renderers={shadcnRenderers}
          onChange={onChange}
          {...extra}
        />
      )
    );
    return onChange;
  };
  const button = (name: string) =>
    Array.from(document.querySelectorAll('button')).find(
      (button) =>
        (button.getAttribute('aria-label') ?? button.textContent) === name
    )!;
  it('uses named icon buttons with tooltips for array actions', () => {
    render();
    for (const name of ['Add', 'Remove']) {
      expect(button(name).querySelector('svg')).toBeTruthy();
      expect(button(name).textContent).toBe('');
      expect(button(name).getAttribute('title')).toBe(name + ' item');
    }
  });
  it.each(['disableAdd', 'disableRemove'])('honors %s', (option) => {
    render({ [option]: true });
    expect(button(option === 'disableAdd' ? 'Add' : 'Remove').disabled).toBe(
      true
    );
  });
  it('enforces min/max when restrict is enabled', () => {
    render({ restrict: true });
    expect(button('Add').disabled).toBe(true);
    expect(button('Remove').disabled).toBe(true);
  });
  it('allows changes past validation limits without restrict', () => {
    render();
    expect(button('Add').disabled).toBe(false);
    expect(button('Remove').disabled).toBe(false);
  });
  it('prevents readonly mutations', () => {
    render({}, { readonly: true });
    expect(button('Add').disabled).toBe(true);
    expect(button('Remove').disabled).toBe(true);
  });
  it('cancels a confirmed delete without changing data', () => {
    const onChange = render();
    onChange.mockClear();
    act(() => button('Remove').click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => button('Cancel').click());
    expect(onChange).not.toHaveBeenCalled();
  });
  it('commits a confirmed delete', async () => {
    const onChange = render();
    act(() => button('Remove').click());
    act(() => button('Delete').click());
    await vi.waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: [] })
      )
    );
  });
  it('supports the never confirmation policy', async () => {
    const onChange = render({ confirmation: { delete: 'never' } });
    act(() => button('Remove').click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await vi.waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: [] })
      )
    );
  });
});
