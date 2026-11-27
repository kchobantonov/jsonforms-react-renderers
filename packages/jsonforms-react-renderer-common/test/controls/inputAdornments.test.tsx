import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it } from 'vite-plus/test';
import { InputAdornments } from '../../src/controls/inputAdornments';

const originalResizeObserver = globalThis.ResizeObserver;
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetWidth',
);

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  if (originalOffsetWidth)
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth,
    );
});

it('reserves end-adornment space on the visible select trigger', () => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as typeof ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return (this as HTMLElement).dataset.adornmentGroup === 'end' ? 20 : 0;
    },
  });
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <InputAdornments
          schema={{ type: 'string' }}
          options={{ endAdornment: 'suffix' }}
        >
          <div>
            <select aria-hidden='true' />
            <button
              type='button'
              data-slot='select-trigger'
              style={{ paddingInlineEnd: '10px' }}
            >
              Choose
            </button>
          </div>
        </InputAdornments>,
      ),
    );
    expect(container.querySelector('button')?.style.paddingInlineEnd).toBe(
      '38px',
    );
    expect(container.querySelector('select')?.style.paddingInlineEnd).toBe('');
  } finally {
    act(() => root.unmount());
  }
});
