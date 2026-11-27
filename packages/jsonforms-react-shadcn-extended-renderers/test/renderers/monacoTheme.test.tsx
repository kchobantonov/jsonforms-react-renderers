import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnMonacoControlRenderer } from '../../src/renderers/ShadcnMonacoControlRenderer';
import { flushUntil } from '../../../jsonforms-react-extended-renderers/test/support/flush';

const spy = vi.hoisted(() => ({
  defined: [] as string[],
  applied: [] as string[],
  themeProp: undefined as string | undefined,
  reset() {
    this.defined = [];
    this.applied = [];
    this.themeProp = undefined;
  },
}));

vi.mock('@monaco-editor/react', () => {
  const monaco = {
    editor: {
      defineTheme: (name: string) => spy.defined.push(name),
      setTheme: (name: string) => spy.applied.push(name),
    },
  };
  const editor = { focus() {}, layout() {}, getAction: () => undefined };
  return {
    default: function MockMonaco(props: any) {
      const [onMount] = React.useState(() => props.onMount);
      spy.themeProp = props.theme;
      // Faithful to @monaco-editor/react's ordering, which is what the bug
      // hinged on: beforeMount runs during render with the monaco instance,
      // while onMount only fires once the editor has loaded - i.e. AFTER the
      // component's effects have already run.
      props.beforeMount?.(monaco);
      React.useEffect(() => {
        // Monaco is loaded asynchronously, so onMount lands well after the
        // parent's effects have run. That ordering is the whole bug: a theme
        // registered only in an effect is registered never, because monacoRef
        // is still null when that effect runs.
        const timer = setTimeout(() => onMount?.(editor, monaco), 0);
        return () => clearTimeout(timer);
      }, [onMount]);
      return React.createElement('div');
    },
  };
});

const schema = {
  type: 'object',
  properties: { code: { type: 'string' } },
};
const uischema = {
  type: 'Control',
  scope: '#/properties/code',
  options: { format: 'code', language: 'javascript' },
};

const renderForm = async (dark: boolean) => {
  spy.reset();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <React.Fragment>
        <JsonForms
          data={{ code: 'const a = 1;' }}
          schema={schema}
          uischema={{
            ...uischema,
            options: { ...uischema.options, theme: dark ? 'dark' : 'light' },
          }}
          renderers={[
            {
              tester: monacoControlTester,
              renderer: ShadcnMonacoControlRenderer,
            },
          ]}
          onChange={() => undefined}
        />
      </React.Fragment>,
    ),
  );
  // the renderer is lazy, so wait for the chunk and the deferred onMount
  await flushUntil(() => spy.themeProp !== undefined);
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('Monaco editor theming', () => {
  // Regression: Monaco's theme registry is global. Registering a bespoke theme
  // and calling setTheme repaints every other Monaco editor on the page,
  // including ones the host application owns, so the renderer must never do it.
  it.each([
    ['dark', true],
    ['light', false],
  ])('never mutates the global theme registry (%s)', async (_label, dark) => {
    const { unmount } = await renderForm(dark as boolean);
    expect(spy.defined).toEqual([]);
    expect(spy.applied).toEqual([]);
    unmount();
  });

  it.each([
    ['dark', true, 'vs-dark'],
    ['light', false, 'vs'],
  ])(
    'hands Monaco a built-in theme name (%s)',
    async (_label, dark, expected) => {
      const { unmount } = await renderForm(dark as boolean);
      expect(spy.themeProp).toBe(expected);
      unmount();
    },
  );
});
