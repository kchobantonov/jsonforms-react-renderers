import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import nullConfig from '@chobantonov/jsonforms-extended-spec/examples/null-control/config.json';
import nullData from '@chobantonov/jsonforms-extended-spec/examples/null-control/data.json';
import nullSchema from '@chobantonov/jsonforms-extended-spec/examples/null-control/schema.json';
import nullUischema from '@chobantonov/jsonforms-extended-spec/examples/null-control/uischema.json';
import mixedConfig from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/config.json';
import mixedData from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';
import mixedSchema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/schema.json';
import mixedUischema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/uischema.json';

/*
  Both fixtures are otherwise only exercised by opening the demo. These render
  them with the renderer set the demo actually uses.
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

const render = (schema: any, uischema: any, data: any, config: any) => {
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
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  return {
    container,
    stored: () => latest,
    boxes: () =>
      Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      ),
    unmount: () => act(() => root.unmount()),
  };
};

describe('the null-control spec example', () => {
  const draw = () =>
    render(nullSchema as any, nullUischema as any, nullData, nullConfig);

  it('draws one checkbox per null property, in its three states', async () => {
    const { boxes, unmount } = draw();
    await settle();
    // noSurcharge (null), exceptionsChecked (absent), legacyApproval ("n/a")
    expect(boxes().length).toBeGreaterThanOrEqual(3);
    expect(boxes().some((box) => box.checked)).toBe(true);
    expect(boxes().some((box) => box.indeterminate)).toBe(true);
    expect(boxes().some((box) => !box.checked && !box.indeterminate)).toBe(
      true
    );
    unmount();
  });

  it('keeps the empty string beside them as a value', async () => {
    const { container, unmount } = draw();
    await settle();
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        'input[type="text"], input:not([type])'
      )
    ).map((input) => input.value);
    expect(values).toContain('');
    unmount();
  });
});

describe('the mixed-control spec example', () => {
  const draw = () =>
    render(mixedSchema as any, mixedUischema as any, mixedData, mixedConfig);

  it('draws a type selector for every mixed value', async () => {
    const { container, unmount } = draw();
    await settle();
    expect(
      container.querySelectorAll('.jsonforms-mixed-type-selector').length
    ).toBeGreaterThanOrEqual(7);
    unmount();
  });

  it('keeps a clear affordance on the properties that are not array elements', async () => {
    const { container, unmount } = draw();
    await settle();
    /*
      The fixture holds both cases at once - scalar properties, whose type may
      be cleared, and a tuple's trailing values, whose type may not. The array
      rule itself is pinned in the antd renderer set's
      `mixedArrayItemType.test.tsx`; here it is enough that the permitted case
      survives alongside it.
    */
    expect(
      container.querySelectorAll('.ant-select-clear').length
    ).toBeGreaterThan(0);
    unmount();
  });

  it('does not rewrite the value none of its types admit', async () => {
    const { stored, unmount } = draw();
    await settle();
    await settle();
    // `priority` is `true` under ["string","number"]. Section 19: shown and
    // reported, never replaced by something the field can represent.
    expect(stored().priority).toBe(true);
    expect(stored().surcharge).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(stored(), 'reference')).toBe(
      false
    );
    unmount();
  });
});
