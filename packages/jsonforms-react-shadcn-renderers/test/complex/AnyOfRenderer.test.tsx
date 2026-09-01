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
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        mail: { type: 'string' },
      },
      required: ['name', 'mail'],
    },
    users: {
      type: 'array',
      items: { $ref: '#/definitions/user' },
    },
    addresses: {
      type: 'array',
      items: { $ref: '#/definitions/address' },
    },
  },
  type: 'object',
  properties: {
    addressOrUser: {
      anyOf: [
        { $ref: '#/definitions/address' },
        { $ref: '#/definitions/user' },
      ],
    },
    addressesOrUsers: {
      anyOf: [
        { $ref: '#/definitions/addresses' },
        { $ref: '#/definitions/users' },
      ],
    },
    addressesOrUsersAnyOfItems: {
      type: 'array',
      items: {
        anyOf: [
          { $ref: '#/definitions/addresses' },
          { $ref: '#/definitions/users' },
        ],
      },
    },
  },
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/addressOrUser',
    },
    {
      type: 'Control',
      scope: '#/properties/addressesOrUsers',
      label: 'Addresses or Users (AnyOf Schema)',
    },
    {
      type: 'Control',
      scope: '#/properties/addressesOrUsersAnyOfItems',
      label: 'Addresses or Users (AnyOf Array Items)',
    },
  ],
};

describe('Shadcn anyOf renderer', () => {
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

  it('renders the complete anyOf example with array variants', () => {
    const data = {
      addressOrUser: {
        street_address: '1600 Pennsylvania Avenue NW',
        city: 'Washington',
        state: 'DC',
      },
    };
    const onChange = vi.fn();

    act(() => {
      root.render(
        <JsonForms
          data={data}
          schema={schema}
          uischema={uischema}
          renderers={shadcnRenderers}
          onChange={onChange}
        />
      );
    });

    expect(container.textContent).not.toContain('No applicable renderer found');
    expect(container.textContent).toContain('anyOf-0');
    expect(container.textContent).toContain('anyOf-1');
    expect(container.textContent).toContain(
      'Addresses or Users (AnyOf Array Items)'
    );
    expect(container.querySelectorAll('input')).toHaveLength(3);
    expect(
      Array.from(container.querySelectorAll('button')).filter(
        (button) => button.textContent === 'Add'
      )
    ).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
  });
});
