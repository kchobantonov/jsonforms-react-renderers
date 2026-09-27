import './MatchMediaMock';
import React from 'react';
import Enzyme, { mount, ReactWrapper } from 'enzyme';
import { NativeControl } from '../../src/controls/NativeControl';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { Input, InputProps } from 'antd';

Enzyme.configure({ adapter: new Adapter() });

const schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
      format: 'time',
    },
  },
};
const uischema: ControlElement = {
  type: 'Control',
  scope: '#/properties/foo',
};

const createNativeControl = (props: ControlProps) => {
  return <NativeControl {...props} />;
};

const defaultControlProps = (): ControlProps => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleChange: () => {},
    enabled: false,
    visible: true,
    path: 'path',
    rootSchema: schema,
    schema: schema.properties.foo,
    uischema: uischema,
    label: 'Foo',
    id: 'foo-id',
    errors: '',
    data: '',
  };
};

describe('native control', () => {
  let wrapper: ReactWrapper;

  afterEach(() => {
    wrapper.unmount();
  });

  it('is disabled', () => {
    const props = defaultControlProps();
    wrapper = mount(createNativeControl(props));
    expect((wrapper.find(Input).props() as InputProps).disabled).toEqual(true);
  });
});
