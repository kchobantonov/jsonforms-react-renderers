import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AntdDatePicker } from '../../src/antd-controls/AntdDatePicker';
import { AntdTimePicker } from '../../src/antd-controls/AntdTimePicker';
import { AntdDateTimePicker } from '../../src/antd-controls/AntdDateTimePicker';

// Exercise the real Ant Design popup and its pending selection, not onChange mocks.
describe('picker selection commits', () => {
  let container: HTMLDivElement;
  let root: Root;
  let refresh: () => void;
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });
  const mount = async (Picker: any, initial: string, options = {}) => {
    const Harness = () => {
      const [data, setData] = useState(initial);
      const [, setRevision] = useState(0);
      refresh = () => setRevision((value) => value + 1);
      return (
        <>
          <Picker
            data={data}
            enabled
            isValid
            path='value'
            id='picker'
            uischema={{ type: 'Control', scope: '#', options }}
            handleChange={(_: string, value: string) => setData(value)}
            inputProps={{ onFocus: refresh, onBlur: refresh }}
          />
          <output>{data}</output>
        </>
      );
    };
    await act(async () => root.render(<Harness />));
    await click(container.querySelector('input')!);
  };
  const click = async (element: Element) => {
    expect(element).not.toBeNull();
    await act(async () => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  };
  const output = () => container.querySelector('output')!.textContent;

  it('commits a month and closes without an OK button', async () => {
    await mount(AntdDatePicker, '2024-01', {
      dateFormat: 'YYYY.MM',
      dateSaveFormat: 'YYYY-MM',
    });
    await click(document.querySelector('td[title="2024-06"]')!);
    expect(output()).toBe('2024-06');
    expect(container.querySelector('input')!.value).toBe('2024.06');
    expect(
      document.querySelector(
        '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'
      )
    ).toBeNull();
  });

  it('commits a year without requiring a day selection', async () => {
    await mount(AntdDatePicker, '2024', {
      dateFormat: 'YYYY',
      dateSaveFormat: 'YYYY',
    });
    await click(document.querySelector('td[title="2026"]')!);
    expect(output()).toBe('2026');
    expect(
      document.querySelector(
        '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'
      )
    ).toBeNull();
  });

  /*
    The two bare-time rows carry no explicit `timeSaveFormat`, so they take the
    default - which section 18 fixes at `HH:mm:ssZ`, offset included, because
    a value without one does not satisfy `format: "time"`. The offset itself
    depends on where the test runs, so these expect a pattern rather than a
    string; every other row pins its own format and stays exact.
  */
  it.each([
    [AntdTimePicker, '13:37:00', {}, /^15:37:00(Z|[+-]\d\d:\d\d)$/],
    [AntdTimePicker, '13:37:00', { ampm: true }, /^15:37:00(Z|[+-]\d\d:\d\d)$/],
    [
      AntdDateTimePicker,
      '2024-01-15T13:37:00',
      { dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss' },
      '2024-01-15T15:37:00',
    ],
    [
      AntdDateTimePicker,
      '1999/12/11 10:05 am',
      {
        dateTimeFormat: 'DD-MM-YY hh:mm:a',
        dateTimeSaveFormat: 'YYYY/MM/DD h:mm a',
        ampm: true,
      },
      '1999/12/11 3:05 am',
    ],
  ])(
    'keeps a pending time across parent rerenders and commits on OK',
    async (Picker, initial, options, expected) => {
      await mount(Picker, initial, options);
      const hour = initial.includes('am') ? '3' : '15';
      await click(
        document.querySelector(
          `.ant-picker-time-panel-column:first-child li[data-value="${hour}"] .ant-picker-time-panel-cell-inner`
        )!
      );
      await act(async () => refresh());
      await click(document.querySelector('.ant-picker-ok button')!);
      const check = (value: unknown) =>
        expected instanceof RegExp
          ? expect(String(value)).toMatch(expected)
          : expect(value).toBe(expected);
      check(output());
      await act(async () => refresh());
      check(output());
    }
  );
});
