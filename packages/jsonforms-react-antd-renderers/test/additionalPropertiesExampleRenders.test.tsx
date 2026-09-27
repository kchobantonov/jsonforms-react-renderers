import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import config from '../../jsonforms-react-demo-common/src/examples/spec/additional-properties/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/additional-properties/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/additional-properties/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/additional-properties/uischema.json';

/*
  The spec example is otherwise only exercised by opening the demo, and its
  fixture is the widest set of awkward keys this renderer has to cope with -
  brackets, digits, an empty name, padded whitespace and a dot. Rendering it
  here is what keeps it from quietly breaking.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const render = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={uischema as any}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('the additional-properties spec example', () => {
  it('renders every dynamic-property object', async () => {
    const { container, unmount } = render();
    await settle();
    expect(
      container.querySelectorAll('.jsonforms-additional-properties').length
    ).toBeGreaterThanOrEqual(5);
    unmount();
  });

  it('shows every value in Inventory labels, awkward keys included', async () => {
    const { container, unmount } = render();
    await settle();
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    for (const value of [
      'Portland',
      'crate', // items[0]
      'season', // 2024
      'unnamed label', // ""
      'kept exactly', // "  spaced  "
    ]) {
      expect(values).toContain(value);
    }
    unmount();
  });

  it('gives the empty-named property a blank label, not quotes', async () => {
    const { container, unmount } = render();
    await settle();
    const heading = container.querySelector('[data-property-name=""]');
    expect(heading).toBeTruthy();
    expect(heading!.textContent!.trim()).toBe('');
    unmount();
  });

  it('shows the dotted key from the imported annotations', async () => {
    const { container, unmount } = render();
    await settle();
    expect(container.textContent).toContain('legacy.key');
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    expect(values).toContain('written by the old dispatch system');
    unmount();
  });

  it('keeps the key that violates its propertyNames visible', async () => {
    const { container, unmount } = render();
    await settle();
    // `sensor-x` is too short, and §19 says to show it rather than drop it.
    expect(container.textContent).toContain('sensor-x');
    unmount();
  });
});
