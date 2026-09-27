import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  A property whose name no data path can address - empty, or containing a dot -
  is edited in a form of its own, rooted at its value.

  That form has its own root schema, which is what breaks local references: a
  `$ref: "#/definitions/label"` inside the property's schema resolved against
  the original document, and in the isolated form there is no such definition.
  `literalPropertySchema` carries the original root along under
  `definitions.__jsonforms_root` and rewrites the references to point into it.

  A reference at the *top* of the property's schema is already resolved further
  up, so it is a nested one that shows whether this works.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const render = (schema: any, data: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/properties/labels' } as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  return {
    container,
    values: () =>
      Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(
        (input) => input.value
      ),
    unmount: () => act(() => root.unmount()),
  };
};

const nestedRefSchema = {
  definitions: { label: { type: 'string', title: 'Label text' } },
  type: 'object',
  properties: {
    labels: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { text: { $ref: '#/definitions/label' } },
      },
    },
  },
};

describe('an isolated editor whose schema references the original document', () => {
  it('resolves a nested local $ref and renders the control', async () => {
    const { values, unmount } = render(nestedRefSchema, {
      labels: { 'a.b': { text: 'dotted value' } },
    });
    await settle();
    // Without the rebundling this logs "can't resolve reference
    // #/definitions/label from id #" and renders nothing.
    expect(values()).toContain('dotted value');
    unmount();
  });

  it('does the same for an empty name', async () => {
    const { values, unmount } = render(nestedRefSchema, {
      labels: { '': { text: 'unnamed value' } },
    });
    await settle();
    expect(values()).toContain('unnamed value');
    unmount();
  });

  it('leaves ordinary names on the normal delegated path', async () => {
    // A name a path *can* address is dispatched, not isolated, so this is the
    // control case: it must keep working too.
    const { values, unmount } = render(nestedRefSchema, {
      labels: { plain: { text: 'ordinary value' } },
    });
    await settle();
    expect(values()).toContain('ordinary value');
    unmount();
  });
});
