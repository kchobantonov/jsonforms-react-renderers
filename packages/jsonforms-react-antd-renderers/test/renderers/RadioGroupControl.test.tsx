import './MatchMediaMock';
import * as React from 'react';
import { ControlElement, NOT_APPLICABLE } from '@jsonforms/core';
import RadioGroupControl, {
  radioGroupControlTester,
} from '../../src/controls/RadioGroupControl';
import { antdRenderers } from '../../src';
import Enzyme, { mount, ReactWrapper } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { JsonFormsStateProvider } from '@jsonforms/react';
import { initCore } from './util';
import { AntdRadioGroup } from '../../src/antd-controls/AntdRadioGroup';
Enzyme.configure({ adapter: new Adapter() });

const data = { foo: 'D' };
const schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D'],
    },
  },
};
const uischema: ControlElement = {
  type: 'Control',
  scope: '#/properties/foo',
  options: {
    format: 'radio',
  },
};

describe('Ant Design radio group tester', () => {
  it('should return valid rank for enums with radio format', () => {
    const rank = radioGroupControlTester(uischema, schema, undefined);
    expect(rank).not.toBe(NOT_APPLICABLE);
  });

  it('should return NOT_APPLICABLE for enums without radio format', () => {
    const uiSchemaNoRadio = {
      type: 'Control',
      scope: '#/properties/foo',
    };
    const rank = radioGroupControlTester(uiSchemaNoRadio, schema, undefined);
    expect(rank).toBe(NOT_APPLICABLE);
  });
});

describe('Ant Design radio group control', () => {
  let wrapper: ReactWrapper;

  afterEach(() => wrapper.unmount());

  it('should have option selected', () => {
    const core = initCore(schema, uischema, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <RadioGroupControl schema={schema} uischema={uischema} />
      </JsonFormsStateProvider>
    );

    const radioButtons = wrapper.find('input[type="radio"]');
    const currentlyChecked = wrapper.find('input[type="radio"][checked=true]');
    expect(radioButtons.length).toBe(4);
    expect(currentlyChecked.first().props().value).toBe('D');
  });

  it('should have only update selected option ', () => {
    const core = initCore(schema, uischema, data);

    core.data = { ...core.data, foo: 'A' };
    core.data = { ...core.data, foo: 'B' };
    wrapper.setProps({ initState: { renderers: antdRenderers, core } });
    wrapper.update();

    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <RadioGroupControl schema={schema} uischema={uischema} />
      </JsonFormsStateProvider>
    );
    const currentlyChecked = wrapper.find('input[type="radio"][checked=true]');
    expect(currentlyChecked.length).toBe(1);
    expect(currentlyChecked.first().props().value).toBe('B');
  });

  it('should be hideable ', () => {
    const core = initCore(schema, uischema, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <RadioGroupControl
          schema={schema}
          uischema={uischema}
          visible={false}
        />
      </JsonFormsStateProvider>
    );

    const radioButtons = wrapper.find('input[type="radio"]');
    expect(radioButtons.length).toBe(0);
  });

  it('is not operable when disabled', () => {
    const core = initCore(schema, uischema, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <RadioGroupControl
          schema={schema}
          uischema={uischema}
          enabled={false}
        />
      </JsonFormsStateProvider>
    );

    const radioButtons = wrapper.find('input[type="radio"]');
    expect(radioButtons.length).toBe(4);
    radioButtons.forEach((radio) => expect(radio.props().disabled).toBe(true));
  });

  it('is operable when enabled', () => {
    const core = initCore(schema, uischema, data);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <RadioGroupControl schema={schema} uischema={uischema} enabled={true} />
      </JsonFormsStateProvider>
    );

    wrapper
      .find('input[type="radio"]')
      .forEach((radio) => expect(radio.props().disabled).toBe(false));
  });

  it('refuses a change dispatched while disabled', () => {
    // The handler is guarded as well as the widget: a keyboard path, or a
    // caller overriding `disabled` through inputProps, must not be able to
    // commit a change to a read-only control.
    const handleChange = vi.fn();
    const group = mount(
      <AntdRadioGroup
        data='D'
        enabled={false}
        handleChange={handleChange}
        path='foo'
        schema={schema.properties.foo as any}
        uischema={uischema}
        options={[{ label: 'A', value: 'A' }]}
        inputProps={{ disabled: false }}
        {...({} as any)}
      />
    );
    group.find('input[type="radio"]').simulate('change', {
      target: { value: 'A' },
    });
    expect(handleChange).not.toHaveBeenCalled();
    group.unmount();
  });
});
