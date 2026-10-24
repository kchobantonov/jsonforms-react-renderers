import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AntdTimePicker } from '../src/antd-controls/AntdTimePicker';
const state = vi.hoisted(() => ({
  data: { limit: '09:00:00' },
  picker: undefined as any,
}));
vi.mock('@jsonforms/react', async (original) => ({
  ...(await original<any>()),
  useJsonForms: () => ({ core: { data: state.data } }),
}));
vi.mock('antd', async (original) => ({
  ...(await original<any>()),
  TimePicker: (props: any) => {
    state.picker = props;
    return null;
  },
}));
it('updates time restrictions when the referenced bound changes', () => {
  const root = createRoot(document.createElement('div'));
  const props: any = {
    enabled: true,
    isValid: true,
    path: 'time',
    handleChange: vi.fn(),
    schema: {
      type: 'string',
      format: 'time',
      formatMinimum: { $data: '1/limit' },
    },
    uischema: { type: 'Control', scope: '#', options: { restrict: true } },
  };
  try {
    act(() => root.render(<AntdTimePicker {...props} id={state.data.limit} />));
    expect(state.picker.disabledTime().disabledHours()).not.toContain(10);
    state.data = { limit: '12:00:00' };
    act(() => root.render(<AntdTimePicker {...props} id={state.data.limit} />));
    expect(state.picker.disabledTime().disabledHours()).toContain(10);
  } finally {
    act(() => root.unmount());
  }
});
