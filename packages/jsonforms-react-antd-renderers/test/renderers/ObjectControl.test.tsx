import './MatchMediaMock';
import { ControlElement, NOT_APPLICABLE } from '@jsonforms/core';
import * as React from 'react';
import { antdRenderers } from '../../src';
import ObjectRenderer, {
  objectControlTester,
} from '../../src/complex/ObjectRenderer';
import Enzyme, { mount, ReactWrapper } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { JsonFormsStateProvider } from '@jsonforms/react';
import { initCore } from './util';

Enzyme.configure({ adapter: new Adapter() });

const data = { foo: { foo_1: 'foo' }, bar: { bar_1: 'bar' } };
const schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'object',
      properties: {
        foo_1: { type: 'string' },
      },
    },
    bar: {
      type: 'object',
      properties: {
        bar_1: { type: 'string' },
      },
    },
  },
};
const uischema1: ControlElement = {
  type: 'Control',
  scope: '#',
};
const uischema2: ControlElement = {
  type: 'Control',
  scope: '#/properties/foo',
};

describe('Ant Design object renderer tester', () => {
  test('should fail', () => {
    expect(objectControlTester(undefined, undefined, undefined)).toBe(
      NOT_APPLICABLE
    );
    expect(objectControlTester(null, undefined, undefined)).toBe(
      NOT_APPLICABLE
    );
    expect(objectControlTester({ type: 'Foo' }, undefined, undefined)).toBe(
      NOT_APPLICABLE
    );
    expect(objectControlTester({ type: 'Control' }, undefined, undefined)).toBe(
      NOT_APPLICABLE
    );
    expect(
      objectControlTester(
        uischema2,
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
        undefined
      )
    ).toBe(NOT_APPLICABLE);
    expect(
      objectControlTester(
        uischema2,
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: schema.properties.bar,
          },
        },
        undefined
      )
    ).toBe(NOT_APPLICABLE);
  });

  it('should succeed', () => {
    expect(
      objectControlTester(
        uischema2,
        {
          type: 'object',
          properties: {
            foo: schema.properties.foo,
          },
        },
        undefined
      )
    ).toBe(2);
  });
});

describe('Ant Design object control', () => {
  let wrapper: ReactWrapper;

  afterEach(() => wrapper.unmount());

  it('should render all children', () => {
    const core = initCore(schema, uischema1, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <ObjectRenderer schema={schema} uischema={uischema1} />
      </JsonFormsStateProvider>
    );

    const inputs = wrapper.find('input');
    expect(inputs.length).toBe(2);
    expect(inputs.at(0).props().type).toBe('text');
    expect(inputs.at(0).props().value).toBe('foo');
    expect(inputs.at(1).props().type).toBe('text');
    expect(inputs.at(1).props().value).toBe('bar');
  });

  it('should render only itself', () => {
    const core = initCore(schema, uischema1, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <ObjectRenderer schema={schema} uischema={uischema2} />
      </JsonFormsStateProvider>
    );

    const inputs = wrapper.find('input');
    expect(inputs.length).toBe(1);
    expect(inputs.at(0).props().type).toBe('text');
    expect(inputs.at(0).props().value).toBe('foo');
  });

  it('should be enabled by default', () => {
    const core = initCore(schema, uischema2, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <ObjectRenderer schema={schema} uischema={uischema2} />
      </JsonFormsStateProvider>
    );
    const inputs = wrapper.find('input');
    expect(inputs.first().props().disabled).toBeFalsy();
  });

  it('can be invisible', () => {
    const core = initCore(schema, uischema2, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <ObjectRenderer schema={schema} uischema={uischema2} visible={false} />
      </JsonFormsStateProvider>
    );
    const inputs = wrapper.find('input');
    expect(inputs.length).toBe(0);
  });

  it('should be visible by default', () => {
    const core = initCore(schema, uischema2, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <ObjectRenderer schema={schema} uischema={uischema2} />
      </JsonFormsStateProvider>
    );
    const inputs = wrapper.find('input');
    expect(inputs.first().props().hidden).toBeFalsy();
  });
});
