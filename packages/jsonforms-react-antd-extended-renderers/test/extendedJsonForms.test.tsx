import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  emit: undefined as undefined | ((markers: unknown[]) => void),
  reset() {
    this.emit = undefined;
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    harness.emit = (markers: unknown[]) => props.onValidate?.(markers);
    return React.createElement('textarea', {
      'data-monaco': true,
      value: props.value ?? '',
      readOnly: true,
    });
  },
}));

import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  ExtendedJsonForms,
  HandleActionContext,
  NO_STORE_DIAGNOSTIC,
  createAdditionalErrorStore,
  monacoControlTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdMonacoControlRenderer } from '../src/renderers/AntdMonacoControlRenderer';
import { antdExtendedRenderers } from '../src';

/*
  What an application gets without reading any of this.

  The wrapper exists because the store needs two props that are only useful
  together, and a form that installs neither publishes into nothing. Both
  halves are covered: the wrapper working, and the bare form saying why it
  does not.
*/

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };

afterEach(() => {
  document.body.innerHTML = '';
  harness.reset();
  vi.restoreAllMocks();
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: { settings: { type: 'string', title: 'Settings' } },
} as any;

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/settings',
      options: { format: 'code', language: 'json', propagateErrors: true },
    },
  ],
} as any;

const renderers = [
  ...antdRenderers,
  ...antdExtendedRenderers,
  { tester: monacoControlTester, renderer: AntdMonacoControlRenderer },
];

const mount = (element: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    message: () =>
      container.querySelector('.ant-form-item-explain')?.textContent ?? '',
    unmount: () => act(() => root.unmount()),
  };
};

describe('ExtendedJsonForms', () => {
  it('needs no wiring for a renderer to publish', async () => {
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ExtendedJsonForms
          data={{ settings: '{}' }}
          schema={schema}
          uischema={uischema}
          validationMode='ValidateAndShow'
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();
    await act(async () => {
      harness.emit?.([{ severity: 8 }, { severity: 8 }]);
    });
    await settle();

    expect(view.message()).toContain('2 errors');
    view.unmount();
  });

  /* The application's own publisher, for the server case. */
  it('accepts a store the application publishes into', async () => {
    const store = createAdditionalErrorStore();
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ExtendedJsonForms
          store={store}
          data={{ settings: '{}' }}
          schema={schema}
          uischema={uischema}
          validationMode='ValidateAndShow'
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();

    await act(async () => {
      store.publish('server', [
        {
          instancePath: '/settings',
          schemaPath: '',
          keyword: 'server',
          message: 'Rejected upstream.',
          params: {},
        } as any,
      ]);
    });
    await settle();

    expect(view.message()).toContain('Rejected upstream.');
    view.unmount();
  });

  /* A host that already passes its own errors keeps them. */
  it('merges host-supplied additionalErrors', async () => {
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ExtendedJsonForms
          data={{ settings: '{}' }}
          schema={schema}
          uischema={uischema}
          additionalErrors={[
            {
              instancePath: '/settings',
              schemaPath: '',
              keyword: 'host',
              message: 'From the host.',
              params: {},
            } as any,
          ]}
          validationMode='ValidateAndShow'
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();
    await act(async () => {
      harness.emit?.([{ severity: 8 }]);
    });
    await settle();

    expect(view.message()).toContain('From the host.');
    expect(view.message()).toContain('1 error.');
    view.unmount();
  });
});

describe('a bare JsonForms with a publishing renderer', () => {
  /*
    The question an application asks: "I used my Monaco renderer and did not
    provide the middleware." It publishes into nothing - and must say so,
    because silence is indistinguishable from the option not working.
  */
  it('says what is missing instead of going quiet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{ settings: '{}' }}
          schema={schema}
          uischema={uischema}
          validationMode='ValidateAndShow'
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();
    await act(async () => {
      harness.emit?.([{ severity: 8 }]);
    });
    await settle();

    expect(view.message()).toBe('');
    const said = warn.mock.calls.map((call) => String(call[0])).join('\n');
    expect(said).toContain(NO_STORE_DIAGNOSTIC);
    // Names the way out, not just the problem.
    expect(said).toContain('ExtendedJsonForms');
    view.unmount();
  });

  /* And says nothing when the renderer had nothing to publish. */
  it('is silent when there is nothing to report', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{ settings: '{}' }}
          schema={schema}
          uischema={uischema}
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();
    expect(
      warn.mock.calls.map((call) => String(call[0])).join('\n')
    ).not.toContain(NO_STORE_DIAGNOSTIC);
  });
});

/*
  The action handler, wired the same way and with the same hazard: a wrapper
  that always provided the context would set it to `undefined` for a host
  whose provider sits further up, turning every Button into a no-op.
*/
describe('the action handler', () => {
  const buttonForm = {
    type: 'VerticalLayout',
    elements: [{ type: 'Button', label: 'Go', action: 'go' }],
  } as any;

  const press = (container: HTMLElement) => {
    const button = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button')
    ).find((candidate) => candidate.textContent?.includes('Go'));
    expect(button, 'no Go button').toBeTruthy();
    act(() => button!.click());
  };

  it('is provided by the wrapper', async () => {
    const seen: string[] = [];
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ExtendedJsonForms
          data={{}}
          schema={{ type: 'object', properties: {} } as any}
          uischema={buttonForm}
          onAction={(event) => {
            seen.push(event.action);
          }}
          renderers={renderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
    await settle();
    press((view as any).container ?? document.body);
    await settle();
    expect(seen).toEqual(['go']);
    view.unmount();
  });

  /*
    The hazard. A container provides the handler for several forms and the
    form itself passes none; the container's must survive.
  */
  it('does not shadow a handler provided further up', async () => {
    const seen: string[] = [];
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <HandleActionContext.Provider
          value={(event) => {
            seen.push(`outer:${event.action}`);
          }}
        >
          <ExtendedJsonForms
            data={{}}
            schema={{ type: 'object', properties: {} } as any}
            uischema={buttonForm}
            renderers={renderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </HandleActionContext.Provider>
      </ConfigProvider>
    );
    await settle();
    press(document.body);
    await settle();
    expect(seen).toEqual(['outer:go']);
    view.unmount();
  });

  /* And an explicit handler wins over one further up. */
  it('prefers its own over an enclosing one', async () => {
    const seen: string[] = [];
    const view = mount(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <HandleActionContext.Provider
          value={() => {
            seen.push('outer');
          }}
        >
          <ExtendedJsonForms
            data={{}}
            schema={{ type: 'object', properties: {} } as any}
            uischema={buttonForm}
            onAction={() => {
              seen.push('own');
            }}
            renderers={renderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </HandleActionContext.Provider>
      </ConfigProvider>
    );
    await settle();
    press(document.body);
    await settle();
    expect(seen).toEqual(['own']);
    view.unmount();
  });
});
