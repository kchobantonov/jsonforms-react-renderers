import { createTranslator } from '@jsonforms/core';
import React, { act } from 'react';
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  InputAdornments,
  normalizeInputAdornments,
  supportsInputAdornments,
} from '../../src/controls/inputAdornments';
beforeEach(() =>
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  ),
);
const mounted: { unmount(): void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((view) => view.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('input adornment validation and accessibility', () => {
  it.each([
    undefined,
    null,
    false,
    0,
    '',
    {},
    { kind: 'text', text: 0 },
    { kind: 'text', text: '' },
    { kind: 'icon', icon: 'lock' },
    { kind: 'icon', icon: '', label: 'Lock' },
    ['plain'],
  ])('ignores malformed adornment %j', (value) =>
    expect(normalizeInputAdornments(value)).toEqual([]),
  );
  it.each(['binary', 'byte'])('rejects binary format %s', (format) =>
    expect(supportsInputAdornments({ type: 'string', format }, {})).toBe(false),
  );
  it.each([undefined, 'boolean', 'object', 'array', 'null'])(
    'rejects non-input type %s',
    (type) => expect(supportsInputAdornments({ type }, {})).toBe(false),
  );
  it.each([
    { slider: true },
    { variant: 'otp' },
    { format: 'code' },
    { format: 'radio' },
    { showRadio: true },
  ])('rejects unsupported variant %j', (options) =>
    expect(supportsInputAdornments({ type: 'string' }, options)).toBe(false),
  );
  it('rejects base64 and permits numeric input variants', () => {
    expect(
      supportsInputAdornments(
        { type: 'string', contentEncoding: 'base64' },
        {},
      ),
    ).toBe(false);
    expect(supportsInputAdornments({ type: 'integer' }, {})).toBe(true);
    expect(supportsInputAdornments({ type: 'number' }, {})).toBe(true);
  });
  it('translates text, accessible icon labels and keyboard tooltips without modifying data', () => {
    const view = mountHook(() => null, {
      context: {
        i18n: {
          translate: createTranslator(
            (key, fallback) =>
              ({
                'prefix.text': 'Translated',
                'icon.label': 'Account',
                'icon.tooltip': 'Details',
              })[key] ?? fallback,
          ),
        },
      },
      render: () => (
        <InputAdornments
          schema={{ type: 'string' }}
          options={{
            startAdornment: [
              { kind: 'text', text: 'Text', i18n: 'prefix' },
              {
                kind: 'icon',
                icon: 'account',
                label: 'Person',
                tooltip: 'Help',
                i18n: 'icon',
              },
            ],
            endAdornment: [
              { kind: 'icon', icon: 'unknown', label: 'Fallback' },
              { kind: 'icon', icon: 'unknown', decorative: true },
            ],
          }}
        >
          <input defaultValue='unchanged' />
        </InputAdornments>
      ),
    });
    mounted.push(view);
    expect(view.container.textContent).toContain('Translated');
    expect(
      view.container.querySelector('[role=img]')?.getAttribute('aria-label'),
    ).toBe('Fallback');
    expect(
      view.container.querySelector('[aria-hidden=true][data-kind=icon]'),
    ).not.toBeNull();
    const button = view.container.querySelector('button')!;
    const tooltip =
      view.container.querySelector<HTMLElement>('[role=tooltip]')!;
    expect(button.getAttribute('aria-label')).toBe('Account');
    expect(tooltip.style.display).toBe('none');
    act(() => button.focus());
    expect(tooltip.style.display).toBe('block');
    act(() => button.blur());
    expect(tooltip.style.display).toBe('none');
    act(() =>
      button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })),
    );
    expect(tooltip.style.display).toBe('block');
    act(() =>
      button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })),
    );
    expect(tooltip.style.display).toBe('none');
    expect(view.container.querySelector('input')?.value).toBe('unchanged');
    expect(view.dispatch).not.toHaveBeenCalled();
  });
  it('renders text tooltips on either side and retains authored fallbacks without a translator', () => {
    const view = mountHook(() => null, {
      render: () => (
        <InputAdornments
          schema={{ type: 'string' }}
          options={{
            endAdornment: {
              kind: 'text',
              text: 'Suffix',
              tooltip: 'Explanation',
              i18n: 'missing',
            },
          }}
        >
          <span>No native field</span>
        </InputAdornments>
      ),
    });
    mounted.push(view);
    expect(view.container.querySelector('button')?.textContent).toBe(
      'SuffixExplanation',
    );
    expect(
      view.container.querySelector<HTMLElement>('[role=tooltip]')?.style
        .insetInlineEnd,
    ).toBe('0');
  });
  it('measures both sides, shifts absolute actions, and restores native styles on cleanup', () => {
    const width = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.adornmentGroup === 'start'
          ? 20
          : this.dataset.adornmentGroup === 'end'
            ? 30
            : 0;
      });
    let resize!: () => void;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    let show = true;
    const view = mountHook(() => null, {
      render: () => (
        <InputAdornments
          schema={{ type: 'string' }}
          options={show ? { startAdornment: '$', endAdornment: 'USD' } : {}}
        >
          <div>
            <input
              style={{
                paddingInlineStart: '4px',
                paddingInlineEnd: '6px',
                transition: 'all 1s',
              }}
            />
            <button
              className='start-action'
              style={{ position: 'absolute', insetInlineStart: '2px' }}
            >
              Start
            </button>
            <button
              className='end-action'
              style={{ position: 'absolute', insetInlineEnd: '3px' }}
            >
              End
            </button>
            <div style={{ position: 'absolute' }}>Other</div>
          </div>
        </InputAdornments>
      ),
    });
    mounted.push(view);
    const input = view.container.querySelector('input')!;
    const start = view.container.querySelector<HTMLElement>('.start-action')!;
    const end = view.container.querySelector<HTMLElement>('.end-action')!;
    expect(input.style.paddingInlineStart).toBe('32px');
    expect(input.style.paddingInlineEnd).toBe('44px');
    expect(start.style.insetInlineStart).toBe('30px');
    expect(end.style.insetInlineEnd).toBe('41px');
    act(resize);
    expect(width).toHaveBeenCalled();
    show = false;
    view.rerender();
    expect(disconnect).toHaveBeenCalled();
    expect(input.style.paddingInlineStart).toBe('4px');
    expect(start.style.insetInlineStart).toBe('2px');
  });
});
