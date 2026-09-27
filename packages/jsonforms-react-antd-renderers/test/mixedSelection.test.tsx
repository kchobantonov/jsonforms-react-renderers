import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import { isMixedControl } from '../src/complex/MixedRenderer';

/*
  A tester is handed the schema of the dispatch it sits in - at the top of a
  form, the **root**. So a Control scoped at `#/properties/setting` is asked
  about the whole document, and this one used to answer from it: the root
  carries `properties`, which the checks reject, so a union-typed declared
  property never reached the mixed renderer and fell through to the plain text
  control. A `["string", "number"]` field became a text box, and a number typed
  into it was stored as a string.

  Section 18 selects on "a Control with a **resolved** schema whose type is an
  array of permitted JSON types", so the scope is resolved first.
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

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const control = (scope: string) => ({ type: 'Control', scope } as any);
const matches = (root: any, scope = '#/properties/value') =>
  isMixedControl(control(scope), root, {
    rootSchema: root,
    config: {},
  } as any);

const objectWith = (value: any) => ({
  type: 'object',
  properties: { value },
});

describe('selecting the mixed control', () => {
  it('resolves the scope rather than judging the enclosing schema', () => {
    expect(matches(objectWith({ type: ['string', 'number'] }))).toBe(true);
  });

  it('still takes a union at the root', () => {
    expect(matches({ type: ['string', 'number'] }, '#')).toBe(true);
  });

  it('takes an unconstrained schema, which nothing else could render', () => {
    expect(matches(objectWith({}))).toBe(true);
  });

  it('leaves single-type properties to their own controls', () => {
    for (const type of ['string', 'number', 'boolean', 'null']) {
      expect(matches(objectWith({ type }))).toBe(false);
    }
  });

  it('leaves objects and combinators alone', () => {
    expect(matches(objectWith({ type: 'object', properties: { a: {} } }))).toBe(
      false
    );
    expect(matches(objectWith({ oneOf: [{ type: 'string' }] }))).toBe(false);
    expect(matches(objectWith({ anyOf: [{ type: 'string' }] }))).toBe(false);
    expect(matches(objectWith({ allOf: [{ type: 'string' }] }))).toBe(false);
  });

  it('does not treat a single-entry type array as a union', () => {
    expect(matches(objectWith({ type: ['string'] }))).toBe(false);
  });

  it('survives a scope that resolves to nothing', () => {
    // Not this tester's job to report, and it must not throw during dispatch.
    expect(() =>
      matches(objectWith({ type: 'string' }), '#/properties/gone')
    ).not.toThrow();
  });
});

describe('a union-typed property in a real form', () => {
  const schema = {
    type: 'object',
    properties: {
      value: { type: ['string', 'number', 'boolean', 'null'], title: 'Value' },
    },
  };

  const render = (data: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={data}
            schema={schema as any}
            uischema={control('#/properties/value')}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    return {
      container,
      selectors: () =>
        container.querySelectorAll('.jsonforms-mixed-type-selector'),
      selected: () =>
        container.querySelector('.ant-select-selection-item')?.textContent ??
        container.querySelector('.ant-select-content')?.textContent,
      unmount: () => act(() => root.unmount()),
    };
  };

  it('gets a type selector, not a text box', async () => {
    const { selectors, unmount } = render({ value: 'text' });
    await settle();
    expect(selectors()).toHaveLength(1);
    unmount();
  });

  it('starts on the type the value already has', async () => {
    const { selected, unmount } = render({ value: 42 });
    await settle();
    expect(selected()).toBe('number');
    unmount();
  });

  it('shows the placeholder, not a type, for an absent value', async () => {
    const { selected, selectors, unmount } = render({});
    await settle();
    expect(selectors()).toHaveLength(1);
    // A prompt rather than a guess: nothing has been selected yet.
    expect(selected()).toBe('Select a type');
    unmount();
  });

  it('shows null as a selected type, not as an absent value', async () => {
    const { selected, unmount } = render({ value: null });
    await settle();
    expect(selected()).toBe('null');
    unmount();
  });
});
