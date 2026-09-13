import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PrimeDatePicker } from '../../src/prime-controls/PrimeDatePicker';
import { PrimeTimePicker } from '../../src/prime-controls/PrimeTimePicker';
import { PrimeDateTimePicker } from '../../src/prime-controls/PrimeDateTimePicker';

describe('PrimeReact picker commits', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });
  it.each([
    [
      PrimeDatePicker,
      '2024-01',
      { dateFormat: 'YYYY.MM', dateSaveFormat: 'YYYY-MM' },
      '.p-monthpicker-month:nth-child(6)',
      '2024-06',
    ],
    [PrimeTimePicker, '13:37:00', {}, '.p-hour-picker button', '14:37:00'],
    [
      PrimeDateTimePicker,
      '1999/12/11 10:05 am',
      { dateTimeSaveFormat: 'YYYY/MM/DD h:mm a', ampm: true },
      '.p-hour-picker button',
      '1999/12/11 11:05 am',
    ],
  ])(
    'commits calendar and time panel selections',
    async (Picker, initial, options, selector, expected) => {
      const Harness = () => {
        const [data, setData] = useState(initial);
        const Component = Picker as any;
        return (
          <>
            <Component
              data={data}
              enabled
              path='value'
              errors=''
              uischema={{ type: 'Control', scope: '#', options }}
              handleChange={(_: string, value: string) => setData(value)}
            />
            <output>{data}</output>
          </>
        );
      };
      await act(async () => root.render(<Harness />));
      await act(async () =>
        (
          container.querySelector('.p-datepicker-trigger') as HTMLElement
        ).click()
      );
      const target = document.querySelector(selector)!;
      expect(target).not.toBeNull();
      await act(async () => {
        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('output')!.textContent).toBe(expected);
    }
  );
});
