import React, { act } from 'react';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  ColumnResizeHandle,
  useColumnWidths,
} from '../../src/collections/columnResize';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (
  direction = 'ltr',
  definition: any = { field: 'name', width: 160, minWidth: 80, maxWidth: 220 },
) => {
  const resize = vi.fn();
  const start = vi.fn();
  const view = mountHook(() => useColumnWidths(), {
    render: () => (
      <table>
        <thead>
          <tr>
            <th data-column-key='name'>
              <ColumnResizeHandle
                field='name'
                definition={definition}
                onResize={resize}
                onResizeStart={start}
                colors={{ border: 'gray', active: 'red', focus: 'blue' }}
              />
            </th>
            <th />
            <th />
          </tr>
        </thead>
      </table>
    ),
  });
  cleanup = view.unmount;
  const handle = view.container.querySelector<HTMLElement>('[role=separator]')!;
  handle.style.direction = direction;
  handle.setPointerCapture = vi.fn();
  handle.hasPointerCapture = vi.fn(() => true);
  handle.releasePointerCapture = vi.fn();
  for (const cell of view.container.querySelectorAll('th'))
    cell.getBoundingClientRect = () => ({ width: 160 }) as DOMRect;
  const key = (key: string) =>
    act(() =>
      handle.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      ),
    );
  const pointer = (type: string, x: number, button = 0) =>
    act(() => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button,
        clientX: x,
      });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      handle.dispatchEvent(event);
    });
  return { view, handle, resize, start, key, pointer };
};
it.each(['ltr', 'rtl'])(
  'supports keyboard resize boundaries in %s',
  (direction) => {
    const view = mount(direction);
    view.key('ArrowRight');
    expect(view.resize).toHaveBeenLastCalledWith(
      direction === 'rtl' ? 150 : 170,
    );
    view.key('ArrowLeft');
    expect(view.resize).toHaveBeenLastCalledWith(
      direction === 'rtl' ? 170 : 150,
    );
    view.key('Home');
    expect(view.resize).toHaveBeenLastCalledWith(80);
    view.key('End');
    expect(view.resize).toHaveBeenLastCalledWith(220);
    const count = view.resize.mock.calls.length;
    view.key('Enter');
    expect(view.resize).toHaveBeenCalledTimes(count);
    expect(view.start).toHaveBeenCalledWith({ name: 160, __actions: 160 });
  },
);
it.each(['ltr', 'rtl'])(
  'resizes by pointer movement in %s and stops on release',
  (direction) => {
    const view = mount(direction);
    view.pointer('pointerdown', 10);
    view.pointer('pointermove', 40);
    expect(view.resize).toHaveBeenLastCalledWith(
      direction === 'rtl' ? 130 : 190,
    );
    view.pointer('pointerup', 40);
    expect(view.handle.releasePointerCapture).toHaveBeenCalledWith(1);
    const count = view.resize.mock.calls.length;
    view.pointer('pointermove', 100);
    expect(view.resize).toHaveBeenCalledTimes(count);
  },
);
it('ignores secondary buttons, cancels lost drags and clamps widths', () => {
  const view = mount();
  view.pointer('pointerdown', 0, 1);
  view.pointer('pointermove', 80);
  expect(view.resize).not.toHaveBeenCalled();
  view.pointer('pointerdown', 0);
  view.pointer('pointermove', 1000);
  expect(view.resize).toHaveBeenLastCalledWith(220);
  view.pointer('pointercancel', 1000);
  view.pointer('lostpointercapture', 1000);
  act(() => view.handle.focus());
  act(() => view.handle.blur());
  act(() => view.handle.click());
});
it('uses explicit and fallback widths when the table cannot be measured', () => {
  const view = mount('ltr', undefined);
  for (const cell of view.view.container.querySelectorAll('th'))
    cell.getBoundingClientRect = () => ({ width: 0 }) as DOMRect;
  view.key('ArrowRight');
  expect(view.resize).toHaveBeenLastCalledWith(170);
  act(() => view.view.current[1]({ name: 180 }));
  expect(view.view.current[0]).toEqual({ name: 180 });
});
