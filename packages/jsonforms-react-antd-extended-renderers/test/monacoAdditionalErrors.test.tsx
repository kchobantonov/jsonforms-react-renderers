import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The Monaco editor's published summary error, end to end.
 *
 * Monaco does not run in jsdom, so `@monaco-editor/react` is replaced by a
 * stub that hands the renderer's `onValidate` whatever markers a test wants.
 * That is the only thing being faked: everything after it - the option
 * resolution, the one-per-instance rule, the publication channel, the host
 * feeding `additionalErrors` back, and JSON Forms routing it to the control -
 * is the real code.
 */
const harness = vi.hoisted(() => ({
  change: undefined as undefined | ((text: string) => void),
  emit: undefined as undefined | ((markers: unknown[]) => void),
  reset() {
    this.emit = undefined;
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    harness.change = props.onChange;
    harness.emit = (markers: unknown[]) => props.onValidate?.(markers);
    return React.createElement('textarea', {
      'data-monaco': true,
      value: props.value ?? '',
      readOnly: true,
    });
  },
}));

import { ConfigProvider } from 'antd';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  ExtendedJsonForms,
  createAdditionalErrorStore,
  monacoControlTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdMonacoControlRenderer } from '../src/renderers/AntdMonacoControlRenderer';

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
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const ERROR = 8;
const WARNING = 4;

const schema = {
  type: 'object',
  properties: {
    settings: { type: 'string', title: 'Settings' },
    other: { type: 'string', title: 'Other' },
  },
} as any;

const editorElement = (options: Record<string, unknown>) => ({
  type: 'Control',
  scope: '#/properties/settings',
  options: { format: 'code', language: 'json', ...options },
});

/**
 * A host that does what the contract asks of it: keeps its own errors, takes
 * what renderers publish, and hands the combination to `<JsonForms>`.
 */
const draw = (options: Record<string, unknown> = {}, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let setElementOptions: (next: Record<string, unknown>) => void = () =>
    undefined;

  const Host = () => {
    const [elementOptions, setOptions] = useState(options);
    setElementOptions = setOptions;
    const store = React.useRef(createAdditionalErrorStore()).current;
    return (
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ExtendedJsonForms
          store={store}
          data={{ settings: '{}', other: '' }}
          schema={schema}
          uischema={
            {
              type: 'VerticalLayout',
              elements: [editorElement(elementOptions)],
            } as any
          }
          config={config}
          validationMode='ValidateAndShow'
          renderers={[
            ...antdRenderers,
            {
              tester: monacoControlTester,
              renderer: AntdMonacoControlRenderer,
            },
          ]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    );
  };

  act(() => root.render(<Host />));

  /** The message antd shows under the editor. */
  const message = () =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-form-item'))
      .find((item) =>
        item.querySelector('label')?.textContent?.includes('Settings')
      )
      ?.querySelector('.ant-form-item-explain')?.textContent ?? '';

  return {
    container,
    message,
    markers: async (markers: unknown[]) => {
      await act(async () => {
        harness.emit?.(markers);
      });
      await settle();
    },
    setOptions: async (next: Record<string, unknown>) => {
      await act(async () => {
        setElementOptions(next);
      });
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('with propagateErrors off, which is the default here', () => {
  /*
    The portable contract defaults this to true. This renderer set defaults it
    to false on purpose - see adjustment 31 - so a language-service diagnostic
    cannot block a form the host never opted in to that for.
  */
  it('reports nothing, however many errors the code has', async () => {
    const view = draw();
    await settle();
    await view.markers([{ severity: ERROR }, { severity: ERROR }]);
    expect(view.message()).toBe('');
    view.unmount();
  });
});

describe('with propagateErrors on', () => {
  it('shows one summary under the editor, like a schema error', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers([{ severity: ERROR }, { severity: ERROR }]);
    expect(view.message()).toContain('2 errors');
    view.unmount();
  });

  /* "At most one summary additionalError per editor instance." */
  it('publishes one error however many markers there are', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers(Array.from({ length: 12 }, () => ({ severity: ERROR })));
    const explains = view.container.querySelectorAll('.ant-form-item-explain');
    expect(explains).toHaveLength(1);
    expect(view.message()).toContain('12 errors');
    view.unmount();
  });

  it('says one error, not 1 errors', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers([{ severity: ERROR }]);
    expect(view.message()).toContain('1 error.');
    view.unmount();
  });

  /* The clearing half: the same summary is retracted, not left behind. */
  it('clears the summary when the code stops having errors', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers([{ severity: ERROR }]);
    expect(view.message()).not.toBe('');

    await view.markers([]);
    expect(view.message()).toBe('');
    view.unmount();
  });

  /*
    "Warnings, informational messages, and hints stay inside Monaco; they do
    not contribute to the summary count or block form validity."
  */
  it('ignores warnings and hints', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers([
      { severity: WARNING },
      { severity: 2 },
      { severity: 1 },
    ]);
    expect(view.message()).toBe('');
    view.unmount();
  });
});

describe('resolving the option', () => {
  it('is turned on form-wide by the namespaced config', async () => {
    const view = draw({}, { jsonformsExtended: { propagateErrors: true } });
    await settle();
    await view.markers([{ severity: ERROR }]);
    expect(view.message()).toContain('1 error.');
    view.unmount();
  });

  it('lets one element opt out of a form-wide setting', async () => {
    const view = draw(
      { propagateErrors: false },
      { jsonformsExtended: { propagateErrors: true } }
    );
    await settle();
    await view.markers([{ severity: ERROR }]);
    expect(view.message()).toBe('');
    view.unmount();
  });

  /*
    "Changing the effective option to false clears only this editor's
    published summary … changing it back republishes current diagnostics …
    without requiring a data edit."
  */
  it('retracts and republishes when the option is switched, with no edit', async () => {
    const view = draw({ propagateErrors: true });
    await settle();
    await view.markers([{ severity: ERROR }, { severity: ERROR }]);
    expect(view.message()).toContain('2 errors');

    await view.setOptions({ propagateErrors: false });
    expect(view.message()).toBe('');

    await view.setOptions({ propagateErrors: true });
    expect(view.message()).toContain('2 errors');
    view.unmount();
  });
});

/*
  The worked example's own fixture, so the README's claims are checked rather
  than asserted. The `reported` editor opts in, the `quiet` one does not, and
  the fixture ships broken JSON in both.
*/
describe('the additional-errors example fixture', () => {
  it('opts one editor in and leaves the other at the default', async () => {
    const exampleUischema = (
      await import(
        '@chobantonov/jsonforms-extended-spec/examples/additional-errors/uischema.json'
      )
    ).default as any;

    const editors: any[] = [];
    const walk = (element: any) => {
      if (element?.options?.format === 'code') editors.push(element);
      (element?.elements ?? []).forEach(walk);
    };
    walk(exampleUischema);

    expect(editors.length).toBeGreaterThanOrEqual(3);
    const reported = editors.filter((e) => e.options.propagateErrors === true);
    const quiet = editors.filter(
      (e) => e.options.propagateErrors === undefined
    );
    expect(reported.length).toBeGreaterThanOrEqual(2);
    expect(quiet).toHaveLength(1);
  });

  /*
    The fixture has to actually contain broken code, or the example
    demonstrates nothing. Checked by parsing it, not by eye.
  */
  it('ships JSON that really is invalid in both editors', async () => {
    const exampleData = (
      await import(
        '@chobantonov/jsonforms-extended-spec/examples/additional-errors/data.json'
      )
    ).default as any;

    expect(() => JSON.parse(exampleData.policy)).toThrow();
    expect(() => JSON.parse(exampleData.quiet)).toThrow();
    // And the language tab's snippet is valid, so switching language is the
    // only thing that changes there.
    expect(() => JSON.parse(exampleData.snippet)).not.toThrow();
  });

  /* The example's config must not turn propagation on form-wide. */
  it('leaves the form-wide default alone', async () => {
    const exampleConfig = (
      await import(
        '@chobantonov/jsonforms-extended-spec/examples/additional-errors/config.json'
      )
    ).default as any;
    expect(exampleConfig.propagateErrors).toBeUndefined();
    expect(exampleConfig.jsonformsExtended?.propagateErrors).toBeUndefined();
  });
});

/*
  The question a host asks before adopting any of this: a submit fails, the
  server marks the same field the editor is on, and then the editor goes
  quiet. Does the server's error survive?

  It is asserted through a real form rather than against the store, because
  the answer depends on the middleware's merge as much as on the registry.
*/
describe('a server error and an editor error on one field', () => {
  const drawBoth = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let store: any;

    const Host = () => {
      store = React.useRef(createAdditionalErrorStore()).current;
      const [data, setData] = React.useState({ settings: '{}', other: '' });
      return (
        <ConfigProvider theme={{ token: { motion: false } }}>
          <ExtendedJsonForms
            store={store}
            data={data}
            schema={schema}
            uischema={
              {
                type: 'VerticalLayout',
                elements: [editorElement({ propagateErrors: true })],
              } as any
            }
            validationMode='ValidateAndShow'
            renderers={[
              ...antdRenderers,
              {
                tester: monacoControlTester,
                renderer: AntdMonacoControlRenderer,
              },
            ]}
            cells={antdCells}
            onChange={({ data: next }) => setData(next)}
          />
        </ConfigProvider>
      );
    };

    act(() => root.render(<Host />));
    const messages = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('.ant-form-item-explain')
      )
        .map((node) => node.textContent ?? '')
        .join(' | ');
    return {
      messages,
      publishServer: async () => {
        await act(async () => {
          store.publish('server', [
            {
              instancePath: '/settings',
              schemaPath: '',
              keyword: 'server',
              message: 'The server rejected this policy.',
              params: {},
            },
          ]);
        });
        await settle();
      },
      clearServer: async () => {
        await act(async () => {
          store.clear('server');
        });
        await settle();
      },
      markers: async (markers: unknown[]) => {
        await act(async () => {
          harness.emit?.(markers);
        });
        await settle();
      },
      unmount: () => act(() => root.unmount()),
    };
  };

  it('shows both, and the editor clearing leaves the server s alone', async () => {
    const view = drawBoth();
    await settle();

    await view.markers([{ severity: ERROR }]);
    await view.publishServer();
    expect(view.messages()).toContain('The server rejected this policy.');
    expect(view.messages()).toContain('1 error.');

    // The language service is happy again.
    await view.markers([]);
    expect(view.messages()).not.toContain('1 error.');
    expect(view.messages()).toContain('The server rejected this policy.');
    view.unmount();
  });

  /*
    And the other way round: the editor's summary is not swept away by the
    clear-on-change rule that retires the server's error, because it opted
    out of that rule.
  */
  it('keeps the editor s summary when the server s error is cleared', async () => {
    const view = drawBoth();
    await settle();
    await view.markers([{ severity: ERROR }]);
    await view.publishServer();
    expect(view.messages()).toContain('The server rejected this policy.');

    await view.clearServer();
    expect(view.messages()).not.toContain('The server rejected this policy.');
    expect(view.messages()).toContain('1 error.');
    view.unmount();
  });
});

it('keeps malformed JSON drafts and publishes only syntax errors in schema-aware mode', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const store = createAdditionalErrorStore();
  let latest: any;
  try {
    act(() =>
      root.render(
        <ExtendedJsonForms
          store={store}
          schema={
            {
              type: 'object',
              properties: {
                value: {
                  type: ['object', 'string'],
                  properties: { name: { type: 'string' } },
                },
              },
            } as any
          }
          data={{ value: { name: 'Ada' } }}
          uischema={{
            type: 'Control',
            scope: '#/properties/value',
            options: {
              format: 'code',
              language: 'json',
              convertJson: true,
              validateJsonSchema: true,
              propagateErrors: true,
            },
          }}
          renderers={[
            ...antdRenderers,
            {
              tester: monacoControlTester,
              renderer: AntdMonacoControlRenderer,
            },
          ]}
          cells={antdCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />
      )
    );
    await settle(100);
    await act(async () => harness.change?.('{'));
    await settle();
    expect(latest.value).toEqual({ name: 'Ada' });
    expect(store.all()).toHaveLength(1);
    expect(
      (container.querySelector('[data-monaco]') as HTMLTextAreaElement).value
    ).toBe('{');
    await act(async () => harness.change?.('{"name":42}'));
    await settle();
    expect(latest.value).toEqual({ name: 42 });
    expect(store.all()).toHaveLength(0);
    await act(async () =>
      harness.emit?.([{ severity: 8, message: 'Schema mismatch' }])
    );
    await settle();
    expect(store.all()).toHaveLength(0);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
