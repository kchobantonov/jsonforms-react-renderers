import './renderers/MatchMediaMock';
import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import { Radio, Select } from 'antd';
import { expect, it, vi } from 'vitest';
import { AntdSelect } from '../src/antd-controls/AntdSelect';
import { AntdRadioGroup } from '../src/antd-controls/AntdRadioGroup';
import { EnumCell } from '../src/cells/EnumCell';

Enzyme.configure({ adapter: new Adapter() });

it.each([
  [
    { mode: 'email', count: 1 },
    { mode: 'postal', count: 2 },
  ],
  [
    ['email', { count: 1 }],
    ['postal', { count: 2 }],
  ],
  [1, '1', false, null, ''],
])('preserves JSON choice identity across reloads: %j', (...values) => {
  const options = values.map((value, index) => ({
    value,
    label: `Choice ${index}`,
  }));
  const handleChange = vi.fn();
  const props = {
    options,
    data: JSON.parse(JSON.stringify(values[1])),
    handleChange,
    path: 'choice',
    enabled: true,
    schema: {},
    uischema: { type: 'Control', scope: '#' },
    t: (_key: string, fallback: string) => fallback,
  } as any;
  const error = vi.spyOn(console, 'error');
  const radio = mount(<AntdRadioGroup {...props} />);
  try {
    expect(radio.find('input[checked=true]').prop('value')).toBe(1);
    radio.find(Radio.Group).prop('onChange')!({ target: { value: 0 } } as any);
    expect(handleChange).toHaveBeenLastCalledWith('choice', values[0]);
    radio.setProps({ data: JSON.parse(JSON.stringify(values[0])) });
    expect(radio.find('input[checked=true]').prop('value')).toBe(0);
    expect(
      error.mock.calls.some((args) => String(args[0]).includes('same key'))
    ).toBe(false);
  } finally {
    radio.unmount();
    error.mockRestore();
  }
  for (const Component of [AntdSelect, EnumCell]) {
    const wrapper = mount(<Component {...props} />);
    try {
      expect(wrapper.find(Select).prop('value')).toBe(1);
      expect(wrapper.text()).toBe('Choice 1');
      wrapper.find(Select).prop('onChange')!(0, {} as any);
      expect(handleChange).toHaveBeenLastCalledWith('choice', values[0]);
      wrapper.setProps({ data: JSON.parse(JSON.stringify(values[0])) });
      expect(wrapper.find(Select).prop('value')).toBe(0);
      wrapper.find(Select).prop('onChange')!(undefined, {} as any);
      expect(handleChange).toHaveBeenLastCalledWith('choice', undefined);
      wrapper.setProps({ data: { unknown: true } });
      expect(wrapper.find(Select).prop('value')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  }
});
