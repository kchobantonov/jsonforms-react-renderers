import './MatchMediaMock';
import * as React from 'react';
import { ControlElement, NOT_APPLICABLE } from '@jsonforms/core';
import OneOfRadioGroupControl, {
  oneOfRadioGroupControlTester,
} from '../../src/controls/OneOfRadioGroupControl';
import { antdRenderers } from '../../src';
import Enzyme, { mount, ReactWrapper } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { JsonFormsStateProvider } from '@jsonforms/react';
import { initCore } from './util';
Enzyme.configure({ adapter: new Adapter() });

const oneOfSchema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
      oneOf: [
        { const: 'A', title: 'Option A' },
        { const: 'B' },
        { const: 'C', title: 'Option C' },
      ],
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

describe('Ant Design oneof radio group tester', () => {
  it('should return valid rank for oneof enums with radio format', () => {
    const rank = oneOfRadioGroupControlTester(uischema, oneOfSchema, undefined);
    expect(rank).not.toBe(NOT_APPLICABLE);
  });

  it('should return NOT_APPLICABLE for enums without radio format', () => {
    const uiSchemaNoRadio = {
      type: 'Control',
      scope: '#/properties/foo',
    };
    const rank = oneOfRadioGroupControlTester(
      uiSchemaNoRadio,
      oneOfSchema,
      undefined
    );
    expect(rank).toBe(NOT_APPLICABLE);
  });
});

describe('Ant Design oneof radio group control', () => {
  let wrapper: ReactWrapper;

  afterEach(() => wrapper.unmount());

  it('should render oneOf schemas ', () => {
    const core = initCore(oneOfSchema, uischema, { foo: 'B' });

    wrapper = mount(
      <JsonFormsStateProvider initState={{ renderers: antdRenderers, core }}>
        <OneOfRadioGroupControl schema={oneOfSchema} uischema={uischema} />
      </JsonFormsStateProvider>
    );
    const inputs = wrapper.find('input[type="radio"]');
    expect(inputs.length).toBe(3);
    const currentlyChecked = inputs.find('[checked=true]');
    expect(currentlyChecked.length).toBe(1);
    expect(currentlyChecked.first().closest('label').text()).toBe('B');
  });
});
