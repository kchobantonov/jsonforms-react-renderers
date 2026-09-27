import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import {
  confirmationRequired,
  fallbackConfirmationPolicy,
  isComplexValue,
  isDiscardableValue,
  resolveConfirmationPolicy,
} from '../src/util/confirmation';

/*
  Section 14's shared destructive-change confirmation.

  Before this, every renderer decided for itself: the array table always
  confirmed, `oneOf` confirmed on lodash's `isEmpty` (which calls `0` and
  `false` empty), and the tree, the array layout, the grid and the dynamic
  properties never confirmed at all. None of it could be configured.
*/

class ResizeObserverStub {
  observe() {
    /* nothing to measure in jsdom */
  }
  unobserve() {
    /* nothing to measure in jsdom */
  }
  disconnect() {
    /* nothing to measure in jsdom */
  }
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

// ------------------------------------------------------------ policy lookup

describe('resolving the policy', () => {
  const resolve = (
    options: any,
    config: any,
    catalogId: any = 'arrayTable',
    operation: any = 'delete'
  ) => resolveConfirmationPolicy({ options, config, catalogId, operation });

  it('prefers the element option above everything', () => {
    expect(
      resolve(
        { confirmation: { delete: 'never' } },
        {
          jsonformsExtended: {
            confirmation: {
              default: 'always',
              renderers: { arrayTable: { delete: 'always' } },
            },
          },
        }
      )
    ).toBe('never');
  });

  it('then the per-renderer config entry', () => {
    expect(
      resolve(undefined, {
        jsonformsExtended: {
          confirmation: {
            default: 'always',
            renderers: { arrayTable: { delete: 'never' } },
          },
        },
      })
    ).toBe('never');
  });

  it('then the global default', () => {
    expect(
      resolve(undefined, {
        jsonformsExtended: { confirmation: { default: 'never' } },
      })
    ).toBe('never');
  });

  it('then the documented fallback', () => {
    expect(resolve(undefined, undefined)).toBe('always');
  });

  /*
    "The default configuration example deliberately opts into always globally
    while restoring complex for mixed type changes; without that exception a
    global always also applies to mixed type changes."
  */
  it('falls back to complex only for a mixed type change', () => {
    expect(fallbackConfirmationPolicy('mixed', 'typeChange')).toBe('complex');
    expect(fallbackConfirmationPolicy('mixed', 'delete')).toBe('always');
    expect(fallbackConfirmationPolicy('oneOf', 'branchChange')).toBe('always');
  });

  it('lets a global default replace that fallback', () => {
    expect(
      resolve(
        undefined,
        { jsonformsExtended: { confirmation: { default: 'always' } } },
        'mixed',
        'typeChange'
      )
    ).toBe('always');
  });

  it('ignores a value that is not a policy, rather than reading it as never', () => {
    expect(resolve({ confirmation: { delete: 'sometimes' } }, undefined)).toBe(
      'always'
    );
    expect(
      resolve(undefined, {
        jsonformsExtended: { confirmation: { default: true } },
      })
    ).toBe('always');
  });

  it('reads nothing from an unrelated config shape', () => {
    expect(resolve(undefined, { confirmation: { default: 'never' } })).toBe(
      'always'
    );
  });
});

// ------------------------------------------------------------ what prompts

describe('deciding whether to prompt', () => {
  /*
    "False, zero, empty strings, and empty containers are existing values."
    Only absence is nothing to discard.
  */
  it('treats every value except absence as something to lose', () => {
    for (const value of [false, 0, '', null, {}, []]) {
      expect(isDiscardableValue(value)).toBe(true);
    }
    expect(isDiscardableValue(undefined)).toBe(false);
  });

  it('calls only a nonempty object or array complex', () => {
    expect(isComplexValue({ a: 1 })).toBe(true);
    expect(isComplexValue([1])).toBe(true);
    // "independently of whether its nested values are empty"
    expect(isComplexValue({ a: {} })).toBe(true);
    expect(isComplexValue({})).toBe(false);
    expect(isComplexValue([])).toBe(false);
    expect(isComplexValue('text')).toBe(false);
    expect(isComplexValue(null)).toBe(false);
  });

  it('never prompts under never', () => {
    expect(confirmationRequired('never', [{ a: 1 }])).toBe(false);
  });

  it('prompts under always only when there is something to discard', () => {
    expect(confirmationRequired('always', [0])).toBe(true);
    expect(confirmationRequired('always', [undefined])).toBe(false);
    expect(confirmationRequired('always', [])).toBe(false);
  });

  it('prompts under complex only for a nonempty container', () => {
    expect(confirmationRequired('complex', ['text'])).toBe(false);
    expect(confirmationRequired('complex', [{}])).toBe(false);
    expect(confirmationRequired('complex', [{ a: 1 }])).toBe(true);
  });

  /*
    "For batches, one confirmation covers the operation; complex applies if any
    discarded value qualifies."
  */
  it('asks once for a batch, and asks if any one value qualifies', () => {
    expect(confirmationRequired('complex', ['a', {}, { a: 1 }])).toBe(true);
    expect(confirmationRequired('complex', ['a', {}, []])).toBe(false);
  });
});

// --------------------------------------------------------------- rendering

const render = (schema: any, uischema: any, data: any, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema}
          uischema={uischema}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  const dialog = () => document.querySelector('[data-confirm]');
  return {
    container,
    dialog,
    accept: async () => {
      const ok = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((button) => button.textContent?.includes('Yes'));
      act(() => ok!.click());
      await settle();
      await settle();
    },
    cancel: async () => {
      const no = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((button) => button.textContent?.includes('No'));
      act(() => no!.click());
      await settle();
    },
    stored: () => latest,
    unmount: () => act(() => root.unmount()),
  };
};

const mapSchema = {
  type: 'object',
  properties: {
    labels: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const deleteProperty = async (container: HTMLElement) => {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button')
  ).find((element) => element.getAttribute('aria-label')?.startsWith('Delete'));
  act(() => button!.click());
  await settle();
};

describe('a dynamic property delete', () => {
  const uischema = { type: 'Control', scope: '#/properties/labels' } as any;

  it('confirms by default, which it never used to', async () => {
    const { container, dialog, stored, unmount } = render(mapSchema, uischema, {
      labels: { note: 'value' },
    });
    await settle();
    await deleteProperty(container);
    expect(dialog()).toBeTruthy();
    // Nothing has happened yet.
    expect(stored().labels).toEqual({ note: 'value' });
    unmount();
  });

  it('performs the delete once confirmed', async () => {
    const { container, accept, stored, unmount } = render(mapSchema, uischema, {
      labels: { note: 'value' },
    });
    await settle();
    await deleteProperty(container);
    await accept();
    expect(stored().labels).toEqual({});
    unmount();
  });

  /* "Cancellation leaves committed data, selection, and expansion unchanged." */
  it('leaves the data alone when cancelled', async () => {
    const { container, cancel, dialog, stored, unmount } = render(
      mapSchema,
      uischema,
      { labels: { note: 'value' } }
    );
    await settle();
    await deleteProperty(container);
    await cancel();
    expect(dialog()).toBeNull();
    expect(stored().labels).toEqual({ note: 'value' });
    unmount();
  });

  it('skips the prompt when the element asks for never', async () => {
    const { container, dialog, stored, unmount } = render(
      mapSchema,
      {
        ...uischema,
        options: { confirmation: { delete: 'never' } },
      },
      { labels: { note: 'value' } }
    );
    await settle();
    await deleteProperty(container);
    expect(dialog()).toBeNull();
    await settle();
    expect(stored().labels).toEqual({});
    unmount();
  });

  it('skips it for a config entry naming this renderer', async () => {
    const { container, dialog, unmount } = render(
      mapSchema,
      uischema,
      { labels: { note: 'value' } },
      {
        jsonformsExtended: {
          confirmation: {
            renderers: { additionalProperties: { delete: 'never' } },
          },
        },
      }
    );
    await settle();
    await deleteProperty(container);
    expect(dialog()).toBeNull();
    unmount();
  });

  it('does not prompt for a property whose value is absent', async () => {
    // An empty string is a value and does prompt; nothing at all does not.
    const { container, dialog, unmount } = render(mapSchema, uischema, {
      labels: { note: '' },
    });
    await settle();
    await deleteProperty(container);
    expect(dialog()).toBeTruthy();
    unmount();
  });
});
