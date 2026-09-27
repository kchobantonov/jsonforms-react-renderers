import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdMonacoControlRenderer } from '../src/renderers/AntdMonacoControlRenderer';
import { flushUntil } from './support/flush';

const spy = vi.hoisted(() => ({ language: undefined as string | undefined }));

vi.mock('@monaco-editor/react', () => {
  const monaco = { editor: { defineTheme: () => {}, setTheme: () => {} } };
  const editor = { focus() {}, layout() {}, getAction: () => undefined };
  return {
    default: (props: any) => {
      spy.language = props.language;
      props.beforeMount?.(monaco);
      React.useEffect(() => {
        const timer = setTimeout(() => props.onMount?.(editor, monaco), 0);
        return () => clearTimeout(timer);
      }, []);
      return React.createElement('div');
    },
  };
});

const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      oneOf: [
        { const: 'javascript', title: 'JavaScript' },
        { const: 'json', title: 'JSON' },
      ],
    },
    code: { type: 'string' },
  },
};

// ':language' points at the `language` property, so the dropdown drives the editor.
const uischema = {
  type: 'Control',
  scope: '#/properties/code',
  options: { format: 'code', ':language': 'language' },
};

const renderWith = async (data: Record<string, unknown>) => {
  spy.language = undefined;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={uischema as any}
          renderers={[
            { tester: monacoControlTester, renderer: AntdMonacoControlRenderer },
          ]}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  await flushUntil(() => spy.language !== undefined);
  act(() => root.unmount());
};

describe('Monaco dynamic language', () => {
  it.each([
    ['json', 'json'],
    ['javascript', 'javascript'],
  ])('resolves ":language" from the form data (%s)', async (value, expected) => {
    await renderWith({ language: value, code: 'x' });
    expect(spy.language).toBe(expected);
  });

  it('falls back to plaintext when the bound property is unset', async () => {
    await renderWith({ code: 'x' });
    expect(spy.language).toBe('plaintext');
  });
});
