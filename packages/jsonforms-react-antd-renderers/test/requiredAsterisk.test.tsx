import './renderers/MatchMediaMock';
import React, { act } from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { antdRenderers } from '../src';
Enzyme.configure({ adapter: new Adapter() });

it('updates required markers from config while retaining required validation and local overrides', async () => {
  const ui = (hide?: boolean) => ({
    type: 'Control',
    scope: '#/properties/name',
    options: hide === undefined ? {} : { hideRequiredAsterisk: hide },
  });
  const wrapper = mount(
    <JsonForms
      schema={{
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      }}
      uischema={ui()}
      data={{}}
      config={{ hideRequiredAsterisk: false }}
      renderers={antdRenderers}
    />
  );
  try {
    expect(wrapper.find('label.ant-form-item-required')).toHaveLength(1);
    await act(async () => {
      wrapper.setProps({ config: { hideRequiredAsterisk: true } });
    });
    wrapper.update();
    expect(wrapper.find('label.ant-form-item-required')).toHaveLength(0);
    expect(
      wrapper.find('.ant-form-item-has-error').hostNodes().length
    ).toBeGreaterThan(0);
    await act(async () => {
      wrapper.setProps({ uischema: ui(false) });
    });
    wrapper.update();
    expect(wrapper.find('label.ant-form-item-required')).toHaveLength(1);
    await act(async () => {
      wrapper.setProps({
        config: { hideRequiredAsterisk: false },
        uischema: ui(true),
      });
    });
    wrapper.update();
    expect(wrapper.find('label.ant-form-item-required')).toHaveLength(0);
  } finally {
    wrapper.unmount();
  }
});
