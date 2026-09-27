import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

/*
  The two ways a jsx template reaches its children, and the failure mode that
  told us only one of them was covered.

  `elements` is both a name-keyed map and an array. Every example in the spec
  folder addresses a child by name, so the array half had no test at all - and
  when the renderer started handing back `{ element, name }` wrappers instead
  of the elements, `{elements}` began throwing "Objects are not valid as a
  React child" in the browser while the whole suite stayed green.

  The trigger is narrower than it looks, which is why a casual test misses it.
  `elements` is a Proxy: a string key it knows resolves to that child, and an
  unnamed child's fallback name **is its decimal index** - so `elements[0]` on
  an all-unnamed list returned the element either way and looked fine. Give one
  child an explicit `name` and its index is no longer a key, the proxy falls
  through to the raw array, and React gets the wrapper. Every case below that
  names a child is therefore a regression test; the all-unnamed one is the
  baseline that stayed green throughout.
*/

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

/*
  Console spies are restored one by one on purpose. `vi.restoreAllMocks()` also
  restores `window.matchMedia`, which the package's setup file installs as a
  mock - and antd's responsive observer calls it, so the next test in the file
  dies in `addEventListener` rather than in anything it is testing.
*/
const spies: { mockRestore: () => void }[] = [];
const hush = (method: 'error' | 'warn') => {
  const spy = vi.spyOn(console, method).mockImplementation(() => undefined);
  spies.push(spy);
  return spy;
};

afterEach(() => {
  document.body.innerHTML = '';
  spies.splice(0).forEach((spy) => spy.mockRestore());
});

const schema = {
  type: 'object',
  properties: {
    first: { type: 'string' },
    second: { type: 'string' },
  },
} as any;

const config = {
  jsonformsExtended: { security: { allowScriptEvaluation: true } },
};

const settle = async (ms = 250) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = async (uischema: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{ first: 'one', second: 'two' }}
          schema={schema}
          uischema={uischema}
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  await settle();
  return { container, unmount: () => act(() => root.unmount()) };
};

const inputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(
    (input) => input.value
  );

describe('a jsx template rendering the whole elements array', () => {
  /*
    The reported failure, at its smallest: one named child, rendered through
    the array rather than by its name.
  */
  it('mounts a named child reached through the array', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div data-all>{elements}</div>',
      elements: [
        { type: 'Control', scope: '#/properties/first', name: 'first' },
        { type: 'Control', scope: '#/properties/second' },
      ],
    });

    const all = view.container.querySelector<HTMLElement>('[data-all]');
    expect(all, 'the template rendered nothing').toBeTruthy();
    expect(inputs(all!)).toEqual(['one', 'two']);
    view.unmount();
  });

  it('mounts every child, in order', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div data-all>{elements}</div>',
      elements: [
        { type: 'Control', scope: '#/properties/first' },
        { type: 'Control', scope: '#/properties/second' },
      ],
    });

    const all = view.container.querySelector<HTMLElement>('[data-all]');
    expect(all, 'the template rendered nothing').toBeTruthy();
    expect(inputs(all!)).toEqual(['one', 'two']);
    view.unmount();
  });

  /*
    Unnamed children are the common case for `{elements}` - nobody names a
    child they only ever render positionally - so the renderable must not be
    keyed on a name that is not there. It once was, and every unnamed child
    shared one entry.
  */
  it('keeps unnamed children distinct', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div data-all>{elements}</div>',
      elements: [
        { type: 'Control', scope: '#/properties/first' },
        { type: 'Control', scope: '#/properties/second' },
      ],
    });
    const values = inputs(
      view.container.querySelector<HTMLElement>('[data-all]')!
    );
    expect(new Set(values).size).toBe(2);
    view.unmount();
  });

  it('still addresses a child by name', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: "<div data-one>{elements['second']}</div>",
      elements: [
        { type: 'Control', scope: '#/properties/first' },
        { type: 'Control', scope: '#/properties/second', name: 'second' },
      ],
    });
    const one = view.container.querySelector<HTMLElement>('[data-one]');
    expect(inputs(one!)).toEqual(['two']);
    view.unmount();
  });

  /* Both halves of `elements` at once, which is what the demo fixture does. */
  it('mixes the array and a named child', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template:
        "<div><div data-named>{elements['second']}</div><div data-all>{elements}</div></div>",
      elements: [
        { type: 'Control', scope: '#/properties/first' },
        { type: 'Control', scope: '#/properties/second', name: 'second' },
      ],
    });
    expect(
      inputs(view.container.querySelector<HTMLElement>('[data-named]')!)
    ).toEqual(['two']);
    expect(
      inputs(view.container.querySelector<HTMLElement>('[data-all]')!)
    ).toEqual(['one', 'two']);
    view.unmount();
  });

  /* Nested, as the demo fixture nests: a template whose child is a template. */
  it('renders a template nested inside a template', async () => {
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div data-outer>{elements}</div>',
      elements: [
        {
          type: 'TemplateLayout',
          lang: 'jsx',
          name: 'inner',
          template: '<div data-inner>{elements}</div>',
          elements: [{ type: 'Control', scope: '#/properties/first' }],
        },
      ],
    });
    const inner = view.container.querySelector<HTMLElement>(
      '[data-outer] [data-inner]'
    );
    expect(inner, 'the nested template did not render').toBeTruthy();
    expect(inputs(inner!)).toEqual(['one']);
    view.unmount();
  });
});

describe('a template that throws', () => {
  /*
    The second half of the browser failure. The boundary around the engine
    reported every failure as a load failure, because the boundary *inside* the
    engine had a `componentDidCatch` but no `getDerivedStateFromError` - so it
    re-rendered the children that had just thrown and let the error escape.
  */
  it('is reported as a template error, not as a failure to load the engine', async () => {
    hush('error');
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div>{data.missing.deeper}</div>',
      elements: [],
    });

    expect(view.container.textContent).not.toContain(
      'The template engine could not be loaded'
    );
    expect(view.container.textContent).toContain('Template Runtime Error');
    view.unmount();
  });

  it('survives an error thrown while React reconciles the output', async () => {
    hush('error');
    // An object is not a valid React child; the throw happens after the
    // template function has already returned, which is what defeated the
    // try/catch the engine wraps around the call.
    const view = await draw({
      type: 'TemplateLayout',
      lang: 'jsx',
      template: '<div>{schema}</div>',
      elements: [],
    });

    expect(view.container.textContent).not.toContain(
      'The template engine could not be loaded'
    );
    expect(view.container.textContent).toContain('Template Runtime Error');
    view.unmount();
  });
});

/*
  The fixture that actually failed in the browser, rendered end to end.

  It is the demo's own `template-layout` example - nested templates, a named
  child, and two levels of `{elements}` - and it had no test of any kind. The
  spec fixture beside it did, which is why the suite stayed green while the
  demo threw on mount.
*/
describe('the demo template-layout example', () => {
  it('mounts', async () => {
    const [
      { default: exampleSchema },
      { default: exampleUischema },
      { default: exampleData },
      { default: exampleConfig },
    ] = await Promise.all([
      import(
        '../../jsonforms-react-demo-common/src/examples/template-layout/schema.json'
      ),
      import(
        '../../jsonforms-react-demo-common/src/examples/template-layout/uischema.json'
      ),
      import(
        '../../jsonforms-react-demo-common/src/examples/template-layout/data.json'
      ),
      import(
        '../../jsonforms-react-demo-common/src/examples/template-layout/config.json'
      ),
    ]);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={exampleData}
            schema={exampleSchema as any}
            uischema={exampleUischema as any}
            config={exampleConfig}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();

    expect(container.textContent).not.toContain('Template Runtime Error');
    expect(container.textContent).not.toContain(
      'The template engine could not be loaded'
    );
    // The innermost template, reached through two levels of `{elements}`.
    expect(container.textContent).toContain('Hello');
    // And the controls the middle template places positionally.
    expect(
      container.querySelectorAll('input').length,
      'the example rendered no controls'
    ).toBeGreaterThan(1);

    act(() => root.unmount());
  });
});
