import './MatchMediaMock';
import React from 'react';

import Enzyme, { mount, ReactWrapper } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { ControlElement } from '@jsonforms/core';
import { AllOfRenderer, antdRenderers } from '../../src';
import { JsonForms, JsonFormsStateProvider } from '@jsonforms/react';
import { initCore } from './util';

Enzyme.configure({ adapter: new Adapter() });

describe('Ant Design allOf renderer', () => {
  let wrapper: ReactWrapper;

  afterEach(() => wrapper.unmount());

  it('should render', () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          allOf: [
            {
              title: 'String',
              type: 'string',
            },
            {
              title: 'Number',
              type: 'number',
            },
          ],
        },
      },
    };
    const uischema: ControlElement = {
      type: 'Control',
      label: 'Value',
      scope: '#/properties/value',
    };
    wrapper = mount(
      <JsonForms
        data={undefined}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
      />
    );
    expect(wrapper.find(AllOfRenderer).length).toBeTruthy();
    const inputs = wrapper.find('input');
    expect(inputs.length).toBe(2);
  });

  it('should be hideable', () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          allOf: [
            {
              title: 'String',
              type: 'string',
            },
            {
              title: 'Number',
              type: 'number',
            },
          ],
        },
      },
    };
    const uischema: ControlElement = {
      type: 'Control',
      label: 'Value',
      scope: '#/properties/value',
    };
    const core = initCore(schema, uischema);
    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <AllOfRenderer schema={schema} uischema={uischema} visible={false} />
      </JsonFormsStateProvider>
    );
    const inputs = wrapper.find('input');
    expect(inputs.length).toBe(0);
  });
});
