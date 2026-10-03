import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

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
  const dialog = () =>
    document.querySelector(
      '.ant-modal-wrap:not([style*="display: none"]) .ant-modal'
    );
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
  const uischema = {
    type: 'Control',
    scope: '#/properties/labels',
    options: { confirmation: { delete: 'always' } },
  } as any;

  it('confirms when the policy is always', async () => {
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
      { ...uischema, options: {} },
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

  it('confirms deleting an empty string under always', async () => {
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
