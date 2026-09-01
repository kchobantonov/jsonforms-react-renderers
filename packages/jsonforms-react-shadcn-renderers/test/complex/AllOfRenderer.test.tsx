import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { shadcnRenderers } from '../../src';

const schema = {
  definitions: {
    address: {
      type: 'object',
      properties: {
        street_address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
      },
      required: ['street_address', 'city', 'state'],
    },
  },
  type: 'object',
  properties: {
    shipping_address: {
      allOf: [
        { $ref: '#/definitions/address' },
        {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['residential', 'business'],
            },
          },
          required: ['type'],
        },
      ],
    },
  },
};

describe('Shadcn allOf renderer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders the composed shipping address as object fields', () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <JsonForms
          data={{}}
          schema={schema}
          uischema={{
            type: 'Control',
            scope: '#/properties/shipping_address',
          }}
          renderers={shadcnRenderers}
          onChange={onChange}
        />
      );
    });

    const labels = Array.from(container.querySelectorAll('label')).map(
      (label) => label.textContent
    );

    expect(labels).toEqual(
      expect.arrayContaining(['Street Address *', 'City *', 'State *'])
    );
    expect(container.querySelectorAll('input')).toHaveLength(3);
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
    expect(container.textContent).not.toContain('array');
    expect(onChange.mock.lastCall?.[0].data.shipping_address).toBeUndefined();
  });
});
