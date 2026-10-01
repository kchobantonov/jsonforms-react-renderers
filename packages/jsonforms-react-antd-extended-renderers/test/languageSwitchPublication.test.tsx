import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ emit: undefined as any }));
vi.mock('@monaco-editor/react', () => ({
  default: function MockMonaco(props: any) {
    harness.emit = (m: unknown[]) => props.onValidate?.(m);
    // Like a real language service: re-validates whenever the language changes,
    // and only JavaScript is unhappy with this snippet.
    React.useEffect(() => {
      props.onValidate?.(
        props.language === 'javascript' ? [{ severity: 8 }] : []
      );
    }, [props.language, props.value]);
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
import { antdExtendedRenderers } from '../src';

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: 'Language',
      oneOf: [
        { const: 'json', title: 'JSON' },
        { const: 'javascript', title: 'JavaScript' },
        { const: 'markdown', title: 'Markdown' },
      ],
    },
    snippet: { type: 'string', title: 'Snippet' },
  },
} as any;

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/language' },
    {
      type: 'Control',
      scope: '#/properties/snippet',
      options: {
        format: 'code',
        ':language': 'language',
        propagateErrors: true,
      },
    },
  ],
} as any;

/*
  A regression, and the reason `ExtendedJsonForms` composes JSON Forms' own
  pieces instead of rendering `<JsonForms>`.

  Delivering published errors through the `additionalErrors` prop reverts the
  edit that provoked them. `JsonFormsStateProvider` lists that prop in an
  effect's dependencies and re-dispatches `updateCore(data, …)` with the prop
  data of that render, and a renderer publishes from its own effect - which
  runs *before* the parent's `onChange` has told the host about the edit. So
  the re-dispatch carries the previous data.

  It showed up as a language select that would not move: choosing JavaScript
  made the editor publish, and publishing put JSON back.
*/
describe('switching a language that makes the editor publish', () => {
  it('keeps every choice, rather than being undone by the publication', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latest: any = { language: 'json', snippet: '{}' };
    const Host = () => {
      const store = React.useRef(createAdditionalErrorStore()).current;
      const [data, setData] = useState(latest);
      return (
        <ConfigProvider theme={{ token: { motion: false } }}>
          <ExtendedJsonForms
            store={store}
            data={data}
            schema={schema}
            uischema={uischema}
            validationMode='ValidateAndShow'
            renderers={[
              ...antdRenderers,
              ...antdExtendedRenderers,
              {
                tester: monacoControlTester,
                renderer: AntdMonacoControlRenderer,
              },
            ]}
            cells={antdCells}
            onChange={({ data: next }) => {
              latest = next;
              setData(next);
            }}
          />
        </ConfigProvider>
      );
    };
    act(() => root.render(<Host />));
    await settle();

    const pick = async (label: string) => {
      const select = container.querySelector('.ant-select') as HTMLElement;
      await act(async () => {
        select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });
      await settle(150);
      const option = Array.from(
        document.querySelectorAll('.ant-select-item-option-content')
      ).find((n) => n.textContent === label);
      expect(option, `no option ${label}`).toBeTruthy();
      await act(async () => {
        (option as HTMLElement).dispatchEvent(
          new MouseEvent('click', { bubbles: true })
        );
      });
      await settle(150);
    };
    const shown = () =>
      container.querySelector('.ant-select-content')?.textContent;

    // The one that publishes. Before the fix this silently snapped back.
    await pick('JavaScript');
    await settle(150);
    expect(shown()).toBe('JavaScript');
    expect(latest.language).toBe('javascript');
    // ...and the summary is on screen, so the publication really happened.
    expect(container.textContent).toContain('1 error.');

    // Back to a language whose diagnostics are clean: the summary is
    // retracted, which is another store change, and that must not move it
    // either.
    await pick('JSON');
    await settle(150);
    expect(shown()).toBe('JSON');
    expect(latest.language).toBe('json');
    expect(container.textContent).not.toContain('1 error.');

    // And a language with no validator at all.
    await pick('Markdown');
    await settle(150);
    expect(shown()).toBe('Markdown');
    expect(latest.language).toBe('markdown');

    act(() => root.unmount());
  });
});
