import { JsonFormsStateProvider } from '@jsonforms/react';

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useDetailDialog } from '../src/detailDialog';

it('uses measured viewport edges, including negative offsets, and remeasures after resizing', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let geometry: ReturnType<typeof useDetailDialog>;
  let rect = { left: 300, top: 100, width: 400, height: 300 };
  const surface = { getBoundingClientRect: () => rect } as HTMLElement;
  const Probe = () => {
    geometry = useDetailDialog(true, { draggable: true }, () => surface);
    return null;
  };
  act(() => root.render(<Probe />));
  const down = () =>
    geometry.dragProps.onPointerDown({
      button: 0,
      target: host,
      currentTarget: { setPointerCapture() {} },
      preventDefault() {},
      clientX: 350,
      clientY: 120,
      pointerId: 1,
    } as any);
  const move = (clientX: number, clientY: number) => {
    act(() => {
      geometry.dragProps.onPointerMove({ clientX, clientY } as any);
      geometry.dragProps.onPointerUp();
    });
  };
  try {
    down();
    move(-1000, -1000);
    expect(geometry.offset).toEqual({ x: -300, y: -100 });
    rect = { left: 0, top: 0, width: 500, height: 400 };
    down();
    move(10000, 10000);
    expect(geometry.offset).toEqual({
      x: window.innerWidth - 500 - 300,
      y: window.innerHeight - 400 - 100,
    });
  } finally {
    act(() => root.unmount());
  }
});

it('inherits form dialog settings and lets local false override them', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let geometry: ReturnType<typeof useDetailDialog>;
  const Probe = () => {
    geometry = useDetailDialog(true, { draggable: false });
    return null;
  };
  act(() =>
    root.render(
      <JsonFormsStateProvider
        initState={{
          core: {
            data: {},
            schema: {},
            uischema: { type: 'VerticalLayout', elements: [] },
            errors: [],
          } as any,
          config: {
            jsonformsExtended: {
              dialog: {
                draggable: true,
                resizable: true,
                maximizable: false,
                height: '75vh',
              },
            },
          },
        }}
      >
        <Probe />
      </JsonFormsStateProvider>
    )
  );
  try {
    expect(geometry.options.draggable).toBe(false);
    expect(geometry.options.maximizable).toBe(false);
    expect(geometry.style.resize).toBe('both');
    expect(geometry.style.height).toBe('75vh');
  } finally {
    act(() => root.unmount());
  }
});
